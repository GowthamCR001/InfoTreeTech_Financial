import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { toPaise } from '../utils/currency';
import { extractYearMonth } from '../utils/dateUtils';

/**
 * Real-time subscription to active company transactions
 */
export function subscribeTransactions(callback, onError, includeDeleted = false) {
  if (!db) {
    onError && onError(new Error('Firestore not initialized'));
    return () => {};
  }

  const txCollection = collection(db, 'transactions');
  // Order by single field transactionDate descending (does not require composite index)
  // We filter isDeleted in JavaScript memory so no Firestore composite index is needed.
  const q = query(txCollection, orderBy('transactionDate', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!includeDeleted && data.isDeleted === true) {
          return;
        }
        items.push({ id: docSnap.id, ...data });
      });
      callback(items);
    },
    (err) => {
      console.warn('Ordered transactions subscription warning, falling back to raw stream:', err);
      // Resilient fallback: subscribe to raw collection and sort/filter client-side
      try {
        return onSnapshot(
          txCollection,
          (fallbackSnapshot) => {
            const items = [];
            fallbackSnapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (!includeDeleted && data.isDeleted === true) {
                return;
              }
              items.push({ id: docSnap.id, ...data });
            });
            // Client-side date descending sort
            items.sort((a, b) => new Date(b.transactionDate || 0) - new Date(a.transactionDate || 0));
            callback(items);
          },
          (fallbackErr) => {
            console.error('Fatal transactions subscription error:', fallbackErr);
            onError && onError(fallbackErr);
          }
        );
      } catch (e) {
        onError && onError(err);
      }
    }
  );
}

/**
 * Validate transaction fields client-side before dispatching to Firestore
 */
export function validateTransactionData(data) {
  const errors = {};

  if (!data.transactionType || !['CREDIT', 'DEBIT'].includes(data.transactionType)) {
    errors.transactionType = 'Transaction type must be Credited or Debited.';
  }

  const numAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : Number(data.amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    errors.amount = 'Amount must be a positive number greater than zero.';
  }

  if (!data.description || !data.description.trim()) {
    errors.description = 'Description is required.';
  }

  if (!data.contactName || !data.contactName.trim()) {
    errors.contactName = 'Contact name is required.';
  }

  if (!data.transactionDate) {
    errors.transactionDate = 'Transaction date is required.';
  }

  const validMethods = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'];
  if (!data.paymentMethod || !validMethods.includes(data.paymentMethod)) {
    errors.paymentMethod = `Payment method must be one of: ${validMethods.join(', ')}`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Create a new Transaction using Firestore batched write.
 * Atomically writes the transaction record and the corresponding audit log entry.
 */
export async function createTransaction(txData, currentUser) {
  if (!db) throw new Error('Firestore is not initialized.');
  if (!currentUser || !currentUser.uid) {
    throw new Error('Authentication required to create a transaction.');
  }

  // RBAC Permission Gate: Enforce granular Credit / Debit rights
  if (currentUser.role !== 'ADMIN') {
    const permissions = currentUser.permissions || {};
    const hasCredit = Boolean(currentUser.canAddCredit ?? permissions.canAddCredit);
    const hasDebit = Boolean(currentUser.canAddDebit ?? permissions.canAddDebit);

    if (txData.transactionType === 'CREDIT' && !hasCredit) {
      throw new Error('Permission Denied: You do not have permission to record Credit transactions. Please contact your company administrator.');
    }
    if (txData.transactionType === 'DEBIT' && !hasDebit) {
      throw new Error('Permission Denied: You do not have permission to record Debit transactions. Please contact your company administrator.');
    }
  }

  const validation = validateTransactionData(txData);
  if (!validation.isValid) {
    const msg = Object.values(validation.errors).join(' ');
    throw new Error(`Validation failed: ${msg}`);
  }

  const numAmount = typeof txData.amount === 'string' ? parseFloat(txData.amount) : Number(txData.amount);
  const amountInPaise = toPaise(numAmount);
  const { year, month } = extractYearMonth(txData.transactionDate);

  const batch = writeBatch(db);

  // 1. Transaction Document
  const txRef = doc(collection(db, 'transactions'));
  const newTx = {
    transactionDate: txData.transactionDate,
    transactionType: txData.transactionType,
    amount: numAmount,
    amountInPaise,
    description: txData.description.trim(),
    contactName: txData.contactName.trim(),
    contactNumber: (txData.contactNumber || '').trim(),
    paymentMethod: txData.paymentMethod,
    referenceNumber: (txData.referenceNumber || '').trim(),
    notes: (txData.notes || '').trim(),
    createdBy: currentUser.uid,
    createdByName: currentUser.displayName || currentUser.email || 'Team Member',
    createdByEmail: currentUser.email || '',
    createdAt: serverTimestamp(),
    isDeleted: false,
    month,
    year,
  };
  batch.set(txRef, newTx);

  // 2. Audit Log Document (Atomically appended)
  const auditRef = doc(collection(db, 'auditLogs'));
  const auditEntry = {
    transactionId: txRef.id,
    action: 'CREATE',
    userId: currentUser.uid,
    userEmail: currentUser.email || '',
    timestamp: serverTimestamp(),
    summary: `Created ${txData.transactionType} of ₹ ${numAmount.toLocaleString('en-IN')} for ${txData.contactName.trim()}`,
    previousValues: null,
    newValues: {
      amount: numAmount,
      amountInPaise,
      transactionType: txData.transactionType,
      transactionDate: txData.transactionDate,
      description: txData.description.trim(),
      contactName: txData.contactName.trim(),
      paymentMethod: txData.paymentMethod,
      referenceNumber: (txData.referenceNumber || '').trim(),
    },
  };
  batch.set(auditRef, auditEntry);

  await batch.commit();
  return { id: txRef.id, ...newTx };
}

/**
 * Edit an existing Transaction (ADMIN only).
 * Atomically updates the transaction document and appends an audit log entry.
 */
export async function updateTransaction(transactionId, updatedData, previousData, currentUser) {
  if (!db) throw new Error('Firestore is not initialized.');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators are permitted to edit transactions.');
  }

  const validation = validateTransactionData(updatedData);
  if (!validation.isValid) {
    const msg = Object.values(validation.errors).join(' ');
    throw new Error(`Validation failed: ${msg}`);
  }

  const numAmount = typeof updatedData.amount === 'string' ? parseFloat(updatedData.amount) : Number(updatedData.amount);
  const amountInPaise = toPaise(numAmount);
  const { year, month } = extractYearMonth(updatedData.transactionDate);

  const batch = writeBatch(db);

  // 1. Update Transaction (Preserve immutable createdBy and createdAt)
  const txRef = doc(db, 'transactions', transactionId);
  const updatePayload = {
    transactionDate: updatedData.transactionDate,
    transactionType: updatedData.transactionType,
    amount: numAmount,
    amountInPaise,
    description: updatedData.description.trim(),
    contactName: updatedData.contactName.trim(),
    contactNumber: (updatedData.contactNumber || '').trim(),
    paymentMethod: updatedData.paymentMethod,
    referenceNumber: (updatedData.referenceNumber || '').trim(),
    notes: (updatedData.notes || '').trim(),
    updatedBy: currentUser.uid,
    updatedByName: currentUser.displayName || currentUser.email || 'Admin',
    updatedAt: serverTimestamp(),
    month,
    year,
  };
  batch.update(txRef, updatePayload);

  // 2. Append Audit Log with Diff
  const auditRef = doc(collection(db, 'auditLogs'));
  const auditEntry = {
    transactionId,
    action: 'UPDATE',
    userId: currentUser.uid,
    userEmail: currentUser.email || '',
    timestamp: serverTimestamp(),
    summary: `Updated transaction #${transactionId.slice(0, 8)}: Amount changed to ₹ ${numAmount.toLocaleString('en-IN')}`,
    previousValues: {
      amount: previousData.amount,
      transactionType: previousData.transactionType,
      transactionDate: previousData.transactionDate,
      description: previousData.description,
      contactName: previousData.contactName,
      paymentMethod: previousData.paymentMethod,
      referenceNumber: previousData.referenceNumber,
    },
    newValues: {
      amount: numAmount,
      transactionType: updatedData.transactionType,
      transactionDate: updatedData.transactionDate,
      description: updatedData.description.trim(),
      contactName: updatedData.contactName.trim(),
      paymentMethod: updatedData.paymentMethod,
      referenceNumber: (updatedData.referenceNumber || '').trim(),
    },
  };
  batch.set(auditRef, auditEntry);

  await batch.commit();
  return { id: transactionId, ...updatePayload };
}

/**
 * Soft Delete a Transaction (ADMIN only).
 * Sets isDeleted: true, deletedBy, deletedAt, and creates an audit log entry.
 */
export async function softDeleteTransaction(transactionId, previousData, currentUser) {
  if (!db) throw new Error('Firestore is not initialized.');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators are permitted to delete transactions.');
  }

  const batch = writeBatch(db);

  // 1. Soft delete transaction document
  const txRef = doc(db, 'transactions', transactionId);
  batch.update(txRef, {
    isDeleted: true,
    deletedBy: currentUser.uid,
    deletedByName: currentUser.displayName || currentUser.email || 'Admin',
    deletedAt: serverTimestamp(),
  });

  // 2. Append Audit Log
  const auditRef = doc(collection(db, 'auditLogs'));
  const auditEntry = {
    transactionId,
    action: 'DELETE',
    userId: currentUser.uid,
    userEmail: currentUser.email || '',
    timestamp: serverTimestamp(),
    summary: `Soft-deleted transaction #${transactionId.slice(0, 8)} (${previousData?.description || 'N/A'}, ₹ ${(previousData?.amount || 0).toLocaleString('en-IN')})`,
    previousValues: {
      amount: previousData?.amount,
      transactionType: previousData?.transactionType,
      transactionDate: previousData?.transactionDate,
      description: previousData?.description,
      contactName: previousData?.contactName,
      isDeleted: false,
    },
    newValues: {
      isDeleted: true,
      deletedBy: currentUser.uid,
    },
  };
  batch.set(auditRef, auditEntry);

  await batch.commit();
  return { id: transactionId, isDeleted: true };
}

/**
 * Permanently purge all ledger transactions and audit logs (ADMIN only).
 * Used for resetting test data before deploying to production.
 */
export async function purgeAllLedgerTransactions(currentUser) {
  if (!db) throw new Error('Firestore is not initialized.');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can purge ledger data.');
  }

  let purgedTxCount = 0;
  let purgedAuditCount = 0;

  // 1. Purge all transactions
  try {
    const txCollection = collection(db, 'transactions');
    const txSnap = await getDocs(txCollection);
    for (const docSnap of txSnap.docs) {
      try {
        await deleteDoc(doc(db, 'transactions', docSnap.id));
        purgedTxCount++;
      } catch (delErr) {
        // Fallback: soft-delete if hard deletion is denied by live security rules
        const batch = writeBatch(db);
        batch.update(doc(db, 'transactions', docSnap.id), {
          isDeleted: true,
          deletedBy: currentUser.uid,
          deletedAt: serverTimestamp(),
        });
        await batch.commit().catch(() => {});
        purgedTxCount++;
      }
    }
  } catch (err) {
    console.warn('Transaction purge warning:', err.message);
  }

  // 2. Purge all audit logs
  try {
    const auditCollection = collection(db, 'auditLogs');
    const auditSnap = await getDocs(auditCollection);
    for (const docSnap of auditSnap.docs) {
      await deleteDoc(doc(db, 'auditLogs', docSnap.id)).catch(() => {});
      purgedAuditCount++;
    }
  } catch (err) {
    console.warn('Audit logs purge warning:', err.message);
  }

  return { purgedTxCount, purgedAuditCount };
}

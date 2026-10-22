import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { toPaise } from '../utils/currency';
import { INITIAL_COMPANY_SETTINGS } from '../utils/sampleData';

const SETTINGS_DOC_ID = 'global';

/**
 * Subscribe to company settings document (opening balance, company name, currency)
 */
export function subscribeCompanySettings(callback, onError) {
  if (!db) {
    onError && onError(new Error('Firestore not initialized'));
    return () => {};
  }

  const settingsRef = doc(db, 'companySettings', SETTINGS_DOC_ID);
  return onSnapshot(
    settingsRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        // Return default configuration if not initialized yet
        callback(INITIAL_COMPANY_SETTINGS);
      }
    },
    (err) => {
      console.error('Company settings subscription error:', err);
      onError && onError(err);
    }
  );
}

/**
 * Update company financial settings (ADMIN only)
 */
export async function updateCompanySettings(data, currentUser) {
  if (!db) throw new Error('Firestore not initialized.');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators are permitted to modify company settings.');
  }

  const openingBalanceNum = typeof data.openingBalance === 'string'
    ? parseFloat(data.openingBalance)
    : Number(data.openingBalance || 0);

  if (isNaN(openingBalanceNum) || openingBalanceNum < 0) {
    throw new Error('Opening balance must be a valid non-negative number.');
  }

  const openingBalanceInPaise = toPaise(openingBalanceNum);

  const payload = {
    companyName: (data.companyName || 'Private Enterprise Ltd').trim(),
    openingBalance: openingBalanceNum,
    openingBalanceInPaise,
    openingBalanceEffectiveDate: data.openingBalanceEffectiveDate || '2026-04-01',
    currencyCode: 'INR',
    timeZone: data.timeZone || 'Asia/Kolkata',
    updatedBy: currentUser.uid,
    updatedAt: serverTimestamp(),
  };

  const settingsRef = doc(db, 'companySettings', SETTINGS_DOC_ID);
  await setDoc(settingsRef, payload, { merge: true });
  return payload;
}

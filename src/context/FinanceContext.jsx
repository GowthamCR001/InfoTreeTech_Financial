import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { isFirebaseConfigured } from '../services/firebase';
import { 
  subscribeTransactions, 
  createTransaction, 
  updateTransaction, 
  softDeleteTransaction,
  purgeAllLedgerTransactions
} from '../services/transactionService';
import { 
  subscribeCompanySettings, 
  updateCompanySettings 
} from '../services/companyService';
import { subscribeAuditLogs } from '../services/auditService';
import { 
  subscribeUsers, 
  toggleUserStatus, 
  changeUserRole,
  createTeamMemberAccount,
  updateTeamMember,
  updateMemberPermissions,
  deleteTeamMember,
  purgeSoftDeletedUsers
} from '../services/teamService';
import { 
  calculateTotals, 
  computeRunningBalances, 
  toPaise 
} from '../utils/currency';
import { extractYearMonth } from '../utils/dateUtils';
import { 
  INITIAL_COMPANY_SETTINGS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_USERS 
} from '../utils/sampleData';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { currentUser, isDemoMode } = useAuth();

  const [companySettings, setCompanySettings] = useState(INITIAL_COMPANY_SETTINGS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [teamMembers, setTeamMembers] = useState(INITIAL_USERS);
  const [archivedMembers, setArchivedMembers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(!isDemoMode);
  const [errorNotice, setErrorNotice] = useState(null);

  // Firestore real-time subscriptions when Firebase is configured
  useEffect(() => {
    if (isDemoMode || !isFirebaseConfigured() || !currentUser) {
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    let unsubSettings = () => {};
    let unsubTransactions = () => {};
    let unsubAudit = () => {};
    let unsubUsers = () => {};

    try {
      // 1. Subscribe Company Settings
      unsubSettings = subscribeCompanySettings(
        (data) => setCompanySettings(data),
        (err) => console.warn('Settings stream warning:', err.message)
      );

      // 2. Subscribe Transactions
      unsubTransactions = subscribeTransactions(
        (data) => {
          setTransactions(data);
          setIsLoadingData(false);
        },
        (err) => {
          console.error('Transactions stream error:', err);
          setErrorNotice(err.message);
          setIsLoadingData(false);
        }
      );

      // 3. Subscribe Audit Logs (if Admin)
      if (currentUser.role === 'ADMIN') {
        unsubAudit = subscribeAuditLogs(
          (data) => setAuditLogs(data),
          (err) => console.warn('Audit logs permission/stream notice:', err.message)
        );
        unsubUsers = subscribeUsers(
          (active, archived) => {
            setTeamMembers(active);
            setArchivedMembers(archived || []);
          },
          (err) => console.warn('Users stream notice:', err.message)
        );
      }
    } catch (err) {
      console.error('Firestore subscription error:', err);
      setIsLoadingData(false);
    }

    return () => {
      unsubSettings();
      unsubTransactions();
      unsubAudit();
      unsubUsers();
    };
  }, [isDemoMode, currentUser]);

  // Dynamic calculations using integer paise arithmetic
  const activeTransactions = useMemo(() => {
    return transactions.filter(t => !t.isDeleted);
  }, [transactions]);

  // Overall financial totals
  const totals = useMemo(() => {
    return calculateTotals(companySettings.openingBalance, activeTransactions);
  }, [companySettings.openingBalance, activeTransactions]);

  // Current month totals (Oct 2026 / current date month)
  const currentMonthTotals = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    const monthTxs = activeTransactions.filter(t => {
      if (t.month && t.year) {
        return Number(t.year) === currentYear && String(t.month).padStart(2, '0') === currentMonth;
      }
      if (t.transactionDate) {
        const parts = t.transactionDate.split('-');
        return Number(parts[0]) === currentYear && parts[1] === currentMonth;
      }
      return false;
    });

    let creditsPaise = 0;
    let debitsPaise = 0;

    for (const tx of monthTxs) {
      const paise = tx.amountInPaise !== undefined ? tx.amountInPaise : toPaise(tx.amount);
      if (tx.transactionType === 'CREDIT') {
        creditsPaise += paise;
      } else {
        debitsPaise += paise;
      }
    }

    return {
      monthString: `${currentMonth}/${currentYear}`,
      credits: creditsPaise / 100,
      debits: debitsPaise / 100,
      count: monthTxs.length,
    };
  }, [activeTransactions]);

  // Transactions with running balances calculated chronologically and returned in descending display order
  const transactionsWithRunningBalance = useMemo(() => {
    return computeRunningBalances(companySettings.openingBalance, activeTransactions, 'desc');
  }, [companySettings.openingBalance, activeTransactions]);

  // Add Transaction
  const handleAddTransaction = async (txData) => {
    if (!currentUser) throw new Error('You must be signed in.');

    if (isDemoMode) {
      const numAmount = parseFloat(txData.amount);
      const { year, month } = extractYearMonth(txData.transactionDate);
      const newTx = {
        id: `tx-${Date.now().toString().slice(-6)}`,
        ...txData,
        amount: numAmount,
        amountInPaise: toPaise(numAmount),
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName,
        createdByEmail: currentUser.email,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        isDeleted: false,
        month,
        year,
      };

      setTransactions(prev => [newTx, ...prev]);

      // Append demo audit log
      const newAudit = {
        id: `audit-${Date.now().toString().slice(-6)}`,
        transactionId: newTx.id,
        action: 'CREATE',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: { seconds: Math.floor(Date.now() / 1000) },
        summary: `Created ${newTx.transactionType} of ₹ ${numAmount.toLocaleString('en-IN')} for ${newTx.contactName}`,
        previousValues: null,
        newValues: newTx,
      };
      setAuditLogs(prev => [newAudit, ...prev]);
      return newTx;
    }

    const created = await createTransaction(txData, currentUser);
    if (created && created.id) {
      setTransactions(prev => {
        if (prev.some(t => t.id === created.id)) return prev;
        return [created, ...prev];
      });
    }
    return created;
  };

  // Edit Transaction (Admin only)
  const handleEditTransaction = async (id, updatedData, previousData) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can edit transactions.');
    }

    if (isDemoMode) {
      const numAmount = parseFloat(updatedData.amount);
      const { year, month } = extractYearMonth(updatedData.transactionDate);

      setTransactions(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            ...updatedData,
            amount: numAmount,
            amountInPaise: toPaise(numAmount),
            updatedBy: currentUser.uid,
            updatedByName: currentUser.displayName,
            updatedAt: { seconds: Math.floor(Date.now() / 1000) },
            month,
            year,
          };
        }
        return t;
      }));

      const newAudit = {
        id: `audit-${Date.now().toString().slice(-6)}`,
        transactionId: id,
        action: 'UPDATE',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: { seconds: Math.floor(Date.now() / 1000) },
        summary: `Updated transaction #${id.slice(0, 8)}: Amount changed to ₹ ${numAmount.toLocaleString('en-IN')}`,
        previousValues: previousData,
        newValues: updatedData,
      };
      setAuditLogs(prev => [newAudit, ...prev]);
      return;
    }

    const updated = await updateTransaction(id, updatedData, previousData, currentUser);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    return updated;
  };

  // Delete Transaction (Admin only, Soft Delete)
  const handleDeleteTransaction = async (id, previousData) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can delete transactions.');
    }

    if (isDemoMode) {
      setTransactions(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            isDeleted: true,
            deletedBy: currentUser.uid,
            deletedByName: currentUser.displayName,
            deletedAt: { seconds: Math.floor(Date.now() / 1000) },
          };
        }
        return t;
      }));

      const newAudit = {
        id: `audit-${Date.now().toString().slice(-6)}`,
        transactionId: id,
        action: 'DELETE',
        userId: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: { seconds: Math.floor(Date.now() / 1000) },
        summary: `Soft-deleted transaction #${id.slice(0, 8)} (${previousData?.description}, ₹ ${(previousData?.amount || 0).toLocaleString('en-IN')})`,
        previousValues: previousData,
        newValues: { isDeleted: true },
      };
      setAuditLogs(prev => [newAudit, ...prev]);
      return;
    }

    const res = await softDeleteTransaction(id, previousData, currentUser);
    setTransactions(prev => prev.filter(t => t.id !== id));
    return res;
  };

  // Update Company Settings (Admin only)
  const handleUpdateCompanySettings = async (newSettings) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can change company settings.');
    }

    if (isDemoMode) {
      const numOpening = parseFloat(newSettings.openingBalance || 0);
      setCompanySettings(prev => ({
        ...prev,
        ...newSettings,
        openingBalance: numOpening,
        openingBalanceInPaise: toPaise(numOpening),
      }));
      return;
    }

    return await updateCompanySettings(newSettings, currentUser);
  };

  // Toggle Team Member Status (Admin only)
  const handleToggleUserStatus = async (uid, isActive) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can modify user accounts.');
    }

    if (isDemoMode) {
      setTeamMembers(prev => prev.map(u => u.uid === uid ? { ...u, isActive } : u));
      return;
    }

    return await toggleUserStatus(uid, isActive, currentUser);
  };

  // Change Team Member Role (Admin only)
  const handleChangeUserRole = async (uid, role) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can change account roles.');
    }

    if (isDemoMode) {
      setTeamMembers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      return;
    }

    return await changeUserRole(uid, role, currentUser);
  };

  // Provision New Team Member
  const handleProvisionMember = async ({ displayName, email, phoneNumber, role, password, permissions }) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can provision new team members.');
    }

    if (isDemoMode) {
      const cleanPermissions = role === 'ADMIN'
        ? { canAddCredit: true, canAddDebit: true }
        : {
            canAddCredit: Boolean(permissions?.canAddCredit),
            canAddDebit: Boolean(permissions?.canAddDebit),
          };

      const newMember = {
        uid: `user-demo-${Date.now().toString().slice(-4)}`,
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber || '',
        role: role || 'TEAM_MEMBER',
        isActive: true,
        permissions: cleanPermissions,
        createdAt: new Date().toISOString(),
      };
      setTeamMembers(prev => [newMember, ...prev]);
      return newMember;
    }

    return await createTeamMemberAccount({ displayName, email, phoneNumber, role, password, permissions }, currentUser);
  };

  // Edit Team Member (Admin only)
  const handleEditTeamMember = async (uid, updatedData) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can edit team member accounts.');
    }

    if (isDemoMode) {
      setTeamMembers(prev => prev.map(u => {
        if (u.uid === uid) {
          return {
            ...u,
            ...updatedData,
            displayName: updatedData.displayName?.trim() || u.displayName,
            email: updatedData.email?.trim().toLowerCase() || u.email,
            phoneNumber: updatedData.phoneNumber !== undefined ? updatedData.phoneNumber : u.phoneNumber,
            role: updatedData.role || u.role,
            permissions: updatedData.permissions !== undefined ? updatedData.permissions : u.permissions,
          };
        }
        return u;
      }));
      return;
    }

    return await updateTeamMember(uid, updatedData, currentUser);
  };

  // Configure Granular Permissions for Team Member (Admin only)
  const handleUpdateMemberPermissions = async (uid, permissions) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can modify member permissions.');
    }

    if (isDemoMode) {
      setTeamMembers(prev => prev.map(u => {
        if (u.uid === uid) {
          return {
            ...u,
            permissions: {
              canAddCredit: Boolean(permissions?.canAddCredit),
              canAddDebit: Boolean(permissions?.canAddDebit),
            },
          };
        }
        return u;
      }));
      return permissions;
    }

    return await updateMemberPermissions(uid, permissions, currentUser);
  };

  // Delete Team Member (Admin only)
  const handleDeleteTeamMember = async (uid) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can delete team member accounts.');
    }

    if (uid === currentUser.uid) {
      throw new Error('Operation denied: You cannot delete your own administrative account.');
    }

    if (isDemoMode) {
      setTeamMembers(prev => prev.filter(u => u.uid !== uid));
      return;
    }

    return await deleteTeamMember(uid, currentUser);
  };

  // Permanently purge archived member documents from Firestore (Admin only)
  const handlePurgeArchivedMembers = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can purge archived accounts.');
    }
    if (isDemoMode) {
      setArchivedMembers([]);
      return 0;
    }
    return await purgeSoftDeletedUsers(currentUser);
  };

  // Permanently purge all ledger transactions and audit logs (Admin only)
  const handlePurgeAllTransactions = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('Only administrators can reset the ledger.');
    }
    if (isDemoMode) {
      setTransactions([]);
      setAuditLogs([]);
      setCompanySettings(prev => ({
        ...prev,
        openingBalance: 0,
        openingBalanceInPaise: 0,
      }));
      return { purgedTxCount: 0, purgedAuditCount: 0 };
    }
    const result = await purgeAllLedgerTransactions(currentUser);
    setTransactions([]);
    setAuditLogs([]);
    return result;
  };

  const value = {
    companySettings,
    transactions: activeTransactions,
    allTransactions: transactions,
    transactionsWithRunningBalance,
    totals,
    currentMonthTotals,
    auditLogs,
    teamMembers,
    archivedMembers,
    isLoadingData,
    errorNotice,
    setErrorNotice,
    addTransaction: handleAddTransaction,
    editTransaction: handleEditTransaction,
    deleteTransaction: handleDeleteTransaction,
    saveCompanySettings: handleUpdateCompanySettings,
    toggleUserStatus: handleToggleUserStatus,
    changeUserRole: handleChangeUserRole,
    provisionMember: handleProvisionMember,
    editTeamMember: handleEditTeamMember,
    updateMemberPermissions: handleUpdateMemberPermissions,
    deleteTeamMember: handleDeleteTeamMember,
    purgeArchivedMembers: handlePurgeArchivedMembers,
    purgeAllTransactions: handlePurgeAllTransactions,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

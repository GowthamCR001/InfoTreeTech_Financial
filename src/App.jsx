import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { TeamPage } from './pages/TeamPage';
import { LoginPage } from './pages/LoginPage';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { FirebaseConfigModal } from './components/setup/FirebaseConfigModal';
import { AdminBootstrapModal } from './components/setup/AdminBootstrapModal';
import { NotificationToast } from './components/common/NotificationToast';
import { LoadingSpinner } from './components/common/EmptyState';

function MainApp() {
  const { currentUser, isAdmin, canAddCredit, canAddDebit, isLoading: isAuthLoading } = useAuth();
  const { addTransaction } = useFinance();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [modalTransactionType, setModalTransactionType] = useState(null); // 'CREDIT' | 'DEBIT' | null
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isBootstrapModalOpen, setIsBootstrapModalOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Restrict Admin-Only Sections: redirect immediately if a non-admin tries to open them
  useEffect(() => {
    if (!isAdmin && ['settings', 'audit', 'team'].includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [isAdmin, currentTab]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const handleOpenAddCredit = () => {
    if (!canAddCredit) {
      showToast('Permission Denied: You do not have permission to record Credit transactions.', 'error');
      return;
    }
    setModalTransactionType('CREDIT');
  };

  const handleOpenAddDebit = () => {
    if (!canAddDebit) {
      showToast('Permission Denied: You do not have permission to record Debit transactions.', 'error');
      return;
    }
    setModalTransactionType('DEBIT');
  };

  const handleCloseModal = () => setModalTransactionType(null);

  const handleCreateTransaction = async (formData) => {
    try {
      await addTransaction(formData);
      showToast(`Successfully recorded ${formData.transactionType} of ₹ ${formData.amount.toLocaleString('en-IN')}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save transaction', 'error');
      throw err;
    }
  };

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Financial Dashboard',
          subtitle: 'Live company ledger balance, monthly inflow/outflow, and metrics',
        };
      case 'transactions':
        return {
          title: 'Transaction Register',
          subtitle: 'Searchable chronological transaction record with calculated running balance',
        };
      case 'reports':
        return {
          title: 'Financial Reports',
          subtitle: 'Monthly and yearly cash flow reconciliation and payment rail breakdown',
        };
      case 'settings':
        return {
          title: 'Company Settings',
          subtitle: 'Opening balance baseline, corporate details, and financial parameters',
        };
      case 'audit':
        return {
          title: 'Audit Trail & Change History',
          subtitle: 'Append-only ledger diffs of all creations, updates, and soft deletions',
        };
      case 'team':
        return {
          title: 'Team Accounts & Permissions',
          subtitle: 'Authorized company members, role assignments, and access control',
        };
      default:
        return { title: 'InfoTreeTech', subtitle: 'Company Financial Manager' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      title={title}
      subtitle={subtitle}
      onAddCredit={handleOpenAddCredit}
      onAddDebit={handleOpenAddDebit}
      onOpenConfigModal={() => setIsConfigModalOpen(true)}
      onOpenSetupGuide={() => setIsBootstrapModalOpen(true)}
    >
      {/* Page Routing */}
      {currentTab === 'dashboard' && (
        <DashboardPage
          onNavigateToTransactions={() => setCurrentTab('transactions')}
          onAddCredit={handleOpenAddCredit}
          onAddDebit={handleOpenAddDebit}
        />
      )}

      {currentTab === 'transactions' && (
        <TransactionsPage
          onAddCredit={handleOpenAddCredit}
          onAddDebit={handleOpenAddDebit}
        />
      )}

      {currentTab === 'reports' && <ReportsPage />}

      {currentTab === 'settings' && (isAdmin ? <SettingsPage /> : <DashboardPage />)}

      {currentTab === 'audit' && (isAdmin ? <AuditLogsPage /> : <DashboardPage />)}

      {currentTab === 'team' && (isAdmin ? <TeamPage /> : <DashboardPage />)}

      {/* Global Add Transaction Modal */}
      {modalTransactionType && (
        <TransactionFormModal
          isOpen={Boolean(modalTransactionType)}
          onClose={handleCloseModal}
          onSubmit={handleCreateTransaction}
          initialType={modalTransactionType}
        />
      )}

      {/* Firebase Config Modal */}
      <FirebaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      {/* Admin Bootstrap & Security Modal */}
      <AdminBootstrapModal
        isOpen={isBootstrapModalOpen}
        onClose={() => setIsBootstrapModalOpen(false)}
      />

      {/* Notification Toast */}
      {toast && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainApp />
      </FinanceProvider>
    </AuthProvider>
  );
}

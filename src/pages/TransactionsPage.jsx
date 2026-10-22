import React, { useState, useMemo } from 'react';
import { Download, PlusCircle, ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';
import { exportTransactionsToCSV } from '../utils/csvExport';

export function TransactionsPage({ onAddCredit, onAddDebit }) {
  const { 
    transactionsWithRunningBalance, 
    editTransaction, 
    deleteTransaction,
    companySettings
  } = useFinance();
  const { isAdmin } = useAuth();

  const [filters, setFilters] = useState({
    search: '',
    type: 'ALL',
    startDate: '',
    endDate: '',
    month: 'ALL',
    year: 'ALL',
    paymentMethod: 'ALL',
  });

  // Modal states for Editing and Deleting
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'ALL',
      startDate: '',
      endDate: '',
      month: 'ALL',
      year: 'ALL',
      paymentMethod: 'ALL',
    });
  };

  // Derive unique years from active transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set([2026, 2025]);
    transactionsWithRunningBalance.forEach(t => {
      if (t.year) yearsSet.add(Number(t.year));
      else if (t.transactionDate) yearsSet.add(new Date(t.transactionDate).getFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactionsWithRunningBalance]);

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    return transactionsWithRunningBalance.filter(tx => {
      // 1. Transaction Type
      if (filters.type !== 'ALL' && tx.transactionType !== filters.type) {
        return false;
      }

      // 2. Date Range
      if (filters.startDate && tx.transactionDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && tx.transactionDate > filters.endDate) {
        return false;
      }

      // 3. Month Filter
      if (filters.month !== 'ALL') {
        const txMonth = tx.month ? String(tx.month).padStart(2, '0') : tx.transactionDate?.split('-')[1];
        if (txMonth !== filters.month) return false;
      }

      // 4. Year Filter
      if (filters.year !== 'ALL') {
        const txYear = tx.year ? String(tx.year) : tx.transactionDate?.split('-')[0];
        if (txYear !== filters.year) return false;
      }

      // 5. Payment Method
      if (filters.paymentMethod !== 'ALL' && tx.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      // 6. Search Query (description, contactName, contactNumber, referenceNumber, notes, id)
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const desc = (tx.description || '').toLowerCase();
        const contact = (tx.contactName || '').toLowerCase();
        const phone = (tx.contactNumber || '').toLowerCase();
        const ref = (tx.referenceNumber || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const id = (tx.id || '').toLowerCase();

        return desc.includes(q) || contact.includes(q) || phone.includes(q) || ref.includes(q) || notes.includes(q) || id.includes(q);
      }

      return true;
    });
  }, [transactionsWithRunningBalance, filters]);

  // Handle Export
  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions, {
      filename: `company-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      companyName: companySettings.companyName || 'Company Ledger',
      filters,
    });
  };

  // Handle Delete Confirmation (Admin Only)
  const confirmDelete = async () => {
    if (!deletingTx) return;
    setIsDeletingLoading(true);
    try {
      await deleteTransaction(deletingTx.id, deletingTx);
      setDeletingTx(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeletingLoading(false);
    }
  };

  // Handle Edit Submit (Admin Only)
  const handleEditSubmit = async (formData) => {
    if (!editingTx) return;
    await editTransaction(editingTx.id, formData, editingTx);
    setEditingTx(null);
  };

  return (
    <div className="space-y-4">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Transaction Register
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full ledger with chronological running balance calculations & audit trails
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Component */}
      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalMatching={filteredTransactions.length}
        availableYears={availableYears}
      />

      {/* Transaction Table */}
      {filteredTransactions.length > 0 ? (
        <TransactionTable
          transactions={filteredTransactions}
          isAdmin={isAdmin}
          onEdit={(tx) => setEditingTx(tx)}
          onDelete={(tx) => setDeletingTx(tx)}
        />
      ) : (
        <EmptyState
          title="No transactions found"
          description="Try adjusting or clearing your active filters to view records."
          actionLabel="Clear Filter Criteria"
          onAction={handleResetFilters}
          icon={Receipt}
        />
      )}

      {/* Edit Transaction Modal (Admin Only) */}
      {editingTx && (
        <TransactionFormModal
          isOpen={Boolean(editingTx)}
          onClose={() => setEditingTx(null)}
          onSubmit={handleEditSubmit}
          initialData={editingTx}
          isEditing={true}
        />
      )}

      {/* Delete Confirmation Modal (Admin Only) */}
      {deletingTx && (
        <ConfirmModal
          isOpen={Boolean(deletingTx)}
          onClose={() => setDeletingTx(null)}
          onConfirm={confirmDelete}
          isLoading={isDeletingLoading}
          title="Confirm Transaction Deletion"
          message={`Are you sure you want to soft-delete transaction #${deletingTx.id?.slice(0, 8)} (${deletingTx.description}, ₹ ${(deletingTx.amount || 0).toLocaleString('en-IN')})? This will mark the record as deleted and recalculate running balances immediately.`}
          confirmText="Soft Delete Record"
          confirmVariant="danger"
        />
      )}
    </div>
  );
}

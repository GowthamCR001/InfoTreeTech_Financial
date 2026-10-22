import React, { useState } from 'react';
import { Settings, Building2, Wallet, Calendar, ShieldCheck, Check, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

export function SettingsPage() {
  const { companySettings, saveCompanySettings, purgeAllTransactions, allTransactions, auditLogs } = useFinance();
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    companyName: companySettings.companyName || '',
    openingBalance: companySettings.openingBalance ? String(companySettings.openingBalance) : '0',
    openingBalanceEffectiveDate: companySettings.openingBalanceEffectiveDate || '2026-04-01',
    currencyCode: 'INR',
    timeZone: 'Asia/Kolkata',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Restricted Admin Area</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only company administrators are authorized to view or modify corporate financial settings.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessNotice(null);
    setErrorNotice(null);

    try {
      await saveCompanySettings(formData);
      setSuccessNotice('Company financial settings saved and ledger balances recalculated successfully.');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to update company settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAllData = async () => {
    const confirmed = window.confirm(
      'WARNING: This will permanently purge all test transactions and audit logs from Cloud Firestore and reset the ledger balance to ₹ 0.00 for a clean production deployment.\n\nAre you sure you want to proceed with fresh start?'
    );
    if (!confirmed) return;

    setIsPurging(true);
    setErrorNotice(null);
    setSuccessNotice(null);
    try {
      const res = await purgeAllTransactions();
      setFormData(prev => ({
        ...prev,
        openingBalance: '0',
      }));
      setSuccessNotice(`Successfully cleared test data (${res.purgedTxCount} transactions, ${res.purgedAuditCount} audit logs). Ledger is now completely clean for production.`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to purge ledger records.');
    } finally {
      setIsPurging(false);
    }
  };

  const parsedOpening = parseFloat(formData.openingBalance || 0);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Company & Opening Balance Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Administer opening balance baselines, organizational details, and financial parameters
        </p>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in font-medium">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sm:space-y-5">
        {/* Dynamic calculation banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <h4 className="font-bold text-slate-900">Deterministic Balance Source of Truth</h4>
            <p className="mt-0.5">
              In accordance with financial compliance rules, running balances are never stored as editable text fields. Any modification to the Opening Balance below automatically recomputes the entire historical chronological ledger.
            </p>
          </div>
        </div>

        {/* Company Legal Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Registered Company / Entity Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Opening Balance (INR) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Opening Baseline Balance (INR ₹) <span className="text-rose-500">*</span>
            </label>
            {!isNaN(parsedOpening) && (
              <span className="text-xs font-bold text-slate-900">
                {formatINR(parsedOpening)}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Initial capital or carried-forward balance as of the effective date.
          </p>
        </div>

        {/* Opening Balance Effective Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Opening Balance Effective Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.openingBalanceEffectiveDate}
                onChange={(e) => setFormData({ ...formData, openingBalanceEffectiveDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Accounting Currency Code
            </label>
            <input
              type="text"
              disabled
              value="INR (Indian Rupee - ₹)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-sm cursor-not-allowed font-medium"
            />
          </div>
        </div>

        {/* Time Zone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Ledger Timezone
          </label>
          <input
            type="text"
            disabled
            value="Asia/Kolkata (IST +05:30)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-sm cursor-not-allowed font-medium"
          />
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Settings & Recalculate'}</span>
          </button>
        </div>
      </form>

      {/* Fresh Production Reset (Danger Zone) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900">
              Fresh Production Reset (Purge All Test Records)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Permanently clears any test transactions and audit logs from Cloud Firestore so you can deploy with a completely clean, fresh zero-transaction ledger.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium">
            Active Records: <strong>{allTransactions?.length || 0}</strong> transactions, <strong>{auditLogs?.length || 0}</strong> audit logs
          </span>

          <button
            type="button"
            onClick={handleResetAllData}
            disabled={isPurging}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isPurging ? 'Purging Test Data...' : 'Purge All Test Records for Fresh Start'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

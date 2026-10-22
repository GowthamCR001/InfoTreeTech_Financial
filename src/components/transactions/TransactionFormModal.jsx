import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Calendar, User, Phone, FileText, Hash, Check, Lock } from 'lucide-react';
import { getTodayDateString } from '../../utils/dateUtils';
import { numberToIndianWords, formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

const PAYMENT_METHODS = [
  'Bank Transfer',
  'UPI',
  'Cash',
  'Cheque',
  'Card',
  'Other'
];

export function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  initialType = 'CREDIT',
  isEditing = false,
}) {
  const { isAdmin, canAddCredit, canAddDebit } = useAuth();

  // If initialType is not permitted for this user, fallback to whatever is permitted
  const resolvedInitialType = (() => {
    if (isAdmin) return initialType;
    if (initialType === 'CREDIT' && canAddCredit) return 'CREDIT';
    if (initialType === 'DEBIT' && canAddDebit) return 'DEBIT';
    if (canAddCredit) return 'CREDIT';
    if (canAddDebit) return 'DEBIT';
    return initialType;
  })();

  const [formData, setFormData] = useState({
    transactionType: resolvedInitialType,
    amount: '',
    description: '',
    contactName: '',
    contactNumber: '',
    transactionDate: getTodayDateString(),
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        transactionType: initialData.transactionType || initialType,
        amount: initialData.amount ? String(initialData.amount) : '',
        description: initialData.description || '',
        contactName: initialData.contactName || '',
        contactNumber: initialData.contactNumber || '',
        transactionDate: initialData.transactionDate || getTodayDateString(),
        paymentMethod: initialData.paymentMethod || 'Bank Transfer',
        referenceNumber: initialData.referenceNumber || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        transactionType: initialType,
        amount: '',
        description: '',
        contactName: '',
        contactNumber: '',
        transactionDate: getTodayDateString(),
        paymentMethod: 'Bank Transfer',
        referenceNumber: '',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, initialType, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    const num = parseFloat(formData.amount);
    if (isNaN(num) || num <= 0) {
      errs.amount = 'Please enter a valid amount greater than ₹ 0.00';
    }
    if (!formData.description.trim()) {
      errs.description = 'Description is required.';
    }
    if (!formData.contactName.trim()) {
      errs.contactName = 'Contact or payee name is required.';
    }
    if (!formData.transactionDate) {
      errs.transactionDate = 'Transaction date is required.';
    }

    // RBAC Permission Validation
    if (!isAdmin) {
      if (formData.transactionType === 'CREDIT' && !canAddCredit) {
        errs.form = 'Permission Denied: You do not have permission to record Credit transactions.';
      }
      if (formData.transactionType === 'DEBIT' && !canAddDebit) {
        errs.form = 'Permission Denied: You do not have permission to record Debit transactions.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to record transaction.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(formData.amount || 0);
  const wordsAmount = !isNaN(parsedAmount) && parsedAmount > 0 ? numberToIndianWords(parsedAmount) : '';
  const isCredit = formData.transactionType === 'CREDIT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Sticky) */}
        <div className={`p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0 ${
          isCredit ? 'bg-slate-900 border-b border-slate-800' : 'bg-slate-900 border-b border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 rounded-xl text-white flex-shrink-0 ${
              isCredit ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">
                {isEditing ? 'Edit Transaction' : (isCredit ? 'Record Credit (Incoming Funds)' : 'Record Debit (Outgoing Expense)')}
              </h3>
              <p className="text-xs text-slate-300 truncate">
                Amounts are securely logged with integer paise precision and audit trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto touch-scroll p-4 sm:p-6 space-y-4">
            {errors.form && (
              <div className="p-3 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
                {errors.form}
              </div>
            )}

          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Transaction Classification <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                disabled={!isAdmin && !canAddCredit}
                onClick={() => handleChange('transactionType', 'CREDIT')}
                title={!isAdmin && !canAddCredit ? 'Permission Denied: Add Credit is not enabled for your account' : ''}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isCredit 
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200/60' 
                    : 'text-slate-600 hover:text-slate-900'
                } ${!isAdmin && !canAddCredit ? 'opacity-40 cursor-not-allowed bg-slate-200/60' : 'cursor-pointer'}`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Credited (Inflow)</span>
                {!isAdmin && !canAddCredit && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              <button
                type="button"
                disabled={!isAdmin && !canAddDebit}
                onClick={() => handleChange('transactionType', 'DEBIT')}
                title={!isAdmin && !canAddDebit ? 'Permission Denied: Add Debit is not enabled for your account' : ''}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  !isCredit 
                    ? 'bg-white text-rose-700 shadow-sm border border-rose-200/60' 
                    : 'text-slate-600 hover:text-slate-900'
                } ${!isAdmin && !canAddDebit ? 'opacity-40 cursor-not-allowed bg-slate-200/60' : 'cursor-pointer'}`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Debited (Outflow)</span>
                {!isAdmin && !canAddDebit && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Amount in INR + Live Word Representation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amount (INR ₹) <span className="text-rose-500">*</span>
              </label>
              {parsedAmount > 0 && (
                <span className="text-xs font-bold text-slate-700">
                  {formatINR(parsedAmount)}
                </span>
              )}
            </div>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                ₹
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className={`w-full pl-8 pr-4 py-2.5 rounded-lg border text-base font-semibold focus:outline-none focus:ring-2 ${
                  errors.amount 
                    ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' 
                    : 'border-slate-300 focus:ring-slate-900/10 focus:border-slate-900'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.amount}</p>
            )}
            {wordsAmount && (
              <p className="mt-1.5 text-[11px] text-slate-500 font-medium italic bg-slate-50 p-1.5 rounded border border-slate-200">
                In words: <span className="text-slate-700 not-italic font-semibold">{wordsAmount}</span>
              </p>
            )}
          </div>

          {/* Description & Purpose */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Description / Particulars <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Q3 Cloud Retainer Invoice #108 or Office Lease"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                errors.description 
                  ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' 
                  : 'border-slate-300 focus:ring-slate-900/10 focus:border-slate-900'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.description}</p>
            )}
          </div>

          {/* Contact Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Contact / Party Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Kaveri Infotech Solutions"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    errors.contactName 
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' 
                      : 'border-slate-300 focus:ring-slate-900/10 focus:border-slate-900'
                  }`}
                />
              </div>
              {errors.contactName && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.contactName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Contact Phone / Mobile
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Transaction Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Transaction Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => handleChange('transactionDate', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                    errors.transactionDate 
                      ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' 
                      : 'border-slate-300 focus:ring-slate-900/10 focus:border-slate-900'
                  }`}
                />
              </div>
              {errors.transactionDate && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.transactionDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Reference / UTR / Cheque / Transaction ID (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. UTR #NEFT09819208 or UPI Txn Ref"
                value={formData.referenceNumber}
                onChange={(e) => handleChange('referenceNumber', e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Internal Corporate Notes (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Approved by Director; Tax invoice filed under Q3 GST portal."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Footer & Submit (Sticky bottom) */}
          <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 p-4 bg-slate-50 border-t border-slate-200 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white shadow-sm transition-all cursor-pointer ${
                isCredit 
                  ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' 
                  : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
              } disabled:opacity-50`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : (isEditing ? 'Save Changes' : (isCredit ? 'Record Credit' : 'Record Debit'))}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

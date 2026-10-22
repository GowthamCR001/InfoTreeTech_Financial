import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Mail, 
  User, 
  Shield, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function EditMemberModal({ isOpen, member, onClose, onSave }) {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    role: 'TEAM_MEMBER',
  });

  const [permissions, setPermissions] = useState({
    canAddCredit: false,
    canAddDebit: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sync state whenever member changes
  useEffect(() => {
    if (member) {
      setFormData({
        displayName: member.displayName || '',
        email: member.email || '',
        phoneNumber: member.phoneNumber || '',
        role: member.role || 'TEAM_MEMBER',
      });
      setPermissions({
        canAddCredit: Boolean(member.permissions?.canAddCredit),
        canAddDebit: Boolean(member.permissions?.canAddDebit),
      });
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const isSelf = member.uid === currentUser?.uid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.displayName.trim()) {
      setErrorMsg('Member full name is required.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('A valid corporate email address is required.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(member.uid, {
        ...formData,
        permissions: formData.role === 'ADMIN'
          ? { canAddCredit: true, canAddDebit: true }
          : permissions,
      });
      setSuccessMsg('Member profile and permissions updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update member details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-600 text-white flex-shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">Edit Member Account</h3>
              <p className="text-xs text-slate-300 truncate">
                Update account details, phone authorization, or permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto touch-scroll p-4 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Member UID Info */}
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium text-slate-700">Account Document UID:</span>
            <code className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
              {member.uid}
            </code>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Adarsh B S"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Corporate Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Corporate Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="e.g. member@infotreetech.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          {/* Authorized Mobile Phone Number */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Authorized Mobile Number <span className="text-slate-400 font-normal">(For Mobile OTP Sign-in)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              When this phone number is saved, the member can immediately sign in with Mobile OTP and their account will be automatically recognized.
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Assigned Access Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSelf}
                onClick={() => setFormData({ ...formData, role: 'TEAM_MEMBER' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.role === 'TEAM_MEMBER'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-bold text-xs text-slate-900">TEAM MEMBER</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Standard access: record ledger entries. Cannot edit/delete existing records.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  formData.role === 'ADMIN'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-xs text-indigo-900 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ADMINISTRATOR</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Full permissions: manage team, edit/delete entries, view audit logs.
                </div>
              </button>
            </div>
            {isSelf && (
              <p className="mt-1.5 text-[11px] text-amber-600 font-medium">
                * You cannot demote your own active administrator account.
              </p>
            )}
          </div>

          {/* Granular Operational Permissions */}
          {formData.role === 'TEAM_MEMBER' ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Granular Transaction Permissions
                </label>
                <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  RBAC Controls
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Configure which transaction operations this team member is authorized to execute:
              </p>

              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={permissions.canAddCredit}
                    onChange={(e) => setPermissions(prev => ({ ...prev, canAddCredit: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        + Add Credit
                      </span>
                      <span>Permit Incoming Funds & Receipts</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Allows member to record customer receipts, revenue, and credit entries.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={permissions.canAddDebit}
                    onChange={(e) => setPermissions(prev => ({ ...prev, canAddDebit: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                        - Add Debit
                      </span>
                      <span>Permit Outgoing Expenses & Disbursements</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Allows member to record vendor expenses, bills, and debit entries.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs text-indigo-900">
              <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Administrators retain full, unrestricted operational access across all features.</span>
            </div>
          )}
          </div>

          {/* Action Buttons (Sticky bottom) */}
          <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 p-4 bg-slate-50 border-t border-slate-100 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 cursor-pointer text-center"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

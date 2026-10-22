import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  Shield, 
  Eye, 
  EyeOff, 
  Sparkles, 
  HelpCircle,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function ProvisionMemberModal({ isOpen, onClose, onProvision }) {
  const { isDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'guide'

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    role: 'TEAM_MEMBER',
    password: '',
  });

  const [permissions, setPermissions] = useState({
    canAddCredit: false,
    canAddDebit: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = 'InfoTree@';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '2026';
    setFormData(prev => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.displayName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Valid corporate email is required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await onProvision({
        ...formData,
        permissions: formData.role === 'ADMIN'
          ? { canAddCredit: true, canAddDebit: true }
          : permissions,
      });
      setSuccessMsg(`Successfully provisioned account for ${formData.email} as ${formData.role === 'ADMIN' ? 'Administrator' : 'Team Member'}.`);
      setFormData({
        displayName: '',
        email: '',
        phoneNumber: '',
        role: 'TEAM_MEMBER',
        password: '',
      });
      setPermissions({
        canAddCredit: false,
        canAddDebit: false,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to provision team member account.');
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">Provision Team Member</h3>
              <p className="text-xs text-slate-300 truncate">
                Grant authorized ledger access to company personnel
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold px-4 pt-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 sm:px-4 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'border-indigo-600 text-indigo-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Member Account Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3 sm:px-4 py-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Firebase Console Steps
          </button>
        </div>

        {/* Tab 1: Interactive Form */}
        {activeTab === 'form' && (
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

            {/* Mode badge */}
            <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              isDemoMode 
                ? 'bg-amber-50 text-amber-900 border-amber-200' 
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}>
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>
                {isDemoMode
                  ? 'Currently in Preview Mode: Submitting will add this user to your active session directory.'
                  : 'Live Firebase Connected: Submitting will securely create Firebase Auth credentials & assign role in Firestore.'}
              </span>
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
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
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
                  placeholder="e.g. ramesh@infotreetech.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>

            {/* Mobile Phone Number */}
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
                Member can sign in with this mobile number via OTP, or with their email + password.
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
                  onClick={() => setFormData({ ...formData, role: 'TEAM_MEMBER' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.role === 'TEAM_MEMBER'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">TEAM MEMBER</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Can record credits/debits & view ledger. Cannot edit/delete records.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                  className={`p-3 rounded-xl border text-left transition-all ${
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
                    Full permissions: edit/delete, audit logs, opening balance & settings.
                  </div>
                </button>
              </div>
            </div>

            {/* Granular Operational Permissions */}
            {formData.role === 'TEAM_MEMBER' ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Operational Financial Permissions
                  </label>
                  <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Default: Restricted
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  By default, team members cannot record transactions. Grant permissions explicitly below:
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
                        Allows this member to record customer receipts, revenue, and credit entries.
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
                        Allows this member to record vendor expenses, bills, and debit entries.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Administrators automatically have complete access to Add Credit and Add Debit.</span>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Generate Strong Password
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Actions (Sticky bottom) */}
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
                className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-slate-900/20 disabled:opacity-50 cursor-pointer text-center"
              >
                {isLoading ? 'Creating Account...' : 'Provision Member'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Manual Console Guide */}
        {activeTab === 'guide' && (
          <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1">Manual Provisioning via Firebase Console</h4>
              <p className="text-slate-600">
                If you prefer creating accounts directly in the Google Firebase Console:
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-2 pl-1 text-slate-600">
              <li>
                Open <strong>Firebase Console &gt; Authentication &gt; Users &gt; Add user</strong>.
              </li>
              <li>
                Enter your team member's corporate email and password. Copy their generated <strong>User UID</strong>.
              </li>
              <li>
                Go to <strong>Cloud Firestore &gt; Data &gt; users</strong> collection.
              </li>
              <li>
                Create a document with Document ID set to their <strong>User UID</strong>:
                <pre className="mt-2 p-2.5 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
{`{
  "uid": "COPIED_USER_UID",
  "displayName": "Member Full Name",
  "email": "member@infotreetech.com",
  "role": "TEAM_MEMBER",
  "isActive": true,
  "createdAt": "2026-10-22T10:00:00Z"
}`}
                </pre>
              </li>
              <li>
                The member can now sign in at the InfoTreeTech login screen with their credentials.
              </li>
            </ol>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Back to Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

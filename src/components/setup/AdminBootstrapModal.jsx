import React from 'react';
import { X, ShieldCheck, UserCheck, AlertOctagon, KeyRound, Terminal, CheckCircle2 } from 'lucide-react';

export function AdminBootstrapModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-600 text-white flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">Admin Account Setup & Team Provisioning</h3>
              <p className="text-xs text-slate-300 truncate">
                Secure procedure for creating accounts without a custom backend server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 flex-1 overflow-y-auto touch-scroll leading-relaxed">
          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
            <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Strict Security Constraint: No Self-Promotion</h4>
              <p className="mt-0.5 text-rose-800">
                To prevent privilege escalation, frontend users cannot register themselves or change their own role to ADMIN. Firestore Security Rules enforce that any document in the <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">users</code> collection can only have its role or active status altered by an existing verified ADMIN.
              </p>
            </div>
          </div>

          {/* Section 1: How to bootstrap the First Admin Account */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              1. Provisioning the Initial Company Admin Account
            </h4>
            <p className="mb-2.5 text-slate-600">
              Since there are no admins initially, the company owner seeds the first administrator directly through the Firebase Console:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600">
              <li>
                In the Firebase Console, go to <strong>Authentication &gt; Users &gt; Add user</strong>.
              </li>
              <li>
                Enter your administrative email (e.g. <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">owner@yourcompany.in</code>) and a strong password.
              </li>
              <li>
                Copy the generated <strong>User UID</strong> (e.g. <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">8f9b2c...</code>).
              </li>
              <li>
                Navigate to <strong>Cloud Firestore</strong>, open the <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">users</code> collection, and create a document with the Document ID set exactly to that <strong>User UID</strong>:
                <pre className="mt-2 p-2.5 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
{`{
  "uid": "YOUR_COPIED_USER_UID",
  "displayName": "Director / Owner Name",
  "email": "owner@yourcompany.in",
  "role": "ADMIN",
  "isActive": true,
  "createdAt": "2026-10-22T10:00:00Z"
}`}
                </pre>
              </li>
              <li>
                You can now log in using the app's login page with full administrative privileges!
              </li>
            </ol>
          </div>

          {/* Section 2: Adding Team Members */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              2. Onboarding Team Members
            </h4>
            <p className="mb-2 text-slate-600">
              To add colleagues, accountants, or operational staff:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
              <li>
                The administrator creates their email/password account in the Firebase Auth console.
              </li>
              <li>
                In Firestore, add a doc in <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">users/{uid}</code> with <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">role: "TEAM_MEMBER"</code>.
              </li>
              <li>
                Team members have zero transactional permissions by default. The administrator can grant or revoke Add Credit and Add Debit permissions individually from Team Accounts & Permissions.
              </li>
            </ul>
          </div>

          {/* Section 3: Deactivating Departing Staff */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              3. Account Deactivation
            </h4>
            <p className="text-slate-600">
              When an employee departs, the Admin navigates to the <strong>Team Accounts</strong> page in InfoTreeTech and clicks "Deactivate". The app immediately invalidates their session, and Firestore Security Rules will block all subsequent database reads and writes.
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 bg-slate-50 border-t border-slate-200 flex justify-end pb-safe">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  HelpCircle,
  AlertTriangle,
  Edit3,
  Trash2
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { AdminBootstrapModal } from '../components/setup/AdminBootstrapModal';
import { ProvisionMemberModal } from '../components/team/ProvisionMemberModal';
import { EditMemberModal } from '../components/team/EditMemberModal';
import { formatDisplayDateTime } from '../utils/dateUtils';

export function TeamPage() {
  const { 
    teamMembers, 
    toggleUserStatus, 
    changeUserRole, 
    provisionMember,
    editTeamMember,
    updateMemberPermissions,
    deleteTeamMember
  } = useFinance();
  const { currentUser, isAdmin } = useAuth();

  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isBootstrapModalOpen, setIsBootstrapModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'toggleStatus' | 'toggleRole' | 'deleteUser'
  const [isLoading, setIsLoading] = useState(false);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Restricted Admin Area</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only company administrators are authorized to manage team member accounts and access permissions.
        </p>
      </div>
    );
  }

  const handleTogglePermission = async (member, permKey) => {
    const currentPerms = member.permissions || { canAddCredit: false, canAddDebit: false };
    const updatedPerms = {
      ...currentPerms,
      [permKey]: !currentPerms[permKey],
    };

    try {
      await updateMemberPermissions(member.uid, updatedPerms);
    } catch (err) {
      console.error('Personnel permission update error:', err);
      alert(`Permission update error: ${err.message}`);
    }
  };

  const handleActionClick = (user, action) => {
    setTargetUser(user);
    setModalAction(action);
  };

  const handleConfirmAction = async () => {
    if (!targetUser) return;
    setIsLoading(true);
    try {
      if (modalAction === 'toggleStatus') {
        await toggleUserStatus(targetUser.uid, !targetUser.isActive);
      } else if (modalAction === 'toggleRole') {
        const newRole = targetUser.role === 'ADMIN' ? 'TEAM_MEMBER' : 'ADMIN';
        await changeUserRole(targetUser.uid, newRole);
      } else if (modalAction === 'deleteUser') {
        await deleteTeamMember(targetUser.uid);
      }
      setTargetUser(null);
      setModalAction(null);
    } catch (err) {
      console.error('Personnel action error:', err);
      alert(`Action error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const modalDetails = (() => {
    if (!targetUser || !modalAction) return {};
    if (modalAction === 'deleteUser') {
      return {
        title: 'Permanently Delete Member Account',
        message: `Are you sure you want to permanently delete "${targetUser.displayName || targetUser.email}" (UID: #${targetUser.uid?.slice(0, 8)})? Their Firestore profile and permissions will be permanently removed. This action cannot be undone.`,
        confirmText: 'Delete Account',
        confirmVariant: 'danger',
      };
    }
    if (modalAction === 'toggleStatus') {
      return {
        title: targetUser.isActive ? 'Deactivate Account' : 'Reactivate Account',
        message: `Are you sure you want to ${targetUser.isActive ? 'deactivate' : 'reactivate'} ${targetUser.email}? ${targetUser.isActive ? 'This will immediately revoke their ability to read or submit transactions.' : 'They will regain ledger access upon their next login.'}`,
        confirmText: targetUser.isActive ? 'Deactivate' : 'Reactivate',
        confirmVariant: targetUser.isActive ? 'danger' : 'primary',
      };
    }
    if (modalAction === 'toggleRole') {
      return {
        title: targetUser.role === 'ADMIN' ? 'Demote Administrator' : 'Promote to Administrator',
        message: `Are you sure you want to change ${targetUser.email}'s role to ${targetUser.role === 'ADMIN' ? 'TEAM_MEMBER' : 'ADMIN'}? ${targetUser.role !== 'ADMIN' ? 'This user will gain full privileges to edit, delete transactions and view audit history.' : 'This user will no longer be able to edit transactions or change settings.'}`,
        confirmText: 'Change Role',
        confirmVariant: 'primary',
      };
    }
    return {};
  })();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Authorized Team Accounts & Permissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company member roles, view active authorizations, or deactivate departing personnel
          </p>
        </div>

        <button
          onClick={() => setIsProvisionModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Member</span>
        </button>
      </div>

      {/* Info Notice on No-Backend Team Management */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <h4 className="font-bold text-slate-900">Direct Client-to-Firestore Authorization Model</h4>
          <p className="mt-0.5 text-slate-600">
            Because this application operates without a custom backend server, team accounts are created in the Firebase Authentication Console, and their role is stored securely in the Firestore <code className="bg-white px-1 py-0.5 rounded border border-slate-300 font-mono">users</code> collection. Deactivated users are blocked by Firestore Security Rules.
          </p>
        </div>
      </div>

      {/* Team Member Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Registered Company Personnel ({teamMembers.length})
          </h3>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <th className="py-3 px-4">Member / Name</th>
                <th className="py-3 px-4">Corporate Email</th>
                <th className="py-3 px-4">Mobile Phone</th>
                <th className="py-3 px-4 text-center">Assigned Role</th>
                <th className="py-3 px-4 text-center">Operational Permissions</th>
                <th className="py-3 px-4 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {teamMembers.map(member => {
                const isSelf = member.uid === currentUser?.uid;
                const isAdminRole = member.role === 'ADMIN';

                return (
                  <tr key={member.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {member.displayName || 'Authorized User'}
                      {isSelf && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-medium">
                          You
                        </span>
                      )}
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        UID: #{member.uid?.slice(0, 8)}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-600">
                      {member.email}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {member.phoneNumber || <span className="text-slate-400 font-sans italic">Not linked</span>}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Badge variant={isAdminRole ? 'admin' : 'member'} size="sm">
                        {member.role || 'TEAM_MEMBER'}
                      </Badge>
                    </td>

                    {/* Operational Permissions Toggle Column */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isAdminRole ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Full Admin Rights</span>
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {/* Add Credit Toggle */}
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(member, 'canAddCredit')}
                            title={member.permissions?.canAddCredit ? 'Click to REVOKE Add Credit permission' : 'Click to GRANT Add Credit permission'}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border cursor-pointer select-none ${
                              member.permissions?.canAddCredit
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 shadow-2xs'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/70 hover:text-slate-600'
                            }`}
                          >
                            {member.permissions?.canAddCredit ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-slate-400" />
                            )}
                            <span>+ Credit</span>
                          </button>

                          {/* Add Debit Toggle */}
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(member, 'canAddDebit')}
                            title={member.permissions?.canAddDebit ? 'Click to REVOKE Add Debit permission' : 'Click to GRANT Add Debit permission'}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border cursor-pointer select-none ${
                              member.permissions?.canAddDebit
                                ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 hover:border-rose-400 shadow-2xs'
                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/70 hover:text-slate-600'
                            }`}
                          >
                            {member.permissions?.canAddDebit ? (
                              <CheckCircle2 className="w-3 h-3 text-rose-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-slate-400" />
                            )}
                            <span>- Debit</span>
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Badge variant={member.isActive ? 'active' : 'inactive'} size="sm">
                        {member.isActive ? 'Active Access' : 'Deactivated'}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Member Details */}
                        <button
                          onClick={() => setEditingMember(member)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-colors shadow-2xs"
                          title="Edit Member Information"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        {/* Toggle Role Button */}
                        <button
                          onClick={() => handleActionClick(member, 'toggleRole')}
                          disabled={isSelf}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                          title="Change Role"
                        >
                          {isAdminRole ? 'Demote to Member' : 'Promote to Admin'}
                        </button>

                        {/* Toggle Active Status */}
                        <button
                          onClick={() => handleActionClick(member, 'toggleStatus')}
                          disabled={isSelf}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors disabled:opacity-40 ${
                            member.isActive
                              ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {member.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>

                        {/* Delete Member */}
                        <button
                          onClick={() => handleActionClick(member, 'deleteUser')}
                          disabled={isSelf}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          title={isSelf ? "You cannot delete your own account" : "Permanently Delete Member"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {targetUser && (
        <ConfirmModal
          isOpen={Boolean(targetUser)}
          onClose={() => setTargetUser(null)}
          onConfirm={handleConfirmAction}
          isLoading={isLoading}
          title={modalDetails.title || 'Confirm Action'}
          message={modalDetails.message || ''}
          confirmText={modalDetails.confirmText || 'Confirm'}
          confirmVariant={modalDetails.confirmVariant || 'danger'}
        />
      )}

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSave={editTeamMember}
      />

      {/* Interactive Provision Team Member Modal */}
      <ProvisionMemberModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onProvision={provisionMember}
      />

      {/* Bootstrap instructions modal */}
      <AdminBootstrapModal
        isOpen={isBootstrapModalOpen}
        onClose={() => setIsBootstrapModalOpen(false)}
      />
    </div>
  );
}

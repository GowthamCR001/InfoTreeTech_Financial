import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  User, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Search,
  Hash
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatDisplayDateTime } from '../utils/dateUtils';
import { Badge } from '../components/common/Badge';

export function AuditLogsPage() {
  const { auditLogs } = useFinance();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Restricted Admin Area</h3>
        <p className="text-xs text-slate-500 mt-1">
          Only company administrators are permitted to view audit logs and historical changes.
        </p>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    const user = (log.userEmail || log.userId || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const summary = (log.summary || '').toLowerCase();
    const txId = (log.transactionId || '').toLowerCase();
    return user.includes(q) || action.includes(q) || summary.includes(q) || txId.includes(q);
  });

  const toggleExpand = (id) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="credit" size="sm">CREATED</Badge>;
      case 'UPDATE':
        return <Badge variant="admin" size="sm">UPDATED</Badge>;
      case 'DELETE':
        return <Badge variant="debit" size="sm">DELETED (SOFT)</Badge>;
      default:
        return <Badge size="sm">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          System Audit Trail & History
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable append-only record of transaction creation, modification diffs, and soft deletions
        </p>
      </div>

      {/* Mandatory Architecture & Security Limits Disclosure */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed space-y-1">
          <h4 className="font-bold text-slate-900">
            Security Disclosure: Limits of Client-Originated Audit Integrity
          </h4>
          <p className="text-slate-700">
            Because this application uses the client-side Firebase SDK without trusted backend code (such as Cloud Functions or a dedicated server), audit log entries are originated by the client browser during batched writes.
          </p>
          <p className="text-slate-600">
            While Firestore Security Rules strictly enforce that audit records are <strong>append-only</strong> (read: ADMIN, create: authenticated, update: false, delete: false), client-originated logs cannot be considered cryptographically tamper-proof against a malicious authenticated user crafting direct Firebase SDK network requests. For bank-grade unalterable audit trails, trusted server-side Firestore Triggers (Cloud Functions) would be required.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search logs by user, action, summary, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-800"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{filteredLogs.length}</span> audit events
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredLogs.length > 0 ? (
          filteredLogs.map(log => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-xs text-slate-900 break-words">
                      {log.summary || `Action ${log.action}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700 truncate max-w-[200px]">
                      <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{log.userEmail || log.userId}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{formatDisplayDateTime(log.timestamp)}</span>
                    </span>
                    {(log.previousValues || log.newValues) && (
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5 ml-1"
                      >
                        <span>{isExpanded ? 'Hide Diff' : 'View Diff'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>Log ID: #{log.id?.slice(0, 8)}</span>
                  <span>Txn: #{log.transactionId?.slice(0, 8)}</span>
                </div>

                {/* Diff Viewer (JSON map) */}
                {isExpanded && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-[11px] font-mono">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="font-semibold text-rose-700 mb-1">
                        Previous Document State:
                      </div>
                      <pre className="text-slate-600 overflow-x-auto whitespace-pre-wrap">
                        {log.previousValues ? JSON.stringify(log.previousValues, null, 2) : 'null (Newly Created Record)'}
                      </pre>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="font-semibold text-emerald-700 mb-1">
                        Applied Changes State:
                      </div>
                      <pre className="text-slate-600 overflow-x-auto whitespace-pre-wrap">
                        {log.newValues ? JSON.stringify(log.newValues, null, 2) : 'null'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No audit log entries found.
          </div>
        )}
      </div>
    </div>
  );
}

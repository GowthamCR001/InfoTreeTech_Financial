import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  FileText, 
  CreditCard, 
  User, 
  Phone,
  Hash,
  Clock
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { formatDisplayDate, formatDisplayDateTime } from '../../utils/dateUtils';
import { TypeBadge, Badge } from '../common/Badge';

export function TransactionTable({
  transactions,
  isAdmin,
  onEdit,
  onDelete,
  onViewDetails,
}) {
  const [sortField, setSortField] = useState('transactionDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'amount') {
      aVal = Number(aVal || 0);
      bVal = Number(bVal || 0);
    } else if (sortField === 'createdAt') {
      aVal = a.createdAt?.seconds || 0;
      bVal = b.createdAt?.seconds || 0;
    } else {
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto touch-scroll">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <th 
                onClick={() => handleSort('transactionDate')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date & Ref</span>
                  <SortIcon field="transactionDate" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('description')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none min-w-[200px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Particulars / Description</span>
                  <SortIcon field="description" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('contactName')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none min-w-[160px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Party / Contact</span>
                  <SortIcon field="contactName" />
                </div>
              </th>

              <th className="py-3 px-3.5 select-none whitespace-nowrap">
                Type & Mode
              </th>

              <th 
                onClick={() => handleSort('amount')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Credit (Inflow)</span>
                  <SortIcon field="amount" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('amount')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-100/70 transition-colors group select-none whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Debit (Outflow)</span>
                  <SortIcon field="amount" />
                </div>
              </th>

              <th className="py-3 px-3.5 text-right select-none whitespace-nowrap">
                Running Balance
              </th>

              <th className="py-3 px-3.5 select-none whitespace-nowrap">
                Recorded By
              </th>

              {isAdmin && (
                <th className="py-3 px-3.5 text-right select-none whitespace-nowrap">
                  Admin Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sortedTransactions.map((tx) => {
              const isCredit = tx.transactionType === 'CREDIT';
              return (
                <tr 
                  key={tx.id} 
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Date & ID */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">
                      {formatDisplayDate(tx.transactionDate)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 font-mono">
                      <span>#{tx.id ? tx.id.slice(0, 8) : 'NEW'}</span>
                      {tx.month && tx.year && (
                        <span className="text-slate-400">· {tx.month}/{tx.year}</span>
                      )}
                    </div>
                  </td>

                  {/* Description & Reference */}
                  <td className="py-3 px-3.5">
                    <p className="font-medium text-slate-900 leading-snug">
                      {tx.description}
                    </p>
                    {tx.referenceNumber && (
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-slate-400" />
                        {tx.referenceNumber}
                      </p>
                    )}
                    {tx.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                        "{tx.notes}"
                      </p>
                    )}
                  </td>

                  {/* Contact Name & Phone */}
                  <td className="py-3 px-3.5">
                    <div className="font-medium text-slate-800">
                      {tx.contactName}
                    </div>
                    {tx.contactNumber && (
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {tx.contactNumber}
                      </div>
                    )}
                  </td>

                  {/* Type & Payment Mode */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <TypeBadge type={tx.transactionType} />
                    <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      {tx.paymentMethod}
                    </div>
                  </td>

                  {/* Credit Amount */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-semibold">
                    {isCredit ? (
                      <span className="text-emerald-700 font-bold">
                        +{formatINR(tx.amount)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Debit Amount */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-semibold">
                    {!isCredit ? (
                      <span className="text-rose-700 font-bold">
                        -{formatINR(tx.amount)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Running Balance */}
                  <td className="py-3 px-3.5 text-right whitespace-nowrap font-semibold">
                    {tx.runningBalance !== undefined ? (
                      <span className={`font-mono ${tx.runningBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                        {formatINR(tx.runningBalance)}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>

                  {/* Created By & Timestamp */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="font-medium text-slate-800 text-[11px] truncate max-w-[130px]">
                      {tx.createdByName || tx.createdByEmail || tx.createdBy?.slice(0, 8)}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDisplayDateTime(tx.createdAt)}
                    </div>
                  </td>

                  {/* Admin Actions (ONLY visible for Admin users) */}
                  {isAdmin && (
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(tx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Edit Transaction (Admin)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(tx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Soft-Delete Transaction (Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

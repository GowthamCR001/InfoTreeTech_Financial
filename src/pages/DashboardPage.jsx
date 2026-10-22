import React from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  Calendar, 
  CalendarDays, 
  Hash, 
  Receipt,
  PlusCircle,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { formatINR } from '../utils/currency';
import { formatDisplayDate } from '../utils/dateUtils';
import { TypeBadge } from '../components/common/Badge';

export function DashboardPage({ onNavigateToTransactions, onAddCredit, onAddDebit }) {
  const { totals, currentMonthTotals, companySettings, transactionsWithRunningBalance } = useFinance();
  const { isAdmin, canAddCredit, canAddDebit } = useAuth();

  const recentTransactions = transactionsWithRunningBalance.slice(0, 6);

  // Calculate net monthly cash flow
  const monthlyNet = currentMonthTotals.credits - currentMonthTotals.debits;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Financial Health Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                Live Ledger Overview
              </span>
              <span className="text-xs text-slate-400">
                Deterministic integer paise arithmetic
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white break-words">
              {formatINR(totals.closingBalance)}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Current Closing Balance (Opening Balance ₹ {companySettings.openingBalance?.toLocaleString('en-IN')} + Credits ₹ {totals.totalCredits?.toLocaleString('en-IN')} − Debits ₹ {totals.totalDebits?.toLocaleString('en-IN')})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
            {canAddCredit && (
              <button
                onClick={onAddCredit}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Add Credit</span>
              </button>
            )}
            {canAddDebit && (
              <button
                onClick={onAddDebit}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Add Debit</span>
              </button>
            )}
            {!canAddCredit && !canAddDebit && (
              <div className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-slate-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0"></span>
                <span>Read-Only Member View (Permissions assigned by Admin)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: Core Totals (Opening Balance, Total Credits, Total Debits, Current Balance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Opening Balance"
          amount={totals.openingBalance}
          subtitle={`Effective: ${companySettings.openingBalanceEffectiveDate || '01 Apr 2026'}`}
          icon={Wallet}
          variant="default"
        />

        <StatCard
          title="Total Credits"
          amount={totals.totalCredits}
          subtitle="All-time verified inflows"
          icon={ArrowDownLeft}
          variant="emerald"
        />

        <StatCard
          title="Total Debits"
          amount={totals.totalDebits}
          subtitle="All-time verified disbursements"
          icon={ArrowUpRight}
          variant="rose"
        />

        <StatCard
          title="Current Balance"
          amount={totals.closingBalance}
          subtitle="Closing ledger balance"
          icon={Scale}
          variant="navy"
        />
      </div>

      {/* Row 2: Current Month Activity & Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={`This Month Credits (${currentMonthTotals.monthString})`}
          amount={currentMonthTotals.credits}
          subtitle="Current calendar month receipts"
          icon={Calendar}
          variant="emerald"
        />

        <StatCard
          title={`This Month Debits (${currentMonthTotals.monthString})`}
          amount={currentMonthTotals.debits}
          subtitle="Current calendar month expenses"
          icon={CalendarDays}
          variant="rose"
        />

        <StatCard
          title="Total Transactions"
          amount={totals.transactionCount}
          subtitle={`Active ledger records (${currentMonthTotals.count} this month)`}
          icon={Hash}
          variant="default"
          isCurrency={false}
        />
      </div>

      {/* Recent Transactions List Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Most recent financial records with calculated running balance</p>
            </div>
          </div>

          <button
            onClick={onNavigateToTransactions}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>View All Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <th className="py-2.5 px-4 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-4 min-w-[180px]">Description</th>
                <th className="py-2.5 px-4 min-w-[140px]">Contact</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Method</th>
                <th className="py-2.5 px-4 text-right">Inflow / Outflow</th>
                <th className="py-2.5 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentTransactions.map((tx) => {
                const isCredit = tx.transactionType === 'CREDIT';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {formatDisplayDate(tx.transactionDate)}
                    </td>
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="font-medium text-slate-900 truncate">
                        {tx.description}
                      </div>
                      {tx.referenceNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {tx.referenceNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {tx.contactName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                      <span className={isCredit ? 'text-emerald-700' : 'text-rose-700'}>
                        {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {tx.runningBalance !== undefined ? formatINR(tx.runningBalance) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

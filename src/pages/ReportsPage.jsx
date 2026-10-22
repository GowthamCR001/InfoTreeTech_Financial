import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  CreditCard,
  Building2,
  PieChart
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatINR, toPaise, toRupees } from '../utils/currency';
import { exportTransactionsToCSV } from '../utils/csvExport';

const MONTHS = [
  { val: '01', name: 'January' },
  { val: '02', name: 'February' },
  { val: '03', name: 'March' },
  { val: '04', name: 'April' },
  { val: '05', name: 'May' },
  { val: '06', name: 'June' },
  { val: '07', name: 'July' },
  { val: '08', name: 'August' },
  { val: '09', name: 'September' },
  { val: '10', name: 'October' },
  { val: '11', name: 'November' },
  { val: '12', name: 'December' },
];

export function ReportsPage() {
  const { transactions, companySettings } = useFinance();

  const [reportType, setReportType] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('10'); // October

  // Filter transactions belonging to the selected period
  const periodTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txYear = tx.year ? String(tx.year) : tx.transactionDate?.split('-')[0];
      if (txYear !== selectedYear) return false;

      if (reportType === 'monthly') {
        const txMonth = tx.month ? String(tx.month).padStart(2, '0') : tx.transactionDate?.split('-')[1];
        if (txMonth !== selectedMonth) return false;
      }

      return true;
    });
  }, [transactions, reportType, selectedYear, selectedMonth]);

  // Financial calculations for period
  const periodMetrics = useMemo(() => {
    let creditsPaise = 0;
    let debitsPaise = 0;

    for (const tx of periodTransactions) {
      const paise = tx.amountInPaise !== undefined ? tx.amountInPaise : toPaise(tx.amount);
      if (tx.transactionType === 'CREDIT') {
        creditsPaise += paise;
      } else {
        debitsPaise += paise;
      }
    }

    const netFlowPaise = creditsPaise - debitsPaise;

    return {
      credits: toRupees(creditsPaise),
      creditsPaise,
      debits: toRupees(debitsPaise),
      debitsPaise,
      netFlow: toRupees(netFlowPaise),
      netFlowPaise,
      count: periodTransactions.length,
    };
  }, [periodTransactions]);

  // Payment method summary breakdown
  const paymentMethodSummary = useMemo(() => {
    const methods = {};

    periodTransactions.forEach(tx => {
      const method = tx.paymentMethod || 'Other';
      if (!methods[method]) {
        methods[method] = { creditsPaise: 0, debitsPaise: 0, count: 0 };
      }

      const paise = tx.amountInPaise !== undefined ? tx.amountInPaise : toPaise(tx.amount);
      if (tx.transactionType === 'CREDIT') {
        methods[method].creditsPaise += paise;
      } else {
        methods[method].debitsPaise += paise;
      }
      methods[method].count += 1;
    });

    return Object.entries(methods).map(([method, data]) => ({
      method,
      credits: toRupees(data.creditsPaise),
      debits: toRupees(data.debitsPaise),
      totalVolume: toRupees(data.creditsPaise + data.debitsPaise),
      count: data.count,
    })).sort((a, b) => b.totalVolume - a.totalVolume);
  }, [periodTransactions]);

  // Export report dataset
  const handleExportReportCSV = () => {
    const periodLabel = reportType === 'monthly'
      ? `${MONTHS.find(m => m.val === selectedMonth)?.name}-${selectedYear}`
      : `FullYear-${selectedYear}`;

    exportTransactionsToCSV(periodTransactions, {
      filename: `financial-report-${periodLabel}.csv`,
      companyName: `${companySettings.companyName || 'Company'} (${periodLabel})`,
    });
  };

  const periodTitle = reportType === 'monthly'
    ? `${MONTHS.find(m => m.val === selectedMonth)?.name} ${selectedYear}`
    : `Financial Year ${selectedYear}`;

  return (
    <div className="space-y-6">
      {/* Page Header & Period Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Financial Performance Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified ledger reconciliation, cash flow metrics, and disbursement breakdown
          </p>
        </div>

        {/* Controls: Monthly vs Yearly & Year/Month selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {/* Segmented Period Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold w-full sm:w-auto">
            <button
              onClick={() => setReportType('monthly')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                reportType === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Report
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all text-center cursor-pointer ${
                reportType === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly Report
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Month selector if monthly */}
            {reportType === 'monthly' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
              >
                {MONTHS.map(m => (
                  <option key={m.val} value={m.val}>{m.name}</option>
                ))}
              </select>
            )}

            {/* Year selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {/* CSV Export Button */}
            <button
              onClick={handleExportReportCSV}
              disabled={periodTransactions.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards for Selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Period Inflows (Credits)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-700">
            {formatINR(periodMetrics.credits)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Total verified customer & client payments
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Period Outflows (Debits)
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-rose-700">
            {formatINR(periodMetrics.debits)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Total operational disbursements & payments
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Net Cash Flow
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold ${periodMetrics.netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatINR(periodMetrics.netFlow)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {periodMetrics.netFlow >= 0 ? 'Net Cash Surplus' : 'Net Cash Deficit'} in {periodTitle}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Transactions Executed
            </span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {periodMetrics.count}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ledger vouchers recorded in {periodTitle}
          </p>
        </div>
      </div>

      {/* Payment Method Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Payment Method & Rail Breakdown ({periodTitle})
              </h3>
              <p className="text-xs text-slate-500">Distribution across Net Banking, UPI, Cards, and Cheques</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs border-collapse min-w-[620px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-center">Transactions</th>
                <th className="py-3 px-4 text-right">Inflow (Credits)</th>
                <th className="py-3 px-4 text-right">Outflow (Debits)</th>
                <th className="py-3 px-4 text-right">Gross Turnaround</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paymentMethodSummary.length > 0 ? (
                paymentMethodSummary.map(row => (
                  <tr key={row.method} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {row.method}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">
                      {row.count}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {row.credits > 0 ? `+${formatINR(row.credits)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      {row.debits > 0 ? `-${formatINR(row.debits)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatINR(row.totalVolume)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No transactions recorded for {periodTitle}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Search, Filter, X, Calendar, RotateCcw } from 'lucide-react';

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'UPI',
  'Cash',
  'Cheque',
  'Card',
  'Other'
];

export function TransactionFilters({
  filters,
  onFilterChange,
  onResetFilters,
  totalMatching,
  availableYears = [2026, 2025],
}) {
  const hasActiveFilters = Boolean(
    filters.search ||
    filters.type !== 'ALL' ||
    filters.startDate ||
    filters.endDate ||
    filters.month !== 'ALL' ||
    filters.year !== 'ALL' ||
    filters.paymentMethod !== 'ALL'
  );

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 mb-5">
      {/* Search Bar + Quick Type Filter Tabs */}
      <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by description, contact name, phone, or reference number..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Transaction Type Segment Filter */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => onFilterChange('type', 'ALL')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
              filters.type === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange('type', 'CREDIT')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
              filters.type === 'CREDIT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Credits
          </button>
          <button
            onClick={() => onFilterChange('type', 'DEBIT')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
              filters.type === 'DEBIT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Debits
          </button>
        </div>
      </div>

      {/* Advanced Filters: Date Range, Month, Year, Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
        {/* Date From */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
          />
        </div>

        {/* Month Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Month
          </label>
          <select
            value={filters.month}
            onChange={(e) => onFilterChange('month', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
          >
            <option value="ALL">All Months</option>
            {MONTH_OPTIONS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => onFilterChange('year', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
          >
            <option value="ALL">All Years</option>
            {availableYears.map(yr => (
              <option key={yr} value={String(yr)}>{yr}</option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Payment Mode
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-slate-800"
          >
            <option value="ALL">All Methods</option>
            {PAYMENT_METHODS.map(pm => (
              <option key={pm} value={pm}>{pm}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Stats & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-slate-500">
        <div>
          Showing <span className="font-bold text-slate-800">{totalMatching}</span> records
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Menu, PlusCircle, ArrowDownLeft, ArrowUpRight, Cloud, CloudOff, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

export function Header({
  title,
  subtitle,
  onOpenMobileMenu,
  onAddCredit,
  onAddDebit,
  onOpenConfigModal,
}) {
  const { isDemoMode, canAddCredit, canAddDebit } = useAuth();
  const { companySettings } = useFinance();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 transition-all">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden flex-shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {title}
              </h2>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex-shrink-0">
                <img 
                  src="/infotree-logo.png" 
                  alt="" 
                  className="w-4 h-4 rounded-full object-contain bg-white"
                />
                <span className="truncate max-w-[150px]">{companySettings.companyName || 'InfoTreeTech Pvt Ltd'}</span>
              </span>
            </div>
            {subtitle && (
              <p className="hidden xs:block sm:block text-xs text-slate-500 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions & Firebase Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Connection status indicator */}
          <button
            onClick={onOpenConfigModal}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              !isDemoMode 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to view Firebase connection details"
          >
            {!isDemoMode ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Firestore</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo Preview Mode</span>
              </>
            )}
          </button>

          {/* Quick Action: Add Credit (Green) - Only visible if permitted */}
          {canAddCredit && (
            <button
              onClick={onAddCredit}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-400 cursor-pointer flex-shrink-0"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="hidden xs:inline sm:inline">Add</span> Credit
            </button>
          )}

          {/* Quick Action: Add Debit (Red) - Only visible if permitted */}
          {canAddDebit && (
            <button
              onClick={onAddDebit}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-rose-400 cursor-pointer flex-shrink-0"
            >
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
              <span className="hidden xs:inline sm:inline">Add</span> Debit
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

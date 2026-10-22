import React from 'react';
import { formatINR } from '../../utils/currency';

export function StatCard({
  title,
  amount,
  subtitle,
  icon: Icon,
  variant = 'default',
  amountPrefix,
  isCurrency = true,
}) {
  const variantStyles = {
    navy: {
      card: 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white border-slate-800 shadow-md',
      title: 'text-slate-300 font-medium text-xs uppercase tracking-wider',
      amount: 'text-white font-bold',
      subtitle: 'text-slate-400',
      iconBox: 'bg-white/10 text-white border border-white/10',
    },
    emerald: {
      card: 'bg-white border-slate-200/90 hover:border-emerald-300 transition-colors shadow-sm',
      title: 'text-emerald-700 font-medium text-xs uppercase tracking-wider',
      amount: 'text-emerald-700 font-bold',
      subtitle: 'text-slate-500',
      iconBox: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    rose: {
      card: 'bg-white border-slate-200/90 hover:border-rose-300 transition-colors shadow-sm',
      title: 'text-rose-700 font-medium text-xs uppercase tracking-wider',
      amount: 'text-rose-700 font-bold',
      subtitle: 'text-slate-500',
      iconBox: 'bg-rose-50 text-rose-600 border border-rose-100',
    },
    default: {
      card: 'bg-white border-slate-200/90 shadow-sm hover:border-slate-300 transition-colors',
      title: 'text-slate-500 font-medium text-xs uppercase tracking-wider',
      amount: 'text-slate-900 font-bold',
      subtitle: 'text-slate-500',
      iconBox: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`rounded-xl border p-4 sm:p-5 min-w-0 ${style.card}`}>
      <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-2">
        <span className={`truncate text-xs ${style.title}`}>{title}</span>
        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${style.iconBox}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 min-w-0">
        {amountPrefix && <span className="text-lg sm:text-xl font-bold flex-shrink-0">{amountPrefix}</span>}
        <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate ${style.amount}`}>
          {isCurrency ? formatINR(amount) : amount}
        </h3>
      </div>

      {subtitle && (
        <p className={`mt-2 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 truncate ${style.subtitle}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

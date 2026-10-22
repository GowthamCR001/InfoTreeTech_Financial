import React from 'react';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const variantClasses = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    credit: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    debit: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    admin: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    member: 'bg-slate-100 text-slate-750 border border-slate-300',
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    inactive: 'bg-amber-50 text-amber-700 border border-amber-200',
    navy: 'bg-slate-900 text-white',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
}

export function TypeBadge({ type }) {
  const isCredit = type === 'CREDIT';
  return (
    <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs ${
      isCredit ? 'bg-emerald-100/70 text-emerald-800' : 'bg-rose-100/70 text-rose-800'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isCredit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {isCredit ? 'Credited' : 'Debited'}
    </span>
  );
}

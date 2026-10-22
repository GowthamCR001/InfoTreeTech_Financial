import React from 'react';
import { Inbox, PlusCircle } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'No financial records match your current filter criteria.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
      <div className="p-3 mb-4 rounded-full bg-slate-100 text-slate-400">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="max-w-sm mt-1.5 text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 mt-5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingSpinner({ label = 'Loading financial records...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-3"></div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

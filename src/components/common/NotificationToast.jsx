import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function NotificationToast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-900/90 text-white border-emerald-700',
    error: 'bg-rose-900/90 text-white border-rose-700',
    info: 'bg-slate-900/90 text-white border-slate-700',
  };

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const IconComponent = icons[type] || Info;

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-fade-in ${styles[type]}`}>
      <IconComponent className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-white/70 hover:text-white p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

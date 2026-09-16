import React from 'react';
import { ProcurementStatus } from '../../types/procurement';

interface StatusBadgeProps {
  status: ProcurementStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
      dot: 'bg-amber-500 ring-amber-200 dark:ring-amber-900',
    },
    'on-time': {
      label: 'On-time',
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      dot: 'bg-blue-500 ring-blue-200 dark:ring-blue-900',
    },
    delayed: {
      label: 'Delayed',
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
      dot: 'bg-rose-500 ring-rose-200 dark:ring-rose-900',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
      dot: 'bg-emerald-500 ring-emerald-200 dark:ring-emerald-900',
    },
  }[status] || {
    label: status,
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  };

  const sizeClass = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-xs sm:text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizeClass} whitespace-nowrap transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ring-2`} />
      <span>{config.label}</span>
    </span>
  );
};

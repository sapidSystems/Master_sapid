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
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500 ring-amber-200',
    },
    'on-time': {
      label: 'On-time',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500 ring-blue-200',
    },
    delayed: {
      label: 'Delayed',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500 ring-rose-200',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500 ring-emerald-200',
    },
  }[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
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

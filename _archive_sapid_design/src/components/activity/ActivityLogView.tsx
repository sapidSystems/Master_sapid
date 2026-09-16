import React, { useState } from 'react';
import { Activity, Clock, User, FileText, Search } from 'lucide-react';
import { useProcurement } from '../../context/ProcurementContext';
import { formatDateTime } from '../../utils/dateUtils';

export const ActivityLogView: React.FC = () => {
  const { activityLogs } = useProcurement();
  const [search, setSearch] = useState('');

  const filteredLogs = activityLogs.filter(log => {
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.user.toLowerCase().includes(q) ||
      log.recordIdentifier.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200';
      case 'COMPLETE':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200';
      case 'DELETE':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200';
      case 'ADD_REMARK':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Procurement System Audit Log
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable tracking of order creations, status adjustments, remarks, and completions
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-soft-sm"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No activity logs match your search.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      {log.module}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      • {log.recordIdentifier}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-brand-500" />
                      {log.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 pl-1 leading-relaxed">
                  {log.details}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

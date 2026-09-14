import React from 'react';
import { PackageSearch, FolderOpen, Plus, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  isSearchOrFilter?: boolean;
  onAction?: () => void;
  actionLabel?: string;
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearchOrFilter = false,
  onAction,
  actionLabel,
  title,
  description
}) => {
  const defaultTitle = isSearchOrFilter
    ? 'No matching records found'
    : 'No records found';

  const defaultDescription = isSearchOrFilter
    ? 'Try adjusting your search keywords, status filters, or date range.'
    : 'There are currently no records in this procurement section.';

  const cleanActionLabel = actionLabel ? actionLabel.replace(/^\+\s*/, '') : (isSearchOrFilter ? 'Reset Filters' : 'Add New Record');

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-2xl border border-dashed border-slate-300 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 my-4 shadow-soft-sm">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-brand-500/10 via-brand-500/5 to-slate-100 flex items-center justify-center text-brand-600 mb-4 shadow-soft border border-slate-200/50">
        {isSearchOrFilter ? (
          <PackageSearch className="w-7 h-7 sm:w-8 sm:h-8" />
        ) : (
          <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8" />
        )}
      </div>
      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1 tracking-tight">
        {title || defaultTitle}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed font-normal">
        {description || defaultDescription}
      </p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 transition-all shadow-soft hover:shadow-soft-md transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSearchOrFilter ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>{cleanActionLabel}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>{cleanActionLabel}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

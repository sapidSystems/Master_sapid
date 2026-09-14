import React, { useState } from 'react';
import { Search, Filter, X, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { FilterState } from '../../types/procurement';

interface TableFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  buyerOptions: string[];
  vendorOptions: string[];
  vendorLabel?: string; // 'Tannery' or 'Supplier'
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  onFilterChange,
  buyerOptions,
  vendorOptions,
  vendorLabel = 'Vendor / Tannery'
}) => {
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  const activeFilterCount = [
    filters.fromDate ? 1 : 0,
    filters.toDate ? 1 : 0,
    filters.status && filters.status !== 'all' ? 1 : 0,
    filters.buyerCode && filters.buyerCode !== 'all' ? 1 : 0,
    filters.vendor && filters.vendor !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleReset = () => {
    const emptyFilters: FilterState = {
      search: '',
      fromDate: '',
      toDate: '',
      status: 'all',
      buyerCode: 'all',
      vendor: 'all'
    };
    onFilterChange(emptyFilters);
    setTempFilters(emptyFilters);
  };

  const openMobileModal = () => {
    setTempFilters(filters);
    setMobileModalOpen(true);
  };

  const applyMobileFilters = () => {
    onFilterChange(tempFilters);
    setMobileModalOpen(false);
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Search and Mobile Filters Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by WO No, buyer, leather/item name, or remarks..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-soft-sm"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button (visible on mobile / tablet) */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={openMobileModal}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-soft-sm active:bg-slate-50 dark:active:bg-slate-800"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {(activeFilterCount > 0 || filters.search) && (
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Filter Row (Hidden on mobile) */}
      <div className="hidden sm:flex flex-wrap items-center gap-2.5 pt-1">
        {/* From Date */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-soft-sm">
          <span className="text-slate-500 font-medium whitespace-nowrap">From:</span>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => onFilterChange({ ...filters, fromDate: e.target.value })}
            className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
          />
        </div>

        {/* To Date */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-soft-sm">
          <span className="text-slate-500 font-medium whitespace-nowrap">To:</span>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => onFilterChange({ ...filters, toDate: e.target.value })}
            className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-soft-sm"
        >
          <option value="all">All Statuses</option>
          <option value="on-time">● On-time</option>
          <option value="delayed">● Delayed</option>
          <option value="pending">● Pending</option>
          <option value="completed">● Completed</option>
        </select>

        {/* Buyer Dropdown */}
        <select
          value={filters.buyerCode}
          onChange={(e) => onFilterChange({ ...filters, buyerCode: e.target.value })}
          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-soft-sm"
        >
          <option value="all">All Buyers</option>
          {buyerOptions.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Vendor Dropdown */}
        <select
          value={filters.vendor}
          onChange={(e) => onFilterChange({ ...filters, vendor: e.target.value })}
          className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-soft-sm"
        >
          <option value="all">All {vendorLabel}s</option>
          {vendorOptions.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {/* Reset Button */}
        {(activeFilterCount > 0 || filters.search) && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Mobile Filters Modal (Req #57) */}
      {mobileModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Filter Records
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileModalOpen(false)}
                className="text-slate-400 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={tempFilters.fromDate}
                  onChange={(e) => setTempFilters({ ...tempFilters, fromDate: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={tempFilters.toDate}
                  onChange={(e) => setTempFilters({ ...tempFilters, toDate: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={tempFilters.status}
                  onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="on-time">● On-time</option>
                  <option value="delayed">● Delayed</option>
                  <option value="pending">● Pending</option>
                  <option value="completed">● Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Buyer Code
                </label>
                <select
                  value={tempFilters.buyerCode}
                  onChange={(e) => setTempFilters({ ...tempFilters, buyerCode: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="all">All Buyers</option>
                  {buyerOptions.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {vendorLabel}
                </label>
                <select
                  value={tempFilters.vendor}
                  onChange={(e) => setTempFilters({ ...tempFilters, vendor: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="all">All {vendorLabel}s</option>
                  {vendorOptions.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  setMobileModalOpen(false);
                }}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={applyMobileFilters}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

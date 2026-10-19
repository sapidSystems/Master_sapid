import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, Check, RotateCcw, Search, X } from 'lucide-react';
import { ColumnDef } from '../../utils/procurementColumns';

interface ColumnVisibilityDropdownProps {
  columns: ColumnDef[];
  visibleColumns: Record<string, boolean>;
  onChange: (newVisible: Record<string, boolean>) => void;
  onReset: () => void;
}

export const ColumnVisibilityDropdown: React.FC<ColumnVisibilityDropdownProps> = ({
  columns,
  visibleColumns,
  onChange,
  onReset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const visibleCount = useMemo(() => {
    return columns.filter(col => visibleColumns[col.id] !== false).length;
  }, [columns, visibleColumns]);

  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const q = searchQuery.toLowerCase();
    return columns.filter(col => col.label.toLowerCase().includes(q));
  }, [columns, searchQuery]);

  const allVisible = columns.every(col => visibleColumns[col.id] !== false);

  const handleToggleColumn = (colId: string) => {
    const current = visibleColumns[colId] !== false;
    onChange({
      ...visibleColumns,
      [colId]: !current
    });
  };

  const handleToggleAll = (targetState: boolean) => {
    const next: Record<string, boolean> = { ...visibleColumns };
    columns.forEach(col => {
      next[col.id] = targetState;
    });
    onChange(next);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer border shadow-2xs ${
          isOpen
            ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/10'
            : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200/90 hover:bg-slate-50'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Customize visible columns and card fields"
      >
        <SlidersHorizontal className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-slate-500'}`} />
        <span className="hidden sm:inline">Visible Columns</span>
        <span className="sm:hidden">Columns</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            isOpen
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 text-slate-700 border border-slate-200/80'
          }`}
        >
          {visibleCount}/{columns.length}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200/95 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
          {/* Header */}
          <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Columns ({visibleCount} shown)
              </span>
              <button
                type="button"
                onClick={onReset}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1 cursor-pointer"
                title="Reset to default columns"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Quick search if columns > 6 */}
            {columns.length > 6 && (
              <div className="relative mt-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Find column..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Select All Toggle Bar */}
          <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between bg-white text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={allVisible}
                onChange={(e) => handleToggleAll(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 accent-brand-600 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                {allVisible ? 'Deselect All' : 'Select All'}
              </span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              Controls table & card views
            </span>
          </div>

          {/* Scrollable Column List */}
          <div className="max-h-64 sm:max-h-72 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-50">
            {filteredColumns.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching columns found
              </div>
            ) : (
              filteredColumns.map((col) => {
                const isChecked = visibleColumns[col.id] !== false;
                return (
                  <label
                    key={col.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors select-none text-xs ${
                      isChecked ? 'bg-slate-50/60 text-slate-900 font-medium' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleColumn(col.id)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 accent-brand-600 cursor-pointer"
                      />
                      <span className={isChecked ? 'text-slate-900 font-semibold' : 'text-slate-600'}>
                        {col.label}
                      </span>
                    </div>
                    {isChecked && (
                      <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3.5 py-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Preferences saved automatically</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

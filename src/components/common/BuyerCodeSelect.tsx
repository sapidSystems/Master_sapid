import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Search, ChevronDown, Check, X } from 'lucide-react';
import { useBuyerCodes } from '../../services/buyerCodeService';
import QuickAddBuyerModal from './QuickAddBuyerModal';

export interface BuyerCodeSelectProps {
  value?: string;
  onChange?: (val: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
  label?: string;
  showAddOption?: boolean;
  showAddButton?: boolean;
  disabled?: boolean;
}

export default function BuyerCodeSelect({
  value = '',
  onChange,
  required = false,
  className = '',
  id,
  placeholder = 'Select Buyer Code...',
  label = '',
  showAddOption = true,
  showAddButton = false,
  disabled = false
}: BuyerCodeSelectProps) {
  const { buyerCodes } = useBuyerCodes();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quickAddInitialCode, setQuickAddInitialCode] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Helper to get formatted display text for an item
  const getItemLabel = (item: { buyerCode: string; buyerName?: string }) => {
    const name = (item.buyerName || '').trim();
    if (name && name.toUpperCase() !== item.buyerCode.toUpperCase()) {
      return `${item.buyerCode} — ${name}`;
    }
    return item.buyerCode;
  };

  // Find currently selected item
  const selectedItem = useMemo(() => {
    return buyerCodes.find((b: any) => b.buyerCode === value);
  }, [buyerCodes, value]);

  // Label to show in trigger button
  const displayLabel = useMemo(() => {
    if (!value) return '';
    if (selectedItem) return getItemLabel(selectedItem);
    return value;
  }, [value, selectedItem]);

  // Filtered list based on search query
  const filteredCodes = useMemo(() => {
    if (!searchQuery.trim()) return buyerCodes;
    const q = searchQuery.toLowerCase().trim();
    return buyerCodes.filter((b: any) => {
      const codeMatch = (b.buyerCode || '').toLowerCase().includes(q);
      const nameMatch = (b.buyerName || '').toLowerCase().includes(q);
      return codeMatch || nameMatch;
    });
  }, [buyerCodes, searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange?.(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleOpenAddModal = (codeToPreFill?: string) => {
    setQuickAddInitialCode(typeof codeToPreFill === 'string' ? codeToPreFill : searchQuery.trim().toUpperCase());
    setIsOpen(false);
    setIsAddModalOpen(true);
  };

  const handleCreated = (newCode: string) => {
    onChange?.(newCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredCodes.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCodes[highlightedIndex]) {
        handleSelect(filteredCodes[highlightedIndex].buyerCode);
      } else if (searchQuery.trim() && showAddOption) {
        handleOpenAddModal(searchQuery.trim().toUpperCase());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const defaultClasses =
    'min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 font-medium';

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {showAddButton && !disabled && (
            <button
              type="button"
              onClick={() => handleOpenAddModal('')}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add New
            </button>
          )}
        </div>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          className={`w-full flex items-center justify-between text-left transition-all cursor-pointer ${
            className || defaultClasses
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''} ${
            isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span
            className={`truncate mr-2 ${
              !displayLabel ? 'text-slate-400 font-normal' : 'text-slate-900 font-medium'
            }`}
          >
            {displayLabel || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.('');
                }}
                title="Clear selection"
                className="p-0.5 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </div>
        </button>

        {/* Hidden input for standard HTML form validation */}
        <input
          type="text"
          id={id}
          required={required}
          value={value || ''}
          onChange={() => {}}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            opacity: 0,
            width: '1px',
            height: '1px',
            pointerEvents: 'none',
            bottom: 0,
            left: '50%'
          }}
        />

        {/* Dropdown Popup */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/80">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search buyer code or name..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs md:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 font-normal"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Options */}
            <div ref={listRef} className="max-h-60 overflow-y-auto divide-y divide-slate-50 py-1">
              {filteredCodes.length > 0 ? (
                filteredCodes.map((b: any, index: number) => {
                  const isSelected = b.buyerCode === value;
                  const isHighlighted = index === highlightedIndex;
                  const hasName =
                    b.buyerName &&
                    b.buyerName.trim() &&
                    b.buyerName.trim().toUpperCase() !== b.buyerCode.toUpperCase();

                  return (
                    <div
                      key={b.id || b.buyerCode}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(b.buyerCode)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3 py-2 text-xs md:text-sm flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/80 text-indigo-900 font-semibold'
                          : isHighlighted
                          ? 'bg-slate-100/90 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold font-mono px-1.5 py-0.5 rounded text-[11px] md:text-xs bg-slate-100 text-indigo-900 border border-slate-200/80">
                          {b.buyerCode}
                        </span>
                        {hasName && (
                          <span className="text-slate-600 truncate text-[11px] md:text-xs font-normal">
                            {b.buyerName.trim()}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium">No buyer codes found</p>
                  {searchQuery.trim() && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No match for "{searchQuery}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Add Option */}
            {showAddOption && !disabled && (
              <div className="p-1.5 bg-slate-50 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {searchQuery.trim()
                    ? `Add "${searchQuery.trim().toUpperCase()}" as New Buyer Code`
                    : 'Add New Buyer Code'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <QuickAddBuyerModal
        isOpen={isAddModalOpen}
        initialCode={quickAddInitialCode}
        onClose={() => {
          setIsAddModalOpen(false);
          setQuickAddInitialCode('');
        }}
        onCreated={handleCreated}
      />
    </div>
  );
}

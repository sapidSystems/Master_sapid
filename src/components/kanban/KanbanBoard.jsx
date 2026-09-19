import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  Layers,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Check,
  RotateCcw,
} from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import DraggableScroll from "../DraggableScroll";

export default function KanbanBoard({
  pipelineId,
  title,
  subtitle,
  systemIcon: SystemIcon = Layers,
  badgeCount,
  badgeLabel = "Open Items",
  columns = [],
  items = [],
  getItemColumnId,
  renderCard,
  onCardClick,
  onRefresh,
  loading = false,
  headerActions,
  viewAllRoute,
  onViewAllClick,
  className = "",
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // ====================================================================
  // 1. COLUMN VISIBILITY CUSTOMIZATION
  // ====================================================================
  const colStorageKey = `taskdesk_kanban_hidden_cols_${
    pipelineId || (title ? title.toLowerCase().replace(/\s+/g, "_") : "default")
  }`;

  const [hiddenCols, setHiddenCols] = useState(() => {
    try {
      const stored = localStorage.getItem(colStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef(null);

  // Sync hidden columns when pipeline/colStorageKey changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(colStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHiddenCols(parsed);
          return;
        }
      }
      setHiddenCols([]);
    } catch {
      setHiddenCols([]);
    }
  }, [colStorageKey]);

  const toggleColumn = (colId) => {
    setHiddenCols((prev) => {
      const updated = prev.includes(colId)
        ? prev.filter((id) => id !== colId)
        : [...prev, colId];
      try {
        localStorage.setItem(colStorageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save column visibility", e);
      }
      return updated;
    });
  };

  const showAllColumns = () => {
    setHiddenCols([]);
    try {
      localStorage.removeItem(colStorageKey);
    } catch (e) {
      console.error("Failed to clear hidden columns", e);
    }
  };

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenCols.includes(col.id));
  }, [columns, hiddenCols]);

  // ====================================================================
  // 2. FILTER DROPDOWN STATE & EXTRACTION
  // ====================================================================
  const filterStorageKey = `taskdesk_kanban_filters_${
    pipelineId || (title ? title.toLowerCase().replace(/\s+/g, "_") : "default")
  }`;

  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem(filterStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return {
            vendors: Array.isArray(parsed.vendors) ? parsed.vendors : [],
            customers: Array.isArray(parsed.customers) ? parsed.customers : [],
            dateSort: parsed.dateSort || null,
          };
        }
      }
    } catch {}
    return { vendors: [], customers: [], dateSort: null };
  });

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Sync filters when pipeline changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(filterStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setFilters({
            vendors: Array.isArray(parsed.vendors) ? parsed.vendors : [],
            customers: Array.isArray(parsed.customers) ? parsed.customers : [],
            dateSort: parsed.dateSort || null,
          });
          return;
        }
      }
    } catch {}
    setFilters({ vendors: [], customers: [], dateSort: null });
  }, [filterStorageKey]);

  const updateFilters = (updater) => {
    setFilters((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(filterStorageKey, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to persist kanban filters", e);
      }
      return next;
    });
  };

  // Click outside and Escape key handler for both dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target)
      ) {
        setIsColumnDropdownOpen(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsColumnDropdownOpen(false);
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Data model property extraction helpers
  const getItemVendor = (item) => {
    return (
      item?.vendor ||
      item?.supplier ||
      item?.tannery ||
      item?.raw?.supplier ||
      item?.raw?.tannery ||
      item?.raw?.vendor ||
      ""
    )
      .toString()
      .trim();
  };

  const getItemCustomer = (item) => {
    return (
      item?.customer ||
      item?.buyer ||
      item?.buyerCoder ||
      item?.buyerCode ||
      item?.raw?.buyer ||
      item?.raw?.buyer_coder ||
      item?.raw?.buyer_code ||
      item?.department ||
      ""
    )
      .toString()
      .trim();
  };

  const getItemDueDate = (item) => {
    const val =
      item?.targetDate ||
      item?.requirementDate ||
      item?.activeStageObj?.plannedDate ||
      item?.despatchDate ||
      item?.plannedDate ||
      item?.raw?.target_receipt_date ||
      item?.raw?.requirement_date ||
      item?.raw?.wo_despatch_date ||
      item?.raw?.planned_date;
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // Dynamically extract and sort unique vendors from currently loaded items
  const { availableVendors, vendorItemCounts } = useMemo(() => {
    const counts = {};
    items.forEach((item) => {
      const v = getItemVendor(item);
      if (v) {
        counts[v] = (counts[v] || 0) + 1;
      }
    });
    const unique = Object.keys(counts).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    return { availableVendors: unique, vendorItemCounts: counts };
  }, [items]);

  // Dynamically extract and sort unique customers from currently loaded items
  const { availableCustomers, customerItemCounts } = useMemo(() => {
    const counts = {};
    items.forEach((item) => {
      const c = getItemCustomer(item);
      if (c) {
        counts[c] = (counts[c] || 0) + 1;
      }
    });
    const unique = Object.keys(counts).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    return { availableCustomers: unique, customerItemCounts: counts };
  }, [items]);

  // Search filtered options inside dropdown
  const filteredVendorOptions = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    if (!q) return availableVendors;
    return availableVendors.filter((v) => v.toLowerCase().includes(q));
  }, [availableVendors, vendorSearch]);

  const filteredCustomerOptions = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return availableCustomers;
    return availableCustomers.filter((c) => c.toLowerCase().includes(q));
  }, [availableCustomers, customerSearch]);

  // Number of active filter rules
  const activeFilterCount =
    filters.vendors.length +
    filters.customers.length +
    (filters.dateSort ? 1 : 0);

  const toggleVendor = (v) => {
    updateFilters((prev) => {
      const vendors = prev.vendors.includes(v)
        ? prev.vendors.filter((item) => item !== v)
        : [...prev.vendors, v];
      return { ...prev, vendors };
    });
  };

  const toggleCustomer = (c) => {
    updateFilters((prev) => {
      const customers = prev.customers.includes(c)
        ? prev.customers.filter((item) => item !== c)
        : [...prev.customers, c];
      return { ...prev, customers };
    });
  };

  const setDateSort = (sortOption) => {
    updateFilters((prev) => ({
      ...prev,
      dateSort: prev.dateSort === sortOption ? null : sortOption,
    }));
  };

  const clearAllFilters = () => {
    updateFilters({ vendors: [], customers: [], dateSort: null });
    setVendorSearch("");
    setCustomerSearch("");
  };

  // ====================================================================
  // 3. CLIENT-SIDE FILTERING & SORTING WITH USEMEMO
  // ====================================================================
  const { columnMap, totalFilteredItems } = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      map[col.id] = [];
    });

    const q = searchQuery.trim().toLowerCase();
    const hasVendorFilter = filters.vendors.length > 0;
    const hasCustomerFilter = filters.customers.length > 0;

    let count = 0;
    items.forEach((item) => {
      // 1. Text Search Filter
      if (q) {
        const itemStr = JSON.stringify(item).toLowerCase();
        if (!itemStr.includes(q)) return;
      }

      // 2. Vendor Multi-Select Filter
      if (hasVendorFilter) {
        const v = getItemVendor(item);
        if (!filters.vendors.includes(v)) return;
      }

      // 3. Customer Multi-Select Filter
      if (hasCustomerFilter) {
        const c = getItemCustomer(item);
        if (!filters.customers.includes(c)) return;
      }

      const colId = getItemColumnId
        ? getItemColumnId(item)
        : item.stage || item.status || item.module;
      if (map[colId]) {
        map[colId].push(item);
        count++;
      }
    });

    // 4. In-Column Date Sorting (Ascending / Descending by Due Date)
    if (filters.dateSort) {
      const isAsc = filters.dateSort === "asc";
      Object.keys(map).forEach((colId) => {
        map[colId].sort((a, b) => {
          const dateA = getItemDueDate(a);
          const dateB = getItemDueDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return isAsc
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        });
      });
    }

    return { columnMap: map, totalFilteredItems: count };
  }, [columns, items, getItemColumnId, searchQuery, filters]);

  const isFiltered = activeFilterCount > 0 || Boolean(searchQuery.trim());

  return (
    <div className={`flex flex-col h-full space-y-4 ${className}`}>
      {/* Board Top Header / Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-soft-sm flex-shrink-0">
            <SystemIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              {badgeCount !== undefined && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/60"
                  title={
                    isFiltered
                      ? `${totalFilteredItems} filtered of ${badgeCount} total`
                      : `${totalFilteredItems} items`
                  }
                >
                  {totalFilteredItems} {badgeLabel}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1. Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards, WO, buyer..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Filter Dropdown Button (Between Search and Customize Columns) */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsFilterDropdownOpen((prev) => !prev);
                setIsColumnDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-2xs ${
                activeFilterCount > 0
                  ? "border-brand-300 bg-brand-50/70 text-brand-700 hover:bg-brand-100/70"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Filter by vendor, customer, and date sort"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isFilterDropdownOpen ? "rotate-180 text-slate-600" : ""
                }`}
              />
            </button>

            {/* Filter Dropdown Panel */}
            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Filter Pipeline Cards
                    </span>
                    {activeFilterCount > 0 && (
                      <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-1.5 py-0.2 rounded-md border border-brand-200">
                        {activeFilterCount} active
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>

                {/* Section 1: Customer / Buyer Multi-Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Customer / Buyer
                    </span>
                    {filters.customers.length > 0 && (
                      <span className="text-[10px] text-brand-600 font-semibold">
                        {filters.customers.length} selected
                      </span>
                    )}
                  </div>

                  {availableCustomers.length > 5 && (
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search customers..."
                        className="w-full pl-7 pr-6 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 text-slate-800"
                      />
                      {customerSearch && (
                        <button
                          onClick={() => setCustomerSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="max-h-32 overflow-y-auto space-y-0.5 py-1 thin-scrollbar border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                    {filteredCustomerOptions.length === 0 ? (
                      <div className="text-[11px] text-slate-400 text-center py-2">
                        {availableCustomers.length === 0
                          ? "No customer data in current pipeline"
                          : "No matching customers"}
                      </div>
                    ) : (
                      filteredCustomerOptions.map((customer) => {
                        const isChecked = filters.customers.includes(customer);
                        return (
                          <label
                            key={customer}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                              isChecked
                                ? "bg-white text-slate-900 font-medium shadow-2xs"
                                : "hover:bg-white text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCustomer(customer)}
                                className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500/20 border-slate-300 cursor-pointer accent-brand-600"
                              />
                              <span className="truncate">{customer}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.2 rounded ml-2">
                              {customerItemCounts[customer] || 0}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Section 2: Vendor / Supplier Multi-Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Vendor / Supplier / Tannery
                    </span>
                    {filters.vendors.length > 0 && (
                      <span className="text-[10px] text-brand-600 font-semibold">
                        {filters.vendors.length} selected
                      </span>
                    )}
                  </div>

                  {availableVendors.length > 5 && (
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        placeholder="Search vendors..."
                        className="w-full pl-7 pr-6 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 text-slate-800"
                      />
                      {vendorSearch && (
                        <button
                          onClick={() => setVendorSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="max-h-32 overflow-y-auto space-y-0.5 py-1 thin-scrollbar border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                    {filteredVendorOptions.length === 0 ? (
                      <div className="text-[11px] text-slate-400 text-center py-2">
                        {availableVendors.length === 0
                          ? "No vendor data in current pipeline"
                          : "No matching vendors"}
                      </div>
                    ) : (
                      filteredVendorOptions.map((vendor) => {
                        const isChecked = filters.vendors.includes(vendor);
                        return (
                          <label
                            key={vendor}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                              isChecked
                                ? "bg-white text-slate-900 font-medium shadow-2xs"
                                : "hover:bg-white text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleVendor(vendor)}
                                className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500/20 border-slate-300 cursor-pointer accent-brand-600"
                              />
                              <span className="truncate">{vendor}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.2 rounded ml-2">
                              {vendorItemCounts[vendor] || 0}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Section 3: Date Sort (Asc / Desc / Reset) */}
                <div className="space-y-1.5 border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Sort Inside Columns
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      By due / target date
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setDateSort(null)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        filters.dateSort === null
                          ? "border-brand-300 bg-brand-50 text-brand-700 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateSort("asc")}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all truncate ${
                        filters.dateSort === "asc"
                          ? "border-brand-300 bg-brand-50 text-brand-700 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      title="Due date: Oldest first"
                    >
                      Oldest first
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateSort("desc")}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all truncate ${
                        filters.dateSort === "desc"
                          ? "border-brand-300 bg-brand-50 text-brand-700 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      title="Due date: Newest first"
                    >
                      Newest first
                    </button>
                  </div>
                </div>

                {/* Footer with Clear all and Apply buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    disabled={activeFilterCount === 0}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-500 px-2 py-1"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-soft-sm transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Column Customization Dropdown Filter */}
          <div className="relative" ref={columnDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsColumnDropdownOpen((prev) => !prev);
                setIsFilterDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-2xs ${
                hiddenCols.length > 0
                  ? "border-brand-300 bg-brand-50/70 text-brand-700 hover:bg-brand-100/70"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Customize visible columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Customize Columns</span>
              {hiddenCols.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700">
                  {visibleColumns.length}/{columns.length}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isColumnDropdownOpen ? "rotate-180 text-slate-600" : ""
                }`}
              />
            </button>

            {isColumnDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Columns ({visibleColumns.length}/{columns.length})
                  </span>
                  {hiddenCols.length > 0 && (
                    <button
                      type="button"
                      onClick={showAllColumns}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Show All
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-0.5 py-1 thin-scrollbar">
                  {columns.map((col) => {
                    const isVisible = !hiddenCols.includes(col.id);
                    const colCount = columnMap[col.id]?.length || 0;
                    return (
                      <label
                        key={col.id}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer select-none transition-colors ${
                          isVisible
                            ? "hover:bg-slate-50 text-slate-800"
                            : "hover:bg-slate-50 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleColumn(col.id)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500/20 border-slate-300 cursor-pointer accent-brand-600"
                          />
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              col.accentColor || "bg-slate-400"
                            }`}
                          />
                          <span
                            className={`font-medium truncate ${
                              isVisible ? "text-slate-800" : "text-slate-400 line-through"
                            }`}
                          >
                            {col.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md ml-2 flex-shrink-0">
                          {colCount}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-soft-sm disabled:opacity-50"
              title="Refresh board data"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-brand-600" : ""}`}
              />
            </button>
          )}

          {headerActions}
        </div>
      </div>

      {/* Board Columns (Horizontal Scrolling) */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="min-w-[300px] w-[320px] h-96 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 animate-pulse space-y-3"
              >
                <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-4"></div>
                <div className="h-28 bg-white border border-slate-200/60 rounded-xl p-3 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                </div>
                <div className="h-28 bg-white border border-slate-200/60 rounded-xl p-3 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleColumns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-center">
            <p className="text-sm font-semibold text-slate-600">
              All columns are currently hidden
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Use the "Customize Columns" dropdown above to show columns.
            </p>
            <button
              type="button"
              onClick={showAllColumns}
              className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
            >
              Show All Columns
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 thin-scrollbar">
            <div className="flex items-start gap-4 min-w-max">
              {visibleColumns.map((col) => {
                const colItems = columnMap[col.id] || [];
                return (
                  <KanbanColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    subtitle={col.subtitle}
                    count={colItems.length}
                    accentColor={col.accentColor}
                    badgeBg={col.badgeBg}
                    icon={col.icon}
                    onAddClick={col.onAddClick}
                    emptyMessage={col.emptyMessage}
                    isFiltered={isFiltered}
                  >
                    {colItems.map((item, itemIdx) => {
                      if (!item) return null;
                      const itemKey =
                        item.id ||
                        item.task_id ||
                        `${item.wo_no || col.id}-${itemIdx}`;
                      return (
                        <div key={itemKey}>
                          {renderCard ? (
                            renderCard(item, col.id)
                          ) : (
                            <div
                              onClick={() => onCardClick && onCardClick(item)}
                              className="bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-xs"
                            >
                              {JSON.stringify(item)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </KanbanColumn>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

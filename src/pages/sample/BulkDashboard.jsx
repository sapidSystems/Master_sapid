import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, FileText, CheckCircle, Clock, ChevronLeft, ChevronRight, Search, Filter, X, ChevronDown } from 'lucide-react';
import DraggableScroll from '../../components/DraggableScroll';
import DonutChart from '../../components/DonutChart';
import { useMagicToast } from '../../context/MagicToastContext';
import supabase from '../../SupabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  let date;
  if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.includes('-')) {
    const [y, m, d] = dateStr.split('-');
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateStr);
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const STAGES_LIST = [
  "HANDOVER",
  "LEATHER IN-HOUSE",
  "MATERIALS IN-HOUSE",
  "PACKING MATERIALS IN-HOUSE",
  "CUTTING COMPLETION",
  "FABRICATION COMPLETION",
  "QA COMPLETED",
  "Planned Shipment"
];

const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateInRange = (date, fromDate, toDate) => {
  const checkDate = new Date(date);
  const startDate = fromDate ? new Date(fromDate) : new Date('1900-01-01');
  const endDate = toDate ? new Date(toDate) : new Date('2099-12-31');
  return checkDate >= startDate && checkDate <= endDate;
};

const mapPlanningDbToLead = (dbRow) => {
  if (!dbRow) return null;
  return {
    id: dbRow.id,
    buyer: dbRow.buyer || '',
    woNo: dbRow.wo_no || '',
    wResDate: dbRow.w_res_date || '',
    woDate: dbRow.wo_date || '',
    woDespatchDate: dbRow.wo_despatch_date || '',
    qty: dbRow.qty || '',
    remarks: dbRow.remarks || '',
    addedBy: dbRow.added_by || '',
    currentStage: dbRow.current_stage || 0,
    isHistory: dbRow.is_history || false,
    historyTimestamp: dbRow.history_timestamp || '',
    stages: dbRow.stages || [],
    timestamp: dbRow.created_at || ''
  };
};

export default function BulkDashboard() {
  const { showToast } = useMagicToast();
  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error')
  };
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    buyerCoder: '',
    searchQuery: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const dashboardType = 'planning';
  const [summaryGroup, setSummaryGroup] = useState('buyer'); // 'buyer' | 'user'
  const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);
  const [activeStatsModal, setActiveStatsModal] = useState(null);
  const [selectedStageModal, setSelectedStageModal] = useState(null);
  const [selectedSummaryGroup, setSelectedSummaryGroup] = useState(null);
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [bulkOrders, setBulkOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('sample_system_product_planning').select('*');
      if (error) throw error;
      setBulkOrders((data || []).map(mapPlanningDbToLead));
    } catch (err) {
      console.error('Error fetching bulk dashboard data:', err);
      toast.error('Failed to load live data for bulk production dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const leads = useMemo(() => {
    return bulkOrders;
  }, [bulkOrders]);

  const distinctBuyers = useMemo(() => {
    const buyers = leads.map(l => l.buyer).filter(Boolean);
    return [...new Set(buyers)].sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(l => {
      // Date Range filter
      const dateField = l.woDate;
      if (filters.dateFrom || filters.dateTo) {
        if (!isDateInRange(dateField, filters.dateFrom, filters.dateTo)) {
          return false;
        }
      }

      // Buyer Coder filter
      const buyerField = l.buyer;
      if (filters.buyerCoder && !buyerField?.toLowerCase().includes(filters.buyerCoder.toLowerCase())) {
        return false;
      }

      // General Search filter
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          (l.woNo && l.woNo.toLowerCase().includes(q)) ||
          (l.buyer && l.buyer.toLowerCase().includes(q)) ||
          (l.remarks && l.remarks.toLowerCase().includes(q))
        );
      }
      return true;
    });

    // Sort by Date descending (newest first)
    return filtered.reverse();
  }, [filters, leads]);

  // Calculate statistics based on filtered data
  const totalLeads = filteredLeads.length;
  const pendingDispatch = filteredLeads.filter(l => !l.isHistory).length;
  const dispatchedLeads = filteredLeads.filter(l => l.isHistory).length;

  const todayDate = getTodayDate();
  const leadsToday = filteredLeads.filter(l => {
    const dateField = l.wResDate;
    return dateField === todayDate;
  }).length;

  const statsModalData = useMemo(() => {
    if (!activeStatsModal) return [];
    if (activeStatsModal === 'total') return filteredLeads;
    if (activeStatsModal === 'today') return filteredLeads.filter(l => l.wResDate === todayDate);
    if (activeStatsModal === 'pending') return filteredLeads.filter(l => !l.isHistory);
    if (activeStatsModal === 'history') return filteredLeads.filter(l => l.isHistory);
    return [];
  }, [activeStatsModal, filteredLeads, todayDate]);

  const getStatsModalTitle = () => {
    if (activeStatsModal === 'total') return 'Total Bulk Orders';
    if (activeStatsModal === 'today') return 'Bulk Orders Added Today';
    if (activeStatsModal === 'pending') return 'Pending Planning Orders';
    if (activeStatsModal === 'history') return 'Completed Orders';
    return '';
  };

  const stageStats = useMemo(() => {
    return STAGES_LIST.map((stageName, index) => {
      const completedOrders = filteredLeads.filter(l => {
        if (l.isHistory) return true;
        const stg = l.stages && l.stages.find(s => s.name === stageName);
        return !!(stg && stg.actualDate);
      });
      const completionPercentage = filteredLeads.length > 0
        ? Math.round((completedOrders.length / filteredLeads.length) * 100)
        : 0;

      return {
        stageNum: index + 1,
        name: stageName,
        completedCount: completedOrders.length,
        percentage: completionPercentage,
        orders: completedOrders
      };
    });
  }, [filteredLeads]);

  const summaryGroupOrders = useMemo(() => {
    if (!selectedSummaryGroup) return [];
    if (summaryGroup === 'user') {
      return filteredLeads.filter(l => (l.addedBy || 'Unknown User') === selectedSummaryGroup.name);
    } else {
      return filteredLeads.filter(l => (l.buyer || 'Unknown') === selectedSummaryGroup.name);
    }
  }, [selectedSummaryGroup, summaryGroup, filteredLeads]);

  // Paginated Leads
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage, itemsPerPage]);

  const handleDownloadCSV = () => {
    const headers = ['W/O No', 'W/RES Date', 'Buyer', 'Qty', 'Description of Enquiry', 'Status', 'Remarks'];
    const rows = filteredLeads.map(l => [
      l.woNo || '',
      formatDate(l.wResDate),
      l.buyer || '',
      l.qty || '',
      l.productName || '',
      l.isHistory ? 'History' : 'Pending',
      l.remarks || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-orders-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Chart data - Leads by Buyer/Type
  const leadsByType = useMemo(() => {
    const typeData = {};
    filteredLeads.forEach(l => {
      const type = l.buyer || 'Unknown';
      if (!typeData[type]) {
        typeData[type] = 0;
      }
      typeData[type] += 1;
    });
    return typeData;
  }, [filteredLeads]);

  const summaryStats = useMemo(() => {
    const stats = {};
    filteredLeads.forEach(l => {
      let groupKey = 'Unknown';

      if (summaryGroup === 'user') {
        groupKey = l.addedBy || 'Unknown User';
      } else {
        groupKey = l.buyer || 'Unknown Buyer';
      }

      if (!stats[groupKey]) {
        stats[groupKey] = { name: groupKey, total: 0, completed: 0, delays: 0 };
      }

      stats[groupKey].total += 1;

      if (l.isHistory) {
        stats[groupKey].completed += 1;
      }

      // Calculate delays
      let delayCount = 0;
      if (l.stages && Array.isArray(l.stages)) {
        l.stages.forEach(stage => {
          if (stage.plannedDate && stage.actualDate) {
            const diffTime = new Date(stage.actualDate) - new Date(stage.plannedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 0) delayCount += 1;
          }
        });
      }
      stats[groupKey].delays += delayCount;
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [filteredLeads, summaryGroup]);

  const paginationControls = (
    <div className="p-2 md:p-3 border-t border-gray-100 bg-gray-50 flex flex-col items-center justify-between gap-2 lg:flex-row rounded-b-lg pb-2 md:pb-3 mt-auto">
      <div className="flex w-full lg:w-auto justify-between items-center text-[10px] md:text-sm gap-2">
        <div className="text-gray-600 flex items-center flex-shrink-0">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-gray-300 rounded-md px-1 py-1 text-[10px] md:text-xs focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
          >
            {[10, 15, 20, 50, 100].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
          <span className="text-[10px] md:text-[11px] font-medium text-gray-500 ml-1.5 whitespace-nowrap">
            entries
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-700">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1 border border-gray-300 rounded-md bg-white disabled:opacity-50 hover:bg-gray-50 transition shadow-sm text-indigo-600"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <div className="text-[10px] md:text-[10px] font-medium min-w-[50px] text-center text-gray-500">
            Pg {currentPage}/{totalPages || 1}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1 border border-gray-300 rounded-md bg-white disabled:opacity-50 hover:bg-gray-50 transition shadow-sm text-indigo-600"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full md:h-auto overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {isLoading ? (
          <div className="flex-grow flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Header with Filters */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full pb-2">
              <div className="flex flex-col lg:flex-row w-full gap-2 items-center">

                {/* Search + Export Row (Mobile grouping) */}
                <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
                  <div className="flex-1 w-full relative">
                    <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search bulk orders..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg lg:rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-xs md:text-sm h-[32px] md:h-[38px]"
                    />
                  </div>
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={`lg:hidden flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${showMobileFilters ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Filter size={14} />
                  </button>
                  {/* Mobile Export Button */}
                  <button
                    onClick={handleDownloadCSV}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center lg:hidden h-[32px] w-[32px] flex-shrink-0 shadow-sm transition"
                  >
                    <TrendingUp size={16} className="rotate-90" />
                  </button>
                </div>

                {/* Filters */}
                <div className={`${showMobileFilters ? 'grid' : 'hidden'} lg:flex grid-cols-2 lg:flex-row gap-2 w-full lg:w-auto lg:flex-[4] items-center`}>
                  <input
                    type="text"
                    placeholder="From Date"
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg lg:rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-[11px] md:text-sm h-[32px] md:h-[38px]"
                  />
                  <input
                    type="text"
                    placeholder="To Date"
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg lg:rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-[11px] md:text-sm h-[32px] md:h-[38px]"
                  />
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={filters.buyerCoder}
                      onFocus={() => setShowBuyerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowBuyerDropdown(false), 200)}
                      onChange={(e) => setFilters({ ...filters, buyerCoder: e.target.value })}
                      placeholder="Search/Select Buyer..."
                      className="w-full bg-white border border-gray-300 rounded-lg lg:rounded pl-2.5 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 text-[11px] md:text-sm h-[32px] md:h-[38px] text-gray-700 font-medium shadow-sm transition"
                    />
                    <ChevronDown size={14} className="absolute right-2.5 top-[9px] md:top-[12px] text-gray-400 pointer-events-none" />
                    {showBuyerDropdown && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        <div className="p-1 space-y-0.5 text-left">
                          <div
                            onClick={() => {
                              setFilters(prev => ({ ...prev, buyerCoder: '' }));
                              setShowBuyerDropdown(false);
                            }}
                            className="px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition"
                          >
                            All Buyers
                          </div>
                          {distinctBuyers
                            .filter(buyer => buyer.toLowerCase().includes(filters.buyerCoder.toLowerCase()))
                            .map(buyer => (
                              <div
                                key={buyer}
                                onClick={() => {
                                  setFilters(prev => ({ ...prev, buyerCoder: buyer }));
                                  setShowBuyerDropdown(false);
                                }}
                                className="px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 rounded cursor-pointer transition hover:text-indigo-700 font-medium"
                              >
                                {buyer}
                              </div>
                            ))
                          }
                          {distinctBuyers.filter(buyer => buyer.toLowerCase().includes(filters.buyerCoder.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400">
                              No matching buyers
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop Export Button */}
              <button
                onClick={handleDownloadCSV}
                className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 h-[38px] rounded-lg font-semibold items-center justify-center gap-2 transition shadow-sm w-full lg:w-auto flex-shrink-0"
              >
                <TrendingUp size={16} className="rotate-90" /> Export CSV
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Leads */}
              <div
                onClick={() => setActiveStatsModal('total')}
                className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Bulk Orders</p>
                    <p className="text-2xl font-bold text-indigo-700 mt-2">
                      {totalLeads}
                    </p>
                  </div>
                  <FileText className="text-indigo-600" size={32} />
                </div>
              </div>

              {/* Leads Today */}
              <div
                onClick={() => setActiveStatsModal('today')}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Bulk Orders Added Today</p>
                    <p className="text-2xl font-bold text-blue-700 mt-2">
                      {leadsToday}
                    </p>
                  </div>
                  <TrendingUp className="text-blue-600" size={32} />
                </div>
              </div>

              {/* Pending Dispatch */}
              <div
                onClick={() => setActiveStatsModal('pending')}
                className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending Planning</p>
                    <p className="text-2xl font-bold text-orange-700 mt-2">
                      {pendingDispatch}
                    </p>
                  </div>
                  <Clock className="text-orange-600" size={32} />
                </div>
              </div>

              {/* Dispatched Leads */}
              <div 
                onClick={() => setActiveStatsModal('history')}
                className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-2">
                      {dispatchedLeads}
                    </p>
                  </div>
                  <CheckCircle className="text-emerald-600" size={32} />
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads by Type */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Orders by Buyer</h3>
                <div>
                  {Object.entries(leadsByType).length > 0 ? (
                    <DonutChart
                      data={Object.entries(leadsByType).map(([label, value]) => ({ label, value }))}
                      totalLabel="Total Orders"
                    />
                  ) : (
                    <p className="text-gray-500 text-center py-4">No bulk order data available</p>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-700">Total System Bulk Orders</span>
                    <span className="font-bold text-indigo-600">{totalLeads}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-700">Awaiting Planning</span>
                    <span className="font-bold text-orange-600">{pendingDispatch}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-700">Completed (History)</span>
                    <span className="font-bold text-emerald-600">{dispatchedLeads}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-gray-700">New Bulk Orders Today</span>
                    <span className="font-bold text-blue-600">{leadsToday}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tables Grid Wrapper */}
            <div className={`mt-4 grid gap-4 ${filteredLeads.length > 0 ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>

              {/* Card 1: Main Summary Table */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gray-50/50 rounded-t-lg">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Bulk Order Summary
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSummaryGroup('buyer')}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${summaryGroup === 'buyer' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'bg-white text-gray-600 hover:text-indigo-600 border border-gray-200'}`}
                    >
                      Group by Buyer
                    </button>
                    <button
                      onClick={() => setSummaryGroup('user')}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${summaryGroup === 'user' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'bg-white text-gray-600 hover:text-indigo-600 border border-gray-200'}`}
                    >
                      Group by User
                    </button>
                  </div>
                </div>

                <DraggableScroll className="hidden md:block max-h-[450px]">
                  <table className="w-full text-left border-collapse relative min-w-max">
                    <thead className="bg-gray-50 text-gray-700 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3">{summaryGroup === 'user' ? 'User Name' : 'Buyer Name'}</th>
                        <th className="px-4 py-3 text-center">Total Bulk Orders</th>
                        <th className="px-4 py-3 text-center">Complete</th>
                        <th className="px-4 py-3 text-center">Delays (Stages)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summaryStats.map((item, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setSelectedSummaryGroup(item)}
                          className="hover:bg-indigo-50/20 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-indigo-700 text-center bg-indigo-50/50">{item.total}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-700 text-center bg-emerald-50/50">{item.completed}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-700 text-center bg-red-50/50">{item.delays}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DraggableScroll>

                <div className="md:hidden flex flex-col gap-2 p-2 bg-slate-50/50 pb-2">
                  {summaryStats.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedSummaryGroup(item)}
                      className="bg-white rounded-lg border border-indigo-50 shadow-[0_2px_10px_-4px_rgba(79,70,229,0.1)] p-3 relative flex flex-col gap-2 transition-all cursor-pointer hover:bg-indigo-50/20"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">
                          {item.name}
                        </h3>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div className="bg-indigo-50/50 p-1.5 rounded">
                          <span className="text-gray-500 block text-[9px] uppercase tracking-wide mb-1">Total</span>
                          <span className="font-bold text-indigo-700">{item.total}</span>
                        </div>
                        <div className="bg-emerald-50/50 p-1.5 rounded">
                          <span className="text-gray-500 block text-[9px] uppercase tracking-wide mb-1">Complete</span>
                          <span className="font-bold text-emerald-700">{item.completed}</span>
                        </div>
                        <div className="bg-red-50/50 p-1.5 rounded">
                          <span className="text-gray-500 block text-[9px] uppercase tracking-wide mb-1">Delays</span>
                          <span className="font-bold text-red-700">{item.delays}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredLeads.length === 0 && (
                  <div className="p-12 text-center text-gray-500 italic font-medium">
                    No bulk orders found matching your criteria.
                  </div>
                )}
                {paginationControls}
              </div>

              {/* Card 2: Stage-wise Progress Overview */}
              {filteredLeads.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50 rounded-t-lg">
                    <h3 className="text-lg font-bold text-gray-900">
                      Stage-wise Progress Overview
                    </h3>
                  </div>

                  <DraggableScroll className="max-h-[450px]">
                    <table className="w-full text-left border-collapse relative min-w-max">
                      <thead className="bg-gray-50 text-gray-700 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3">Stage #</th>
                          <th className="px-4 py-3">Stage Name</th>
                          <th className="px-4 py-3 text-center">Completed Orders</th>
                          <th className="px-4 py-3 text-center">Completion Rate</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 font-medium text-gray-700">
                        {stageStats.map((stage) => (
                          <tr
                            key={stage.stageNum}
                            onClick={() => setSelectedStageModal(stage)}
                            className="hover:bg-indigo-50/20 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3.5 font-bold text-gray-500">Stage {stage.stageNum}</td>
                            <td className="px-4 py-3.5 font-semibold text-gray-950">{stage.name}</td>
                            <td className="px-4 py-3.5 text-center font-bold text-indigo-600">
                              {stage.completedCount} / {filteredLeads.length}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="font-bold text-xs text-gray-900">{stage.percentage}%</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStageModal(stage);
                                }}
                                className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold uppercase hover:bg-indigo-100 transition shadow-sm"
                              >
                                View Orders
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DraggableScroll>
                </div>
              )}
            </div>
          </>
        )}

        {/* Lead Details Modal */}
        {selectedLeadDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900">
                  Order Details: <span className="text-indigo-600">{selectedLeadDetails.woNo}</span>
                </h3>
                <button
                  onClick={() => setSelectedLeadDetails(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-3 md:p-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium">Buyer Name</p>
                    <p className="font-bold text-gray-900 text-xs">{selectedLeadDetails.buyer || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-medium">Quantity</p>
                    <p className="font-bold text-gray-900 text-xs">{selectedLeadDetails.qty || '-'}</p>
                  </div>
                </div>

                <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-2 pb-1.5 border-b border-gray-100">Stage Progress</h4>
                <div className="space-y-1.5">
                  {STAGES_LIST.map((stageName, index) => {
                    const stageNum = index + 1;
                    const stages = selectedLeadDetails.stages || [];
                    const stg = stages.find(s => s.name === stageName);

                    // Status Colors
                    let statusColor = "bg-gray-100 text-gray-500";
                    let statusText = "Pending";

                    if (selectedLeadDetails.isHistory) {
                      statusColor = "bg-emerald-100 text-emerald-700";
                      statusText = "Completed";
                    } else if (stg) {
                      if (stg.actualDate) {
                        statusColor = "bg-emerald-100 text-emerald-700";
                        statusText = "Completed";
                        if (stg.plannedDate && new Date(stg.actualDate) > new Date(stg.plannedDate)) {
                          statusColor = "bg-orange-100 text-orange-700";
                          statusText = "Completed (Delayed)";
                        }
                      } else if (stg.plannedDate && new Date() > new Date(stg.plannedDate)) {
                        statusColor = "bg-red-100 text-red-700";
                        statusText = "Delayed";
                      }
                    }

                    return (
                      <div key={index} className="flex items-center justify-between py-1.5 px-3 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-[11px] leading-tight">{stageNum}. {stageName}</p>
                          {stg?.remarks && (
                            <p className="text-[9px] text-gray-500 leading-tight mt-0.5">{stg.remarks}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-0.5 ml-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${statusColor}`}>
                            {statusText}
                          </span>
                          {stg?.actualDate && (
                            <span className="text-[9px] text-gray-400">{formatDate(stg.actualDate)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Data Modal */}
        {activeStatsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{getStatsModalTitle()}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Showing {statsModalData.length} records</p>
                </div>
                <button
                  onClick={() => setActiveStatsModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {statsModalData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-medium text-sm">
                    No records found for this category.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <DraggableScroll className="w-full">
                      <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">W/O No</th>
                            <th className="px-4 py-3">Buyer</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3">W/RES Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Current Stage</th>
                            <th className="px-4 py-3 text-center">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {statsModalData.map((order) => (
                            <tr
                              key={order.id}
                              className="hover:bg-indigo-50/20 transition-colors cursor-pointer"
                              onDoubleClick={() => {
                                setSelectedLeadDetails(order);
                                setActiveStatsModal(null);
                              }}
                            >
                              <td className="px-4 py-3 font-bold text-indigo-600">{order.woNo}</td>
                              <td className="px-4 py-3">{order.buyer || '-'}</td>
                              <td className="px-4 py-3 text-center font-bold text-sky-700">{order.qty || '-'}</td>
                              <td className="px-4 py-3">{formatDate(order.wResDate)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${order.isHistory ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                  {order.isHistory ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-gray-900">
                                  Stage {order.currentStage || 0} / 8
                                </span>
                                {order.stages && order.stages[order.currentStage - 1] && (
                                  <span className="text-[10px] text-gray-400 block mt-0.5">
                                    {order.stages[order.currentStage - 1].name}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedLeadDetails(order);
                                    setActiveStatsModal(null);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase transition"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DraggableScroll>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Stage-wise Progress Modal */}
        {selectedStageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Stage {selectedStageModal.stageNum}: {selectedStageModal.name} - Completed
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing {selectedStageModal.completedCount} completed orders
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedStageModal(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {selectedStageModal.orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-medium text-sm">
                    No orders have completed this stage yet.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <DraggableScroll className="w-full">
                      <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">W/O No</th>
                            <th className="px-4 py-3">Buyer</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3">Stage Plan Date</th>
                            <th className="px-4 py-3">Stage Actual Date</th>
                            <th className="px-4 py-3">Delay (Days)</th>
                            <th className="px-4 py-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {selectedStageModal.orders.map((order) => {
                            const stg = order.stages?.find(s => s.name === selectedStageModal.name);
                            let delay = 0;
                            if (stg?.plannedDate && stg?.actualDate) {
                              const plan = new Date(stg.plannedDate);
                              const act = new Date(stg.actualDate);
                              delay = Math.round((act - plan) / (1000 * 60 * 60 * 24));
                            }
                            return (
                              <tr 
                                key={order.id} 
                                className="hover:bg-indigo-50/20 transition-colors cursor-pointer"
                                onDoubleClick={() => {
                                  setSelectedLeadDetails(order);
                                  setSelectedStageModal(null);
                                }}
                              >
                                <td className="px-4 py-3 font-bold text-indigo-600">{order.woNo}</td>
                                <td className="px-4 py-3">{order.buyer || '-'}</td>
                                <td className="px-4 py-3 text-center font-bold text-sky-700">{order.qty || '-'}</td>
                                <td className="px-4 py-3">{stg?.plannedDate ? formatDate(stg.plannedDate) : '-'}</td>
                                <td className="px-4 py-3 font-semibold text-emerald-600">
                                  {order.isHistory ? 'Completed' : (stg?.actualDate ? formatDate(stg.actualDate) : '-')}
                                </td>
                                <td className="px-4 py-3">
                                  {delay > 0 ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">
                                      {delay} Days Delayed
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800">
                                      On Time
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{stg?.remarks || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </DraggableScroll>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Group Details Modal */}
        {selectedSummaryGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Orders for: <span className="text-indigo-600">{selectedSummaryGroup.name}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing {summaryGroupOrders.length} orders
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSummaryGroup(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {summaryGroupOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-medium text-sm">
                    No orders found.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <DraggableScroll className="w-full">
                      <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">W/O No</th>
                            <th className="px-4 py-3">{summaryGroup === 'user' ? 'Buyer' : 'Added By'}</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3">W/RES Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Current Stage</th>
                            <th className="px-4 py-3 text-center">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {summaryGroupOrders.map((order) => (
                            <tr 
                              key={order.id} 
                              className="hover:bg-indigo-50/20 transition-colors cursor-pointer"
                              onDoubleClick={() => {
                                setSelectedLeadDetails(order);
                                setSelectedSummaryGroup(null);
                              }}
                            >
                              <td className="px-4 py-3 font-bold text-indigo-600">{order.woNo}</td>
                              <td className="px-4 py-3">
                                {summaryGroup === 'user' ? (order.buyer || '-') : (order.addedBy || '-')}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-sky-700">{order.qty || '-'}</td>
                              <td className="px-4 py-3">{formatDate(order.wResDate)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  order.isHistory ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {order.isHistory ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-gray-900">
                                  Stage {order.currentStage || 0} / 8
                                </span>
                                {order.stages && order.stages[order.currentStage - 1] && (
                                  <span className="text-[10px] text-gray-400 block mt-0.5">
                                    {order.stages[order.currentStage - 1].name}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedLeadDetails(order);
                                    setSelectedSummaryGroup(null);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase transition"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DraggableScroll>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

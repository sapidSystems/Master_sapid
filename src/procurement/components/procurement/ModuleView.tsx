import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, CheckCircle, Clock, Boxes, ScrollText } from 'lucide-react';
import { ModuleType, AnyProcurementItem, FilterState, ViewTab } from '../../types/procurement';
import { useProcurement } from '../../context/ProcurementContext';
import { TableFilters } from './TableFilters';
import { ProcurementTable } from './ProcurementTable';
import { CreateRecordModal } from '../modals/CreateRecordModal';
import { UpdateStatusModal } from '../modals/UpdateStatusModal';
import { RemarksHistoryModal } from '../modals/RemarksHistoryModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface ModuleViewProps {
  module: ModuleType;
}

export const ModuleView: React.FC<ModuleViewProps> = ({ module }) => {
  const {
    activeNav,
    setActiveNav,
    activeTab,
    setActiveTab,
    newLeather,
    dailyLeather,
    materials,
    packaging,
    createRecord,
    updateRecord,
    deleteRecord,
    addRemarkToRecord
  } = useProcurement();

  const [searchParams, setSearchParams] = useSearchParams();
  const subQuery = searchParams.get('sub');

  // Internal active module state when on Material/Packaging page
  const [activeSubModule, setActiveSubModule] = useState<'material' | 'packaging'>(() => {
    if (subQuery === 'packaging' || module === 'packaging') return 'packaging';
    return 'material';
  });

  // Sync with search parameter if it changes or module prop changes
  useEffect(() => {
    if (subQuery === 'packaging') {
      setActiveSubModule('packaging');
    } else if (subQuery === 'material') {
      setActiveSubModule('material');
    } else if (module === 'packaging') {
      setActiveSubModule('packaging');
    } else if (module === 'material') {
      setActiveSubModule('material');
    }
  }, [subQuery, module]);

  const currentActiveModule: ModuleType = (module === 'material' || module === 'packaging') ? activeSubModule : module;

  const handleSelectSubModule = (sub: 'material' | 'packaging') => {
    setActiveSubModule(sub);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (sub === 'packaging') {
        next.set('sub', 'packaging');
      } else {
        next.delete('sub');
      }
      return next;
    });
  };

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedItemForUpdate, setSelectedItemForUpdate] = useState<AnyProcurementItem | null>(null);

  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [selectedItemForRemarks, setSelectedItemForRemarks] = useState<AnyProcurementItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<AnyProcurementItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters state (Req #57)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    fromDate: '',
    toDate: '',
    status: 'all',
    buyerCode: 'all',
    vendor: 'all'
  });

  // Source items for current active module
  const currentModuleItems = useMemo(() => {
    switch (currentActiveModule) {
      case 'new-leather': return newLeather;
      case 'daily-leather': return dailyLeather;
      case 'material': return materials;
      case 'packaging': return packaging;
    }
  }, [currentActiveModule, newLeather, dailyLeather, materials, packaging]);

  // Tab filtered items: pending vs history
  const tabItems = useMemo(() => {
    if (activeTab === 'pending') {
      return currentModuleItems.filter(i => !i.actualReceiptDate);
    } else {
      return currentModuleItems.filter(i => (i.remarkHistory && i.remarkHistory.length > 0) || !!i.actualReceiptDate);
    }
  }, [currentModuleItems, activeTab]);

  // Unique Buyers and Vendors for dropdown filters
  const buyerOptions = useMemo(() => {
    const set = new Set<string>();
    currentModuleItems.forEach(i => {
      if (i.buyerCode) set.add(i.buyerCode);
    });
    return Array.from(set).sort();
  }, [currentModuleItems]);

  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    currentModuleItems.forEach(i => {
      if ((i as any).tannery) set.add((i as any).tannery);
      if ((i as any).supplier) set.add((i as any).supplier);
      if ((i as any).items) {
        (i as any).items.forEach((sub: any) => {
          if (sub.tannery) set.add(sub.tannery);
        });
      }
    });
    return Array.from(set).sort();
  }, [currentModuleItems]);

  // Apply Search and Filters
  const filteredItems = useMemo(() => {
    return tabItems.filter(item => {
      // 1. Search Query
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const woMatch = (item as any).woNo?.toLowerCase().includes(q);
        const buyerMatch = item.buyerCode?.toLowerCase().includes(q);
        const remarkMatch = item.remarks?.toLowerCase().includes(q);
        const leatherMatch = (item as any).leatherName?.toLowerCase().includes(q);
        const materialMatch = (item as any).materialName?.toLowerCase().includes(q);
        const packagingMatch = (item as any).packagingType?.toLowerCase().includes(q);
        const subItemsMatch = (item as any).items?.some((sub: any) => 
          sub.leatherName.toLowerCase().includes(q) || sub.colour.toLowerCase().includes(q) || sub.tannery.toLowerCase().includes(q)
        );

        if (!woMatch && !buyerMatch && !remarkMatch && !leatherMatch && !materialMatch && !packagingMatch && !subItemsMatch) {
          return false;
        }
      }

      // 2. From Date
      if (filters.fromDate && item.date < filters.fromDate) {
        return false;
      }

      // 3. To Date
      if (filters.toDate && item.date > filters.toDate) {
        return false;
      }

      // 4. Status
      if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // 5. Buyer Code
      if (filters.buyerCode && filters.buyerCode !== 'all' && item.buyerCode !== filters.buyerCode) {
        return false;
      }

      // 6. Vendor / Tannery
      if (filters.vendor && filters.vendor !== 'all') {
        const matchesDirect = (item as any).tannery === filters.vendor || (item as any).supplier === filters.vendor;
        const matchesSub = (item as any).items?.some((sub: any) => sub.tannery === filters.vendor);
        if (!matchesDirect && !matchesSub) {
          return false;
        }
      }

      return true;
    });
  }, [tabItems, filters]);

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.fromDate ||
    filters.toDate ||
    (filters.status && filters.status !== 'all') ||
    (filters.buyerCode && filters.buyerCode !== 'all') ||
    (filters.vendor && filters.vendor !== 'all')
  );

  const resetFilters = () => {
    setFilters({
      search: '',
      fromDate: '',
      toDate: '',
      status: 'all',
      buyerCode: 'all',
      vendor: 'all'
    });
  };

  // Module configuration
  const config = {
    'new-leather': {
      title: 'New Leather Development',
      subtitle: 'Track new article swatches, lab dips, drum dyeing, and sample hides',
      vendorLabel: 'Tannery',
      addLabel: 'Add New Leather',
      shortAddLabel: 'Add New Leather'
    },
    'daily-leather': {
      title: 'Daily Leather Procurement',
      subtitle: 'Manage production work order leather requirements and multiple hide lots',
      vendorLabel: 'Tannery',
      addLabel: 'Add Daily Leather',
      shortAddLabel: 'Add Daily Leather'
    },
    'material': {
      title: 'Daily Material Procurement',
      subtitle: 'Monitor fabric linings, bonded threads, buckles, and footwear hardware',
      vendorLabel: 'Supplier',
      addLabel: 'Add Daily Material',
      shortAddLabel: 'Add Daily Material'
    },
    'packaging': {
      title: 'Daily Packaging Procurement',
      subtitle: 'Coordinate branded shoe boxes, barcode hangtags, desiccants, and master cartons',
      vendorLabel: 'Supplier',
      addLabel: 'Add Daily Packaging',
      shortAddLabel: 'Add Daily Packaging'
    }
  }[currentActiveModule];

  // Actions
  const handleOpenUpdate = (item: AnyProcurementItem) => {
    setSelectedItemForUpdate(item);
    setUpdateModalOpen(true);
  };

  const handleOpenRemarks = (item: AnyProcurementItem) => {
    setSelectedItemForRemarks(item);
    setRemarksModalOpen(true);
  };

  const handleOpenDelete = (item: AnyProcurementItem) => {
    setSelectedItemForDelete(item);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItemForDelete) return;
    setIsDeleting(true);
    await deleteRecord(currentActiveModule, selectedItemForDelete.id);
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setSelectedItemForDelete(null);
  };

  const pendingCount = currentModuleItems.filter(i => !i.actualReceiptDate).length;
  const historyCount = currentModuleItems.filter(i => (i.remarkHistory && i.remarkHistory.length > 0) || !!i.actualReceiptDate).length;

  const matPending = materials.filter(i => !i.actualReceiptDate).length;
  const pkgPending = packaging.filter(i => !i.actualReceiptDate).length;

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* 2-Tab Header for Material & Packaging combined view */}
      {(module === 'material' || module === 'packaging') && (
        <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => handleSelectSubModule('material')}
            className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              currentActiveModule === 'material'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200 font-extrabold ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Boxes className={`w-4 h-4 ${currentActiveModule === 'material' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Daily Material Proc</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              currentActiveModule === 'material'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-200/70 text-slate-600'
            }`}>
              {matPending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubModule('packaging')}
            className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              currentActiveModule === 'packaging'
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200 font-extrabold ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ScrollText className={`w-4 h-4 ${currentActiveModule === 'packaging' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Daily Packaging Proc</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
              currentActiveModule === 'packaging'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-200/70 text-slate-600'
            }`}>
              {pkgPending}
            </span>
          </button>
        </div>
      )}

      {/* Top Bar: Title & Responsive Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {config.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {config.subtitle}
          </p>
        </div>

        {/* Primary Add Button */}
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="self-start sm:self-auto min-h-[44px] px-5 py-2.5 bg-black hover:bg-slate-900 active:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ring-2 ring-black/10"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{config.addLabel}</span>
        </button>
      </div>

      {/* Tab Switcher: Pending vs History (Req #50) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Orders</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === 'pending'
              ? 'bg-amber-400 text-slate-950'
              : 'bg-slate-200 text-slate-700'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Received History</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            activeTab === 'history'
              ? 'bg-emerald-400 text-slate-950'
              : 'bg-slate-200 text-slate-700'
          }`}>
            {historyCount}
          </span>
        </button>
      </div>

      {/* Filter Component (Req #57) */}
      <TableFilters
        filters={filters}
        onFilterChange={setFilters}
        buyerOptions={buyerOptions}
        vendorOptions={vendorOptions}
        vendorLabel={config.vendorLabel}
      />

      {/* Table Component (Req #55, #56, #63) */}
      <ProcurementTable
        module={currentActiveModule}
        items={filteredItems}
        isHistory={activeTab === 'history'}
        onUpdate={handleOpenUpdate}
        onQuickComplete={(item, actualDate) => updateRecord(currentActiveModule, item.id, { actualReceiptDate: actualDate })}
        onViewRemarks={handleOpenRemarks}
        onDelete={handleOpenDelete}
        onAddNew={() => setCreateModalOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      {/* Create Modal */}
      <CreateRecordModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        module={currentActiveModule}
        onCreate={createRecord}
      />

      {/* Update Target & Actual Receipt Date Modal */}
      <UpdateStatusModal
        isOpen={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setSelectedItemForUpdate(null);
        }}
        module={currentActiveModule}
        item={selectedItemForUpdate}
        onSave={(updates) => {
          if (!selectedItemForUpdate) return Promise.resolve(false);
          return updateRecord(currentActiveModule, selectedItemForUpdate.id, updates);
        }}
      />

      {/* Remarks History & Add Remark Modal */}
      <RemarksHistoryModal
        isOpen={remarksModalOpen}
        onClose={() => {
          setRemarksModalOpen(false);
          setSelectedItemForRemarks(null);
        }}
        module={currentActiveModule}
        recordId={selectedItemForRemarks?.id || ''}
        recordTitle={selectedItemForRemarks ? ((selectedItemForRemarks as any).woNo || selectedItemForRemarks.id) : ''}
        remarks={selectedItemForRemarks?.remarkHistory || []}
        onAddRemark={async (text) => {
          if (!selectedItemForRemarks) return false;
          const ok = await addRemarkToRecord(currentActiveModule, selectedItemForRemarks.id, text);
          if (ok) {
            // Update modal's internal list
            setSelectedItemForRemarks(prev => prev ? {
              ...prev,
              remarkHistory: [
                ...prev.remarkHistory,
                {
                  id: 'rem-' + Date.now(),
                  text,
                  author: 'System User',
                  timestamp: new Date().toISOString()
                }
              ]
            } : null);
          }
          return ok;
        }}
      />

      {/* Delete Confirmation Modal (Req #67) */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        type="delete"
        title="Delete Procurement Order?"
        message={`Are you sure you want to permanently delete ${selectedItemForDelete ? ((selectedItemForDelete as any).woNo || selectedItemForDelete.id) : 'this record'}? This action cannot be reversed.`}
        confirmLabel="Delete Order"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedItemForDelete(null);
        }}
      />
    </div>
  );
};

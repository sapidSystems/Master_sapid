import React, { useState } from 'react';
import { Edit3, Trash2, ArrowUpDown, Clock, User, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { ModuleType, AnyProcurementItem, NewLeatherItem, DailyLeatherItem, MaterialItem, PackagingItem } from '../../types/procurement';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatDateTime, getDaysDiffText, addWorkingDays } from '../../utils/dateUtils';
import { EmptyState } from '../common/EmptyState';
import {
  fetchTatConfigs,
  getTatDays,
  calculateTatStatus,
  TatPlannedCell,
  TatDelayCell,
} from '../../../utils/tatUtils';

interface ProcurementTableProps {
  module: ModuleType;
  items: AnyProcurementItem[];
  isHistory: boolean;
  visibleColumns?: Record<string, boolean>;
  onUpdate: (item: AnyProcurementItem) => void;
  onQuickComplete?: (item: AnyProcurementItem, actualDate: string) => void;
  onViewRemarks: (item: AnyProcurementItem) => void;
  onDelete: (item: AnyProcurementItem) => void;
  onAddNew?: () => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  canWrite?: boolean;
}

export const ProcurementTable: React.FC<ProcurementTableProps> = ({
  module,
  items,
  isHistory,
  visibleColumns,
  onUpdate,
  onQuickComplete,
  onViewRemarks,
  onDelete,
  onAddNew,
  hasActiveFilters,
  onResetFilters,
  canWrite = true
}) => {
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tatConfigs, setTatConfigs] = useState<any[]>([]);

  React.useEffect(() => {
    fetchTatConfigs().then(setTatConfigs);
  }, []);

  const isColVisible = (colId: string) => {
    if (!visibleColumns) return true;
    return visibleColumns[colId] !== false;
  };

  const getModuleTatPath = (mod: ModuleType) => {
    switch (mod) {
      case 'new-leather':
        return '/dashboard/procurement/new-leather';
      case 'daily-leather':
        return '/dashboard/procurement/daily-leather';
      case 'material':
        return '/dashboard/procurement/material';
      case 'packaging':
        return '/dashboard/procurement/packaging';
      default:
        return `/dashboard/procurement/${mod}`;
    }
  };

  const currentTatDays = getTatDays(tatConfigs, getModuleTatPath(module), 4);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
    }
  };

  // If rendering Received History Tab: Display each update/remark log entry as its own separate row (No Action Buttons)
  if (isHistory) {
    interface FlatHistoryRow {
      logId: string;
      timestamp: string;
      author: string;
      item: AnyProcurementItem;
      logText: string;
    }

    const historyLogs: FlatHistoryRow[] = [];
    items.forEach(item => {
      if (item.remarkHistory && item.remarkHistory.length > 0) {
        item.remarkHistory.forEach(rem => {
          historyLogs.push({
            logId: rem.id,
            timestamp: rem.timestamp,
            author: rem.author || 'System User',
            item,
            logText: rem.text
          });
        });
      } else if (item.remarks) {
        historyLogs.push({
          logId: 'log-' + item.id,
          timestamp: item.updatedAt || item.createdAt || item.date,
          author: 'System User',
          item,
          logText: item.remarks
        });
      }
    });

    historyLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (historyLogs.length === 0) {
      return (
        <EmptyState
          isSearchOrFilter={hasActiveFilters}
          onAction={hasActiveFilters ? onResetFilters : (canWrite ? onAddNew : undefined)}
          actionLabel={hasActiveFilters ? 'Reset Filters' : (canWrite ? '+ Add New Record' : undefined)}
        />
      );
    }

    return (
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 text-[11px] sm:text-xs uppercase font-semibold tracking-wider">
              <tr>
                {isColVisible('historyDate') && (
                  <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom font-bold bg-emerald-500/10 text-emerald-900 min-w-[105px]">
                    Update Date<br />& Time
                  </th>
                )}
                {isColVisible('historyAuthor') && (
                  <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom font-bold min-w-[85px]">
                    Updated<br />By
                  </th>
                )}
                {module === 'packaging' ? (
                  <>
                    {isColVisible('woNo') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[95px] bg-amber-500/10 text-amber-900">Work Order<br />No.</th>}
                    {isColVisible('buyerCode') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[80px] bg-amber-500/10 text-amber-900">Buyer<br />Code</th>}
                    {isColVisible('woDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[95px] bg-amber-500/10 text-amber-900">Work Order<br />Date</th>}
                    {isColVisible('indentReceiptDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[125px] bg-amber-500/10 text-amber-900">Work Order &<br />Indent Receipt Date</th>}
                    {isColVisible('shipmentDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[105px] bg-amber-500/10 text-amber-900">Work Order<br />Shipment Date</th>}
                    {isColVisible('targetStockCheckDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[110px] font-bold text-slate-700">Target Stock<br />Check Date</th>}
                    {isColVisible('actualStockUpdateDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[110px] bg-emerald-500/20 text-emerald-950 font-bold">Actual Stock<br />Update Date</th>}
                    {isColVisible('poReleaseTargetDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[105px] font-bold text-slate-700">PO Release<br />Target Date</th>}
                    {isColVisible('actualPoReleaseDate') && <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[100px] bg-emerald-500/20 text-emerald-950 font-bold">Actual PO<br />Release Date</th>}
                    {isColVisible('plannedMaterialReceiptDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[115px] bg-orange-500/20 text-orange-950 font-bold">Planned Material<br />Receipt Date</th>}
                    {isColVisible('actualReceiptDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[115px] bg-emerald-500/20 text-emerald-950 font-bold">Actual Material<br />Receipt Date</th>}
                    {isColVisible('status') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[80px] font-bold">Status</th>}
                  </>
                ) : module === 'material' ? (
                  <>
                    {isColVisible('woNo') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[95px] bg-amber-500/10 text-amber-900">Work Order<br />No.</th>}
                    {isColVisible('buyerCode') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[80px] bg-amber-500/10 text-amber-900">Buyer<br />Code</th>}
                    {isColVisible('woDate') && <th scope="col" className="px-2.5 sm:px-3 py-2.5 leading-tight whitespace-normal align-bottom min-w-[95px] bg-amber-500/10 text-amber-900">Work Order<br />Date</th>}
                    {isColVisible('indentReceiptDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[125px] bg-amber-500/10 text-amber-900">Work Order &<br />Indent Receipt Date</th>}
                    {isColVisible('shipmentDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[105px] bg-amber-500/10 text-amber-900">Work Order<br />Shipment Date</th>}
                    {isColVisible('targetStockCheckDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[110px] font-bold text-slate-700">Target Stock<br />Check Date</th>}
                    {isColVisible('actualStockUpdateDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[110px] bg-emerald-500/20 text-emerald-950 font-bold">Actual Stock<br />Update Date</th>}
                    {isColVisible('poReleaseTargetDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[105px] font-bold text-slate-700">PO Release<br />Target Date</th>}
                    {isColVisible('actualPoReleaseDate') && <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[100px] bg-emerald-500/20 text-emerald-950 font-bold">Actual PO<br />Release Date</th>}
                    {isColVisible('plannedMaterialReceiptDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[115px] bg-orange-500/20 text-orange-950 font-bold">Planned Material<br />Receipt Date</th>}
                    {isColVisible('actualReceiptDate') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[115px] bg-emerald-500/20 text-emerald-950 font-bold">Actual Material<br />Receipt Date</th>}
                    {isColVisible('status') && <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[80px] font-bold">Status</th>}
                  </>
                ) : module === 'daily-leather' ? (
                  <>
                    {isColVisible('woNo') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Work Order No.</th>}
                    {isColVisible('buyerCode') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Buyer Code</th>}
                    {isColVisible('woDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Work Order Date</th>}
                    {isColVisible('indentReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Work Order & Indent Receipt Date</th>}
                    {isColVisible('shipmentDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Work Order Shipment Date</th>}
                    {isColVisible('poReleaseTargetDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700">PO Release Target Date</th>}
                    {isColVisible('actualPoReleaseDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold">Actual PO Release Date</th>}
                    {isColVisible('leatherName') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Leather Name</th>}
                    {isColVisible('colour') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Colour</th>}
                    {isColVisible('quantity') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 text-right">Qty Required (sqft)</th>}
                    {isColVisible('tannery') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Tannery</th>}
                    {isColVisible('qtyInStock') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold text-right">Qty In Stock</th>}
                    {isColVisible('qtyOrdered') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold text-right">Qty Ordered (sqft)</th>}
                    {isColVisible('poDeliveryDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 font-bold">PO Delivery Date</th>}
                    {isColVisible('plannedDeliveryDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-normal leading-tight align-bottom min-w-[120px] bg-orange-500/20 text-orange-950 font-bold">Planned Material<br />Receipt Date</th>}
                    {isColVisible('qtyReceived') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold text-right">Qty Received (sqft)</th>}
                    {isColVisible('dueQty') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-right">Due Qty (sqft)</th>}
                    {isColVisible('actualReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-normal leading-tight align-bottom min-w-[140px] bg-emerald-500/20 text-emerald-950 font-bold">Actual Receipt Date<br />for Complete Order</th>}
                    {isColVisible('status') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status</th>}
                  </>
                ) : module === 'new-leather' ? (
                  <>
                    {isColVisible('woNo') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Item / Development ID</th>}
                    {isColVisible('buyerCode') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Buyer Code</th>}
                    {isColVisible('leatherName') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Leather Name</th>}
                    {isColVisible('colour') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Colour</th>}
                    {isColVisible('quantity') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 text-right">Quantity</th>}
                    {isColVisible('tannery') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Tannery</th>}
                    {isColVisible('targetReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700">Target Receipt Date</th>}
                    {isColVisible('actualReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold border-l-2 border-emerald-500">Actual Receipt Date</th>}
                    {isColVisible('status') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>}
                  </>
                ) : (
                  <>
                    {isColVisible('woNo') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Item / WO No.</th>}
                    {isColVisible('buyerCode') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Buyer Code</th>}
                    {isColVisible('leatherName') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Leather / Item Name</th>}
                    {isColVisible('colour') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Colour</th>}
                    {isColVisible('quantity') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap text-right">Quantity</th>}
                    {isColVisible('tannery') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Tannery / Supplier</th>}
                    {isColVisible('targetReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Target Receipt Date</th>}
                    {isColVisible('actualReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold border-l-2 border-emerald-500">Actual Receipt Date</th>}
                    {isColVisible('status') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>}
                  </>
                )}
                {isColVisible('remarks') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap min-w-[240px] bg-amber-500/10">Remarks / History Log</th>}
                {isColVisible('tatPlanned') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-purple-500/10 text-purple-900 font-bold">TAT Planned</th>}
                {isColVisible('tatDelay') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-purple-500/10 text-purple-900 font-bold">TAT Delay</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {historyLogs.map((log, idx) => {
                const item = log.item as any;
                const identifier = item.woNo || item.id;
                const itemName = item.leatherName || item.materialName || item.packagingType || '—';
                const vendorName = item.tannery || item.supplier || '—';
                const colour = item.colour || '—';
                const qtyText = item.quantity !== undefined ? `${item.quantity.toLocaleString()} ${item.unit || 'sqft'}` : '—';

                return (
                  <tr key={log.logId || idx} className="hover:bg-slate-50/80 transition-colors text-xs sm:text-sm">
                    {isColVisible('historyDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">
                        {formatDateTime(log.timestamp)}
                      </td>
                    )}
                    {isColVisible('historyAuthor') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-brand-500" />
                          {log.author}
                        </span>
                      </td>
                    )}
                    {module === 'material' || module === 'packaging' ? (
                      <>
                        {isColVisible('woNo') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 bg-amber-500/5">
                            {item.woNo || '—'}
                          </td>
                        )}
                        {isColVisible('buyerCode') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium bg-amber-500/5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs">
                              {item.buyerCode || '—'}
                            </span>
                          </td>
                        )}
                        {isColVisible('woDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                            {formatDate(item.woDate || item.date)}
                          </td>
                        )}
                        {isColVisible('indentReceiptDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                            {formatDate(item.indentReceiptDate)}
                          </td>
                        )}
                        {isColVisible('shipmentDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                            {formatDate(item.shipmentDate)}
                          </td>
                        )}
                        {(() => {
                          const hBaseDate = item.indentReceiptDate || item.woDate || item.date;
                          const hStockCheckDays = module === 'packaging' ? 7 : 3;
                          const hTargetStockCheck = item.targetStockCheckDate || (hBaseDate ? addWorkingDays(hBaseDate, hStockCheckDays) : '');
                          const hPoReleaseTarget = item.poReleaseTargetDate || (hTargetStockCheck ? addWorkingDays(hTargetStockCheck, 2) : '');
                          return (
                            <>
                              {isColVisible('targetStockCheckDate') && (
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                                  {formatDate(hTargetStockCheck)}
                                </td>
                              )}
                              {isColVisible('actualStockUpdateDate') && (
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 font-medium bg-emerald-500/10">
                                  {formatDate(item.actualStockUpdateDate)}
                                </td>
                              )}
                              {isColVisible('poReleaseTargetDate') && (
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                                  {formatDate(hPoReleaseTarget)}
                                </td>
                              )}
                            </>
                          );
                        })()}
                        {isColVisible('actualPoReleaseDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 font-medium bg-emerald-500/10">
                            {formatDate(item.actualPoReleaseDate)}
                          </td>
                        )}
                        {isColVisible('plannedMaterialReceiptDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-orange-700 font-medium bg-orange-500/10">
                            {formatDate(item.expectedMaterialReceiptDate || item.targetReceiptDate)}
                          </td>
                        )}
                        {isColVisible('actualReceiptDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 bg-emerald-500/10 border-l-2 border-emerald-500">
                            {formatDate(item.actualReceiptDate)}
                          </td>
                        )}
                        {isColVisible('status') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                        )}
                      </>
                    ) : module === 'daily-leather' ? (
                      <>
                        {isColVisible('woNo') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 bg-amber-500/5">
                            {item.woNo || '—'}
                          </td>
                        )}
                        {isColVisible('buyerCode') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium bg-amber-500/5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs">
                              {item.buyerCode || '—'}
                            </span>
                          </td>
                        )}
                        {isColVisible('woDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                            {formatDate(item.woDate || item.date)}
                          </td>
                        )}
                        {isColVisible('indentReceiptDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                            {formatDate(item.indentReceiptDate)}
                          </td>
                        )}
                        {isColVisible('shipmentDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                            {formatDate(item.shipmentDate)}
                          </td>
                        )}
                        {isColVisible('poReleaseTargetDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                            {formatDate(item.poReleaseTargetDate || ((item.indentReceiptDate || item.woDate || item.date) ? addWorkingDays(item.indentReceiptDate || item.woDate || item.date, 2) : ''))}
                          </td>
                        )}
                        {isColVisible('actualPoReleaseDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 font-medium bg-emerald-500/10">
                            {formatDate(item.actualPoReleaseDate)}
                          </td>
                        )}
                        {isColVisible('leatherName') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-slate-900 bg-amber-500/5">
                            {item.leatherName || '—'}
                          </td>
                        )}
                        {isColVisible('colour') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                            {item.colour || '—'}
                          </td>
                        )}
                        {isColVisible('quantity') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-900 bg-amber-500/5">
                            {item.quantity !== undefined && item.quantity !== null && item.quantity !== '' ? Number(item.quantity).toLocaleString() : '—'}
                          </td>
                        )}
                        {isColVisible('tannery') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                            {item.tannery || '—'}
                          </td>
                        )}
                        {isColVisible('qtyInStock') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700 bg-emerald-500/10">
                            {item.qtyInStock !== undefined && item.qtyInStock !== null ? item.qtyInStock.toLocaleString() : '0'}
                          </td>
                        )}
                        {isColVisible('qtyOrdered') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700 bg-emerald-500/10">
                            {item.qtyOrdered !== undefined && item.qtyOrdered !== null ? item.qtyOrdered.toLocaleString() : (item.quantity !== undefined && item.quantity !== null && item.quantity !== '' ? Number(item.quantity).toLocaleString() : '—')}
                          </td>
                        )}
                        {isColVisible('poDeliveryDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-orange-700 bg-orange-500/10">
                            {formatDate(item.poDeliveryDate)}
                          </td>
                        )}
                        {isColVisible('plannedDeliveryDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-orange-700 bg-orange-500/10">
                            {formatDate(item.plannedDeliveryDate || item.targetReceiptDate)}
                          </td>
                        )}
                        {isColVisible('qtyReceived') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-emerald-700 bg-emerald-500/10">
                            {(item.qtyReceived || 0) > 0 ? (item.qtyReceived || 0).toLocaleString() : '—'}
                          </td>
                        )}
                        {isColVisible('dueQty') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-800">
                            {item.quantity !== undefined && item.quantity !== null && item.quantity !== ''
                              ? ((item.qtyReceived || 0) >= Number(item.quantity) ? 'No Due' : Math.max(0, Number(item.quantity) - (item.qtyReceived || 0)).toLocaleString())
                              : '—'}
                          </td>
                        )}
                        {isColVisible('actualReceiptDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 bg-emerald-500/10 border-l-2 border-emerald-500">
                            {formatDate(item.actualReceiptDate)}
                          </td>
                        )}
                        {isColVisible('status') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                        )}
                      </>
                    ) : (
                      <>
                        {isColVisible('woNo') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600">
                            {identifier}
                          </td>
                        )}
                        {isColVisible('buyerCode') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-mono text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {item.buyerCode || '—'}
                            </span>
                          </td>
                        )}
                        {isColVisible('leatherName') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                            {itemName}
                          </td>
                        )}
                        {isColVisible('colour') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600">
                            {colour}
                          </td>
                        )}
                        {isColVisible('quantity') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium">
                            {qtyText}
                          </td>
                        )}
                        {isColVisible('tannery') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600">
                            {vendorName}
                          </td>
                        )}
                        {isColVisible('targetReceiptDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                            {formatDate(item.targetReceiptDate)}
                          </td>
                        )}
                        {isColVisible('actualReceiptDate') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 bg-emerald-500/10 border-l-2 border-emerald-500">
                            {formatDate(item.actualReceiptDate)}
                          </td>
                        )}
                        {isColVisible('status') && (
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                        )}
                      </>
                    )}
                    {isColVisible('remarks') && (
                      <td className="px-3 sm:px-4 py-3 text-xs text-slate-800 font-medium">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                          {log.logText}
                        </div>
                      </td>
                    )}
                    {(() => {
                      const histStartDate = item.date || item.woDate || item.createdAt;
                      const histEndDate = item.actualReceiptDate || item.actualMaterialReceiptDate || log.timestamp || item.updatedAt;
                      const histTatStatus = calculateTatStatus({
                        tatDays: currentTatDays,
                        startDate: histStartDate,
                        endDate: histEndDate,
                        isCompleted: true,
                      });
                      return (
                        <>
                          {isColVisible('tatPlanned') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <TatPlannedCell tatDays={currentTatDays} startDate={histStartDate} />
                            </td>
                          )}
                          {isColVisible('tatDelay') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <TatDelayCell status={histTatStatus} />
                            </td>
                          )}
                        </>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Showing <span className="font-semibold text-slate-700">{historyLogs.length}</span> update log entries
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Read-only historical audit log</span>
          </div>
        </div>
      </div>
    );
  }

  // Sort items for Pending view
  const sortedItems = [...items].sort((a, b) => {
    let valA: any = (a as any)[sortField];
    let valB: any = (b as any)[sortField];

    if (valA === undefined) valA = '';
    if (valB === undefined) valB = '';

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  if (items.length === 0) {
    return (
      <EmptyState
        isSearchOrFilter={hasActiveFilters}
        onAction={hasActiveFilters ? onResetFilters : (canWrite ? onAddNew : undefined)}
        actionLabel={hasActiveFilters ? 'Reset Filters' : (canWrite ? '+ Add New Record' : undefined)}
      />
    );
  }

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
      {/* Mobile Swipe Helper */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>← Swipe horizontally for more details →</span>
        <span className="font-semibold text-slate-700">{items.length} records</span>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 text-[11px] sm:text-xs uppercase font-semibold tracking-wider">
            <tr>
              {/* Sticky Action Column Header */}
              {isColVisible('action') && (
                <th 
                  scope="col" 
                  className="sticky left-0 z-30 bg-slate-100 px-2.5 sm:px-3 py-2 sm:py-2.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] align-bottom font-bold whitespace-nowrap min-w-[90px]"
                >
                  Action
                </th>
              )}

              {module === 'packaging' ? (
                <>
                  {isColVisible('woNo') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[95px] bg-amber-500/10 text-amber-900">
                      Work Order<br />No.
                    </th>
                  )}
                  {isColVisible('buyerCode') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[80px] bg-amber-500/10 text-amber-900">
                      Buyer<br />Code
                    </th>
                  )}
                  {isColVisible('woDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[95px] bg-amber-500/10 text-amber-900">
                      Work Order<br />Date
                    </th>
                  )}
                  {isColVisible('indentReceiptDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[125px] bg-amber-500/10 text-amber-900">
                      Work Order &<br />Indent Receipt Date
                    </th>
                  )}
                  {isColVisible('shipmentDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[105px] bg-amber-500/10 text-amber-900">
                      Work Order<br />Shipment Date
                    </th>
                  )}
                  {isColVisible('targetStockCheckDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[110px] font-bold text-slate-700">
                      Target Stock<br />Check Date
                    </th>
                  )}
                  {isColVisible('actualStockUpdateDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[110px] bg-emerald-500/20 text-emerald-950 font-bold">
                      Actual Stock<br />Update Date
                    </th>
                  )}
                  {isColVisible('poReleaseTargetDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[105px] font-bold text-slate-700">
                      PO Release<br />Target Date
                    </th>
                  )}
                  {isColVisible('actualPoReleaseDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[100px] bg-emerald-500/20 text-emerald-950 font-bold">
                      Actual PO<br />Release Date
                    </th>
                  )}
                  {isColVisible('plannedMaterialReceiptDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[115px] bg-orange-500/20 text-orange-950 font-bold">
                      Planned Material<br />Receipt Date
                    </th>
                  )}
                  {isColVisible('actualReceiptDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[115px] bg-emerald-500/20 text-emerald-950 font-bold">
                      Actual Material<br />Receipt Date
                    </th>
                  )}
                  {isColVisible('status') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[80px] font-bold">
                      Status
                    </th>
                  )}
                  {isColVisible('remarks') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[120px] bg-amber-500/10 text-amber-900">
                      Remarks
                    </th>
                  )}
                  {isColVisible('tatPlanned') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[75px] font-bold text-slate-700 bg-indigo-50/70 border-l border-indigo-100">
                      TAT<br />Planned
                    </th>
                  )}
                  {isColVisible('tatDelay') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[75px] font-bold text-slate-700 bg-indigo-50/70 border-r border-indigo-100">
                      TAT<br />Delay
                    </th>
                  )}
                </>
              ) : module === 'material' ? (
                <>
                  {isColVisible('woNo') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[95px] bg-amber-500/10 text-amber-900">
                      Work Order<br />No.
                    </th>
                  )}
                  {isColVisible('buyerCode') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[80px] bg-amber-500/10 text-amber-900">
                      Buyer<br />Code
                    </th>
                  )}
                  {isColVisible('woDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 leading-tight whitespace-normal align-bottom min-w-[95px] bg-amber-500/10 text-amber-900">
                      Work Order<br />Date
                    </th>
                  )}
                  {isColVisible('indentReceiptDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[125px] bg-amber-500/10 text-amber-900">
                      Work Order &<br />Indent Receipt Date
                    </th>
                  )}
                  {isColVisible('shipmentDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[105px] bg-amber-500/10 text-amber-900">
                      Work Order<br />Shipment Date
                    </th>
                  )}
                  {isColVisible('targetStockCheckDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[110px] font-bold text-slate-700">
                      Target Stock<br />Check Date
                    </th>
                  )}
                  {isColVisible('actualStockUpdateDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[110px] bg-emerald-500/20 text-emerald-950 font-bold">
                      Actual Stock<br />Update Date
                    </th>
                  )}
                  {isColVisible('poReleaseTargetDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[105px] font-bold text-slate-700">
                      PO Release<br />Target Date
                    </th>
                  )}
                  {isColVisible('actualPoReleaseDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[100px] bg-emerald-500/20 text-emerald-950 font-bold">
                      Actual PO<br />Release Date
                    </th>
                  )}
                  {isColVisible('plannedMaterialReceiptDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[115px] bg-orange-500/20 text-orange-950 font-bold">
                      Planned Material<br />Receipt Date
                    </th>
                  )}
                  {isColVisible('actualReceiptDate') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[115px] bg-emerald-500/20 text-emerald-950 font-bold">
                      Actual Material<br />Receipt Date
                    </th>
                  )}
                  {isColVisible('status') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[80px] font-bold">
                      Status
                    </th>
                  )}
                  {isColVisible('remarks') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[120px] bg-amber-500/10 text-amber-900">
                      Remarks
                    </th>
                  )}
                  {isColVisible('tatPlanned') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2 sm:py-2.5 whitespace-normal leading-tight align-bottom min-w-[75px] font-bold text-slate-700 bg-indigo-50/70 border-l border-indigo-100">
                      TAT<br />Planned
                    </th>
                  )}
                  {isColVisible('tatDelay') && (
                    <th scope="col" className="px-2.5 sm:px-3 py-2.5 whitespace-normal leading-tight align-bottom min-w-[75px] font-bold text-slate-700 bg-indigo-50/70 border-r border-indigo-100">
                      TAT<br />Delay
                    </th>
                  )}
                </>
              ) : module === 'daily-leather' ? (
                <>
                  {isColVisible('woNo') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Work Order No.</th>}
                  {isColVisible('buyerCode') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Buyer Code</th>}
                  {isColVisible('woDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Work Order Date</th>}
                  {isColVisible('indentReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Work Order & Indent Receipt Date</th>}
                  {isColVisible('shipmentDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Work Order Shipment Date</th>}
                  {isColVisible('poReleaseTargetDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700">PO Release Target Date</th>}
                  {isColVisible('actualPoReleaseDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold">Actual PO Release Date</th>}
                  {isColVisible('leatherName') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Leather Name</th>}
                  {isColVisible('colour') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Colour</th>}
                  {isColVisible('quantity') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 text-right">Qty Required (sqft)</th>}
                  {isColVisible('tannery') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900">Tannery</th>}
                  {isColVisible('qtyInStock') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold text-right">Qty In Stock</th>}
                  {isColVisible('qtyOrdered') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold text-right">Qty Ordered (sqft)</th>}
                  {isColVisible('poDeliveryDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 font-bold">PO Delivery Date</th>}
                  {isColVisible('plannedDeliveryDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-normal leading-tight align-bottom min-w-[120px] bg-orange-500/20 text-orange-950 font-bold">Planned Material<br />Receipt Date</th>}
                  {isColVisible('qtyReceived') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold text-right">Qty Received (sqft)</th>}
                  {isColVisible('dueQty') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-right">Due Qty (sqft)</th>}
                  {isColVisible('actualReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-normal leading-tight align-bottom min-w-[140px] bg-emerald-500/20 text-emerald-950 font-bold">Actual Receipt Date<br />for Complete Order</th>}
                  {isColVisible('status') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status</th>}
                  {isColVisible('remarks') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap min-w-[160px] bg-emerald-500/20 text-emerald-950 font-bold">Remarks</th>}
                  {isColVisible('tatPlanned') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 bg-indigo-50/70 border-l border-indigo-100">TAT Planned</th>}
                  {isColVisible('tatDelay') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 bg-indigo-50/70 border-r border-indigo-100">TAT Delay</th>}
                </>
              ) : (
                <>
                  {isColVisible('date') && (
                    <th 
                      scope="col" 
                      onClick={() => handleSort('date')}
                      className="px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer select-none hover:text-brand-600 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  )}

                  {isColVisible('buyerCode') && (
                    <th 
                      scope="col" 
                      onClick={() => handleSort('buyerCode')}
                      className="px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer select-none hover:text-brand-600 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>Buyer</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  )}

                  {module !== 'new-leather' && isColVisible('woNo') && (
                    <th 
                      scope="col" 
                      onClick={() => handleSort('woNo')}
                      className="px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer select-none hover:text-brand-600 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>WO No.</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  )}

                  {module === 'new-leather' && (
                    <>
                      {isColVisible('leatherName') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Leather Name</th>}
                      {isColVisible('colour') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Colour</th>}
                      {isColVisible('quantity') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap text-right">Quantity</th>}
                      {isColVisible('tannery') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Tannery</th>}
                    </>
                  )}

                  {isColVisible('targetReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Target Date</th>}
                  {isColVisible('actualReceiptDate') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 font-bold border-l-2 border-emerald-500">Actual Receipt Date</th>}
                  {isColVisible('status') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (Auto)</th>}
                  {isColVisible('tatPlanned') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 bg-indigo-50/70 border-l border-indigo-100">TAT Planned</th>}
                  {isColVisible('tatDelay') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 bg-indigo-50/70 border-r border-indigo-100">TAT Delay</th>}
                  {isColVisible('remarks') && <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap min-w-[160px] bg-amber-500/10">Remarks</th>}
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-800">
            {sortedItems.map((item, idx) => {
              const daysInfo = getDaysDiffText(item.targetReceiptDate, item.actualReceiptDate);
              const isSystemRemark = (text?: string) => {
                if (!text) return true;
                const t = text.trim();
                return Boolean(
                  t.match(/^Created from Production Plan Approval/i) ||
                  t.match(/^from Production Plan Approval/i) ||
                  t.match(/^Approved in Production Planning by .* Dispatched for procurement\./i)
                );
              };
              const rawRemark = item.remarks && !isSystemRemark(item.remarks) ? item.remarks : '';
              const userHistoryRemarks = (item.remarkHistory || []).filter(r => r && r.text && !isSystemRemark(r.text));
              const latestRemark = rawRemark || (userHistoryRemarks.length > 0 ? userHistoryRemarks[userHistoryRemarks.length - 1].text : '—');

              if (module === 'new-leather') {
                const nl = item as NewLeatherItem;
                return (
                  <tr
                    key={nl.id || idx}
                    className="hover:bg-slate-50/80 transition-colors group text-xs sm:text-sm"
                  >
                    {/* Sticky Action Column */}
                    {isColVisible('action') && (
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 px-3 sm:px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {!isHistory && (
                            <button
                              type="button"
                              onClick={() => onUpdate(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors shadow-xs"
                              title={canWrite ? "Update Tracking Parameters" : "View Record Details"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{canWrite ? 'Update' : 'View'}</span>
                            </button>
                          )}
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 1. Date */}
                    {isColVisible('date') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatDate(nl.date)}
                      </td>
                    )}

                    {/* 2. Buyer Code */}
                    {isColVisible('buyerCode') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs">
                          {nl.buyerCode || '—'}
                        </span>
                      </td>
                    )}

                    {/* 3. Leather Name */}
                    {isColVisible('leatherName') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-slate-900">
                        {nl.leatherName || '—'}
                      </td>
                    )}

                    {/* 4. Colour */}
                    {isColVisible('colour') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600">
                        {nl.colour || '—'}
                      </td>
                    )}

                    {/* 5. Quantity */}
                    {isColVisible('quantity') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-slate-800">
                        {nl.quantity ? `${nl.quantity.toLocaleString()} ${nl.unit || ''}` : '—'}
                      </td>
                    )}

                    {/* 6. Tannery */}
                    {isColVisible('tannery') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600">
                        {nl.tannery || '—'}
                      </td>
                    )}

                    {/* 7. Target Date */}
                    {isColVisible('targetReceiptDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                        {formatDate(nl.targetReceiptDate)}
                      </td>
                    )}

                    {/* 8. Actual Receipt Date */}
                    {isColVisible('actualReceiptDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 bg-emerald-500/10 border-l-2 border-emerald-500">
                        {formatDate(nl.actualReceiptDate) || '—'}
                      </td>
                    )}

                    {/* 9. Status */}
                    {isColVisible('status') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={nl.status} size="sm" />
                      </td>
                    )}

                    {/* TAT Planned & TAT Delay */}
                    {(() => {
                      const nlStartDate = nl.date || (nl as any).createdAt;
                      const isComplete = Boolean(nl.actualReceiptDate);
                      const tatStatus = calculateTatStatus({
                        tatDays: currentTatDays,
                        startDate: nlStartDate,
                        endDate: nl.actualReceiptDate,
                        isCompleted: isComplete,
                      });
                      return (
                        <>
                          {isColVisible('tatPlanned') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <TatPlannedCell tatDays={currentTatDays} startDate={nlStartDate} />
                            </td>
                          )}
                          {isColVisible('tatDelay') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <TatDelayCell status={tatStatus} />
                            </td>
                          )}
                        </>
                      );
                    })()}

                    {/* 10. Remarks */}
                    {isColVisible('remarks') && (
                      <td className="px-3 sm:px-4 py-3 text-xs text-slate-700 max-w-[220px] truncate bg-amber-500/5" title={latestRemark}>
                        {latestRemark}
                      </td>
                    )}
                  </tr>
                );
              }

              if (module === 'material' || module === 'packaging') {
                const mat = item as any;
                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Sticky Action Column */}
                    {isColVisible('action') && (
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 px-3 sm:px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {!isHistory && (
                            <button
                              type="button"
                              onClick={() => onUpdate(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-600 transition-colors shadow-soft-sm"
                              title={canWrite ? "Update Tracking Parameters" : "View Record Details"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{canWrite ? 'Update' : 'View'}</span>
                            </button>
                          )}

                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 1. Work Order No. */}
                    {isColVisible('woNo') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 bg-amber-500/5">
                        {mat.woNo || '—'}
                      </td>
                    )}

                    {/* 2. Buyer Code */}
                    {isColVisible('buyerCode') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium bg-amber-500/5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs">
                          {mat.buyerCode || '—'}
                        </span>
                      </td>
                    )}

                    {/* 3. Work Order Date */}
                    {isColVisible('woDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                        {formatDate(mat.woDate || mat.date)}
                      </td>
                    )}

                    {/* 4. Work Order & Indent Receipt Date */}
                    {isColVisible('indentReceiptDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                        {formatDate(mat.indentReceiptDate)}
                      </td>
                    )}

                    {/* 5. Work Order Shipment Date */}
                    {isColVisible('shipmentDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                        {formatDate(mat.shipmentDate)}
                      </td>
                    )}

                    {/* 6, 7, 8 Target Stock, Actual Stock, PO Release Target */}
                    {(() => {
                      const matBaseDate = mat.indentReceiptDate || mat.woDate || mat.date;
                      const stockCheckDays = module === 'packaging' ? 7 : 3;
                      const targetStockCheck = mat.targetStockCheckDate || (matBaseDate ? addWorkingDays(matBaseDate, stockCheckDays) : '');
                      const poReleaseTarget = mat.poReleaseTargetDate || (targetStockCheck ? addWorkingDays(targetStockCheck, 2) : '');

                      return (
                        <>
                          {isColVisible('targetStockCheckDate') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                              {formatDate(targetStockCheck)}
                            </td>
                          )}

                          {isColVisible('actualStockUpdateDate') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 font-medium bg-emerald-500/10">
                              {formatDate(mat.actualStockUpdateDate)}
                            </td>
                          )}

                          {isColVisible('poReleaseTargetDate') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                              {formatDate(poReleaseTarget)}
                            </td>
                          )}
                        </>
                      );
                    })()}

                    {/* 9. Actual PO Release Date */}
                    {isColVisible('actualPoReleaseDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 font-medium bg-emerald-500/10">
                        {formatDate(mat.actualPoReleaseDate)}
                      </td>
                    )}

                    {/* 10. Planned Material Receipt Date */}
                    {isColVisible('plannedMaterialReceiptDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-orange-700 font-medium bg-orange-500/10">
                        {formatDate(mat.expectedMaterialReceiptDate || mat.targetReceiptDate)}
                      </td>
                    )}

                    {/* 11. Actual Material Receipt Date */}
                    {isColVisible('actualReceiptDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 bg-emerald-500/10 border-l-2 border-emerald-500">
                        {formatDate(mat.actualReceiptDate) || '—'}
                      </td>
                    )}

                    {/* 12. Status */}
                    {isColVisible('status') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={mat.status} size="sm" />
                      </td>
                    )}

                    {/* 13. Remarks */}
                    {isColVisible('remarks') && (
                      <td className="px-3 sm:px-4 py-3 text-xs text-slate-700 max-w-[220px] truncate bg-amber-500/5" title={latestRemark}>
                        {latestRemark}
                      </td>
                    )}

                    {/* TAT Planned & TAT Delay */}
                    {(() => {
                      const matStartDate = mat.woDate || mat.indentReceiptDate || mat.date || (mat as any).createdAt;
                      const isComplete = Boolean(mat.actualReceiptDate);
                      const tatStatus = calculateTatStatus({
                        tatDays: currentTatDays,
                        startDate: matStartDate,
                        endDate: mat.actualReceiptDate,
                        isCompleted: isComplete,
                      });
                      return (
                        <>
                          {isColVisible('tatPlanned') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <TatPlannedCell tatDays={currentTatDays} startDate={matStartDate} />
                            </td>
                          )}
                          {isColVisible('tatDelay') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <TatDelayCell status={tatStatus} />
                            </td>
                          )}
                        </>
                      );
                    })()}
                  </tr>
                );
              }

              if (module === 'daily-leather') {
                const dl = item as DailyLeatherItem;
                const qtyReq = dl.quantity || 0;
                const qtyRec = dl.qtyReceived || 0;
                const dueQty = Math.max(0, qtyReq - qtyRec);

                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/80 transition-colors group text-xs sm:text-sm"
                  >
                    {/* Sticky Action Column */}
                    {isColVisible('action') && (
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 px-3 sm:px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {!isHistory && (
                            <button
                              type="button"
                              onClick={() => onUpdate(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-600 transition-colors shadow-soft-sm"
                              title={canWrite ? "Update Tracking Parameters" : "View Record Details"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{canWrite ? 'Update' : 'View'}</span>
                            </button>
                          )}
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 1. Work Order No. */}
                    {isColVisible('woNo') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 bg-amber-500/5">
                        {dl.woNo || '—'}
                      </td>
                    )}

                    {/* 2. Buyer Code */}
                    {isColVisible('buyerCode') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium bg-amber-500/5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs">
                          {dl.buyerCode || '—'}
                        </span>
                      </td>
                    )}

                    {/* 3. Work Order Date */}
                    {isColVisible('woDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                        {formatDate(dl.woDate || dl.date)}
                      </td>
                    )}

                    {/* 4. Work Order & Indent Receipt Date */}
                    {isColVisible('indentReceiptDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                        {formatDate(dl.indentReceiptDate)}
                      </td>
                    )}

                    {/* 5. Work Order Shipment Date */}
                    {isColVisible('shipmentDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                        {formatDate(dl.shipmentDate)}
                      </td>
                    )}

                    {/* 6. PO Release Target Date */}
                    {isColVisible('poReleaseTargetDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                        {formatDate(dl.poReleaseTargetDate || ((dl.indentReceiptDate || dl.woDate || dl.date) ? addWorkingDays(dl.indentReceiptDate || dl.woDate || dl.date, 2) : ''))}
                      </td>
                    )}

                    {/* 7. Actual PO Release Date */}
                    {isColVisible('actualPoReleaseDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 font-medium bg-emerald-500/10">
                        {formatDate(dl.actualPoReleaseDate)}
                      </td>
                    )}

                    {/* 8. Leather Name */}
                    {isColVisible('leatherName') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-slate-900 bg-amber-500/5">
                        {dl.leatherName || '—'}
                      </td>
                    )}

                    {/* 9. Colour */}
                    {isColVisible('colour') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                        {dl.colour || '—'}
                      </td>
                    )}

                    {/* 10. Qty Required (sqft) */}
                    {isColVisible('quantity') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-900 bg-amber-500/5">
                        {qtyReq.toLocaleString()}
                      </td>
                    )}

                    {/* 11. Tannery */}
                    {isColVisible('tannery') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 bg-amber-500/5">
                        {dl.tannery || '—'}
                      </td>
                    )}

                    {/* 12. Qty In Stock */}
                    {isColVisible('qtyInStock') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700 bg-emerald-500/10">
                        {dl.qtyInStock !== undefined && dl.qtyInStock !== null ? dl.qtyInStock.toLocaleString() : '0'}
                      </td>
                    )}

                    {/* 13. Qty Ordered (sqft) */}
                    {isColVisible('qtyOrdered') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700 bg-emerald-500/10">
                        {dl.qtyOrdered !== undefined && dl.qtyOrdered !== null ? dl.qtyOrdered.toLocaleString() : qtyReq.toLocaleString()}
                      </td>
                    )}

                    {/* 14. PO Delivery Date */}
                    {isColVisible('poDeliveryDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-orange-700 bg-orange-500/10">
                        {formatDate(dl.poDeliveryDate)}
                      </td>
                    )}

                    {/* 15. Planned Delivery Date */}
                    {isColVisible('plannedDeliveryDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-orange-700 bg-orange-500/10">
                        {formatDate(dl.plannedDeliveryDate || dl.targetReceiptDate)}
                      </td>
                    )}

                    {/* 16. Qty Received (sqft) */}
                    {isColVisible('qtyReceived') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-emerald-700 bg-emerald-500/10">
                        {qtyRec > 0 ? qtyRec.toLocaleString() : '—'}
                      </td>
                    )}

                    {/* 17. Due Qty (sqft) */}
                    {isColVisible('dueQty') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-800">
                        {qtyRec >= qtyReq ? 'No Due' : dueQty.toLocaleString()}
                      </td>
                    )}

                    {/* 18. Actual Receipt Date for Complete Order */}
                    {isColVisible('actualReceiptDate') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 bg-emerald-500/10 border-l-2 border-emerald-500">
                        {formatDate(dl.actualReceiptDate)}
                      </td>
                    )}

                    {/* 19. Status */}
                    {isColVisible('status') && (
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={dl.status} size="sm" />
                      </td>
                    )}

                    {/* 20. Remarks */}
                    {isColVisible('remarks') && (
                      <td className="px-3 sm:px-4 py-3 text-xs text-slate-700 max-w-[220px] truncate bg-emerald-500/10" title={latestRemark}>
                        {latestRemark}
                      </td>
                    )}

                    {/* TAT Planned & TAT Delay */}
                    {(() => {
                      const dlStartDate = dl.woDate || dl.indentReceiptDate || dl.date || (dl as any).createdAt;
                      const isComplete = Boolean(dl.actualReceiptDate);
                      const tatStatus = calculateTatStatus({
                        tatDays: currentTatDays,
                        startDate: dlStartDate,
                        endDate: dl.actualReceiptDate,
                        isCompleted: isComplete,
                      });
                      return (
                        <>
                          {isColVisible('tatPlanned') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <TatPlannedCell tatDays={currentTatDays} startDate={dlStartDate} />
                            </td>
                          )}
                          {isColVisible('tatDelay') && (
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <TatDelayCell status={tatStatus} />
                            </td>
                          )}
                        </>
                      );
                    })()}
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Showing <span className="font-semibold text-slate-700">{sortedItems.length}</span> {isHistory ? 'history' : 'pending'} entries
        </div>
        <div className="text-[11px] text-slate-400">
          * Click on column headers to sort ascending/descending
        </div>
      </div>
    </div>
  );
};

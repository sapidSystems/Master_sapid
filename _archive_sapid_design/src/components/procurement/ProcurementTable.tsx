import React, { useState } from 'react';
import { Edit3, Trash2, ArrowUpDown, Clock, User, ShieldCheck, MessageSquare } from 'lucide-react';
import { ModuleType, AnyProcurementItem, NewLeatherItem, DailyLeatherItem, MaterialItem, PackagingItem } from '../../types/procurement';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatDateTime, getDaysDiffText } from '../../utils/dateUtils';
import { EmptyState } from '../common/EmptyState';

interface ProcurementTableProps {
  module: ModuleType;
  items: AnyProcurementItem[];
  isHistory: boolean;
  onUpdate: (item: AnyProcurementItem) => void;
  onQuickComplete?: (item: AnyProcurementItem, actualDate: string) => void;
  onViewRemarks: (item: AnyProcurementItem) => void;
  onDelete: (item: AnyProcurementItem) => void;
  onAddNew: () => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
}

export const ProcurementTable: React.FC<ProcurementTableProps> = ({
  module,
  items,
  isHistory,
  onUpdate,
  onQuickComplete,
  onViewRemarks,
  onDelete,
  onAddNew,
  hasActiveFilters,
  onResetFilters
}) => {
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
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
          onAction={hasActiveFilters ? onResetFilters : onAddNew}
          actionLabel={hasActiveFilters ? 'Reset Filters' : '+ Add New Record'}
        />
      );
    }

    return (
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/10 text-emerald-900 dark:text-emerald-300">Update Date & Time</th>
                <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Updated By</th>
                {module === 'packaging' ? (
                  <>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order No.</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Buyer Code</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order & Indent Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Shipment Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">Target Stock Check Date (within 7 working days)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Stock Update Date (as recd from Packing Dept)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">PO Release Target Date (within 2 working days)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual PO Release Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 dark:text-orange-200 font-bold">Expected Material Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Material Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>
                  </>
                ) : module === 'material' ? (
                  <>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order No.</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Buyer Code</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order & Indent Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Shipment Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">Target Stock Check Date (within 3 working days)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Stock Update Date (as recd from Material Store)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">PO Release Target Date (within 2 working days)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual PO Release Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 dark:text-orange-200 font-bold">Expected Material Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Material Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>
                  </>
                ) : module === 'daily-leather' ? (
                  <>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order No.</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Buyer Code</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order & Indent Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Shipment Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">PO Release Target Date (within 2 working days)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual PO Release Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Leather Name</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Colour</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300 text-right">Qty Required (sqft)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Tannery</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold text-right">Qty In Stock</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold text-right">Qty Ordered (sqft)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 dark:text-orange-200 font-bold">PO Delivery Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 dark:text-orange-200 font-bold">Planned Delivery Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold text-right">Qty Received (sqft)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-right">Due Qty (sqft)</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Receipt Date for Complete Order</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>
                  </>
                ) : module === 'new-leather' ? (
                  <>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Item / Development ID</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Buyer Code</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Leather Name</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Colour</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300 text-right">Quantity</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Tannery / Supplier</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">Target Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold border-l-2 border-emerald-500">Actual Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>
                  </>
                ) : (
                  <>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Item / WO No.</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Buyer Code</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Leather / Item Name</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Colour</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap text-right">Quantity</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Tannery / Supplier</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Target Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold border-l-2 border-emerald-500">Actual Receipt Date</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>
                  </>
                )}
                <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap min-w-[240px] bg-amber-500/10">Update Description / History Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {historyLogs.map((log, idx) => {
                const item = log.item as any;
                const identifier = item.woNo || item.id;
                const itemName = item.leatherName || item.materialName || item.packagingType || '—';
                const vendorName = item.tannery || item.supplier || '—';
                const colour = item.colour || '—';
                const qtyText = item.quantity !== undefined ? `${item.quantity.toLocaleString()} ${item.unit || 'sqft'}` : '—';

                return (
                  <tr key={log.logId || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-xs sm:text-sm">
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-brand-500" />
                        {log.author}
                      </span>
                    </td>
                    {module === 'material' || module === 'packaging' ? (
                      <>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 dark:text-brand-400 bg-amber-500/5">
                          {item.woNo || '—'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium bg-amber-500/5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs">
                            {item.buyerCode || '—'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                          {formatDate(item.woDate || item.date)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                          {formatDate(item.indentReceiptDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                          {formatDate(item.shipmentDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                          {formatDate(item.targetStockCheckDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 dark:bg-emerald-950/20">
                          {formatDate(item.actualStockUpdateDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                          {formatDate(item.poReleaseTargetDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 dark:bg-emerald-950/20">
                          {formatDate(item.actualPoReleaseDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-orange-700 dark:text-orange-400 font-medium bg-orange-500/10 dark:bg-orange-950/20">
                          {formatDate(item.expectedMaterialReceiptDate || item.targetReceiptDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/30 border-l-2 border-emerald-500">
                          {formatDate(item.actualReceiptDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                      </>
                    ) : module === 'daily-leather' ? (
                      <>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 dark:text-brand-400 bg-amber-500/5">
                          {item.woNo || '—'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium bg-amber-500/5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs">
                            {item.buyerCode || '—'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                          {formatDate(item.woDate || item.date)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                          {formatDate(item.indentReceiptDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                          {formatDate(item.shipmentDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                          {formatDate(item.poReleaseTargetDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 dark:bg-emerald-950/20">
                          {formatDate(item.actualPoReleaseDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-white bg-amber-500/5">
                          {item.leatherName || '—'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 bg-amber-500/5">
                          {item.colour || '—'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white bg-amber-500/5">
                          {(item.quantity || 0).toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 bg-amber-500/5">
                          {item.tannery || '—'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/20">
                          {item.qtyInStock !== undefined && item.qtyInStock !== null ? item.qtyInStock.toLocaleString() : '0'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/20">
                          {item.qtyOrdered !== undefined && item.qtyOrdered !== null ? item.qtyOrdered.toLocaleString() : (item.quantity || 0).toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-orange-700 dark:text-orange-300 bg-orange-500/10 dark:bg-orange-950/20">
                          {formatDate(item.poDeliveryDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-orange-700 dark:text-orange-300 bg-orange-500/10 dark:bg-orange-950/20">
                          {formatDate(item.plannedDeliveryDate || item.targetReceiptDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/20">
                          {(item.qtyReceived || 0) > 0 ? (item.qtyReceived || 0).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {(item.qtyReceived || 0) >= (item.quantity || 0) ? 'No Due' : Math.max(0, (item.quantity || 0) - (item.qtyReceived || 0)).toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/30 border-l-2 border-emerald-500">
                          {formatDate(item.actualReceiptDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 dark:text-brand-400">
                          {identifier}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-mono text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.buyerCode || '—'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          {itemName}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {colour}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium">
                          {qtyText}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {vendorName}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                          {formatDate(item.targetReceiptDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/30 border-l-2 border-emerald-500">
                          {formatDate(item.actualReceiptDate)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                      </>
                    )}
                    <td className="px-3 sm:px-4 py-3 text-xs text-slate-800 dark:text-slate-200 font-medium">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 leading-relaxed">
                        {log.logText}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{historyLogs.length}</span> update log entries
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
        onAction={hasActiveFilters ? onResetFilters : onAddNew}
        actionLabel={hasActiveFilters ? 'Reset Filters' : '+ Add New Record'}
      />
    );
  }

  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
      {/* Mobile Swipe Helper (Req #55) */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>← Swipe horizontally for more details →</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">{items.length} records</span>
      </div>

      {/* Responsive Horizontal Scroll Container (Req #55 & #56) */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          {/* Sticky Table Header (Req #63) */}
          <thead className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs uppercase font-semibold tracking-wider">
            <tr>
              {/* Sticky Action Column Header (Req #56) */}
              <th 
                scope="col" 
                className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 px-3 sm:px-4 py-3 sm:py-3.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap min-w-[110px]"
              >
                Action
              </th>

              {module === 'packaging' ? (
                <>
                  {/* Yellow header columns: At time of creation */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order No.</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Buyer Code</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order & Indent Receipt Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Shipment Date</th>
                  {/* Auto target column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">Target Stock Check Date (within 7 working days)</th>
                  {/* Green header column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Stock Update Date (as recd from Packing Dept)</th>
                  {/* Auto target column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">PO Release Target Date (within 2 working days)</th>
                  {/* Green header column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual PO Release Date</th>
                  {/* Orange header column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 dark:text-orange-200 font-bold">Expected Material Receipt Date</th>
                  {/* Green header column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Material Receipt Date</th>
                  {/* Auto status column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>
                  {/* Yellow header column: editable */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap min-w-[160px] bg-amber-500/10 text-amber-900 dark:text-amber-300">Remarks</th>
                </>
              ) : module === 'material' ? (
                <>
                  {/* Yellow header columns: At time of creation */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order No.</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Buyer Code</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order & Indent Receipt Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Shipment Date</th>
                  {/* Auto target column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">Target Stock Check Date (within 3 working days)</th>
                  {/* Green header column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Stock Update Date (as recd from Material Store)</th>
                  {/* Auto target column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">PO Release Target Date (within 2 working days)</th>
                  {/* Green header column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual PO Release Date</th>
                  {/* Orange header column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 dark:text-orange-200 font-bold">Expected Material Receipt Date</th>
                  {/* Green header column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Material Receipt Date</th>
                  {/* Auto status column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>
                  {/* Yellow header column: editable */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap min-w-[160px] bg-amber-500/10 text-amber-900 dark:text-amber-300">Remarks</th>
                </>
              ) : module === 'daily-leather' ? (
                <>
                  {/* Yellow header columns: At time of creation */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order No.</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Buyer Code</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order & Indent Receipt Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Work Order Shipment Date</th>
                  {/* Auto target date column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-200">PO Release Target Date (within 2 working days)</th>
                  {/* Green header column: daily update */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual PO Release Date</th>
                  {/* Yellow header columns: Leather details */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Leather Name</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Colour</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300 text-right">Qty Required (sqft)</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-amber-500/10 text-amber-900 dark:text-amber-300">Tannery</th>
                  {/* Green header columns: daily update */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold text-right">Qty In Stock</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold text-right">Qty Ordered (sqft)</th>
                  {/* Orange header columns: user can update once, only Admin can change */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 dark:text-orange-200 font-bold">PO Delivery Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-orange-500/20 text-orange-950 dark:text-orange-200 font-bold">Planned Delivery Date</th>
                  {/* Green header columns: daily update */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold text-right">Qty Received (sqft)</th>
                  {/* Auto calculated column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold text-right">Due Qty (sqft)</th>
                  {/* Green header column: daily update */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Actual Receipt Date for Complete Order</th>
                  {/* Auto status column */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (On-time / Delayed)</th>
                  {/* Green header column: editable daily */}
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap min-w-[160px] bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold">Remarks</th>
                </>
              ) : (
                <>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('date')}
                    className="px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th 
                    scope="col" 
                    onClick={() => handleSort('buyerCode')}
                    className="px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span>Buyer</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {module !== 'new-leather' && (
                    <th 
                      scope="col" 
                      onClick={() => handleSort('woNo')}
                      className="px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer select-none hover:text-brand-600 dark:hover:text-brand-400 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        <span>WO No.</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  )}

                  {module === 'new-leather' && (
                    <>
                      <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Leather Name</th>
                      <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Colour</th>
                      <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap text-right">Quantity</th>
                      <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Tannery</th>
                    </>
                  )}

                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap">Target Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-bold border-l-2 border-emerald-500">Actual Receipt Date</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap font-bold">Status (Auto)</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 sm:py-3.5 whitespace-nowrap min-w-[160px] bg-amber-500/10">Remarks</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {sortedItems.map((item, idx) => {
              const daysInfo = getDaysDiffText(item.targetReceiptDate, item.actualReceiptDate);
              const remarkCount = item.remarkHistory ? item.remarkHistory.length : 0;
              const latestRemark = item.remarks || (remarkCount > 0 ? item.remarkHistory[remarkCount - 1].text : '—');

              if (module === 'material' || module === 'packaging') {
                const mat = item as any;
                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Sticky Action Column */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 dark:bg-slate-900 dark:group-hover:bg-slate-800/50 px-3 sm:px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {!isHistory && (
                          <button
                            type="button"
                            onClick={() => onUpdate(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-300 transition-colors shadow-soft-sm"
                            title="Update Tracking Parameters"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Update</span>
                          </button>
                        )}



                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* 1. Work Order No. (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 dark:text-brand-400 bg-amber-500/5">
                      {mat.woNo || '—'}
                    </td>

                    {/* 2. Buyer Code (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium bg-amber-500/5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs">
                        {mat.buyerCode || '—'}
                      </span>
                    </td>

                    {/* 3. Work Order Date (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                      {formatDate(mat.woDate || mat.date)}
                    </td>

                    {/* 4. Work Order & Indent Receipt Date (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                      {formatDate(mat.indentReceiptDate)}
                    </td>

                    {/* 5. Work Order Shipment Date (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                      {formatDate(mat.shipmentDate)}
                    </td>

                    {/* 6. Target Stock Check Date (Auto +3d / +7d) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(mat.targetStockCheckDate)}
                    </td>

                    {/* 7. Actual Stock Update Date (Green column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 dark:bg-emerald-950/20">
                      {formatDate(mat.actualStockUpdateDate)}
                    </td>

                    {/* 8. PO Release Target Date (Auto +2d) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(mat.poReleaseTargetDate)}
                    </td>

                    {/* 9. Actual PO Release Date (Green column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 dark:bg-emerald-950/20">
                      {formatDate(mat.actualPoReleaseDate)}
                    </td>

                    {/* 10. Expected Material Receipt Date (Orange column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-orange-700 dark:text-orange-400 font-medium bg-orange-500/10 dark:bg-orange-950/20">
                      {formatDate(mat.expectedMaterialReceiptDate || mat.targetReceiptDate)}
                    </td>

                    {/* 11. Actual Material Receipt Date (Green column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/30 border-l-2 border-emerald-500">
                      {formatDate(mat.actualReceiptDate) || '—'}
                    </td>

                    {/* 12. Status (On-time / Delayed) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={mat.status} size="sm" />
                    </td>

                    {/* 13. Remarks (Yellow column / Editable) */}
                    <td className="px-3 sm:px-4 py-3 text-xs text-slate-700 dark:text-slate-200 max-w-[220px] truncate bg-amber-500/5" title={latestRemark}>
                      {latestRemark}
                    </td>
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
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group text-xs sm:text-sm"
                  >
                    {/* Sticky Action Column */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/80 dark:bg-slate-900 dark:group-hover:bg-slate-800/50 px-3 sm:px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        {!isHistory && (
                          <button
                            type="button"
                            onClick={() => onUpdate(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-300 transition-colors shadow-soft-sm"
                            title="Update Tracking Parameters"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Update</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* 1. Work Order No. (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-brand-600 dark:text-brand-400 bg-amber-500/5">
                      {dl.woNo || '—'}
                    </td>

                    {/* 2. Buyer Code (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium bg-amber-500/5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs">
                        {dl.buyerCode || '—'}
                      </span>
                    </td>

                    {/* 3. Work Order Date (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                      {formatDate(dl.woDate || dl.date)}
                    </td>

                    {/* 4. Work Order & Indent Receipt Date (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                      {formatDate(dl.indentReceiptDate)}
                    </td>

                    {/* 5. Work Order Shipment Date (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 bg-amber-500/5">
                      {formatDate(dl.shipmentDate)}
                    </td>

                    {/* 6. PO Release Target Date (Auto +2d) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                      {formatDate(dl.poReleaseTargetDate)}
                    </td>

                    {/* 7. Actual PO Release Date (Green column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 dark:bg-emerald-950/20">
                      {formatDate(dl.actualPoReleaseDate)}
                    </td>

                    {/* 8. Leather Name (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-white bg-amber-500/5">
                      {dl.leatherName || '—'}
                    </td>

                    {/* 9. Colour (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 bg-amber-500/5">
                      {dl.colour || '—'}
                    </td>

                    {/* 10. Qty Required (sqft) (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white bg-amber-500/5">
                      {qtyReq.toLocaleString()}
                    </td>

                    {/* 11. Tannery (Yellow background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 bg-amber-500/5">
                      {dl.tannery || '—'}
                    </td>

                    {/* 12. Qty In Stock (Green background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/20">
                      {dl.qtyInStock !== undefined && dl.qtyInStock !== null ? dl.qtyInStock.toLocaleString() : '0'}
                    </td>

                    {/* 13. Qty Ordered (sqft) (Green background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/20">
                      {dl.qtyOrdered !== undefined && dl.qtyOrdered !== null ? dl.qtyOrdered.toLocaleString() : qtyReq.toLocaleString()}
                    </td>

                    {/* 14. PO Delivery Date (Orange background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-orange-700 dark:text-orange-300 bg-orange-500/10 dark:bg-orange-950/20">
                      {formatDate(dl.poDeliveryDate)}
                    </td>

                    {/* 15. Planned Delivery Date (Orange background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-medium text-orange-700 dark:text-orange-300 bg-orange-500/10 dark:bg-orange-950/20">
                      {formatDate(dl.plannedDeliveryDate || dl.targetReceiptDate)}
                    </td>

                    {/* 16. Qty Received (sqft) (Green background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/20">
                      {qtyRec > 0 ? qtyRec.toLocaleString() : '—'}
                    </td>

                    {/* 17. Due Qty (sqft) (Auto calculation) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {qtyRec >= qtyReq ? 'No Due' : dueQty.toLocaleString()}
                    </td>

                    {/* 18. Actual Receipt Date for Complete Order (Green background column) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 dark:bg-emerald-950/20 border-l-2 border-emerald-500">
                      {formatDate(dl.actualReceiptDate)}
                    </td>

                    {/* 19. Status (On-time / Delayed) */}
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={dl.status} size="sm" />
                    </td>

                    {/* 20. Remarks (Green background column / Editable daily) */}
                    <td className="px-3 sm:px-4 py-3 text-xs text-slate-700 dark:text-slate-200 max-w-[220px] truncate bg-emerald-500/10 dark:bg-emerald-950/20" title={latestRemark}>
                      {latestRemark}
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary */}
      <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{sortedItems.length}</span> {isHistory ? 'history' : 'pending'} entries
        </div>
        <div className="text-[11px] text-slate-400">
          * Click on column headers to sort ascending/descending
        </div>
      </div>
    </div>
  );
};

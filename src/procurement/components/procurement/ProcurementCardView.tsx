import React from 'react';
import {
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  MessageSquare,
  Box,
  Building2,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { AnyProcurementItem, ModuleType, DailyLeatherItem } from '../../types/procurement';
import { formatDate } from '../../../pages/production/productionService';
import { calculateTatStatus, fetchTatConfigs, getTatDays } from '../../../utils/tatUtils';

interface ProcurementCardViewProps {
  module: ModuleType;
  items: AnyProcurementItem[];
  isHistory?: boolean;
  canWrite?: boolean;
  visibleColumns?: Record<string, boolean>;
  onUpdate: (item: AnyProcurementItem) => void;
  onViewRemarks: (item: AnyProcurementItem) => void;
  onDelete?: (item: AnyProcurementItem) => void;
}

export const ProcurementCardView: React.FC<ProcurementCardViewProps> = ({
  module,
  items,
  isHistory = false,
  canWrite = true,
  visibleColumns,
  onUpdate,
  onViewRemarks,
  onDelete
}) => {
  const [tatConfigs, setTatConfigs] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchTatConfigs().then(setTatConfigs);
  }, []);

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

  const isColVisible = (colId: string) => {
    if (!visibleColumns) return true;
    return visibleColumns[colId] !== false;
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
        <Box className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-600">No procurement records found</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const dl = item as DailyLeatherItem;
        const isReceived = Boolean(item.actualReceiptDate);
        const remarkCount = item.remarkHistory?.length || 0;
        const subCount = (dl as any).items?.length || 1;

        // Check which sections have at least one visible item
        const showHeaderWoNo = isColVisible('woNo');
        const showHeaderBuyer = isColVisible('buyerCode') && Boolean(item.buyerCode);
        const showHeaderDate = (isColVisible('woDate') || isColVisible('date')) && Boolean(item.woDate || item.date);
        const showHeaderStatus = isColVisible('status');
        const showHeader = showHeaderWoNo || showHeaderBuyer || showHeaderDate || showHeaderStatus;

        const showItemName = isColVisible('leatherName');
        const showColour = isColVisible('colour') && Boolean((item as any).colour || (item as any).specification);
        const showTannery = isColVisible('tannery') && Boolean((item as any).tannery || (item as any).supplier);

        // Quantities grid
        const qtyReq = (item as any).quantity;
        const qtyInStock = (item as any).qtyInStock;
        const qtyOrdered = (item as any).qtyOrdered;
        const qtyRec = (item as any).qtyReceived || 0;
        const dueQty = (qtyReq !== undefined && qtyReq !== null && qtyReq !== '')
          ? Math.max(0, Number(qtyReq) - Number(qtyRec))
          : 0;

        const showQtyReq = isColVisible('quantity') && qtyReq !== undefined && qtyReq !== null && qtyReq !== '';
        const showQtyInStock = isColVisible('qtyInStock') && qtyInStock !== undefined && qtyInStock !== null;
        const showQtyOrdered = isColVisible('qtyOrdered') && (qtyOrdered !== undefined || qtyReq !== undefined);
        const showQtyRec = isColVisible('qtyReceived') && (qtyRec > 0 || module === 'daily-leather');
        const showDueQty = isColVisible('dueQty') && module === 'daily-leather';

        const showQuantitiesGrid = showQtyReq || showQtyInStock || showQtyOrdered || showQtyRec || showDueQty;

        // Dates
        const showIndentDate = isColVisible('indentReceiptDate') && Boolean((item as any).indentReceiptDate);
        const showShipmentDate = isColVisible('shipmentDate') && Boolean(item.shipmentDate);
        const showTargetStock = isColVisible('targetStockCheckDate') && Boolean((item as any).targetStockCheckDate);
        const showActualStock = isColVisible('actualStockUpdateDate') && Boolean((item as any).actualStockUpdateDate);
        const showPoReleaseTarget = isColVisible('poReleaseTargetDate') && Boolean((item as any).poReleaseTargetDate);
        const showActualPoRelease = isColVisible('actualPoReleaseDate') && Boolean((item as any).actualPoReleaseDate);
        const showPoDeliveryDate = isColVisible('poDeliveryDate') && Boolean((item as any).poDeliveryDate);
        const showPlannedDelivery = (isColVisible('plannedDeliveryDate') || isColVisible('plannedMaterialReceiptDate')) &&
          Boolean((item as any).plannedDeliveryDate || (item as any).expectedMaterialReceiptDate || (item as any).targetReceiptDate);
        const showTargetReceipt = isColVisible('targetReceiptDate') && Boolean((item as any).targetReceiptDate) && module === 'new-leather';
        const showActualReceipt = isColVisible('actualReceiptDate') && Boolean(item.actualReceiptDate);

        const showMilestoneDates = showIndentDate || showShipmentDate || showTargetStock || showActualStock ||
          showPoReleaseTarget || showActualPoRelease || showPoDeliveryDate || showPlannedDelivery ||
          showTargetReceipt || showActualReceipt;

        // TAT
        const showTatPlanned = isColVisible('tatPlanned');
        const showTatDelay = isColVisible('tatDelay');
        const showTat = showTatPlanned || showTatDelay;

        const startDate = item.woDate || (item as any).indentReceiptDate || item.date || (item as any).createdAt;
        const tatStatus = calculateTatStatus({
          tatDays: currentTatDays,
          startDate,
          endDate: item.actualReceiptDate,
          isCompleted: Boolean(item.actualReceiptDate),
        });

        // History specifics
        const showHistoryDate = isHistory && isColVisible('historyDate') && Boolean((item as any).updatedAt || item.date);
        const showHistoryAuthor = isHistory && isColVisible('historyAuthor');

        // Footer
        const showRemarks = isColVisible('remarks');
        const showAction = isColVisible('action') && !isHistory;
        const showFooter = showRemarks || showAction;

        return (
          <div
            key={item.id}
            onClick={() => onUpdate(item)}
            className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all p-4 flex flex-col justify-between cursor-pointer relative overflow-hidden"
          >
            {/* Top Accent Strip */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                isReceived ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />

            <div className="space-y-2.5">
              {/* Header: W/O No, Buyer Badge, Status Badge */}
              {showHeader && (
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {showHeaderWoNo && (
                        <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                          {item.woNo || item.id}
                        </span>
                      )}
                      {showHeaderBuyer && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80 font-mono">
                          {item.buyerCode}
                        </span>
                      )}
                    </div>
                    {showHeaderDate && (
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        {module === 'new-leather' ? 'Date: ' : 'WO Date: '}
                        {formatDate(item.woDate || item.date)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {showHeaderStatus && (
                      isReceived ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Received</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      )
                    )}
                    {subCount > 1 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        {subCount} items
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* History Row: Date & Author */}
              {(showHistoryDate || showHistoryAuthor) && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                  {showHistoryDate && (
                    <span>Updated: {formatDate((item as any).updatedAt || item.date)}</span>
                  )}
                  {showHistoryAuthor && (
                    <span className="font-semibold text-slate-700">By: System User</span>
                  )}
                </div>
              )}

              {/* Main Info */}
              {(showItemName || showColour || showTannery) && (
                <div className="space-y-1.5 text-xs">
                  {showItemName && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        {module === 'daily-leather' || module === 'new-leather' ? 'Leather Item' : 'Material Requirement'}
                      </span>
                      <div className="font-bold text-slate-800 text-sm mt-0.5 line-clamp-1">
                        {(item as any).leatherName || (item as any).materialName || (item as any).packagingType || '—'}
                      </div>
                    </div>
                  )}

                  {showColour && (
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Color / Spec: {(item as any).colour || (item as any).specification}
                    </span>
                  )}

                  {showTannery && (
                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-semibold truncate">
                        {(item as any).tannery || (item as any).supplier}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantities Grid */}
              {showQuantitiesGrid && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl text-center">
                  {showQtyReq && (
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Req</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {Number(qtyReq).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {showQtyInStock && (
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">In Stock</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {Number(qtyInStock).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {showQtyOrdered && (
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Ordered</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {Number(qtyOrdered !== undefined ? qtyOrdered : qtyReq || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {showQtyRec && (
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Received</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {Number(qtyRec).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {showDueQty && (
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Due</span>
                      <span className="font-mono font-bold text-rose-700 text-xs">
                        {dueQty > 0 ? dueQty.toLocaleString() : '0'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Key Milestone Dates */}
              {showMilestoneDates && (
                <div className="space-y-1 pt-1 text-[11px] border-t border-slate-100">
                  {showIndentDate && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Indent Receipt:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatDate((item as any).indentReceiptDate)}
                      </span>
                    </div>
                  )}
                  {showTargetStock && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Target Stock Check:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatDate((item as any).targetStockCheckDate)}
                      </span>
                    </div>
                  )}
                  {showActualStock && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Actual Stock Update:</span>
                      <span className="font-semibold text-emerald-700 font-mono">
                        {formatDate((item as any).actualStockUpdateDate)}
                      </span>
                    </div>
                  )}
                  {showPoReleaseTarget && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>PO Release Target:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatDate((item as any).poReleaseTargetDate)}
                      </span>
                    </div>
                  )}
                  {showActualPoRelease && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Actual PO Release:</span>
                      <span className="font-semibold text-emerald-700 font-mono">
                        {formatDate((item as any).actualPoReleaseDate)}
                      </span>
                    </div>
                  )}
                  {showPoDeliveryDate && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>PO Delivery Date:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatDate((item as any).poDeliveryDate)}
                      </span>
                    </div>
                  )}
                  {showPlannedDelivery && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Planned Receipt Date:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatDate((item as any).plannedDeliveryDate || (item as any).expectedMaterialReceiptDate || (item as any).targetReceiptDate)}
                      </span>
                    </div>
                  )}
                  {showTargetReceipt && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Target Date:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatDate((item as any).targetReceiptDate)}
                      </span>
                    </div>
                  )}
                  {showActualReceipt && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Actual Receipt Date:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {formatDate(item.actualReceiptDate)}
                      </span>
                    </div>
                  )}
                  {showShipmentDate && (
                    <div className="flex items-center justify-between text-slate-500 bg-amber-50/60 px-1.5 py-0.5 rounded">
                      <span className="font-medium text-amber-900">Shipment Target:</span>
                      <span className="font-bold text-amber-950 font-mono">
                        {formatDate(item.shipmentDate)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAT Section */}
              {showTat && (
                <div className="flex items-center justify-between text-[11px] bg-indigo-50/60 px-2 py-1 rounded-lg">
                  {showTatPlanned && (
                    <span className="text-indigo-900 font-medium">
                      TAT Target: {currentTatDays} Days
                    </span>
                  )}
                  {showTatDelay && (
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      tatStatus.isDelayed
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {tatStatus.isDelayed ? `Delayed (${tatStatus.delayDays}d)` : 'On-Time'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            {showFooter && (
              <div className="pt-2.5 flex items-center justify-between gap-2 mt-3 border-t border-slate-100">
                {showRemarks ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewRemarks(item);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{remarkCount} Remarks</span>
                  </button>
                ) : (
                  <div />
                )}

                {showAction && (
                  <div className="flex items-center gap-1.5">
                    {canWrite && onDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                        title="Delete Record"
                        className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate(item);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-black hover:bg-slate-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{canWrite ? 'Update' : 'View'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

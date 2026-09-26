import React from 'react';
import {
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  AlertCircle,
  Truck,
  Box,
  Building2,
  ArrowRight
} from 'lucide-react';
import { AnyProcurementItem, ModuleType, DailyLeatherItem } from '../../types/procurement';
import { formatDate } from '../../../pages/production/productionService';

interface ProcurementCardViewProps {
  module: ModuleType;
  items: AnyProcurementItem[];
  isHistory?: boolean;
  canWrite?: boolean;
  onUpdate: (item: AnyProcurementItem) => void;
  onViewRemarks: (item: AnyProcurementItem) => void;
  onDelete?: (item: AnyProcurementItem) => void;
}

export const ProcurementCardView: React.FC<ProcurementCardViewProps> = ({
  module,
  items,
  isHistory = false,
  canWrite = true,
  onUpdate,
  onViewRemarks,
  onDelete
}) => {
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

            <div>
              {/* Header: W/O No, Buyer Badge, Status Badge */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                      {item.woNo || item.id}
                    </span>
                    {item.buyerCode && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80 font-mono">
                        {item.buyerCode}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                    WO Date: {formatDate(item.woDate || item.date)}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {isReceived ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Received</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Pending</span>
                    </span>
                  )}
                  {subCount > 1 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      {subCount} items
                    </span>
                  )}
                </div>
              </div>

              {/* Main Info */}
              <div className="py-2.5 space-y-2 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    {module === 'daily-leather' ? 'Leather Item' : 'Material Requirement'}
                  </span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5 line-clamp-1">
                    {(item as any).leatherName || (item as any).materialName || (item as any).packagingType || '—'}
                  </div>
                  {((item as any).colour || (item as any).specification) && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Color / Spec: {(item as any).colour || (item as any).specification}
                    </span>
                  )}
                </div>

                {((item as any).tannery || (item as any).supplier) && (
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold truncate">
                      {(item as any).tannery || (item as any).supplier}
                    </span>
                  </div>
                )}

                {/* Quantities Grid */}
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl text-center">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">Req</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {(item as any).quantity !== undefined && (item as any).quantity !== null && (item as any).quantity !== ''
                        ? Number((item as any).quantity).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">Ordered</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {Number((item as any).qtyOrdered || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">Received</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {Number((item as any).qtyReceived || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Key Milestone Dates */}
                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>PO Delivery Date:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatDate((item as any).poDeliveryDate || '—')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Planned Receipt Date:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatDate((item as any).plannedDeliveryDate || (item as any).targetReceiptDate || '—')}
                    </span>
                  </div>
                  {/* Shipment Date (Read-only, always sourced live from Work Order Creation) */}
                  <div className="flex items-center justify-between text-slate-500 bg-amber-50/60 px-1.5 py-0.5 rounded">
                    <span className="font-medium text-amber-900">Shipment Target:</span>
                    <span className="font-bold text-amber-950 font-mono">
                      {formatDate(item.shipmentDate || '—')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-2.5 flex items-center justify-between gap-2 mt-auto">
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
                  <span>Update</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Layers,
  MessageSquare,
  FileSpreadsheet,
  Edit2,
  Sliders,
  Eye,
  Check
} from 'lucide-react';
import { formatDate } from '../../pages/production/productionService';

export default function ProductionCardView({
  plans = [],
  onAction = null,
  actionLabel = '',
  actionIcon = null,
  emptyMessage = 'No production orders found',
  onCardClick = null,
  showStages = true,
}) {
  const navigate = useNavigate();

  if (!plans || plans.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
        <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-600">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your search keywords or filters.</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((p) => {
        // Calculate delay badge
        let isDelayed = false;
        let delayText = 'On Track';
        let isCompleted = Boolean(p.isHistory);

        const despatchDate = p.woDespatchDate ? new Date(p.woDespatchDate) : null;
        if (despatchDate && !isNaN(despatchDate.getTime())) {
          despatchDate.setHours(0, 0, 0, 0);
          if (!isCompleted && today > despatchDate) {
            const diffDays = Math.max(1, Math.round((today.getTime() - despatchDate.getTime()) / (1000 * 60 * 60 * 24)));
            isDelayed = true;
            delayText = `${diffDays}d delay`;
          }
        }

        // Check stages delay if not overall delayed
        if (!isDelayed && !isCompleted && Array.isArray(p.stages)) {
          for (const s of p.stages) {
            if (s.plannedDate) {
              const pDate = new Date(s.plannedDate);
              pDate.setHours(0, 0, 0, 0);
              if (s.actualDate) {
                const aDate = new Date(s.actualDate);
                aDate.setHours(0, 0, 0, 0);
                if (aDate > pDate) {
                  const d = Math.round((aDate.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
                  if (d > 0) {
                    isDelayed = true;
                    delayText = `${d}d delay`;
                    break;
                  }
                }
              } else if (today > pDate) {
                const d = Math.round((today.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));
                if (d > 0) {
                  isDelayed = true;
                  delayText = `${d}d delay`;
                  break;
                }
              }
            }
          }
        }

        // Stages completed count
        const stagesList = p.stages || [];
        const completedStagesCount = stagesList.filter(s => Boolean(s.actualDate)).length;
        const totalStages = stagesList.length || 8;

        const handleDefaultClick = () => {
          if (onCardClick) {
            onCardClick(p);
          } else {
            navigate(`/dashboard/production/${p.id || p.woNo}`);
          }
        };

        return (
          <div
            key={p.id}
            onClick={handleDefaultClick}
            className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all p-4 flex flex-col justify-between cursor-pointer relative overflow-hidden"
          >
            {/* Top Accent Strip */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                isCompleted
                  ? 'bg-blue-500'
                  : isDelayed
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
            />

            <div>
              {/* Header: W/O No, Buyer Badge, Delay Badge */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                      {p.woNo || p.id}
                    </span>
                    {p.buyer && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80 font-mono">
                        {p.buyer}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                    WO Date: {formatDate(p.woDate || p.date)}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <span>Completed</span>
                    </span>
                  ) : isDelayed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                      <Clock className="w-3 h-3 text-rose-600" />
                      <span>{delayText}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>On Track</span>
                    </span>
                  )}

                  {p.approvalStatus && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      p.approvalStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.approvalStatus === 'pending_approval'
                        ? 'bg-amber-50 text-amber-700'
                        : p.approvalStatus === 'rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.approvalStatus.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantities & Dates Grid */}
              <div className="py-2.5 space-y-2 border-b border-slate-100 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl text-center">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">Quantity</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {p.qty !== undefined && p.qty !== null && p.qty !== ''
                        ? Number(p.qty).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">Milestones</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {completedStagesCount} / {totalStages}
                    </span>
                  </div>
                </div>

                {/* Key Milestone Dates */}
                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Plan Date:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {formatDate(p.planDate || '—')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 bg-amber-50/60 px-1.5 py-0.5 rounded">
                    <span className="font-medium text-amber-900">Shipment Target:</span>
                    <span className="font-bold text-amber-950 font-mono">
                      {formatDate(p.woDespatchDate || '—')}
                    </span>
                  </div>
                </div>

                {/* Remarks preview */}
                {p.remarks && String(p.remarks).trim() && (
                  <div className="pt-1 text-[11px] text-slate-600 line-clamp-1 italic">
                    <span className="font-semibold not-italic text-slate-400 mr-1">Remark:</span>
                    {p.remarks}
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-2.5 flex items-center justify-between gap-2 mt-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/dashboard/production/${p.id || p.woNo}`);
                }}
                className="text-[11px] text-brand-600 hover:text-brand-800 font-bold inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>

              {onAction && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(p);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-black hover:bg-slate-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  {actionIcon || <Edit2 className="w-3 h-3" />}
                  <span>{actionLabel || 'Action'}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

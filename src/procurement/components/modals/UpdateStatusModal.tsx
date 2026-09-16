import React, { useState, useEffect } from 'react';
import { Edit3, X, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import {
  ModuleType,
  AnyProcurementItem,
  NewLeatherItem,
  DailyLeatherItem,
  MaterialItem,
  PackagingItem
} from '../../types/procurement';
import { getTodayDateString, addDays } from '../../utils/dateUtils';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: ModuleType;
  item: AnyProcurementItem | null;
  onSave: (updates: any) => Promise<boolean>;
  canWrite?: boolean;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  module,
  item,
  onSave,
  canWrite = true
}) => {
  // Common / Base Fields
  const [date, setDate] = useState('');
  const [buyerCode, setBuyerCode] = useState('');
  const [woNo, setWoNo] = useState('');
  const [targetReceiptDate, setTargetReceiptDate] = useState('');
  const [actualReceiptDate, setActualReceiptDate] = useState('');
  const [newRemark, setNewRemark] = useState('');

  // Daily Leather Header Dates
  const [indentReceiptDate, setIndentReceiptDate] = useState('');
  const [shipmentDate, setShipmentDate] = useState('');

  // Leather Item Fields (New Leather & Daily Leather)
  const [leatherName, setLeatherName] = useState('');
  const [colour, setColour] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [tannery, setTannery] = useState('');

  // Daily Leather Tracking Parameters
  const [actualPoReleaseDate, setActualPoReleaseDate] = useState('');
  const [qtyInStock, setQtyInStock] = useState<number | ''>('');
  const [qtyOrdered, setQtyOrdered] = useState<number | ''>('');
  const [poDeliveryDate, setPoDeliveryDate] = useState('');
  const [plannedDeliveryDate, setPlannedDeliveryDate] = useState('');
  const [qtyReceived, setQtyReceived] = useState<number | ''>('');

  // Material / Packaging Specific Tracking Fields
  const [actualStockUpdateDate, setActualStockUpdateDate] = useState('');
  const [expectedMaterialReceiptDate, setExpectedMaterialReceiptDate] = useState('');

  const [materialName, setMaterialName] = useState('');
  const [materialSpec, setMaterialSpec] = useState('');
  const [supplier, setSupplier] = useState('');

  // Packaging Specific
  const [packagingType, setPackagingType] = useState('');
  const [packagingSpec, setPackagingSpec] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletionNotice, setShowCompletionNotice] = useState(false);

  const isAdmin = (localStorage.getItem('role') || '').toLowerCase() === 'admin';

  // Prefill all existing fields when modal opens or item changes
  useEffect(() => {
    if (item) {
      setDate(item.date || getTodayDateString());
      setBuyerCode(item.buyerCode || '');
      setTargetReceiptDate(item.targetReceiptDate || '');
      setActualReceiptDate(item.actualReceiptDate || '');
      setNewRemark('');
      setShowCompletionNotice(false);

      if (module === 'new-leather') {
        const nl = item as NewLeatherItem;
        setLeatherName(nl.leatherName || '');
        setColour(nl.colour || '');
        setQuantity(nl.quantity !== undefined ? nl.quantity : '');
        setTannery(nl.tannery || '');
      } else if (module === 'daily-leather') {
        const dl = item as DailyLeatherItem;
        setWoNo(dl.woNo || '');
        setIndentReceiptDate(dl.indentReceiptDate || '');
        setShipmentDate(dl.shipmentDate || '');
        setLeatherName(dl.leatherName || '');
        setColour(dl.colour || '');
        setQuantity(dl.quantity !== undefined ? dl.quantity : '');
        setTannery(dl.tannery || '');
        setActualPoReleaseDate(dl.actualPoReleaseDate || '');
        setQtyInStock(dl.qtyInStock !== undefined ? dl.qtyInStock : '');
        setQtyOrdered(dl.qtyOrdered !== undefined ? dl.qtyOrdered : dl.quantity || '');
        setPoDeliveryDate(dl.poDeliveryDate || '');
        setPlannedDeliveryDate(dl.plannedDeliveryDate || dl.targetReceiptDate || '');
        setQtyReceived('');
      } else if (module === 'material') {
        const mat = item as MaterialItem;
        setWoNo(mat.woNo || '');
        setIndentReceiptDate(mat.indentReceiptDate || '');
        setShipmentDate(mat.shipmentDate || '');
        setActualStockUpdateDate(mat.actualStockUpdateDate || '');
        setActualPoReleaseDate(mat.actualPoReleaseDate || '');
        setExpectedMaterialReceiptDate(mat.expectedMaterialReceiptDate || mat.targetReceiptDate || '');
        setMaterialName(mat.materialName || '');
        setMaterialSpec(mat.specification || '');
        setQuantity(mat.quantity !== undefined ? mat.quantity : '');
        setSupplier(mat.supplier || '');
      } else if (module === 'packaging') {
        const pkg = item as PackagingItem;
        setWoNo(pkg.woNo || '');
        setIndentReceiptDate(pkg.indentReceiptDate || '');
        setShipmentDate(pkg.shipmentDate || '');
        setActualStockUpdateDate(pkg.actualStockUpdateDate || '');
        setActualPoReleaseDate(pkg.actualPoReleaseDate || '');
        setExpectedMaterialReceiptDate(pkg.expectedMaterialReceiptDate || pkg.targetReceiptDate || '');
        setPackagingType(pkg.packagingType || '');
        setPackagingSpec(pkg.specification || '');
        setQuantity(pkg.quantity !== undefined ? pkg.quantity : '');
        setSupplier(pkg.supplier || '');
      }
    }
  }, [item, module]);

  // Check completion notice
  useEffect(() => {
    if (item && !item.actualReceiptDate && actualReceiptDate) {
      setShowCompletionNotice(true);
    } else {
      setShowCompletionNotice(false);
    }
  }, [actualReceiptDate, item]);

  // ESC key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updates: any = {
      date,
      buyerCode: buyerCode.trim().toUpperCase(),
      targetReceiptDate: module === 'daily-leather' ? (plannedDeliveryDate || poDeliveryDate || targetReceiptDate) : (expectedMaterialReceiptDate || targetReceiptDate),
      actualReceiptDate: actualReceiptDate || undefined,
      newRemark: newRemark.trim() || undefined
    };

    if (module === 'new-leather') {
      updates.leatherName = leatherName.trim();
      updates.colour = colour.trim();
      updates.quantity = quantity !== '' ? Number(quantity) : 0;
      updates.tannery = tannery.trim();
    } else if (module === 'daily-leather') {
      updates.woNo = woNo.trim().toUpperCase();
      updates.woDate = date;
      updates.indentReceiptDate = indentReceiptDate || undefined;
      updates.shipmentDate = shipmentDate || undefined;
      updates.leatherName = leatherName.trim();
      updates.colour = colour.trim();
      updates.quantity = quantity !== '' ? Number(quantity) : 0;
      updates.tannery = tannery.trim();
      updates.actualPoReleaseDate = actualPoReleaseDate || undefined;
      updates.qtyInStock = qtyInStock !== '' ? Number(qtyInStock) : undefined;
      updates.qtyOrdered = qtyOrdered !== '' ? Number(qtyOrdered) : undefined;
      updates.poDeliveryDate = poDeliveryDate || undefined;
      if (!(item as any)?.poDeliveryDateLocked && !isAdmin && poDeliveryDate) {
        updates.poDeliveryDateLocked = true;
      }
      updates.plannedDeliveryDate = plannedDeliveryDate || undefined;
      if (!(item as any)?.plannedDeliveryDateLocked && !isAdmin && plannedDeliveryDate) {
        updates.plannedDeliveryDateLocked = true;
      }
      updates.incrementalQtyReceived = qtyReceived !== '' ? Number(qtyReceived) : undefined;
    } else if (module === 'material') {
      updates.woNo = woNo.trim().toUpperCase();
      updates.woDate = date;
      updates.indentReceiptDate = indentReceiptDate || undefined;
      updates.shipmentDate = shipmentDate || undefined;
      updates.actualStockUpdateDate = actualStockUpdateDate || undefined;
      updates.actualPoReleaseDate = actualPoReleaseDate || undefined;
      updates.expectedMaterialReceiptDate = expectedMaterialReceiptDate || undefined;
      updates.materialName = materialName.trim();
      updates.specification = materialSpec.trim();
      updates.quantity = quantity !== '' ? Number(quantity) : 0;
      updates.supplier = supplier.trim();
      if (!(item as any)?.updateSectionLocked && !isAdmin && (actualStockUpdateDate || actualPoReleaseDate || expectedMaterialReceiptDate || actualReceiptDate)) {
        updates.updateSectionLocked = true;
      }
    } else if (module === 'packaging') {
      updates.woNo = woNo.trim().toUpperCase();
      updates.woDate = date;
      updates.indentReceiptDate = indentReceiptDate || undefined;
      updates.shipmentDate = shipmentDate || undefined;
      updates.actualStockUpdateDate = actualStockUpdateDate || undefined;
      updates.actualPoReleaseDate = actualPoReleaseDate || undefined;
      updates.expectedMaterialReceiptDate = expectedMaterialReceiptDate || undefined;
      updates.packagingType = packagingType.trim();
      updates.specification = packagingSpec.trim();
      updates.quantity = quantity !== '' ? Number(quantity) : 0;
      updates.supplier = supplier.trim();
      if (!(item as any)?.updateSectionLocked && !isAdmin && (actualStockUpdateDate || actualPoReleaseDate || expectedMaterialReceiptDate || actualReceiptDate)) {
        updates.updateSectionLocked = true;
      }
    }

    const success = await onSave(updates);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const setReceivedToday = () => {
    setActualReceiptDate(getTodayDateString());
  };

  const baseIndentDate = indentReceiptDate || date || (item as any)?.indentReceiptDate || (item as any)?.woDate || (item as any)?.date || getTodayDateString();
  const autoStockCheckDays = module === 'packaging' ? 7 : 3;
  const autoStockCheckDate = addDays(baseIndentDate, autoStockCheckDays);
  const autoPoReleaseDate = addDays(autoStockCheckDate, 2);

  const getLiveStatus = () => {
    let target = targetReceiptDate;
    if (module === 'material' || module === 'packaging') {
      target = expectedMaterialReceiptDate || targetReceiptDate || (item as any)?.expectedMaterialReceiptDate || (item as any)?.targetStockCheckDate || '';
    } else if (module === 'daily-leather') {
      target = plannedDeliveryDate || poDeliveryDate || targetReceiptDate || '';
    }

    if (!target) {
      return { 
        status: 'pending', 
        label: 'Pending', 
        detail: 'Enter target or expected date to calculate status', 
        isDelay: false, 
        delayDays: 0 
      };
    }

    const targetTime = new Date(target).getTime();
    const effectiveDate = actualReceiptDate && actualReceiptDate.trim() !== '' ? actualReceiptDate : getTodayDateString();
    const effectiveTime = new Date(effectiveDate).getTime();
    const diffDays = Math.round((effectiveTime - targetTime) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        status: 'delayed',
        label: 'Delayed',
        detail: actualReceiptDate 
          ? `Delivered ${diffDays} day${diffDays > 1 ? 's' : ''} past target date (${target})` 
          : `${diffDays} day${diffDays > 1 ? 's' : ''} overdue against target date (${target})`,
        isDelay: true,
        delayDays: diffDays
      };
    } else if (diffDays === 0) {
      return {
        status: 'on-time',
        label: 'On-Time',
        detail: actualReceiptDate ? 'Delivered on target date' : 'Due today',
        isDelay: false,
        delayDays: 0
      };
    } else {
      const daysAhead = Math.abs(diffDays);
      return {
        status: 'on-time',
        label: 'On-Time',
        detail: actualReceiptDate ? `Received ${daysAhead} day${daysAhead > 1 ? 's' : ''} early` : `${daysAhead} day${daysAhead > 1 ? 's' : ''} remaining until target date`,
        isDelay: false,
        delayDays: 0
      };
    }
  };

  const liveStatus = getLiveStatus();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-[95%] sm:w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {canWrite ? `Update Entry #${item.id}` : `View Entry #${item.id}`}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 font-mono text-xs font-semibold">
                  {(item as any).woNo || item.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {canWrite ? 'Prefilled with existing order details. Modify any parameters and save changes.' : 'Viewing existing order details and parameters (read-only mode).'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <fieldset disabled={!canWrite} className="space-y-4">
          
          {/* Module 1: New Leather Development */}
          {module === 'new-leather' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Leather Order Parameters (Editable)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Buyer Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerCode}
                      onChange={(e) => setBuyerCode(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Leather Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={leatherName}
                      onChange={(e) => setLeatherName(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Colour <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={colour}
                      onChange={(e) => setColour(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantity (sqft) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tannery <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tannery}
                      onChange={(e) => setTannery(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Delivery Dates */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-brand-900 uppercase tracking-wider block">
                  Delivery Tracking Dates
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Receipt Date
                    </label>
                    <input
                      type="date"
                      value={targetReceiptDate}
                      onChange={(e) => setTargetReceiptDate(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Actual Receipt Date
                      </label>
                      <button
                        type="button"
                        onClick={setReceivedToday}
                        className="text-xs text-brand-600 hover:underline font-semibold"
                      >
                        Set Today
                      </button>
                    </div>
                    <input
                      type="date"
                      value={actualReceiptDate}
                      onChange={(e) => setActualReceiptDate(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {showCompletionNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <span className="font-semibold">Move to History:</span> Saving with an Actual Receipt Date will mark this item as <strong>Completed</strong> and move it to Received History.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Module 2: Daily Leather Procurement */}
          {module === 'daily-leather' && (
            <div className="space-y-4">
              {/* Read-Only Header Parameters */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Work Order Header Parameters (Read-Only)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-600">
                    Read-Only Reference
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Work Order No.
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={woNo}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Buyer Code
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={buyerCode}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Work Order Date
                    </label>
                    <input
                      type="date"
                      disabled
                      readOnly
                      value={date}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Work Order & Indent Receipt Date
                    </label>
                    <input
                      type="date"
                      disabled
                      readOnly
                      value={indentReceiptDate}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Work Order Shipment Date
                    </label>
                    <input
                      type="date"
                      disabled
                      readOnly
                      value={shipmentDate}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              {/* Read-Only Item Specs Parameters */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Leather Item Parameters (Read-Only)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Leather Name
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={leatherName}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Colour
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={colour}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Qty Required (sqft)
                    </label>
                    <input
                      type="number"
                      disabled
                      readOnly
                      value={quantity}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Tannery
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={tannery}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              {/* 8 Editable Tracking & Delivery Parameters */}
              <div className="p-3.5 rounded-xl border border-brand-200 bg-brand-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900 uppercase tracking-wider block">
                    Tracking & Delivery Parameters (Editable)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-100 text-brand-700">
                    Editable Inputs
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Actual PO Release Date
                    </label>
                    <input
                      type="date"
                      value={actualPoReleaseDate}
                      onChange={(e) => setActualPoReleaseDate(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qty In Stock (sqft)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 500"
                      value={qtyInStock}
                      onChange={(e) => setQtyInStock(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qty Ordered (sqft)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 3000"
                      value={qtyOrdered}
                      onChange={(e) => setQtyOrdered(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {(() => {
                    const poDeliveryLocked = !isAdmin && Boolean((item as any)?.poDeliveryDateLocked);
                    const plannedDeliveryLocked = !isAdmin && Boolean((item as any)?.plannedDeliveryDateLocked);
                    return (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            PO Delivery Date
                          </label>
                          <input
                            type="date"
                            disabled={poDeliveryLocked}
                            value={poDeliveryDate}
                            onChange={(e) => setPoDeliveryDate(e.target.value)}
                            className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                              poDeliveryLocked
                                ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed'
                                : 'border-slate-300 bg-white text-slate-900'
                            }`}
                          />
                          {poDeliveryLocked && (
                            <p className="text-[11px] text-amber-600 font-medium mt-1">
                              Locked after first update — contact an admin to change this.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Planned Delivery Date
                          </label>
                          <input
                            type="date"
                            disabled={plannedDeliveryLocked}
                            value={plannedDeliveryDate}
                            onChange={(e) => setPlannedDeliveryDate(e.target.value)}
                            className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                              plannedDeliveryLocked
                                ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed'
                                : 'border-slate-300 bg-white text-slate-900'
                            }`}
                          />
                          {plannedDeliveryLocked && (
                            <p className="text-[11px] text-amber-600 font-medium mt-1">
                              Locked after first update — contact an admin to change this.
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        New Qty Received (add to total)
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Already received: <strong className="text-slate-900 font-bold">{Number((item as any)?.qtyReceived || 0).toLocaleString()}</strong> / {Number((item as any)?.quantity || (item as any)?.qtyOrdered || 0).toLocaleString()} sqft
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 200 (sqft just arrived)"
                      value={qtyReceived}
                      onChange={(e) => setQtyReceived(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    {qtyReceived !== '' && Number(qtyReceived) > 0 && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        New Total will be: {(Number((item as any)?.qtyReceived || 0) + Number(qtyReceived)).toLocaleString()} / {Number((item as any)?.quantity || (item as any)?.qtyOrdered || 0).toLocaleString()} sqft (Remaining: {Math.max(0, Number((item as any)?.quantity || (item as any)?.qtyOrdered || 0) - (Number((item as any)?.qtyReceived || 0) + Number(qtyReceived))).toLocaleString()} sqft)
                      </p>
                    )}
                  </div>
                </div>

                {/* Actual Receipt Date for Complete Order */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                      Actual Receipt Date for Complete Order
                    </label>
                    <button
                      type="button"
                      onClick={setReceivedToday}
                      className="text-xs text-brand-600 hover:underline font-semibold"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={actualReceiptDate}
                    onChange={(e) => setActualReceiptDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />

                  {showCompletionNotice && (
                    <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                      <div>
                        <span className="font-semibold">Move to History:</span> Filling this date will mark this leather item as <strong>Completed</strong> and move it to Received History.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Module 3 & 4: Material & Packaging Procurement */}
          {(module === 'material' || module === 'packaging') && (
            <div className="space-y-4">
              {/* Read-Only Parameters Section */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Creation Parameters (Read-Only)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-600">
                    Read-Only Reference
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Work Order No.
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={woNo}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Buyer Code
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={buyerCode}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Work Order Date
                    </label>
                    <input
                      type="date"
                      disabled
                      readOnly
                      value={date}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Work Order & Indent Receipt Date
                    </label>
                    <input
                      type="date"
                      disabled
                      readOnly
                      value={indentReceiptDate}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Work Order Shipment Date
                    </label>
                    <input
                      type="date"
                      disabled
                      readOnly
                      value={shipmentDate}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Target Stock Check Date (Auto +{module === 'packaging' ? 7 : 3}d)
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={autoStockCheckDate || '—'}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-emerald-50/60 text-emerald-800 text-xs sm:text-sm font-semibold cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      PO Release Target Date (Auto +2d)
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={autoPoReleaseDate || '—'}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-emerald-50/60 text-emerald-800 text-xs sm:text-sm font-semibold cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              {/* Editable Update Section */}
              {(() => {
                const updateSectionLocked = !isAdmin && Boolean((item as any)?.updateSectionLocked);
                return (
                  <div className="p-3.5 rounded-xl border border-brand-200 bg-brand-50/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-900 uppercase tracking-wider block">
                        Update Section (Editable)
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        updateSectionLocked
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-brand-100 text-brand-700'
                      }`}>
                        {updateSectionLocked ? 'Locked — Admin Only' : 'Daily Updates'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Actual Stock Update Date (from Material Store)
                        </label>
                        <input
                          type="date"
                          disabled={updateSectionLocked}
                          value={actualStockUpdateDate}
                          onChange={(e) => setActualStockUpdateDate(e.target.value)}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                            updateSectionLocked
                              ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Actual PO Release Date
                        </label>
                        <input
                          type="date"
                          disabled={updateSectionLocked}
                          value={actualPoReleaseDate}
                          onChange={(e) => setActualPoReleaseDate(e.target.value)}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                            updateSectionLocked
                              ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Expected Material Receipt Date
                        </label>
                        <input
                          type="date"
                          disabled={updateSectionLocked}
                          value={expectedMaterialReceiptDate}
                          onChange={(e) => setExpectedMaterialReceiptDate(e.target.value)}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                            updateSectionLocked
                              ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Actual Material Receipt Date
                          </label>
                          {!updateSectionLocked && (
                            <button
                              type="button"
                              onClick={setReceivedToday}
                              className="text-xs text-brand-600 hover:underline font-semibold"
                            >
                              Set Today
                            </button>
                          )}
                        </div>
                        <input
                          type="date"
                          disabled={updateSectionLocked}
                          value={actualReceiptDate}
                          onChange={(e) => setActualReceiptDate(e.target.value)}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                            updateSectionLocked
                              ? 'border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    {updateSectionLocked && (
                      <p className="text-[11px] text-amber-600 font-medium pt-1">
                        This section can only be updated once by users. Contact an admin to make further changes.
                      </p>
                    )}

                    {showCompletionNotice && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                        <div>
                          <span className="font-semibold">Move to History:</span> Saving with an Actual Material Receipt Date will mark this order as <strong>Completed</strong> and move it to Received History.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Live Status Section (On-Time / Delayed Indicator) */}
          <div className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
            liveStatus.isDelay
              ? 'bg-rose-50/90 border-rose-200 text-rose-950'
              : liveStatus.status === 'on-time'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shadow-xs flex-shrink-0 ${
                liveStatus.isDelay
                  ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                  : liveStatus.status === 'on-time'
                  ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {liveStatus.isDelay ? (
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live Status:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                    liveStatus.isDelay
                      ? 'bg-rose-600 text-white shadow-xs'
                      : liveStatus.status === 'on-time'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-300 text-slate-800'
                  }`}>
                    {liveStatus.label}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold mt-1 text-slate-800">
                  {liveStatus.detail}
                </p>
              </div>
            </div>

            {liveStatus.isDelay && (
              <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-rose-200/70 border border-rose-300 text-rose-900 text-xs font-black tracking-wide whitespace-nowrap shadow-2xs">
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{liveStatus.delayDays} DAY{liveStatus.delayDays > 1 ? 'S' : ''} DELAY</span>
              </div>
            )}
          </div>

          {/* Remarks / Follow-up Note Section for All Modules */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              Add Remark / Follow-up Note
            </label>
            <textarea
              rows={2}
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              placeholder="Add inspection notes, follow-up status, or Tannery updates..."
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
            />
          </div>
          </fieldset>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {canWrite ? 'Cancel' : 'Close'}
            </button>
            {canWrite && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-black hover:bg-slate-900 active:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ring-2 ring-black/10"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { ModuleType, LeatherSubItem } from '../../types/procurement';
import { getTodayDateString } from '../../utils/dateUtils';

interface CreateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: ModuleType;
  onCreate: (module: ModuleType, data: any) => Promise<boolean>;
}

export const CreateRecordModal: React.FC<CreateRecordModalProps> = ({
  isOpen,
  onClose,
  module,
  onCreate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Common fields
  const [date, setDate] = useState(getTodayDateString());
  const [buyerCode, setBuyerCode] = useState('');
  const [woNo, setWoNo] = useState('');
  const [targetReceiptDate, setTargetReceiptDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Daily Leather specific header fields
  const [indentReceiptDate, setIndentReceiptDate] = useState(getTodayDateString());
  const [shipmentDate, setShipmentDate] = useState('');

  // New Leather specific
  const [leatherName, setLeatherName] = useState('');
  const [colour, setColour] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('sqft');
  const [tannery, setTannery] = useState('');

  // Daily Leather multiple sub-items (Req #68)
  const [leatherItems, setLeatherItems] = useState<LeatherSubItem[]>([
    { id: 'sub-1', leatherName: '', colour: '', quantity: 500, tannery: '', remarks: '' }
  ]);

  // Material specific
  const [materialName, setMaterialName] = useState('');
  const [materialSpec, setMaterialSpec] = useState('');
  const [materialSupplier, setMaterialSupplier] = useState('');
  const [materialUnit, setMaterialUnit] = useState('meters');

  // Packaging specific
  const [packagingType, setPackagingType] = useState('');
  const [packagingSpec, setPackagingSpec] = useState('');
  const [packagingSupplier, setPackagingSupplier] = useState('');
  const [packagingUnit, setPackagingUnit] = useState('pcs');

  if (!isOpen) return null;

  const moduleTitles = {
    'new-leather': 'New Leather Development',
    'daily-leather': 'Daily Leather Procurement',
    'material': 'Daily Material Procurement',
    'packaging': 'Daily Packaging Procurement'
  };

  const addLeatherItem = () => {
    setLeatherItems(prev => [
      ...prev,
      {
        id: 'sub-' + Date.now() + Math.random().toString(36).substring(2, 5),
        leatherName: '',
        colour: '',
        quantity: 500,
        tannery: '',
        remarks: ''
      }
    ]);
  };

  const removeLeatherItem = (index: number) => {
    if (leatherItems.length <= 1) return;
    setLeatherItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateLeatherItem = (index: number, field: keyof LeatherSubItem, val: any) => {
    setLeatherItems(prev => prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!buyerCode.trim()) {
      setErrorMessage('Buyer Code is required.');
      return;
    }

    let payload: any = {
      date,
      buyerCode: buyerCode.trim().toUpperCase(),
      targetReceiptDate: targetReceiptDate || shipmentDate || date,
      remarks: remarks.trim()
    };

    if (module === 'new-leather') {
      if (!leatherName.trim() || !colour.trim() || !tannery.trim()) {
        setErrorMessage('Please fill in Leather Name, Colour, and Tannery.');
        return;
      }
      payload = {
        ...payload,
        leatherName: leatherName.trim(),
        colour: colour.trim(),
        quantity: Number(quantity) || 0,
        unit,
        tannery: tannery.trim()
      };
    } else if (module === 'daily-leather') {
      if (!woNo.trim()) {
        setErrorMessage('Work Order No. (WO No.) is required.');
        return;
      }
      for (let i = 0; i < leatherItems.length; i++) {
        if (!leatherItems[i].leatherName.trim() || !leatherItems[i].tannery.trim()) {
          setErrorMessage(`Leather Item #${i + 1} is missing Leather Name or Tannery.`);
          return;
        }
      }
      payload = {
        ...payload,
        woNo: woNo.trim().toUpperCase(),
        woDate: date,
        indentReceiptDate,
        shipmentDate,
        items: leatherItems
      };
    } else if (module === 'material') {
      if (!woNo.trim()) {
        setErrorMessage('Work Order No. is required.');
        return;
      }
      payload = {
        ...payload,
        woNo: woNo.trim().toUpperCase(),
        woDate: date,
        indentReceiptDate: indentReceiptDate || date,
        shipmentDate: shipmentDate || '',
        materialName: materialName.trim() || 'Material Requirements',
        specification: materialSpec.trim(),
        quantity: Number(quantity) || 0,
        unit: materialUnit,
        supplier: materialSupplier.trim() || 'Material Vendor'
      };
    } else if (module === 'packaging') {
      if (!woNo.trim()) {
        setErrorMessage('Work Order No. is required.');
        return;
      }
      payload = {
        ...payload,
        woNo: woNo.trim().toUpperCase(),
        woDate: date,
        indentReceiptDate: indentReceiptDate || date,
        shipmentDate: shipmentDate || '',
        packagingType: packagingType.trim() || 'Packaging Requirements',
        specification: packagingSpec.trim(),
        quantity: Number(quantity) || 0,
        unit: packagingUnit,
        supplier: packagingSupplier.trim() || 'Packaging Vendor'
      };
    }

    setIsSubmitting(true);
    const success = await onCreate(module, payload);
    setIsSubmitting(false);

    if (success) {
      onClose();
      window.location.reload();
    }
  };

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
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Add {moduleTitles[module]}
              </h3>
              <p className="text-xs text-slate-500">
                Create new pending procurement order
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
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs sm:text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Top Form Section */}
          {module === 'daily-leather' || module === 'material' || module === 'packaging' ? (
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Work Order Parameters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="create-wono" className="block text-xs font-medium text-slate-700 mb-1">
                    Work Order No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="create-wono"
                    type="text"
                    required
                    placeholder="e.g. WO-88401"
                    value={woNo}
                    onChange={(e) => setWoNo(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="create-buyer" className="block text-xs font-medium text-slate-700 mb-1">
                    Buyer Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="create-buyer"
                    type="text"
                    required
                    placeholder="e.g. BUY-ZARA"
                    value={buyerCode}
                    onChange={(e) => setBuyerCode(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="create-wodate" className="block text-xs font-medium text-slate-700 mb-1">
                    Work Order Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="create-wodate"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="create-indentdate" className="block text-xs font-medium text-slate-700 mb-1">
                    Work Order & Indent Receipt Date
                  </label>
                  <input
                    id="create-indentdate"
                    type="date"
                    value={indentReceiptDate}
                    onChange={(e) => setIndentReceiptDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="create-shipdate" className="block text-xs font-medium text-slate-700 mb-1">
                    Work Order Shipment Date
                  </label>
                  <input
                    id="create-shipdate"
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label htmlFor="create-date" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Order Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="create-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label htmlFor="create-buyer" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Buyer Code <span className="text-rose-500">*</span>
                </label>
                <input
                  id="create-buyer"
                  type="text"
                  required
                  placeholder="e.g. BUY-ZARA"
                  value={buyerCode}
                  onChange={(e) => setBuyerCode(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
          )}

          {/* Module 1: New Leather Development specific inputs */}
          {module === 'new-leather' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div>
                <label htmlFor="nl-name" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Leather Name / Article <span className="text-rose-500">*</span>
                </label>
                <input
                  id="nl-name"
                  type="text"
                  required
                  placeholder="e.g. Full Grain Classic Calf"
                  value={leatherName}
                  onChange={(e) => setLeatherName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label htmlFor="nl-color" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Colour <span className="text-rose-500">*</span>
                </label>
                <input
                  id="nl-color"
                  type="text"
                  required
                  placeholder="e.g. Cognac Saddle Brown"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label htmlFor="nl-qty" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Quantity (sqft / hides) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="nl-qty"
                  type="number"
                  required
                  min="1"
                  placeholder="1200"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label htmlFor="nl-tannery" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Tannery / Supplier <span className="text-rose-500">*</span>
                </label>
                <input
                  id="nl-tannery"
                  type="text"
                  required
                  placeholder="e.g. Prime Tanners Ltd"
                  value={tannery}
                  onChange={(e) => setTannery(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          )}

          {/* Module 2: Daily Leather Procurement (Multi-item bottom cards) */}
          {module === 'daily-leather' && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Leather Items Section ({leatherItems.length})
                </span>
                <button
                  type="button"
                  onClick={addLeatherItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Leather Item
                </button>
              </div>

              <div className="space-y-3">
                {leatherItems.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/60 relative space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Leather Item #{idx + 1}
                      </span>
                      {leatherItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLeatherItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors text-xs inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Leather Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Smooth Milled Nappa"
                          value={sub.leatherName}
                          onChange={(e) => updateLeatherItem(idx, 'leatherName', e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Colour <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Jet Black"
                          value={sub.colour}
                          onChange={(e) => updateLeatherItem(idx, 'colour', e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Qty Required (sqft) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="1000"
                          value={sub.quantity}
                          onChange={(e) => updateLeatherItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Tannery <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Prime Tanners Ltd"
                          value={sub.tannery}
                          onChange={(e) => updateLeatherItem(idx, 'tannery', e.target.value)}
                          className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="Specific sampling / grade remarks for this item..."
                        value={sub.remarks || ''}
                        onChange={(e) => updateLeatherItem(idx, 'remarks', e.target.value)}
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module 3: Daily Material specific inputs */}
          {module === 'material' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div>
                <label htmlFor="mat-name" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Material Name / Type <span className="text-rose-500">*</span>
                </label>
                <input
                  id="mat-name"
                  type="text"
                  required
                  placeholder="e.g. Cotton Twill Lining 240 GSM"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="mat-spec" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Specification
                </label>
                <input
                  id="mat-spec"
                  type="text"
                  placeholder="e.g. Water-resistant coating, 58 inch"
                  value={materialSpec}
                  onChange={(e) => setMaterialSpec(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="mat-qty" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="mat-qty"
                    type="number"
                    required
                    min="1"
                    placeholder="5000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="mat-unit" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    id="mat-unit"
                    value={materialUnit}
                    onChange={(e) => setMaterialUnit(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="meters">Meters</option>
                    <option value="rolls">Rolls</option>
                    <option value="spools">Spools</option>
                    <option value="pcs">Pcs</option>
                    <option value="kg">Kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="mat-supplier" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Supplier / Vendor <span className="text-rose-500">*</span>
                </label>
                <input
                  id="mat-supplier"
                  type="text"
                  required
                  placeholder="e.g. TexFab Global"
                  value={materialSupplier}
                  onChange={(e) => setMaterialSupplier(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Module 4: Daily Packaging specific inputs */}
          {module === 'packaging' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <div>
                <label htmlFor="pkg-type" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Packaging Item / Type <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pkg-type"
                  type="text"
                  required
                  placeholder="e.g. Rigid Drawer Shoe Boxes"
                  value={packagingType}
                  onChange={(e) => setPackagingType(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="pkg-spec" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Specification
                </label>
                <input
                  id="pkg-spec"
                  type="text"
                  placeholder="e.g. 1400 GSM greyboard with foil logo"
                  value={packagingSpec}
                  onChange={(e) => setPackagingSpec(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="pkg-qty" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="pkg-qty"
                    type="number"
                    required
                    min="1"
                    placeholder="3000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pkg-unit" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    id="pkg-unit"
                    value={packagingUnit}
                    onChange={(e) => setPackagingUnit(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="pcs">Pcs</option>
                    <option value="cartons">Cartons</option>
                    <option value="pouches">Pouches</option>
                    <option value="rolls">Rolls</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="pkg-supplier" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Supplier / Vendor <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pkg-supplier"
                  type="text"
                  required
                  placeholder="e.g. Precision Pack & Print"
                  value={packagingSupplier}
                  onChange={(e) => setPackagingSupplier(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Target Receipt Date & Initial Remarks (Common for modules other than daily-leather) */}
          {module !== 'daily-leather' && (
            <>
              <div className="pt-2">
                <label htmlFor="create-target-date" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Target Receipt Date <span className="text-slate-400 font-normal"></span>
                </label>
                <input
                  id="create-target-date"
                  type="date"
                  value={targetReceiptDate}
                  onChange={(e) => setTargetReceiptDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="create-remarks" className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Remarks / Initial Notes
                </label>
                <textarea
                  id="create-remarks"
                  rows={2}
                  placeholder="Add any initial purchase order or sampling instructions..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />
              </div>
            </>
          )}

          {/* Modal Footer Buttons (Req #54 & #66) */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-soft transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Create Procurement'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBuyerCodes } from '../../services/buyerCodeService';
import QuickAddBuyerModal from './QuickAddBuyerModal';

export interface BuyerCodeSelectProps {
  value?: string;
  onChange?: (val: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
  label?: string;
  showAddOption?: boolean;
  showAddButton?: boolean;
  disabled?: boolean;
}

export default function BuyerCodeSelect({
  value = '',
  onChange,
  required = false,
  className = '',
  id,
  placeholder = 'Select Buyer Code...',
  label = '',
  showAddOption = true,
  showAddButton = false,
  disabled = false
}: BuyerCodeSelectProps) {
  const { buyerCodes } = useBuyerCodes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__ADD_NEW__') {
      setIsAddModalOpen(true);
      return;
    }
    onChange?.(selected);
  };

  const handleCreated = (newCode: string) => {
    onChange?.(newCode);
  };

  const defaultClasses =
    'w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium';

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {showAddButton && !disabled && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add New
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <select
          id={id}
          required={required}
          disabled={disabled}
          value={value || ''}
          onChange={handleSelectChange}
          className={className || defaultClasses}
        >
          <option value="">{placeholder}</option>
          {buyerCodes.map((b: any) => (
            <option key={b.buyerCode} value={b.buyerCode}>
              {b.buyerCode} — {b.buyerName}
            </option>
          ))}
          {value && !buyerCodes.some((b: any) => b.buyerCode === value) && (
            <option value={value}>{value}</option>
          )}
          {showAddOption && !disabled && (
            <option value="__ADD_NEW__" className="font-semibold text-brand-600">
              ➕ Add New Buyer Code...
            </option>
          )}
        </select>
      </div>

      <QuickAddBuyerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

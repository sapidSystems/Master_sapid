import { ModuleType } from '../types/procurement';

export interface ColumnDef {
  id: string;
  label: string;
  defaultVisible?: boolean;
  pendingOnly?: boolean;
  historyOnly?: boolean;
}

export const PROCUREMENT_COLUMNS_CONFIG: Record<ModuleType, ColumnDef[]> = {
  'new-leather': [
    { id: 'action', label: 'Action', pendingOnly: true },
    { id: 'historyDate', label: 'Update Date & Time', historyOnly: true },
    { id: 'historyAuthor', label: 'Updated By', historyOnly: true },
    { id: 'date', label: 'Date', pendingOnly: true },
    { id: 'buyerCode', label: 'Buyer Code' },
    { id: 'leatherName', label: 'Leather Name' },
    { id: 'colour', label: 'Colour' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'tannery', label: 'Tannery' },
    { id: 'targetReceiptDate', label: 'Target Date' },
    { id: 'actualReceiptDate', label: 'Actual Receipt Date' },
    { id: 'status', label: 'Status' },
    { id: 'tatPlanned', label: 'TAT Planned' },
    { id: 'tatDelay', label: 'TAT Delay' },
    { id: 'remarks', label: 'Remarks' },
  ],
  'daily-leather': [
    { id: 'action', label: 'Action', pendingOnly: true },
    { id: 'historyDate', label: 'Update Date & Time', historyOnly: true },
    { id: 'historyAuthor', label: 'Updated By', historyOnly: true },
    { id: 'woNo', label: 'Work Order No.' },
    { id: 'buyerCode', label: 'Buyer Code' },
    { id: 'woDate', label: 'Work Order Date' },
    { id: 'indentReceiptDate', label: 'Indent Receipt Date' },
    { id: 'shipmentDate', label: 'Shipment Date' },
    { id: 'poReleaseTargetDate', label: 'PO Release Target Date' },
    { id: 'actualPoReleaseDate', label: 'Actual PO Release Date' },
    { id: 'leatherName', label: 'Leather Name' },
    { id: 'colour', label: 'Colour' },
    { id: 'quantity', label: 'Qty Required (sqft)' },
    { id: 'tannery', label: 'Tannery' },
    { id: 'qtyInStock', label: 'Qty In Stock' },
    { id: 'qtyOrdered', label: 'Qty Ordered (sqft)' },
    { id: 'poDeliveryDate', label: 'PO Delivery Date' },
    { id: 'plannedDeliveryDate', label: 'Planned Receipt Date' },
    { id: 'qtyReceived', label: 'Qty Received (sqft)' },
    { id: 'dueQty', label: 'Due Qty (sqft)' },
    { id: 'actualReceiptDate', label: 'Actual Receipt Date' },
    { id: 'status', label: 'Status' },
    { id: 'remarks', label: 'Remarks' },
    { id: 'tatPlanned', label: 'TAT Planned' },
    { id: 'tatDelay', label: 'TAT Delay' },
  ],
  'material': [
    { id: 'action', label: 'Action', pendingOnly: true },
    { id: 'historyDate', label: 'Update Date & Time', historyOnly: true },
    { id: 'historyAuthor', label: 'Updated By', historyOnly: true },
    { id: 'woNo', label: 'Work Order No.' },
    { id: 'buyerCode', label: 'Buyer Code' },
    { id: 'woDate', label: 'Work Order Date' },
    { id: 'indentReceiptDate', label: 'Indent Receipt Date' },
    { id: 'shipmentDate', label: 'Shipment Date' },
    { id: 'targetStockCheckDate', label: 'Target Stock Check Date' },
    { id: 'actualStockUpdateDate', label: 'Actual Stock Update Date' },
    { id: 'poReleaseTargetDate', label: 'PO Release Target Date' },
    { id: 'actualPoReleaseDate', label: 'Actual PO Release Date' },
    { id: 'plannedMaterialReceiptDate', label: 'Planned Material Receipt Date' },
    { id: 'actualReceiptDate', label: 'Actual Material Receipt Date' },
    { id: 'status', label: 'Status' },
    { id: 'remarks', label: 'Remarks' },
    { id: 'tatPlanned', label: 'TAT Planned' },
    { id: 'tatDelay', label: 'TAT Delay' },
  ],
  'packaging': [
    { id: 'action', label: 'Action', pendingOnly: true },
    { id: 'historyDate', label: 'Update Date & Time', historyOnly: true },
    { id: 'historyAuthor', label: 'Updated By', historyOnly: true },
    { id: 'woNo', label: 'Work Order No.' },
    { id: 'buyerCode', label: 'Buyer Code' },
    { id: 'woDate', label: 'Work Order Date' },
    { id: 'indentReceiptDate', label: 'Indent Receipt Date' },
    { id: 'shipmentDate', label: 'Shipment Date' },
    { id: 'targetStockCheckDate', label: 'Target Stock Check Date' },
    { id: 'actualStockUpdateDate', label: 'Actual Stock Update Date' },
    { id: 'poReleaseTargetDate', label: 'PO Release Target Date' },
    { id: 'actualPoReleaseDate', label: 'Actual PO Release Date' },
    { id: 'plannedMaterialReceiptDate', label: 'Planned Material Receipt Date' },
    { id: 'actualReceiptDate', label: 'Actual Material Receipt Date' },
    { id: 'status', label: 'Status' },
    { id: 'remarks', label: 'Remarks' },
    { id: 'tatPlanned', label: 'TAT Planned' },
    { id: 'tatDelay', label: 'TAT Delay' },
  ],
};

export const getColumnsForModule = (module: ModuleType, isHistory = false): ColumnDef[] => {
  const allColumns = PROCUREMENT_COLUMNS_CONFIG[module] || [];
  return allColumns.filter((col) => {
    if (isHistory && col.pendingOnly) return false;
    if (!isHistory && col.historyOnly) return false;
    return true;
  });
};

export const getDefaultVisibleColumns = (module: ModuleType): Record<string, boolean> => {
  const columns = PROCUREMENT_COLUMNS_CONFIG[module] || [];
  const map: Record<string, boolean> = {};
  columns.forEach((col) => {
    map[col.id] = col.defaultVisible !== false;
  });
  return map;
};

export const loadVisibleColumns = (module: ModuleType): Record<string, boolean> => {
  const defaults = getDefaultVisibleColumns(module);
  try {
    const raw = localStorage.getItem(`procurement_visible_cols_${module}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch (err) {
    console.error(`Failed to load column preferences for ${module}:`, err);
  }
  return defaults;
};

export const saveVisibleColumns = (module: ModuleType, columns: Record<string, boolean>): void => {
  try {
    localStorage.setItem(`procurement_visible_cols_${module}`, JSON.stringify(columns));
  } catch (err) {
    console.error(`Failed to save column preferences for ${module}:`, err);
  }
};

export type ProcurementStatus = 'pending' | 'on-time' | 'delayed' | 'completed';

export type ModuleType = 'new-leather' | 'daily-leather' | 'material' | 'packaging';

export type ViewTab = 'pending' | 'history';

export interface RemarkEntry {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface BaseProcurementItem {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  buyerCode: string;
  targetReceiptDate: string; // ISO format: YYYY-MM-DD
  actualReceiptDate?: string; // ISO format: YYYY-MM-DD
  status: ProcurementStatus;
  remarks?: string;
  remarkHistory: RemarkEntry[];
  createdAt: string;
  updatedAt: string;
}

// 1. New Leather Development
export interface NewLeatherItem extends BaseProcurementItem {
  module: 'new-leather';
  leatherName: string;
  colour: string;
  quantity: number; // in sqft or hides
  unit?: string;
  tannery: string;
}

// Sub-item for Daily Leather Procurement creation form
export interface LeatherSubItem {
  id: string;
  leatherName: string;
  colour: string;
  quantity: number; // Qty Required (sqft)
  tannery: string;
  remarks?: string;
}

// 2. Daily Leather Procurement (Individual Item Entry)
export interface DailyLeatherItem extends BaseProcurementItem {
  module: 'daily-leather';
  woNo: string;
  woDate?: string; // Work Order Date
  indentReceiptDate?: string; // Work Order & Indent Receipt Date
  shipmentDate?: string; // Work Order Shipment Date
  
  // Leather Item specifics
  leatherName: string;
  colour: string;
  quantity: number; // Qty Required (sqft)
  tannery: string;

  // Tracking / Update Popup Form Parameters
  actualPoReleaseDate?: string;
  poReleaseTargetDate?: string;
  qtyInStock?: number;
  qtyOrdered?: number;
  poDeliveryDate?: string;
  plannedDeliveryDate?: string;
  qtyReceived?: number;
  // Note: actualReceiptDate is inherited from BaseProcurementItem (Actual Receipt Date for Complete Order)
  
  // Legacy / fallback field
  items?: LeatherSubItem[];
}

// 3. Daily Material Procurement
export interface MaterialItem extends BaseProcurementItem {
  module: 'material';
  woNo: string;
  woDate?: string; // Work Order Date
  indentReceiptDate?: string; // Work Order & Indent Receipt Date
  shipmentDate?: string; // Work Order Shipment Date
  
  // Auto-calculated fields
  targetStockCheckDate?: string; // Auto: indentReceiptDate + 3 days
  poReleaseTargetDate?: string; // Auto: targetStockCheckDate + 2 days
  
  // Update fields
  actualStockUpdateDate?: string; // Actual Stock Update Date (as recd from Material Store)
  actualPoReleaseDate?: string; // Actual PO Release Date
  expectedMaterialReceiptDate?: string; // Expected Material Receipt Date

  materialName: string;
  specification?: string;
  quantity?: number;
  unit?: string;
  supplier?: string;
}

// 4. Daily Packaging Procurement
export interface PackagingItem extends BaseProcurementItem {
  module: 'packaging';
  woNo: string;
  woDate?: string; // Work Order Date
  indentReceiptDate?: string; // Work Order & Indent Receipt Date
  shipmentDate?: string; // Work Order Shipment Date
  
  // Auto-calculated fields
  targetStockCheckDate?: string; // Auto: indentReceiptDate + 3 days
  poReleaseTargetDate?: string; // Auto: targetStockCheckDate + 2 days
  
  // Update fields
  actualStockUpdateDate?: string; // Actual Stock Update Date (as recd from Material Store)
  actualPoReleaseDate?: string; // Actual PO Release Date
  expectedMaterialReceiptDate?: string; // Expected Material Receipt Date

  packagingType: string;
  specification?: string;
  quantity?: number;
  unit?: string;
  supplier?: string;
}

export type AnyProcurementItem = NewLeatherItem | DailyLeatherItem | MaterialItem | PackagingItem;

export interface ActivityLogEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'COMPLETE' | 'DELETE' | 'ADD_REMARK';
  module: ModuleType;
  recordIdentifier: string; // WO No or Item Name
  details: string;
  user: string;
  timestamp: string;
}

export interface FilterState {
  search: string;
  fromDate: string;
  toDate: string;
  status: string; // 'all' or specific status
  buyerCode: string;
  vendor: string; // Tannery or Supplier
}

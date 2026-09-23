import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ModuleType,
  ViewTab,
  NewLeatherItem,
  DailyLeatherItem,
  LeatherSubItem,
  MaterialItem,
  PackagingItem,
  AnyProcurementItem,
  ActivityLogEntry,
  RemarkEntry
} from '../types/procurement';
import { calculateStatus, calculateMaterialStatus, addDays, addWorkingDays, getTodayDateString } from '../utils/dateUtils';
import { useToast } from './ToastContext';
import { supabase } from '../utils/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Required Supabase Migrations (run manually in Supabase SQL editor):
// ALTER TABLE procurement_daily_leather ADD COLUMN IF NOT EXISTS po_delivery_date_locked boolean DEFAULT false;
// ALTER TABLE procurement_daily_leather ADD COLUMN IF NOT EXISTS planned_delivery_date_locked boolean DEFAULT false;
// ALTER TABLE procurement_material ADD COLUMN IF NOT EXISTS update_section_locked boolean DEFAULT false;
// ALTER TABLE procurement_packaging ADD COLUMN IF NOT EXISTS update_section_locked boolean DEFAULT false;
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Table name mapping
// ─────────────────────────────────────────────────────────────────────────────
const TABLE: Record<ModuleType, string> = {
  'new-leather': 'procurement_new_leather',
  'daily-leather': 'procurement_daily_leather',
  'material': 'procurement_material',
  'packaging': 'procurement_packaging',
};

// ─────────────────────────────────────────────────────────────────────────────
// camelCase ↔ snake_case conversion helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a JS procurement item (camelCase) → DB row (snake_case) */
function toDbRow(item: any): Record<string, any> {
  const row: Record<string, any> = {};
  const map: Record<string, string> = {
    buyerCode: 'buyer_code',
    targetReceiptDate: 'target_receipt_date',
    actualReceiptDate: 'actual_receipt_date',
    remarkHistory: 'remark_history',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    leatherName: 'leather_name',
    woNo: 'wo_no',
    woDate: 'wo_date',
    indentReceiptDate: 'indent_receipt_date',
    shipmentDate: 'shipment_date',
    targetStockCheckDate: 'target_stock_check_date',
    poReleaseTargetDate: 'po_release_target_date',
    actualStockUpdateDate: 'actual_stock_update_date',
    actualPoReleaseDate: 'actual_po_release_date',
    expectedMaterialReceiptDate: 'expected_material_receipt_date',
    materialName: 'material_name',
    packagingType: 'packaging_type',
    qtyInStock: 'qty_in_stock',
    qtyOrdered: 'qty_ordered',
    poDeliveryDate: 'po_delivery_date',
    plannedDeliveryDate: 'planned_delivery_date',
    qtyReceived: 'qty_received',
    poDeliveryDateLocked: 'po_delivery_date_locked',
    plannedDeliveryDateLocked: 'planned_delivery_date_locked',
    updateSectionLocked: 'update_section_locked',
    recordIdentifier: 'record_identifier',
    productionPlanningId: 'production_planning_id',
    source: 'source',
  };

  for (const [jsKey, dbKey] of Object.entries(map)) {
    if (item[jsKey] !== undefined) {
      row[dbKey] = item[jsKey];
    }
  }

  // Pass-through fields that are already snake_case or identical
  const passThrough = ['id', 'module', 'date', 'colour', 'quantity', 'unit', 'tannery',
    'status', 'remarks', 'specification', 'supplier', 'timestamp', 'action', 'details', 'user'];
  for (const k of passThrough) {
    if (item[k] !== undefined) row[k] = item[k];
  }

  // Empty strings → null for DATE columns to avoid Postgres errors
  const dateFields = ['date', 'wo_date', 'indent_receipt_date', 'shipment_date',
    'target_receipt_date', 'actual_receipt_date', 'target_stock_check_date',
    'po_release_target_date', 'actual_stock_update_date', 'actual_po_release_date',
    'expected_material_receipt_date', 'po_delivery_date', 'planned_delivery_date'];
  for (const f of dateFields) {
    if (row[f] === '') row[f] = null;
  }

  return row;
}

/** Convert a DB row (snake_case) → JS item (camelCase) */
function fromDbRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    module: row.module,
    date: row.date || '',
    buyerCode: row.buyer_code || '',
    targetReceiptDate: row.target_receipt_date || '',
    actualReceiptDate: row.actual_receipt_date || undefined,
    status: row.status || 'pending',
    remarks: row.remarks || '',
    remarkHistory: Array.isArray(row.remark_history) ? row.remark_history : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    // New Leather
    leatherName: row.leather_name,
    colour: row.colour,
    quantity: row.quantity,
    unit: row.unit,
    tannery: row.tannery,
    // Daily Leather extra
    woNo: row.wo_no,
    woDate: row.wo_date,
    indentReceiptDate: row.indent_receipt_date || undefined,
    shipmentDate: row.shipment_date || undefined,
    actualPoReleaseDate: row.actual_po_release_date || undefined,
    qtyInStock: row.qty_in_stock,
    qtyOrdered: row.qty_ordered,
    poDeliveryDate: row.po_delivery_date || undefined,
    plannedDeliveryDate: row.planned_delivery_date || undefined,
    qtyReceived: row.qty_received,
    poDeliveryDateLocked: row.po_delivery_date_locked !== undefined ? Boolean(row.po_delivery_date_locked) : undefined,
    plannedDeliveryDateLocked: row.planned_delivery_date_locked !== undefined ? Boolean(row.planned_delivery_date_locked) : undefined,
    // Auto-calculate target dates with working days rules (Material: 3wd stock check, 2wd PO; Packaging: 7wd stock check, 2wd PO; Leather: 2wd PO)
    ...(() => {
      const indentDate = row.indent_receipt_date || row.wo_date || row.date;
      const stockCheckDays = row.module === 'packaging' ? 7 : (row.module === 'material' ? 3 : 0);
      const computedStockCheck = stockCheckDays > 0 && indentDate ? addWorkingDays(indentDate, stockCheckDays) : undefined;
      const finalStockCheck = row.target_stock_check_date || computedStockCheck;

      const computedPoRelease = row.module === 'daily-leather'
        ? (indentDate ? addWorkingDays(indentDate, 2) : undefined)
        : (finalStockCheck ? addWorkingDays(finalStockCheck, 2) : undefined);
      const finalPoRelease = row.po_release_target_date || computedPoRelease;

      return {
        targetStockCheckDate: finalStockCheck,
        poReleaseTargetDate: finalPoRelease,
      };
    })(),
    actualStockUpdateDate: row.actual_stock_update_date || undefined,
    expectedMaterialReceiptDate: row.expected_material_receipt_date || undefined,
    updateSectionLocked: row.update_section_locked !== undefined ? Boolean(row.update_section_locked) : undefined,
    materialName: row.material_name,
    specification: row.specification,
    supplier: row.supplier,
    // Packaging only
    packagingType: row.packaging_type,
    // Production Planning Integration
    productionPlanningId: row.production_planning_id || undefined,
    source: row.source || 'manual',
  };
}

function fromDbActivityLog(row: any): ActivityLogEntry {
  return {
    id: row.id,
    action: row.action,
    module: row.module,
    recordIdentifier: row.record_identifier || '',
    details: row.details || '',
    user: row.user || 'System User',
    timestamp: row.timestamp || new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
}

const DEFAULT_USER: UserProfile = {
  name: 'Vikram Sharma',
  role: 'Procurement Lead & Merchandiser',
  department: 'Supply Chain & Sourcing',
  email: 'v.sharma@sapid-footwear.com',
  avatar: 'VS'
};

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────

interface ProcurementContextType {
  activeNav: string;
  activeTab: ViewTab;
  setActiveNav: (nav: string) => void;
  setActiveTab: (tab: ViewTab) => void;

  newLeather: NewLeatherItem[];
  dailyLeather: DailyLeatherItem[];
  materials: MaterialItem[];
  packaging: PackagingItem[];
  activityLogs: ActivityLogEntry[];
  currentUser: UserProfile | null;
  isLoading: boolean;

  getModuleCounts: (module: ModuleType) => { pending: number; history: number; delayed: number; onTime: number };
  getDashboardStats: () => {
    totalPending: number;
    totalDelayed: number;
    totalOnTime: number;
    totalCompleted: number;
    newLeatherPending: number;
    dailyLeatherPending: number;
    materialsPending: number;
    packagingPending: number;
  };

  createRecord: (module: ModuleType, data: any) => Promise<boolean>;
  updateRecord: (module: ModuleType, id: string, updates: any) => Promise<boolean>;
  deleteRecord: (module: ModuleType, id: string) => Promise<boolean>;
  addRemarkToRecord: (module: ModuleType, id: string, remarkText: string) => Promise<boolean>;
  completeProcurement: (module: ModuleType, id: string, actualDate: string) => Promise<boolean>;

  getRecordById: (module: ModuleType, id: string) => AnyProcurementItem | undefined;
  resetAllDataToDefault: () => void;
  logoutUser: () => void;
  loginUser: () => void;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);

  const [activeNav, setActiveNavState] = useState<string>(() => {
    try { return localStorage.getItem('erp_active_nav') || 'dashboard'; } catch { return 'dashboard'; }
  });

  const [activeTab, setActiveTabState] = useState<ViewTab>(() => {
    try { return (localStorage.getItem('erp_active_tab') as ViewTab) || 'pending'; } catch { return 'pending'; }
  });

  const setActiveNav = (nav: string) => {
    setActiveNavState(nav);
    try { localStorage.setItem('erp_active_nav', nav); } catch {}
  };

  const setActiveTab = (tab: ViewTab) => {
    setActiveTabState(tab);
    try { localStorage.setItem('erp_active_tab', tab); } catch {}
  };

  // State — seed from localStorage cache for instant first render, then Supabase overwrites
  const [newLeather, setNewLeather] = useState<NewLeatherItem[]>(() => {
    try { const s = localStorage.getItem('erp_new_leather'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [dailyLeather, setDailyLeather] = useState<DailyLeatherItem[]>(() => {
    try {
      const s = localStorage.getItem('erp_daily_leather');
      if (!s) return [];
      const list: DailyLeatherItem[] = JSON.parse(s);
      return list.map(item => {
        const base = item.indentReceiptDate || item.woDate || item.date;
        const poReleaseTargetDate = item.poReleaseTargetDate || (base ? addWorkingDays(base, 2) : undefined);
        return { ...item, poReleaseTargetDate };
      });
    } catch { return []; }
  });
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const s = localStorage.getItem('erp_materials');
      if (!s) return [];
      const list: MaterialItem[] = JSON.parse(s);
      return list.map(item => {
        const base = item.indentReceiptDate || item.woDate || item.date;
        const targetStockCheckDate = item.targetStockCheckDate || (base ? addWorkingDays(base, 3) : undefined);
        const poReleaseTargetDate = item.poReleaseTargetDate || (targetStockCheckDate ? addWorkingDays(targetStockCheckDate, 2) : undefined);
        return { ...item, targetStockCheckDate, poReleaseTargetDate };
      });
    } catch { return []; }
  });
  const [packaging, setPackaging] = useState<PackagingItem[]>(() => {
    try {
      const s = localStorage.getItem('erp_packaging');
      if (!s) return [];
      const list: PackagingItem[] = JSON.parse(s);
      return list.map(item => {
        const base = item.indentReceiptDate || item.woDate || item.date;
        const targetStockCheckDate = item.targetStockCheckDate || (base ? addWorkingDays(base, 7) : undefined);
        const poReleaseTargetDate = item.poReleaseTargetDate || (targetStockCheckDate ? addWorkingDays(targetStockCheckDate, 2) : undefined);
        return { ...item, targetStockCheckDate, poReleaseTargetDate };
      });
    } catch { return []; }
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => {
    try { const s = localStorage.getItem('erp_activity_logs'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try { const s = localStorage.getItem('erp_current_user_session'); return s !== null ? JSON.parse(s) : DEFAULT_USER; } catch { return DEFAULT_USER; }
  });

  // ── Sync localStorage cache whenever state changes ──────────────────────────
  useEffect(() => { try { localStorage.setItem('erp_new_leather', JSON.stringify(newLeather)); } catch {} }, [newLeather]);
  useEffect(() => { try { localStorage.setItem('erp_daily_leather', JSON.stringify(dailyLeather)); } catch {} }, [dailyLeather]);
  useEffect(() => { try { localStorage.setItem('erp_materials', JSON.stringify(materials)); } catch {} }, [materials]);
  useEffect(() => { try { localStorage.setItem('erp_packaging', JSON.stringify(packaging)); } catch {} }, [packaging]);
  useEffect(() => { try { localStorage.setItem('erp_activity_logs', JSON.stringify(activityLogs)); } catch {} }, [activityLogs]);
  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem('erp_current_user_session', JSON.stringify(currentUser));
      else localStorage.removeItem('erp_current_user_session');
    } catch {}
  }, [currentUser]);

  // Dispatch global event when procurement tasks change so sidebar badges update reactively
  useEffect(() => {
    if (!isLoading) {
      window.dispatchEvent(new CustomEvent('procurement-updated'));
    }
  }, [newLeather, dailyLeather, materials, packaging, isLoading]);

  // ── Fetch all data from Supabase on mount ───────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      try {
        const [nlRes, dlRes, matRes, pkgRes, logRes] = await Promise.all([
          supabase.from('procurement_new_leather').select('*').order('created_at', { ascending: false }),
          supabase.from('procurement_daily_leather').select('*').order('created_at', { ascending: false }),
          supabase.from('procurement_material').select('*').order('created_at', { ascending: false }),
          supabase.from('procurement_packaging').select('*').order('created_at', { ascending: false }),
          supabase.from('procurement_activity_logs').select('*').order('timestamp', { ascending: false }).limit(200),
        ]);

        if (nlRes.data)  setNewLeather(nlRes.data.map(r => fromDbRow({ ...r, module: 'new-leather' }) as NewLeatherItem));
        if (dlRes.data)  setDailyLeather(dlRes.data.map(r => fromDbRow({ ...r, module: 'daily-leather' }) as DailyLeatherItem));
        if (matRes.data) setMaterials(matRes.data.map(r => fromDbRow({ ...r, module: 'material' }) as MaterialItem));
        if (pkgRes.data) setPackaging(pkgRes.data.map(r => fromDbRow({ ...r, module: 'packaging' }) as PackagingItem));
        if (logRes.data) setActivityLogs(logRes.data.map(fromDbActivityLog));

        if (nlRes.error)  console.error('[Procurement] new_leather fetch error:', nlRes.error);
        if (dlRes.error)  console.error('[Procurement] daily_leather fetch error:', dlRes.error);
        if (matRes.error) console.error('[Procurement] material fetch error:', matRes.error);
        if (pkgRes.error) console.error('[Procurement] packaging fetch error:', pkgRes.error);
        if (logRes.error) console.error('[Procurement] activity_logs fetch error:', logRes.error);
      } catch (err) {
        console.error('[Procurement] Failed to fetch from Supabase, using localStorage cache:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Activity logger ─────────────────────────────────────────────────────────
  const logActivity = useCallback(async (
    action: ActivityLogEntry['action'],
    module: ModuleType,
    recordIdentifier: string,
    details: string
  ) => {
    const newLog: ActivityLogEntry = {
      id: 'log-' + Date.now() + Math.random().toString(36).substring(2, 6),
      action,
      module,
      recordIdentifier,
      details,
      user: currentUser ? currentUser.name : 'System User',
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
    // Write to Supabase (fire-and-forget, non-blocking)
    supabase.from('procurement_activity_logs').insert({
      id: newLog.id,
      action: newLog.action,
      module: newLog.module,
      record_identifier: newLog.recordIdentifier,
      details: newLog.details,
      user: newLog.user,
      timestamp: newLog.timestamp,
    }).then(({ error }) => {
      if (error) console.error('[Procurement] Activity log insert error:', error);
    });
  }, [currentUser]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getRecordById = useCallback((module: ModuleType, id: string): AnyProcurementItem | undefined => {
    switch (module) {
      case 'new-leather':  return newLeather.find(i => i.id === id);
      case 'daily-leather': return dailyLeather.find(i => i.id === id);
      case 'material':     return materials.find(i => i.id === id);
      case 'packaging':    return packaging.find(i => i.id === id);
    }
  }, [newLeather, dailyLeather, materials, packaging]);

  const getModuleCounts = useCallback((module: ModuleType) => {
    let list: AnyProcurementItem[] = [];
    switch (module) {
      case 'new-leather':  list = newLeather; break;
      case 'daily-leather': list = dailyLeather; break;
      case 'material':     list = materials; break;
      case 'packaging':    list = packaging; break;
    }
    const pending = list.filter(i => !i.actualReceiptDate).length;
    const history = list.filter(i => !!i.actualReceiptDate).length;
    const delayed = list.filter(i => !i.actualReceiptDate && i.status === 'delayed').length;
    const onTime  = list.filter(i => !i.actualReceiptDate && (i.status === 'on-time' || i.status === 'pending')).length;
    return { pending, history, delayed, onTime };
  }, [newLeather, dailyLeather, materials, packaging]);

  const getDashboardStats = useCallback(() => {
    const allItems: AnyProcurementItem[] = [...newLeather, ...dailyLeather, ...materials, ...packaging];
    const pendingItems   = allItems.filter(i => !i.actualReceiptDate);
    const completedItems = allItems.filter(i => !!i.actualReceiptDate);
    return {
      totalPending:        pendingItems.length,
      totalDelayed:        pendingItems.filter(i => i.status === 'delayed').length,
      totalOnTime:         pendingItems.filter(i => i.status === 'on-time' || i.status === 'pending').length,
      totalCompleted:      completedItems.length,
      newLeatherPending:   newLeather.filter(i => !i.actualReceiptDate).length,
      dailyLeatherPending: dailyLeather.filter(i => !i.actualReceiptDate).length,
      materialsPending:    materials.filter(i => !i.actualReceiptDate).length,
      packagingPending:    packaging.filter(i => !i.actualReceiptDate).length,
    };
  }, [newLeather, dailyLeather, materials, packaging]);

  // ── CREATE ──────────────────────────────────────────────────────────────────
  const createRecord = async (module: ModuleType, data: any): Promise<boolean> => {
    try {
      const nowIso = new Date().toISOString();
      const calculatedStatus = calculateStatus(data.targetReceiptDate, data.actualReceiptDate);

      const remarkHistory: RemarkEntry[] = [];
      if (data.remarks && data.remarks.trim()) {
        remarkHistory.push({
          id: 'rem-' + Date.now(),
          text: data.remarks.trim(),
          author: currentUser ? currentUser.name : 'System User',
          timestamp: nowIso
        });
      }

      let identifier = '';

      switch (module) {
        case 'new-leather': {
          const newId = 'NL-' + (1000 + newLeather.length + 1);
          const newItem: NewLeatherItem = {
            id: newId,
            module: 'new-leather',
            date: data.date || getTodayDateString(),
            buyerCode: data.buyerCode,
            leatherName: data.leatherName,
            colour: data.colour,
            quantity: Number(data.quantity) || 0,
            unit: data.unit || 'sqft',
            tannery: data.tannery,
            targetReceiptDate: data.targetReceiptDate,
            actualReceiptDate: data.actualReceiptDate || undefined,
            status: calculatedStatus,
            remarks: data.remarks || '',
            remarkHistory,
            createdAt: nowIso,
            updatedAt: nowIso
          };
          const { error } = await supabase.from(TABLE[module]).insert(toDbRow(newItem));
          if (error) throw error;
          setNewLeather(prev => [newItem, ...prev]);
          identifier = `${newId} (${newItem.leatherName})`;
          break;
        }

        case 'daily-leather': {
          const rawItems: LeatherSubItem[] = data.items && data.items.length > 0 ? data.items : [{
            id: 'sub-' + Date.now(),
            leatherName: data.leatherName || 'Standard Leather',
            colour: data.colour || 'Black',
            quantity: Number(data.quantity) || 100,
            tannery: data.tannery || 'Tannery 1',
            remarks: data.remarks || ''
          }];

          const newEntries: DailyLeatherItem[] = rawItems.map((sub, idx) => {
            const entryId = 'DL-' + (2000 + dailyLeather.length + idx + 1);
            const itemRemarkHistory: RemarkEntry[] = [];
            const subRemarkText = sub.remarks || data.remarks;
            if (subRemarkText && subRemarkText.trim()) {
              itemRemarkHistory.push({
                id: 'rem-' + Date.now() + '-' + idx,
                text: subRemarkText.trim(),
                author: currentUser ? currentUser.name : 'System User',
                timestamp: nowIso
              });
            }
            const dlBaseDate = data.indentReceiptDate || data.woDate || data.date || getTodayDateString();
            return {
              id: entryId,
              module: 'daily-leather',
              woNo: data.woNo || `WO-${Math.floor(10000 + Math.random() * 90000)}`,
              buyerCode: data.buyerCode,
              date: data.woDate || data.date || getTodayDateString(),
              woDate: data.woDate || data.date || getTodayDateString(),
              indentReceiptDate: data.indentReceiptDate || undefined,
              shipmentDate: data.shipmentDate || undefined,
              targetReceiptDate: data.plannedDeliveryDate || data.poDeliveryDate || data.targetReceiptDate || data.shipmentDate || getTodayDateString(),
              actualReceiptDate: data.actualReceiptDate || undefined,
              leatherName: sub.leatherName,
              colour: sub.colour,
              quantity: Number(sub.quantity) || 0,
              tannery: sub.tannery,
              poReleaseTargetDate: data.poReleaseTargetDate || (dlBaseDate ? addWorkingDays(dlBaseDate, 2) : undefined),
              actualPoReleaseDate: data.actualPoReleaseDate || undefined,
              qtyInStock: data.qtyInStock !== undefined ? Number(data.qtyInStock) : undefined,
              qtyOrdered: data.qtyOrdered !== undefined ? Number(data.qtyOrdered) : undefined,
              poDeliveryDate: data.poDeliveryDate || undefined,
              plannedDeliveryDate: data.plannedDeliveryDate || undefined,
              qtyReceived: data.qtyReceived !== undefined ? Number(data.qtyReceived) : undefined,
              status: calculateStatus(
                data.plannedDeliveryDate || data.poDeliveryDate || data.targetReceiptDate || data.shipmentDate || getTodayDateString(),
                data.actualReceiptDate
              ),
              remarks: sub.remarks || data.remarks || '',
              remarkHistory: itemRemarkHistory,
              createdAt: nowIso,
              updatedAt: nowIso
            } as DailyLeatherItem;
          });

          // Insert all sub-items to Supabase
          const rows = newEntries.map(e => toDbRow(e));
          const { error } = await supabase.from(TABLE[module]).insert(rows);
          if (error) throw error;
          setDailyLeather(prev => [...newEntries, ...prev]);
          identifier = `${data.woNo} (${newEntries.length} leather item${newEntries.length > 1 ? 's' : ''})`;
          break;
        }

        case 'material': {
          const newId = 'MAT-' + (3000 + materials.length + 1);
          const indentDate = data.indentReceiptDate || data.woDate || data.date || getTodayDateString();
          const targetStockCheckDate = addWorkingDays(indentDate, 3);
          const poReleaseTargetDate  = addWorkingDays(targetStockCheckDate, 2);
          const expectedMatDate = data.expectedMaterialReceiptDate || data.targetReceiptDate || data.shipmentDate || '';

          const newItem: MaterialItem = {
            id: newId,
            module: 'material',
            woNo: data.woNo || `WO-${Math.floor(10000 + Math.random() * 90000)}`,
            buyerCode: data.buyerCode,
            date: data.woDate || data.date || getTodayDateString(),
            woDate: data.woDate || data.date || getTodayDateString(),
            indentReceiptDate: data.indentReceiptDate || undefined,
            shipmentDate: data.shipmentDate || undefined,
            targetStockCheckDate,
            poReleaseTargetDate,
            actualStockUpdateDate: data.actualStockUpdateDate || undefined,
            actualPoReleaseDate: data.actualPoReleaseDate || undefined,
            expectedMaterialReceiptDate: expectedMatDate || undefined,
            materialName: data.materialName || 'Material Items',
            specification: data.specification || '',
            quantity: Number(data.quantity) || 0,
            unit: data.unit || 'meters',
            supplier: data.supplier || 'Vendor',
            targetReceiptDate: expectedMatDate || targetStockCheckDate,
            actualReceiptDate: data.actualReceiptDate || undefined,
            status: calculateMaterialStatus(expectedMatDate, data.actualReceiptDate),
            remarks: data.remarks || '',
            remarkHistory,
            createdAt: nowIso,
            updatedAt: nowIso
          };
          const { error } = await supabase.from(TABLE[module]).insert(toDbRow(newItem));
          if (error) throw error;
          setMaterials(prev => [newItem, ...prev]);
          identifier = `${newItem.woNo} (${newItem.materialName})`;
          break;
        }

        case 'packaging': {
          const newId = 'PKG-' + (4000 + packaging.length + 1);
          const indentDate = data.indentReceiptDate || data.woDate || data.date || getTodayDateString();
          const targetStockCheckDate = addWorkingDays(indentDate, 7);
          const poReleaseTargetDate  = addWorkingDays(targetStockCheckDate, 2);
          const expectedMatDate = data.expectedMaterialReceiptDate || data.targetReceiptDate || data.shipmentDate || '';

          const newItem: PackagingItem = {
            id: newId,
            module: 'packaging',
            woNo: data.woNo || `WO-${Math.floor(10000 + Math.random() * 90000)}`,
            buyerCode: data.buyerCode,
            date: data.woDate || data.date || getTodayDateString(),
            woDate: data.woDate || data.date || getTodayDateString(),
            indentReceiptDate: data.indentReceiptDate || undefined,
            shipmentDate: data.shipmentDate || undefined,
            targetStockCheckDate,
            poReleaseTargetDate,
            actualStockUpdateDate: data.actualStockUpdateDate || undefined,
            actualPoReleaseDate: data.actualPoReleaseDate || undefined,
            expectedMaterialReceiptDate: expectedMatDate || undefined,
            packagingType: data.packagingType || 'Packaging Items',
            specification: data.specification || '',
            quantity: Number(data.quantity) || 0,
            unit: data.unit || 'pcs',
            supplier: data.supplier || 'Vendor',
            targetReceiptDate: expectedMatDate || targetStockCheckDate,
            actualReceiptDate: data.actualReceiptDate || undefined,
            status: calculateMaterialStatus(expectedMatDate, data.actualReceiptDate),
            remarks: data.remarks || '',
            remarkHistory,
            createdAt: nowIso,
            updatedAt: nowIso
          };
          const { error } = await supabase.from(TABLE[module]).insert(toDbRow(newItem));
          if (error) throw error;
          setPackaging(prev => [newItem, ...prev]);
          identifier = `${newItem.woNo} (${newItem.packagingType})`;
          break;
        }
      }

      await logActivity('CREATE', module, identifier, `New ${module} order placed.`);
      showToast('Record created successfully', 'success');
      return true;
    } catch (err) {
      console.error('[Procurement] createRecord error:', err);
      showToast('Failed to create record. Check input values.', 'error');
      return false;
    }
  };

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  const updateRecord = async (module: ModuleType, id: string, updates: any): Promise<boolean> => {
    try {
      const nowIso = new Date().toISOString();
      const existing = getRecordById(module, id);
      if (!existing) { showToast('Record not found', 'error'); return false; }

      // Server-side style role guard: non-admin cannot overwrite locked fields
      const isAdmin = (localStorage.getItem('role') || '').toLowerCase() === 'admin';
      if (!isAdmin) {
        if (module === 'daily-leather') {
          if ((existing as any)?.poDeliveryDateLocked) {
            delete updates.poDeliveryDate;
            delete updates.poDeliveryDateLocked;
          }
          if ((existing as any)?.plannedDeliveryDateLocked) {
            delete updates.plannedDeliveryDate;
            delete updates.plannedDeliveryDateLocked;
          }
        } else if (module === 'material' || module === 'packaging') {
          if ((existing as any)?.updateSectionLocked) {
            delete updates.actualStockUpdateDate;
            delete updates.actualPoReleaseDate;
            delete updates.expectedMaterialReceiptDate;
            delete updates.actualReceiptDate;
            delete updates.updateSectionLocked;
          }
        }
      }

      const targetDate = updates.targetReceiptDate !== undefined ? updates.targetReceiptDate : existing.targetReceiptDate;
      const actualDate = updates.actualReceiptDate !== undefined ? updates.actualReceiptDate : existing.actualReceiptDate;
      let newStatus = calculateStatus(targetDate, actualDate);

      // Build detailed change list for audit trail
      const changeLogs: string[] = [];
      if (updates.leatherName && updates.leatherName !== (existing as any).leatherName)
        changeLogs.push(`Leather Name changed to "${updates.leatherName}"`);
      if (updates.colour && updates.colour !== (existing as any).colour)
        changeLogs.push(`Colour changed to "${updates.colour}"`);
      if (updates.quantity !== undefined && Number(updates.quantity) !== Number((existing as any).quantity))
        changeLogs.push(`Quantity updated to ${updates.quantity}`);
      if (updates.tannery && updates.tannery !== (existing as any).tannery)
        changeLogs.push(`Tannery updated to "${updates.tannery}"`);
      if (updates.supplier && updates.supplier !== (existing as any).supplier)
        changeLogs.push(`Supplier updated to "${updates.supplier}"`);
      if (updates.buyerCode && updates.buyerCode !== existing.buyerCode)
        changeLogs.push(`Buyer Code changed to "${updates.buyerCode}"`);
      if (updates.actualPoReleaseDate && updates.actualPoReleaseDate !== (existing as any).actualPoReleaseDate)
        changeLogs.push(`Actual PO Release Date set to ${updates.actualPoReleaseDate}`);
      if (updates.actualReceiptDate && updates.actualReceiptDate !== existing.actualReceiptDate)
        changeLogs.push(`Actual Receipt Date set to ${updates.actualReceiptDate}. Order Completed.`);

      // Incremental qty received logic
      if (updates.incrementalQtyReceived !== undefined && Number(updates.incrementalQtyReceived) > 0) {
        const delta = Number(updates.incrementalQtyReceived);
        const oldQtyReceived = Number((existing as any).qtyReceived || 0);
        const newTotal = oldQtyReceived + delta;
        updates.qtyReceived = newTotal;
        const totalOrdered = (existing as any).quantity || (existing as any).qtyOrdered || 0;
        changeLogs.push(`Received ${delta.toLocaleString()} sqft more (Total: ${newTotal.toLocaleString()} / ${totalOrdered.toLocaleString()} sqft)`);
      } else if (updates.qtyReceived !== undefined && Number(updates.qtyReceived) !== Number((existing as any).qtyReceived)) {
        changeLogs.push(`Qty Received updated to ${updates.qtyReceived}`);
      }
      delete updates.incrementalQtyReceived;

      if (updates.targetReceiptDate && updates.targetReceiptDate !== existing.targetReceiptDate)
        changeLogs.push(`Target Receipt Date updated to ${updates.targetReceiptDate}`);
      if (updates.newRemark && updates.newRemark.trim())
        changeLogs.push(`Remark: "${updates.newRemark.trim()}"`);

      // Only append to remarkHistory if user actually typed a new remark (Task 5)
      let updatedRemarkHistory = [...(existing.remarkHistory || [])];
      if (updates.newRemark && updates.newRemark.trim()) {
        updatedRemarkHistory.push({
          id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          text: updates.newRemark.trim(),
          author: currentUser ? currentUser.name : 'System User',
          timestamp: nowIso
        });
      }

      const merged: any = { ...existing, ...updates, remarkHistory: updatedRemarkHistory, updatedAt: nowIso };
      delete merged.newRemark;

      if (module === 'material' || module === 'packaging') {
        const indentDate = merged.indentReceiptDate || merged.woDate || merged.date;
        const stockCheckDays = module === 'packaging' ? 7 : 3;
        merged.targetStockCheckDate = addWorkingDays(indentDate, stockCheckDays);
        merged.poReleaseTargetDate  = addWorkingDays(merged.targetStockCheckDate, 2);
        if (merged.expectedMaterialReceiptDate) merged.targetReceiptDate = merged.expectedMaterialReceiptDate;
        newStatus = calculateMaterialStatus(merged.expectedMaterialReceiptDate, merged.actualReceiptDate);
      } else if (module === 'daily-leather') {
        const indentDate = merged.indentReceiptDate || merged.woDate || merged.date;
        if (indentDate && !merged.poReleaseTargetDate) {
          merged.poReleaseTargetDate = addWorkingDays(indentDate, 2);
        }
      }
      merged.status = newStatus;

      const movingToHistory = !existing.actualReceiptDate && !!merged.actualReceiptDate;

      // Upsert to Supabase
      const { error } = await supabase.from(TABLE[module]).upsert(toDbRow(merged));
      if (error) throw error;

      // Update local state
      switch (module) {
        case 'new-leather':
          setNewLeather(prev => prev.map(i => i.id === id ? (merged as NewLeatherItem) : i)); break;
        case 'daily-leather': {
          setDailyLeather(prev => prev.map(i => i.id === id ? (merged as DailyLeatherItem) : i));

          // Handle multi-entry leather items (add / update / remove)
          if (updates.deletedLeatherItemIds && updates.deletedLeatherItemIds.length > 0) {
            (async () => {
              try {
                await supabase.from(TABLE['daily-leather']).delete().in('id', updates.deletedLeatherItemIds);
                setDailyLeather(prev => prev.filter(i => !updates.deletedLeatherItemIds.includes(i.id)));
              } catch (delErr) {
                console.warn('Error deleting removed leather items:', delErr);
              }
            })();
          }

          if (updates.leatherItems && Array.isArray(updates.leatherItems)) {
            // Update any existing sibling entries
            const existingSiblings = updates.leatherItems.filter(
              (sub: any) => !sub.isNew && sub.id !== id && !sub.id.startsWith('new-')
            );
            for (const sub of existingSiblings) {
              (async () => {
                try {
                  const sibPatch = {
                    leather_name: sub.leatherName,
                    colour: sub.colour,
                    quantity: Number(sub.quantity) || 0,
                    tannery: sub.tannery,
                    updated_at: nowIso
                  };
                  await supabase.from(TABLE['daily-leather']).update(sibPatch).eq('id', sub.id);
                  setDailyLeather(prev =>
                    prev.map(i =>
                      i.id === sub.id
                        ? {
                            ...i,
                            leatherName: sub.leatherName,
                            colour: sub.colour,
                            quantity: Number(sub.quantity) || 0,
                            tannery: sub.tannery
                          }
                        : i
                    )
                  );
                } catch (sibErr) {
                  console.warn('Error updating sibling leather item:', sibErr);
                }
              })();
            }

            // Insert newly added entries
            const newSubs = updates.leatherItems.filter((sub: any) => sub.isNew || sub.id.startsWith('new-'));
            if (newSubs.length > 0) {
              (async () => {
                const insertedNewEntries: DailyLeatherItem[] = [];
                for (let idx = 0; idx < newSubs.length; idx++) {
                  const sub = newSubs[idx];
                  const newEntryId = 'DL-' + (Date.now() + idx + 1);
                  const newEntry: DailyLeatherItem = {
                    id: newEntryId,
                    module: 'daily-leather',
                    woNo: merged.woNo || '',
                    buyerCode: merged.buyerCode || '',
                    date: merged.woDate || merged.date || getTodayDateString(),
                    woDate: merged.woDate || merged.date || getTodayDateString(),
                    indentReceiptDate: merged.indentReceiptDate || undefined,
                    shipmentDate: merged.shipmentDate || undefined,
                    targetReceiptDate:
                      merged.targetReceiptDate ||
                      merged.plannedDeliveryDate ||
                      merged.poDeliveryDate ||
                      getTodayDateString(),
                    actualReceiptDate: merged.actualReceiptDate || undefined,
                    leatherName: sub.leatherName || '',
                    colour: sub.colour || '',
                    quantity: Number(sub.quantity) || 0,
                    tannery: sub.tannery || '',
                    actualPoReleaseDate: merged.actualPoReleaseDate || undefined,
                    qtyInStock: merged.qtyInStock !== undefined ? Number(merged.qtyInStock) : undefined,
                    qtyOrdered: merged.qtyOrdered !== undefined ? Number(merged.qtyOrdered) : undefined,
                    poDeliveryDate: merged.poDeliveryDate || undefined,
                    plannedDeliveryDate: merged.plannedDeliveryDate || undefined,
                    qtyReceived: undefined,
                    status: merged.status,
                    remarks: merged.remarks || '',
                    remarkHistory: merged.remarkHistory || [],
                    createdAt: nowIso,
                    updatedAt: nowIso
                  };
                  try {
                    const { error: insErr } = await supabase
                      .from(TABLE['daily-leather'])
                      .insert(toDbRow(newEntry));
                    if (!insErr) {
                      insertedNewEntries.push(newEntry);
                    } else {
                      console.error('Error inserting new leather item:', insErr);
                    }
                  } catch (insCatch) {
                    console.error('Exception inserting new leather item:', insCatch);
                  }
                }
                if (insertedNewEntries.length > 0) {
                  setDailyLeather(prev => [...insertedNewEntries, ...prev]);
                }
              })();
            }
          }
          break;
        }
        case 'material':
          setMaterials(prev => prev.map(i => i.id === id ? (merged as MaterialItem) : i)); break;
        case 'packaging':
          setPackaging(prev => prev.map(i => i.id === id ? (merged as PackagingItem) : i)); break;
      }

      // Requirement 6: Sync Actual Receipt Date back to Production Planning stage
      if (actualDate && (module === 'daily-leather' || module === 'material' || module === 'packaging')) {
        const planningId = (merged as any).productionPlanningId || (existing as any).productionPlanningId;
        const woNo = (merged as any).woNo || (existing as any).woNo;

        const stageTargetName =
          module === 'daily-leather' ? 'LEATHER IN-HOUSE' :
          module === 'material' ? 'MATERIALS IN-HOUSE' :
          module === 'packaging' ? 'PACKING MATERIALS IN-HOUSE' : '';

        if (stageTargetName && (planningId || woNo)) {
          (async () => {
            try {
              let query = supabase.from('sample_system_product_planning').select('id, stages, current_stage');
              if (planningId) {
                query = query.eq('id', planningId);
              } else if (woNo) {
                query = query.eq('wo_no', woNo);
              }
              const { data: planningRows } = await query;
              if (planningRows && planningRows.length > 0) {
                for (const row of planningRows) {
                  let stagesArr = Array.isArray(row.stages) ? [...row.stages] : [];
                  let changed = false;
                  stagesArr = stagesArr.map((stg: any) => {
                    if (stg.name === stageTargetName) {
                      changed = true;
                      return { ...stg, actualDate: actualDate };
                    }
                    return stg;
                  });
                  if (changed) {
                    await supabase
                      .from('sample_system_product_planning')
                      .update({ stages: stagesArr })
                      .eq('id', row.id);
                  }
                }
              }
            } catch (syncErr) {
              console.error('[Procurement] Failed to sync stage actualDate to Production Planning:', syncErr);
            }
          })();
        }
      }

      const identifier = (merged as any).woNo || merged.id;
      if (movingToHistory) {
        await logActivity('COMPLETE', module, identifier, `Procurement completed on ${actualDate}. Moved to History.`);
        showToast('Record moved to history', 'success', 'Procurement Completed');
      } else {
        const detailText = changeLogs.length > 0 ? changeLogs.join(' • ') : 'Updated details and status.';
        await logActivity('UPDATE', module, identifier, detailText);
        showToast('Record updated successfully', 'success');
      }
      return true;
    } catch (err) {
      console.error('[Procurement] updateRecord error:', err);
      showToast('Error updating record', 'error');
      return false;
    }
  };

  const completeProcurement = async (module: ModuleType, id: string, actualDate: string): Promise<boolean> => {
    return updateRecord(module, id, { actualReceiptDate: actualDate });
  };

  // ── DELETE ──────────────────────────────────────────────────────────────────
  const deleteRecord = async (module: ModuleType, id: string): Promise<boolean> => {
    try {
      const existing = getRecordById(module, id);
      const identifier = existing ? ((existing as any).woNo || existing.id) : id;

      const { error } = await supabase.from(TABLE[module]).delete().eq('id', id);
      if (error) throw error;

      switch (module) {
        case 'new-leather':  setNewLeather(prev => prev.filter(i => i.id !== id)); break;
        case 'daily-leather': setDailyLeather(prev => prev.filter(i => i.id !== id)); break;
        case 'material':     setMaterials(prev => prev.filter(i => i.id !== id)); break;
        case 'packaging':    setPackaging(prev => prev.filter(i => i.id !== id)); break;
      }

      await logActivity('DELETE', module, identifier, 'Permanently removed record.');
      showToast('Record deleted successfully', 'success');
      return true;
    } catch (err) {
      console.error('[Procurement] deleteRecord error:', err);
      showToast('Failed to delete record', 'error');
      return false;
    }
  };

  // ── ADD REMARK ──────────────────────────────────────────────────────────────
  const addRemarkToRecord = async (module: ModuleType, id: string, remarkText: string): Promise<boolean> => {
    try {
      const existing = getRecordById(module, id);
      if (!existing) return false;

      const newRemark: RemarkEntry = {
        id: 'rem-' + Date.now(),
        text: remarkText.trim(),
        author: currentUser ? currentUser.name : 'System User',
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [...existing.remarkHistory, newRemark];
      const identifier = (existing as any).woNo || existing.id;

      // Update Supabase
      const { error } = await supabase
        .from(TABLE[module])
        .update({
          remarks: newRemark.text,
          remark_history: updatedHistory,
          updated_at: newRemark.timestamp
        })
        .eq('id', id);
      if (error) throw error;

      // Update local state
      const patch = { remarks: newRemark.text, remarkHistory: updatedHistory, updatedAt: newRemark.timestamp };
      switch (module) {
        case 'new-leather':  setNewLeather(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i)); break;
        case 'daily-leather': setDailyLeather(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i)); break;
        case 'material':     setMaterials(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i)); break;
        case 'packaging':    setPackaging(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i)); break;
      }

      await logActivity('ADD_REMARK', module, identifier, `Added remark: "${newRemark.text.substring(0, 50)}..."`);
      showToast('Remark history saved', 'success');
      return true;
    } catch (err) {
      console.error('[Procurement] addRemarkToRecord error:', err);
      showToast('Failed to save remark', 'error');
      return false;
    }
  };

  // ── RESET ───────────────────────────────────────────────────────────────────
  const resetAllDataToDefault = useCallback(() => {
    setNewLeather([]);
    setDailyLeather([]);
    setMaterials([]);
    setPackaging([]);
    setActivityLogs([]);
    localStorage.removeItem('erp_new_leather');
    localStorage.removeItem('erp_daily_leather');
    localStorage.removeItem('erp_materials');
    localStorage.removeItem('erp_packaging');
    localStorage.removeItem('erp_activity_logs');
    showToast('Local cache cleared', 'info');
  }, [showToast]);

  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    showToast('Logged out of active session. Application data preserved.', 'info');
  }, [showToast]);

  const loginUser = useCallback(() => {
    setCurrentUser(DEFAULT_USER);
    showToast(`Welcome back, ${DEFAULT_USER.name}`, 'success');
  }, [showToast]);

  return (
    <ProcurementContext.Provider
      value={{
        activeNav, activeTab, setActiveNav, setActiveTab,
        newLeather, dailyLeather, materials, packaging, activityLogs, currentUser,
        isLoading,
        getModuleCounts, getDashboardStats,
        createRecord, updateRecord, deleteRecord, addRemarkToRecord, completeProcurement,
        getRecordById, resetAllDataToDefault, logoutUser, loginUser
      }}
    >
      {children}
    </ProcurementContext.Provider>
  );
};

export function useProcurement() {
  const context = useContext(ProcurementContext);
  if (!context) throw new Error('useProcurement must be used within a ProcurementProvider');
  return context;
}

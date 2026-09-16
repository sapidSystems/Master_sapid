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
import {
  INITIAL_NEW_LEATHER,
  INITIAL_DAILY_LEATHER,
  INITIAL_MATERIAL,
  INITIAL_PACKAGING,
  INITIAL_ACTIVITY_LOGS
} from '../utils/seedData';
import { calculateStatus, calculateMaterialStatus, addDays, getTodayDateString } from '../utils/dateUtils';
import { useToast } from './ToastContext';

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

interface ProcurementContextType {
  // Navigation State
  activeNav: string; // 'dashboard' | 'activity' | 'new-leather' | 'daily-leather' | 'material' | 'packaging'
  activeTab: ViewTab; // 'pending' | 'history'
  setActiveNav: (nav: string) => void;
  setActiveTab: (tab: ViewTab) => void;
  
  // Data
  newLeather: NewLeatherItem[];
  dailyLeather: DailyLeatherItem[];
  materials: MaterialItem[];
  packaging: PackagingItem[];
  activityLogs: ActivityLogEntry[];
  currentUser: UserProfile | null;
  
  // Counts & Stats
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

  // Operations
  createRecord: (module: ModuleType, data: any) => Promise<boolean>;
  updateRecord: (module: ModuleType, id: string, updates: any) => Promise<boolean>;
  deleteRecord: (module: ModuleType, id: string) => Promise<boolean>;
  addRemarkToRecord: (module: ModuleType, id: string, remarkText: string) => Promise<boolean>;
  completeProcurement: (module: ModuleType, id: string, actualDate: string) => Promise<boolean>;
  
  // Helpers
  getRecordById: (module: ModuleType, id: string) => AnyProcurementItem | undefined;
  resetAllDataToDefault: () => void;
  logoutUser: () => void;
  loginUser: () => void;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export const ProcurementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [activeNav, setActiveNavState] = useState<string>(() => {
    try {
      return localStorage.getItem('erp_active_nav') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [activeTab, setActiveTabState] = useState<ViewTab>(() => {
    try {
      return (localStorage.getItem('erp_active_tab') as ViewTab) || 'pending';
    } catch {
      return 'pending';
    }
  });

  const setActiveNav = (nav: string) => {
    setActiveNavState(nav);
    try {
      localStorage.setItem('erp_active_nav', nav);
    } catch {}
  };

  const setActiveTab = (tab: ViewTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('erp_active_tab', tab);
    } catch {}
  };

  // Load from localStorage or initialize with empty array
  const [newLeather, setNewLeather] = useState<NewLeatherItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_new_leather');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dailyLeather, setDailyLeather] = useState<DailyLeatherItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_daily_leather');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_materials');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [packaging, setPackaging] = useState<PackagingItem[]>(() => {
    try {
      const saved = localStorage.getItem('erp_packaging');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('erp_activity_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('erp_current_user_session');
      return saved !== null ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // Sync to LocalStorage on updates
  useEffect(() => {
    try {
      localStorage.setItem('erp_new_leather', JSON.stringify(newLeather));
    } catch (e) { console.error(e); }
  }, [newLeather]);

  useEffect(() => {
    try {
      localStorage.setItem('erp_daily_leather', JSON.stringify(dailyLeather));
    } catch (e) { console.error(e); }
  }, [dailyLeather]);

  useEffect(() => {
    try {
      localStorage.setItem('erp_materials', JSON.stringify(materials));
    } catch (e) { console.error(e); }
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem('erp_packaging', JSON.stringify(packaging));
    } catch (e) { console.error(e); }
  }, [packaging]);

  useEffect(() => {
    try {
      localStorage.setItem('erp_activity_logs', JSON.stringify(activityLogs));
    } catch (e) { console.error(e); }
  }, [activityLogs]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('erp_current_user_session', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('erp_current_user_session');
      }
    } catch (e) { console.error(e); }
  }, [currentUser]);

  // Activity logger helper
  const logActivity = useCallback((
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
  }, [currentUser]);

  // Helper to fetch single record
  const getRecordById = useCallback((module: ModuleType, id: string): AnyProcurementItem | undefined => {
    switch (module) {
      case 'new-leather':
        return newLeather.find(i => i.id === id);
      case 'daily-leather':
        return dailyLeather.find(i => i.id === id);
      case 'material':
        return materials.find(i => i.id === id);
      case 'packaging':
        return packaging.find(i => i.id === id);
    }
  }, [newLeather, dailyLeather, materials, packaging]);

  // Calculate statistics
  const getModuleCounts = useCallback((module: ModuleType) => {
    let list: AnyProcurementItem[] = [];
    switch (module) {
      case 'new-leather': list = newLeather; break;
      case 'daily-leather': list = dailyLeather; break;
      case 'material': list = materials; break;
      case 'packaging': list = packaging; break;
    }

    const pending = list.filter(i => !i.actualReceiptDate).length;
    const history = list.filter(i => !!i.actualReceiptDate).length;
    const delayed = list.filter(i => !i.actualReceiptDate && i.status === 'delayed').length;
    const onTime = list.filter(i => !i.actualReceiptDate && (i.status === 'on-time' || i.status === 'pending')).length;

    return { pending, history, delayed, onTime };
  }, [newLeather, dailyLeather, materials, packaging]);

  const getDashboardStats = useCallback(() => {
    const allItems: AnyProcurementItem[] = [
      ...newLeather,
      ...dailyLeather,
      ...materials,
      ...packaging
    ];

    const pendingItems = allItems.filter(i => !i.actualReceiptDate);
    const completedItems = allItems.filter(i => !!i.actualReceiptDate);

    const totalPending = pendingItems.length;
    const totalDelayed = pendingItems.filter(i => i.status === 'delayed').length;
    const totalOnTime = pendingItems.filter(i => i.status === 'on-time' || i.status === 'pending').length;
    const totalCompleted = completedItems.length;

    const newLeatherPending = newLeather.filter(i => !i.actualReceiptDate).length;
    const dailyLeatherPending = dailyLeather.filter(i => !i.actualReceiptDate).length;
    const materialsPending = materials.filter(i => !i.actualReceiptDate).length;
    const packagingPending = packaging.filter(i => !i.actualReceiptDate).length;

    return {
      totalPending,
      totalDelayed,
      totalOnTime,
      totalCompleted,
      newLeatherPending,
      dailyLeatherPending,
      materialsPending,
      packagingPending
    };
  }, [newLeather, dailyLeather, materials, packaging]);

  // Create record
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
          setNewLeather(prev => [newItem, ...prev]);
          identifier = `${newId} (${newItem.leatherName})`;
          break;
        }
        case 'daily-leather': {
          const rawItems: LeatherSubItem[] = data.items && data.items.length > 0 ? data.items : [
            {
              id: 'sub-' + Date.now(),
              leatherName: data.leatherName || 'Standard Leather',
              colour: data.colour || 'Black',
              quantity: Number(data.quantity) || 100,
              tannery: data.tannery || 'Tannery 1',
              remarks: data.remarks || ''
            }
          ];

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
            };
          });

          setDailyLeather(prev => [...newEntries, ...prev]);
          identifier = `${data.woNo} (${newEntries.length} leather item${newEntries.length > 1 ? 's' : ''})`;
          break;
        }
        case 'material': {
          const newId = 'MAT-' + (3000 + materials.length + 1);
          const indentDate = data.indentReceiptDate || data.woDate || data.date || getTodayDateString();
          const targetStockCheckDate = addDays(indentDate, 3);
          const poReleaseTargetDate = addDays(targetStockCheckDate, 2);
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
          setMaterials(prev => [newItem, ...prev]);
          identifier = `${newItem.woNo} (${newItem.materialName})`;
          break;
        }
        case 'packaging': {
          const newId = 'PKG-' + (4000 + packaging.length + 1);
          const indentDate = data.indentReceiptDate || data.woDate || data.date || getTodayDateString();
          const targetStockCheckDate = addDays(indentDate, 3);
          const poReleaseTargetDate = addDays(targetStockCheckDate, 2);
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
          setPackaging(prev => [newItem, ...prev]);
          identifier = `${newItem.woNo} (${newItem.packagingType})`;
          break;
        }
      }

      logActivity('CREATE', module, identifier, `New ${module} order placed.`);
      showToast('Record created successfully', 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Failed to create record. Check input values.', 'error');
      return false;
    }
  };

  // Update record
  const updateRecord = async (module: ModuleType, id: string, updates: any): Promise<boolean> => {
    try {
      const nowIso = new Date().toISOString();
      const existing = getRecordById(module, id);
      if (!existing) {
        showToast('Record not found', 'error');
        return false;
      }

      const targetDate = updates.targetReceiptDate !== undefined ? updates.targetReceiptDate : existing.targetReceiptDate;
      const actualDate = updates.actualReceiptDate !== undefined ? updates.actualReceiptDate : existing.actualReceiptDate;
      let newStatus = calculateStatus(targetDate, actualDate);

      // Build detailed change list for audit trail
      const changeLogs: string[] = [];
      
      if (updates.leatherName && updates.leatherName !== (existing as any).leatherName) {
        changeLogs.push(`Leather Name changed to "${updates.leatherName}"`);
      }
      if (updates.colour && updates.colour !== (existing as any).colour) {
        changeLogs.push(`Colour changed to "${updates.colour}"`);
      }
      if (updates.quantity !== undefined && Number(updates.quantity) !== Number((existing as any).quantity)) {
        changeLogs.push(`Quantity updated to ${updates.quantity}`);
      }
      if (updates.tannery && updates.tannery !== (existing as any).tannery) {
        changeLogs.push(`Tannery updated to "${updates.tannery}"`);
      }
      if (updates.supplier && updates.supplier !== (existing as any).supplier) {
        changeLogs.push(`Supplier updated to "${updates.supplier}"`);
      }
      if (updates.buyerCode && updates.buyerCode !== existing.buyerCode) {
        changeLogs.push(`Buyer Code changed to "${updates.buyerCode}"`);
      }
      if (updates.actualPoReleaseDate && updates.actualPoReleaseDate !== (existing as any).actualPoReleaseDate) {
        changeLogs.push(`Actual PO Release Date set to ${updates.actualPoReleaseDate}`);
      }
      if (updates.actualReceiptDate && updates.actualReceiptDate !== existing.actualReceiptDate) {
        changeLogs.push(`Actual Receipt Date set to ${updates.actualReceiptDate}. Order Completed.`);
      }
      if (updates.targetReceiptDate && updates.targetReceiptDate !== existing.targetReceiptDate) {
        changeLogs.push(`Target Receipt Date updated to ${updates.targetReceiptDate}`);
      }
      if (updates.newRemark && updates.newRemark.trim()) {
        changeLogs.push(`Remark: "${updates.newRemark.trim()}"`);
      }

      let updatedRemarkHistory = [...(existing.remarkHistory || [])];
      if (changeLogs.length > 0) {
        updatedRemarkHistory.push({
          id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          text: changeLogs.join(' • '),
          author: currentUser ? currentUser.name : 'System User',
          timestamp: nowIso
        });
      } else {
        updatedRemarkHistory.push({
          id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          text: 'Procurement details updated.',
          author: currentUser ? currentUser.name : 'System User',
          timestamp: nowIso
        });
      }

      const merged: any = {
        ...existing,
        ...updates,
        remarkHistory: updatedRemarkHistory,
        updatedAt: nowIso
      };
      delete merged.newRemark;

      if (module === 'material' || module === 'packaging') {
        const indentDate = merged.indentReceiptDate || merged.woDate || merged.date;
        merged.targetStockCheckDate = addDays(indentDate, 3);
        merged.poReleaseTargetDate = addDays(merged.targetStockCheckDate, 2);
        if (merged.expectedMaterialReceiptDate) {
          merged.targetReceiptDate = merged.expectedMaterialReceiptDate;
        }
        newStatus = calculateMaterialStatus(merged.expectedMaterialReceiptDate, merged.actualReceiptDate);
      }

      merged.status = newStatus;

      // Check if moving to history
      const movingToHistory = !existing.actualReceiptDate && !!merged.actualReceiptDate;



      switch (module) {
        case 'new-leather':
          setNewLeather(prev => prev.map(i => (i.id === id ? (merged as NewLeatherItem) : i)));
          break;
        case 'daily-leather':
          setDailyLeather(prev => prev.map(i => (i.id === id ? (merged as DailyLeatherItem) : i)));
          break;
        case 'material':
          setMaterials(prev => prev.map(i => (i.id === id ? (merged as MaterialItem) : i)));
          break;
        case 'packaging':
          setPackaging(prev => prev.map(i => (i.id === id ? (merged as PackagingItem) : i)));
          break;
      }

      const identifier = (merged as any).woNo || merged.id;
      if (movingToHistory) {
        logActivity('COMPLETE', module, identifier, `Procurement completed on ${actualDate}. Moved to History.`);
        showToast('Record moved to history', 'success', 'Procurement Completed');
      } else {
        logActivity('UPDATE', module, identifier, `Updated details and status.`);
        showToast('Record updated successfully', 'success');
      }
      return true;
    } catch (err) {
      console.error(err);
      showToast('Error updating record', 'error');
      return false;
    }
  };

  // Complete procurement directly
  const completeProcurement = async (module: ModuleType, id: string, actualDate: string): Promise<boolean> => {
    return updateRecord(module, id, { actualReceiptDate: actualDate });
  };

  // Delete record
  const deleteRecord = async (module: ModuleType, id: string): Promise<boolean> => {
    try {
      const existing = getRecordById(module, id);
      const identifier = existing ? ((existing as any).woNo || existing.id) : id;

      switch (module) {
        case 'new-leather':
          setNewLeather(prev => prev.filter(i => i.id !== id));
          break;
        case 'daily-leather':
          setDailyLeather(prev => prev.filter(i => i.id !== id));
          break;
        case 'material':
          setMaterials(prev => prev.filter(i => i.id !== id));
          break;
        case 'packaging':
          setPackaging(prev => prev.filter(i => i.id !== id));
          break;
      }

      logActivity('DELETE', module, identifier, `Permanently removed record.`);
      showToast('Record deleted successfully', 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Failed to delete record', 'error');
      return false;
    }
  };

  // Add Remark
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

      switch (module) {
        case 'new-leather':
          setNewLeather(prev => prev.map(i => i.id === id ? { ...i, remarks: newRemark.text, remarkHistory: updatedHistory, updatedAt: newRemark.timestamp } : i));
          break;
        case 'daily-leather':
          setDailyLeather(prev => prev.map(i => i.id === id ? { ...i, remarks: newRemark.text, remarkHistory: updatedHistory, updatedAt: newRemark.timestamp } : i));
          break;
        case 'material':
          setMaterials(prev => prev.map(i => i.id === id ? { ...i, remarks: newRemark.text, remarkHistory: updatedHistory, updatedAt: newRemark.timestamp } : i));
          break;
        case 'packaging':
          setPackaging(prev => prev.map(i => i.id === id ? { ...i, remarks: newRemark.text, remarkHistory: updatedHistory, updatedAt: newRemark.timestamp } : i));
          break;
      }

      logActivity('ADD_REMARK', module, identifier, `Added remark: "${newRemark.text.substring(0, 50)}..."`);
      showToast('Remark history saved', 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Failed to save remark', 'error');
      return false;
    }
  };

  // Clear all saved data
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
    showToast('Database reset to empty state', 'info');
  }, [showToast]);

  // Logout (clears session without deleting app data per Req #71)
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
        activeNav,
        activeTab,
        setActiveNav,
        setActiveTab,
        newLeather,
        dailyLeather,
        materials,
        packaging,
        activityLogs,
        currentUser,
        getModuleCounts,
        getDashboardStats,
        createRecord,
        updateRecord,
        deleteRecord,
        addRemarkToRecord,
        completeProcurement,
        getRecordById,
        resetAllDataToDefault,
        logoutUser,
        loginUser
      }}
    >
      {children}
    </ProcurementContext.Provider>
  );
};

export function useProcurement() {
  const context = useContext(ProcurementContext);
  if (!context) {
    throw new Error('useProcurement must be used within a ProcurementProvider');
  }
  return context;
}

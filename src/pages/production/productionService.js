import supabase from '../../SupabaseClient';
import { addWorkingDays } from '../../procurement/utils/dateUtils';

export const notifyProductionUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('production-updated'));
  }
};

export const STAGES_LIST = [
  'HANDOVER',
  'LEATHER IN-HOUSE',
  'MATERIALS IN-HOUSE',
  'PACKING MATERIALS IN-HOUSE',
  'CUTTING COMPLETION',
  'FABRICATION COMPLETION',
  'QA COMPLETED',
  'Planned Shipment'
];

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    let date;
    if (typeof dateStr === 'string' && dateStr.length === 10 && dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      date = new Date(y, m - 1, d);
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
};

export const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Extract all remark records across plans (both overall W/O remarks and stage-level remarks)
 * Each entry is a discrete history record.
 */
export const extractRemarkRecords = (plans) => {
  if (!Array.isArray(plans)) return [];
  const records = [];

  plans.forEach(plan => {
    if (!plan) return;

    // 1. Overall W/O Remarks
    if (plan.remarks && String(plan.remarks).trim()) {
      const firstStage = Array.isArray(plan.stages) ? plan.stages[0] : null;
      records.push({
        id: `${plan.id}-overall`,
        planId: plan.id,
        woNo: plan.woNo || '—',
        buyer: plan.buyer || '—',
        type: 'overall',
        sourceName: 'W/O Notes',
        stageName: 'Overall Remarks',
        remark: String(plan.remarks).trim(),
        date: firstStage?.woRemarkDate || plan.remarkDate || plan.woDate || plan.created_at || plan.timestamp || '',
        author: firstStage?.woRemarkAuthor || plan.remarkAuthor || plan.addedBy || 'Merchandiser',
        isHistory: Boolean(plan.isHistory),
        plan
      });
    }

    // 2. Stage-level Remarks
    const stages = plan.stages || [];
    stages.forEach((stage, idx) => {
      if (stage && stage.remarks && String(stage.remarks).trim()) {
        records.push({
          id: `${plan.id}-stage-${idx}`,
          planId: plan.id,
          woNo: plan.woNo || '—',
          buyer: plan.buyer || '—',
          type: 'stage',
          sourceName: stage.name || `Stage ${idx + 1}`,
          stageName: stage.name || `Stage ${idx + 1}`,
          remark: String(stage.remarks).trim(),
          date: stage.remarkDate || stage.actualDate || stage.plannedDate || plan.woDate || plan.created_at || '',
          author: stage.remarkAuthor || plan.addedBy || 'Stage Supervisor',
          isHistory: Boolean(plan.isHistory),
          stage,
          plan
        });
      }
    });
  });

  // Sort newest by date first
  return records.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
};

export const mapDbToLead = (dbRow) => {
  if (!dbRow) return null;
  return {
    id: dbRow.id,
    buyer: dbRow.buyer || '',
    woNo: dbRow.wo_no || '',
    wResDate: dbRow.w_res_date || '',
    woDate: dbRow.wo_date || '',
    woDespatchDate: dbRow.wo_despatch_date || '',
    qty: dbRow.qty || '',
    remarks: dbRow.remarks || '',
    addedBy: dbRow.added_by || '',
    currentStage: dbRow.current_stage || 0,
    isHistory: dbRow.is_history || false,
    historyTimestamp: dbRow.history_timestamp || '',
    stages: Array.isArray(dbRow.stages) ? dbRow.stages : [],
    timestamp: dbRow.created_at || '',
    planDate: dbRow.plan_date || '',
    approvalStatus: dbRow.approval_status || 'draft', // 'draft' | 'pending_approval' | 'approved' | 'rejected'
    approvalNote: dbRow.approval_note || '',
    approvedBy: dbRow.approved_by || '',
    approvedAt: dbRow.approved_at || '',
    procurementPushed: dbRow.procurement_pushed || false,
  };
};

export const mapLeadToDb = (lead) => {
  if (!lead) return null;
  return {
    id: lead.id,
    buyer: lead.buyer,
    wo_no: lead.woNo,
    w_res_date: lead.wResDate || null,
    wo_date: lead.woDate || null,
    wo_despatch_date: lead.woDespatchDate || null,
    qty: lead.qty,
    remarks: lead.remarks || null,
    added_by: lead.addedBy || null,
    current_stage: lead.currentStage || 0,
    is_history: lead.isHistory || false,
    history_timestamp: lead.historyTimestamp || null,
    stages: lead.stages || null,
    plan_date: lead.planDate || null,
    approval_status: lead.approvalStatus || 'draft',
    approval_note: lead.approvalNote || null,
    approved_by: lead.approvedBy || null,
    approved_at: lead.approvedAt || null,
    procurement_pushed: lead.procurementPushed || false,
  };
};

export const fetchProductionPlans = async () => {
  const { data, error } = await supabase
    .from('sample_system_product_planning')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbToLead);
};

export const createProductionPlan = async (formData, currentUser) => {
  const id = `PLAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const defaultStages = STAGES_LIST.map(name => ({
    name,
    plannedDate: '',
    actualDate: '',
    remarks: ''
  }));

  const newLead = {
    id,
    buyer: (formData.buyer || '').trim(),
    woNo: (formData.woNo || '').trim(),
    wResDate: formData.wResDate || null,
    woDate: formData.woDate || null,
    woDespatchDate: formData.woDespatchDate || null,
    qty: formData.qty || '0',
    remarks: formData.remarks || '',
    addedBy: currentUser?.name || 'Admin User',
    currentStage: 0,
    isHistory: false,
    stages: defaultStages,
    planDate: null,
    approvalStatus: 'draft',
    approvalNote: null,
    approvedBy: null,
    approvedAt: null,
    procurementPushed: false,
  };

  const dbRow = mapLeadToDb(newLead);
  const { error } = await supabase
    .from('sample_system_product_planning')
    .insert([dbRow]);
  if (error) throw error;
  notifyProductionUpdated();
  return newLead;
};

export const updateProductionPlan = async (id, updates) => {
  const cleanUpdates = {};
  if (updates.buyer !== undefined) cleanUpdates.buyer = updates.buyer;
  if (updates.woNo !== undefined) cleanUpdates.wo_no = updates.woNo;
  if (updates.wResDate !== undefined) cleanUpdates.w_res_date = updates.wResDate || null;
  if (updates.woDate !== undefined) cleanUpdates.wo_date = updates.woDate || null;
  if (updates.woDespatchDate !== undefined) cleanUpdates.wo_despatch_date = updates.woDespatchDate || null;
  if (updates.qty !== undefined) cleanUpdates.qty = updates.qty;
  if (updates.remarks !== undefined) cleanUpdates.remarks = updates.remarks || null;
  if (updates.stages !== undefined) cleanUpdates.stages = updates.stages;
  if (updates.currentStage !== undefined) cleanUpdates.current_stage = updates.currentStage;
  if (updates.isHistory !== undefined) cleanUpdates.is_history = updates.isHistory;
  if (updates.historyTimestamp !== undefined) cleanUpdates.history_timestamp = updates.historyTimestamp;
  if (updates.planDate !== undefined) cleanUpdates.plan_date = updates.planDate || null;
  if (updates.approvalStatus !== undefined) cleanUpdates.approval_status = updates.approvalStatus;
  if (updates.approvalNote !== undefined) cleanUpdates.approval_note = updates.approvalNote;

  const { error } = await supabase
    .from('sample_system_product_planning')
    .update(cleanUpdates)
    .eq('id', id);
  if (error) throw error;
  notifyProductionUpdated();
  return true;
};

export const deleteProductionPlan = async (id) => {
  const { error } = await supabase
    .from('sample_system_product_planning')
    .delete()
    .eq('id', id);
  if (error) throw error;
  notifyProductionUpdated();
  return true;
};

export const submitForApproval = async (id, planDate, stageUpdates = null) => {
  const updatePayload = {
    plan_date: planDate,
    approval_status: 'pending_approval',
    approval_note: null
  };
  if (stageUpdates && Array.isArray(stageUpdates)) {
    updatePayload.stages = stageUpdates;
  }

  const { error } = await supabase
    .from('sample_system_product_planning')
    .update(updatePayload)
    .eq('id', id);
  if (error) throw error;
  notifyProductionUpdated();
  return true;
};

export const approveProductionPlan = async ({ lead, note = '', currentUser }) => {
  const nowIso = new Date().toISOString();
  const userName = currentUser?.name || 'Admin User';

  // 1. Update sample_system_product_planning
  const updatePayload = {
    approval_status: 'approved',
    approval_note: note || 'Approved for procurement',
    approved_by: userName,
    approved_at: nowIso,
    procurement_pushed: true,
  };
  if (lead.planDate) {
    updatePayload.plan_date = lead.planDate;
  }
  if (lead.stages && Array.isArray(lead.stages)) {
    updatePayload.stages = lead.stages;
  }

  const { error: planError } = await supabase
    .from('sample_system_product_planning')
    .update(updatePayload)
    .eq('id', lead.id);
  if (planError) throw planError;

  // 2. Add entry to approval history
  try {
    await supabase
      .from('production_planning_approval_history')
      .insert([{
        planning_id: lead.id,
        action: 'approved',
        note: note || 'Plan approved and dispatched to procurement modules',
        acted_by: userName,
        acted_at: nowIso
      }]);
  } catch (histErr) {
    console.warn('[productionService] Approval history insert warning:', histErr);
  }

  // 3. Push records to Procurement modules (Daily Leather, Material, Packaging)
  const effectiveDate = lead.planDate || lead.woDate || getTodayDate();
  const baseProcurementRow = {
    wo_no: lead.woNo,
    buyer_code: lead.buyer,
    date: effectiveDate,
    wo_date: lead.woDate || null,
    indent_receipt_date: lead.wResDate || lead.woDate || null,
    shipment_date: lead.woDespatchDate || null,
    target_receipt_date: lead.planDate || effectiveDate,
    production_planning_id: lead.id,
    source: 'production_planning',
    status: 'pending',
    remarks: `Created from Production Plan Approval (${lead.woNo}). ${lead.remarks || ''}`.trim(),
    remark_history: [{
      id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      text: `Approved in Production Planning by ${userName}. Dispatched for procurement.`,
      author: userName,
      timestamp: nowIso
    }],
    created_at: nowIso,
    updated_at: nowIso
  };

  // Calculate target dates according to manufacturing working days
  const indentBase = lead.wResDate || lead.woDate || effectiveDate;
  const matStockCheck = addWorkingDays(indentBase, 3);
  const matPoRelease = addWorkingDays(matStockCheck, 2);

  const pkgStockCheck = addWorkingDays(indentBase, 7);
  const pkgPoRelease = addWorkingDays(pkgStockCheck, 2);

  const dlPoRelease = addWorkingDays(indentBase, 2);

  // 3a. Daily Leather
  const dlRow = {
    ...baseProcurementRow,
    id: `DL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    module: 'daily-leather',
    leather_name: 'Production Leather Requirement',
    colour: 'Standard',
    quantity: Number(lead.qty) || 0,
    tannery: 'Pending Selection',
    po_release_target_date: dlPoRelease,
  };

  // 3b. Daily Material
  const matRow = {
    ...baseProcurementRow,
    id: `MAT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    module: 'material',
    material_name: 'Production Material Requirement',
    specification: 'Per WO Specification',
    quantity: Number(lead.qty) || 0,
    unit: 'pcs',
    supplier: 'Pending Selection',
    target_stock_check_date: matStockCheck,
    po_release_target_date: matPoRelease,
  };

  // 3c. Daily Packaging
  const pkgRow = {
    ...baseProcurementRow,
    id: `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    module: 'packaging',
    packaging_type: 'Standard Packaging Requirement',
    specification: 'Per Export Standard',
    quantity: Number(lead.qty) || 0,
    unit: 'pcs',
    supplier: 'Pending Selection',
    target_stock_check_date: pkgStockCheck,
    po_release_target_date: pkgPoRelease,
  };

  // Insert into all 3 procurement tables
  await Promise.allSettled([
    supabase.from('procurement_daily_leather').insert([dlRow]),
    supabase.from('procurement_material').insert([matRow]),
    supabase.from('procurement_packaging').insert([pkgRow]),
  ]);

  notifyProductionUpdated();
  return true;
};

export const rejectProductionPlan = async ({ lead, note = '', currentUser }) => {
  const nowIso = new Date().toISOString();
  const userName = currentUser?.name || 'Admin User';

  // 1. Update sample_system_product_planning to rejected
  const { error } = await supabase
    .from('sample_system_product_planning')
    .update({
      approval_status: 'rejected',
      approval_note: note || 'Rejected'
    })
    .eq('id', lead.id);
  if (error) throw error;

  // 2. Log in history
  try {
    await supabase
      .from('production_planning_approval_history')
      .insert([{
        planning_id: lead.id,
        action: 'rejected',
        note: note || 'Plan rejected and returned for revision',
        acted_by: userName,
        acted_at: nowIso
      }]);
  } catch (histErr) {
    console.warn('[productionService] Rejection history insert warning:', histErr);
  }

  notifyProductionUpdated();
  return true;
};

export const fetchApprovalHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('production_planning_approval_history')
      .select('*')
      .order('acted_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[productionService] fetchApprovalHistory error:', err);
    return [];
  }
};

/**
 * Identify if a stage name corresponds to one of the 3 procurement modules:
 * - LEATHER IN-HOUSE -> Daily Leather Procurement
 * - MATERIALS IN-HOUSE -> Daily Material Procurement
 * - PACKING MATERIALS IN-HOUSE -> Daily Packaging Procurement
 */
export const getProcurementModuleConfig = (stageName) => {
  if (!stageName) return null;
  const n = String(stageName).toUpperCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  if (n.includes('LEATHER') && n.includes('HOUSE')) {
    return {
      module: 'daily-leather',
      tableName: 'procurement_daily_leather',
      stageName: 'LEATHER IN-HOUSE',
      label: 'Daily Leather Procurement',
      dateColumnLabel: 'Actual Receipt Date for Complete Order'
    };
  }
  if (n.includes('PACK') && n.includes('HOUSE')) {
    return {
      module: 'packaging',
      tableName: 'procurement_packaging',
      stageName: 'PACKING MATERIALS IN-HOUSE',
      label: 'Daily Packaging Procurement',
      dateColumnLabel: 'Actual Material Receipt Date'
    };
  }
  if (n.includes('MATERIAL') && n.includes('HOUSE')) {
    return {
      module: 'material',
      tableName: 'procurement_material',
      stageName: 'MATERIALS IN-HOUSE',
      label: 'Daily Material Procurement',
      dateColumnLabel: 'Actual Material Receipt Date'
    };
  }
  return null;
};

/**
 * Extract the latest remark, author, and timestamp from a procurement table row
 */
export const extractLatestProcurementRemark = (row) => {
  if (!row) return { remark: '', date: '', author: '' };

  let latestText = '';
  let latestDate = '';
  let latestAuthor = '';

  // 1. Check remark_history if it exists and has items
  if (Array.isArray(row.remark_history) && row.remark_history.length > 0) {
    const sorted = [...row.remark_history].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
    const top = sorted[0];
    if (top && top.text && String(top.text).trim()) {
      latestText = String(top.text).trim();
      latestDate = top.timestamp || row.updated_at || row.created_at || '';
      latestAuthor = top.author || 'Procurement';
    }
  }

  // 2. Fallback to row.remarks if remark_history didn't yield text
  if (!latestText && row.remarks && String(row.remarks).trim()) {
    latestText = String(row.remarks).trim();
    latestDate = row.updated_at || row.created_at || '';
    latestAuthor = 'Procurement';
  }

  return {
    remark: latestText,
    date: latestDate,
    author: latestAuthor
  };
};

/**
 * Aggregate multiple rows for a given procurement module on a work order
 */
export const aggregateProcurementRows = (rows) => {
  if (!rows || rows.length === 0) {
    return { actualDate: '', remark: '', remarkDate: '', remarkAuthor: '' };
  }

  // Valid actual receipt dates (formatted as YYYY-MM-DD)
  const validDates = rows
    .map(r => r.actual_receipt_date ? String(r.actual_receipt_date).substring(0, 10) : null)
    .filter(Boolean);
  const actualDate = validDates.length > 0 ? validDates.sort().reverse()[0] : '';

  // Find the most recent remark across all rows
  let bestRemark = { remark: '', date: '', author: '' };
  let bestTime = -1;

  rows.forEach(r => {
    const remInfo = extractLatestProcurementRemark(r);
    if (remInfo.remark) {
      const t = remInfo.date ? new Date(remInfo.date).getTime() : 0;
      if (t >= bestTime) {
        bestTime = t;
        bestRemark = remInfo;
      }
    }
  });

  return {
    actualDate,
    remark: bestRemark.remark,
    remarkDate: bestRemark.date,
    remarkAuthor: bestRemark.author
  };
};

/**
 * Fetch all procurement data across the 3 procurement tables and build an efficient lookup function
 */
export const fetchProcurementDataForOrders = async (plans = []) => {
  try {
    const [dlRes, matRes, pkgRes] = await Promise.all([
      supabase.from('procurement_daily_leather').select('id, wo_no, production_planning_id, actual_receipt_date, remarks, remark_history, created_at, updated_at'),
      supabase.from('procurement_material').select('id, wo_no, production_planning_id, actual_receipt_date, remarks, remark_history, created_at, updated_at'),
      supabase.from('procurement_packaging').select('id, wo_no, production_planning_id, actual_receipt_date, remarks, remark_history, created_at, updated_at'),
    ]);

    const dlRows = dlRes.data || [];
    const matRows = matRes.data || [];
    const pkgRows = pkgRes.data || [];

    const getMatchingRows = (rows, plan) => {
      if (!plan) return [];
      const planId = plan.id;
      const wo = plan.woNo ? String(plan.woNo).trim().toUpperCase() : '';
      return rows.filter(r => {
        if (planId && r.production_planning_id && r.production_planning_id === planId) return true;
        if (wo && r.wo_no && String(r.wo_no).trim().toUpperCase() === wo) return true;
        return false;
      });
    };

    const getInfoForPlan = (plan) => {
      if (!plan) return null;
      const dlMatch = getMatchingRows(dlRows, plan);
      const matMatch = getMatchingRows(matRows, plan);
      const pkgMatch = getMatchingRows(pkgRows, plan);
      return {
        'daily-leather': aggregateProcurementRows(dlMatch),
        'material': aggregateProcurementRows(matMatch),
        'packaging': aggregateProcurementRows(pkgMatch),
      };
    };

    return {
      dlRows,
      matRows,
      pkgRows,
      getInfoForPlan
    };
  } catch (err) {
    console.error('Error fetching procurement data for orders:', err);
    return {
      dlRows: [],
      matRows: [],
      pkgRows: [],
      getInfoForPlan: () => ({
        'daily-leather': { actualDate: '', remark: '', remarkDate: '', remarkAuthor: '' },
        'material': { actualDate: '', remark: '', remarkDate: '', remarkAuthor: '' },
        'packaging': { actualDate: '', remark: '', remarkDate: '', remarkAuthor: '' },
      })
    };
  }
};

/**
 * Fetch fresh procurement data for a single work order / plan
 */
export const fetchProcurementForSinglePlan = async (plan) => {
  if (!plan) return null;
  const wo = plan.woNo ? String(plan.woNo).trim().toUpperCase() : '';
  const planId = plan.id;

  try {
    const buildQuery = (tbl) => {
      let q = supabase.from(tbl).select('id, wo_no, production_planning_id, actual_receipt_date, remarks, remark_history, created_at, updated_at');
      if (planId && wo) {
        return q.or(`production_planning_id.eq.${planId},wo_no.eq.${wo}`);
      } else if (planId) {
        return q.eq('production_planning_id', planId);
      } else if (wo) {
        return q.eq('wo_no', wo);
      }
      return q;
    };

    const [dlRes, matRes, pkgRes] = await Promise.all([
      buildQuery('procurement_daily_leather'),
      buildQuery('procurement_material'),
      buildQuery('procurement_packaging'),
    ]);

    return {
      'daily-leather': aggregateProcurementRows(dlRes.data || []),
      'material': aggregateProcurementRows(matRes.data || []),
      'packaging': aggregateProcurementRows(pkgRes.data || []),
    };
  } catch (err) {
    console.error('Error fetching procurement for single plan:', err);
    return null;
  }
};

/**
 * Merge procurement actual dates and latest remarks into stage list
 */
export const mergeProcurementIntoStages = (stages = [], procurementInfo = null) => {
  if (!Array.isArray(stages)) return [];
  if (!procurementInfo) return stages;

  return stages.map(stage => {
    const cfg = getProcurementModuleConfig(stage.name);
    if (!cfg) return stage;

    const proc = procurementInfo[cfg.module];
    if (!proc) return stage;

    return {
      ...stage,
      actualDate: proc.actualDate || stage.actualDate || '',
      remarks: proc.remark || stage.remarks || '',
      remarkDate: proc.remarkDate || stage.remarkDate || '',
      remarkAuthor: proc.remarkAuthor || stage.remarkAuthor || 'Procurement',
      isProcurementLocked: true,
      procurementConfig: cfg
    };
  });
};


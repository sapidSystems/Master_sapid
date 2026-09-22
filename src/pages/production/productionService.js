import supabase from '../../SupabaseClient';

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
  if (updates.planDate !== undefined) cleanUpdates.plan_date = updates.planDate || null;
  if (updates.approvalStatus !== undefined) cleanUpdates.approval_status = updates.approvalStatus;
  if (updates.approvalNote !== undefined) cleanUpdates.approval_note = updates.approvalNote;

  const { error } = await supabase
    .from('sample_system_product_planning')
    .update(cleanUpdates)
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const deleteProductionPlan = async (id) => {
  const { error } = await supabase
    .from('sample_system_product_planning')
    .delete()
    .eq('id', id);
  if (error) throw error;
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
  return true;
};

export const approveProductionPlan = async ({ lead, note = '', currentUser }) => {
  const nowIso = new Date().toISOString();
  const userName = currentUser?.name || 'Admin User';

  // 1. Update sample_system_product_planning
  const { error: planError } = await supabase
    .from('sample_system_product_planning')
    .update({
      approval_status: 'approved',
      approval_note: note || 'Approved for procurement',
      approved_by: userName,
      approved_at: nowIso,
      procurement_pushed: true,
    })
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

  // 3a. Daily Leather
  const dlRow = {
    ...baseProcurementRow,
    id: `DL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    module: 'daily-leather',
    leather_name: 'Production Leather Requirement',
    colour: 'Standard',
    quantity: Number(lead.qty) || 0,
    tannery: 'Pending Selection',
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
  };

  // Insert into all 3 procurement tables
  await Promise.allSettled([
    supabase.from('procurement_daily_leather').insert([dlRow]),
    supabase.from('procurement_material').insert([matRow]),
    supabase.from('procurement_packaging').insert([pkgRow]),
  ]);

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

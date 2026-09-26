import { useState, useEffect, useCallback } from 'react';
import supabase from '../SupabaseClient';

export const DEFAULT_BUYER_CODES = [
  { id: 'BC-1', buyerCode: 'DG', buyerName: 'Dolce & Gabbana', description: 'Luxury apparel and footwear' },
  { id: 'BC-2', buyerCode: 'IT', buyerName: 'Inditex Group', description: 'Global retail fashion' },
  { id: 'BC-3', buyerCode: 'VL', buyerName: 'Valentino', description: 'Couture & leather goods' },
  { id: 'BC-4', buyerCode: 'VBL', buyerName: 'Van Bommel', description: 'Heritage shoe manufacturer' },
  { id: 'BC-5', buyerCode: 'TK', buyerName: 'Ted Baker', description: 'Lifestyle brand' },
  { id: 'BC-6', buyerCode: 'ND', buyerName: 'Nordstrom', description: 'Department store retail' },
  { id: 'BC-7', buyerCode: 'AH', buyerName: 'Armani House', description: 'Designer fashion' },
  { id: 'BC-8', buyerCode: 'OX', buyerName: 'Oxford Footwear', description: 'Classic dress shoes' },
  { id: 'BC-9', buyerCode: 'PO', buyerName: 'Polo Ralph Lauren', description: 'Apparel and accessories' },
  { id: 'BC-10', buyerCode: 'AT', buyerName: 'Ann Taylor', description: 'Retail fashion' },
  { id: 'BC-11', buyerCode: 'ZS', buyerName: 'Zalando SE', description: 'E-commerce fashion' },
  { id: 'BC-12', buyerCode: 'EE', buyerName: 'Ecco Enterprises', description: 'Footwear & leather' },
  { id: 'BC-13', buyerCode: 'DOI', buyerName: 'Department of Industry', description: 'Institutional' },
  { id: 'BC-14', buyerCode: 'AK', buyerName: 'Anne Klein', description: 'Women apparel and footwear' },
  { id: 'BC-15', buyerCode: 'DLW', buyerName: 'Deluxe Leather Works', description: 'Specialty leather' },
  { id: 'BC-16', buyerCode: 'BUYER-A1', buyerName: 'Prime Retail A1', description: 'Wholesale client' },
  { id: 'BC-17', buyerCode: 'SH', buyerName: 'Schuh Holdings', description: 'Footwear retail' },
  { id: 'BC-18', buyerCode: 'XOZ', buyerName: 'XOZ International', description: 'Export client' },
];

const LOCAL_STORAGE_KEY = 'master_buyer_codes_cache';

// Helper to read cached codes
export const getCachedBuyerCodes = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading cached buyer codes:', err);
  }
  return DEFAULT_BUYER_CODES;
};

// Helper to save cached codes
export const setCachedBuyerCodes = (codes) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(codes));
    window.dispatchEvent(new CustomEvent('buyer-codes-updated', { detail: codes }));
  } catch (err) {
    console.warn('Error saving cached buyer codes:', err);
  }
};

// Fetch master buyer codes from Supabase (falling back to cache/defaults)
export const fetchMasterBuyerCodes = async () => {
  try {
    const { data, error } = await supabase
      .from('dropdown_options')
      .select('*')
      .eq('project_type', 'buyer_code')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      const mapped = data.map(row => ({
        id: row.id,
        buyerCode: (row.task_status || '').trim().toUpperCase(),
        buyerName: row.part_name || '',
        description: row.machine_name || '',
        createdAt: row.created_at
      })).filter(b => Boolean(b.buyerCode));

      setCachedBuyerCodes(mapped);
      return mapped;
    } else {
      // Seed default buyer codes into Supabase dropdown_options
      const seedEntries = DEFAULT_BUYER_CODES.map(b => ({
        project_type: 'buyer_code',
        part_name: b.buyerName,
        task_status: b.buyerCode.toUpperCase(),
        machine_name: b.description || ''
      }));

      const { data: inserted, error: seedError } = await supabase
        .from('dropdown_options')
        .insert(seedEntries)
        .select();

      if (!seedError && inserted && inserted.length > 0) {
        const mapped = inserted.map(row => ({
          id: row.id,
          buyerCode: (row.task_status || '').trim().toUpperCase(),
          buyerName: row.part_name || '',
          description: row.machine_name || '',
          createdAt: row.created_at
        }));
        setCachedBuyerCodes(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Using cached buyer codes due to fetch error:', err);
  }

  const cached = getCachedBuyerCodes();
  return cached;
};

// Create a new Buyer Code
export const createMasterBuyerCode = async ({ buyerName = '', buyerCode, description = '' }) => {
  const cleanCode = (buyerCode || '').trim().toUpperCase();
  const cleanName = (buyerName || '').trim() || cleanCode;

  if (!cleanCode) throw new Error('Buyer Code is required');

  // Check uniqueness in current cache
  const existing = getCachedBuyerCodes();
  const found = existing.find(b => b.buyerCode.toUpperCase() === cleanCode);
  if (found) {
    return found; // Return existing record if code already exists
  }

  const payload = {
    project_type: 'buyer_code',
    part_name: cleanName,
    task_status: cleanCode,
    machine_name: description.trim()
  };

  let newId = `BC-${Date.now()}`;
  try {
    const { data, error } = await supabase
      .from('dropdown_options')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      newId = data.id;
    } else if (error) {
      console.warn('Could not insert buyer code to remote database, saving locally:', error);
    }
  } catch (err) {
    console.warn('Remote buyer code insert error, saving locally:', err);
  }

  const newRecord = {
    id: newId,
    buyerCode: cleanCode,
    buyerName: cleanName,
    description: description.trim(),
    createdAt: new Date().toISOString()
  };

  const updatedList = [...existing, newRecord].sort((a, b) => a.buyerCode.localeCompare(b.buyerCode));
  setCachedBuyerCodes(updatedList);
  return newRecord;
};

// Update an existing Buyer Code
export const updateMasterBuyerCode = async (id, { buyerName, buyerCode, description = '' }) => {
  const cleanCode = buyerCode.trim().toUpperCase();
  const cleanName = buyerName.trim();

  if (!cleanCode) throw new Error('Buyer Code is required');
  if (!cleanName) throw new Error('Customer / Buyer Name is required');

  const existing = getCachedBuyerCodes();
  const duplicate = existing.find(b => b.buyerCode.toUpperCase() === cleanCode && String(b.id) !== String(id));
  if (duplicate) {
    throw new Error(`Buyer Code "${cleanCode}" is already in use by another customer.`);
  }

  const payload = {
    part_name: cleanName,
    task_status: cleanCode,
    machine_name: description.trim()
  };

  const { error } = await supabase
    .from('dropdown_options')
    .update(payload)
    .eq('id', id);

  if (error) throw error;

  const updatedList = existing.map(b => (String(b.id) === String(id)
    ? { ...b, buyerCode: cleanCode, buyerName: cleanName, description: description.trim() }
    : b
  )).sort((a, b) => a.buyerCode.localeCompare(b.buyerCode));

  setCachedBuyerCodes(updatedList);
  return true;
};

// Delete a Buyer Code
export const deleteMasterBuyerCode = async (id) => {
  const { error } = await supabase
    .from('dropdown_options')
    .delete()
    .eq('id', id);

  if (error) throw error;

  const existing = getCachedBuyerCodes();
  const updatedList = existing.filter(b => String(b.id) !== String(id));
  setCachedBuyerCodes(updatedList);
  return true;
};

// React hook for consuming master buyer codes throughout the app
export const useBuyerCodes = () => {
  const [buyerCodes, setBuyerCodes] = useState(() => getCachedBuyerCodes());
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchMasterBuyerCodes();
      setBuyerCodes(data);
    } catch (err) {
      console.error('Error reloading buyer codes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();

    const handleUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBuyerCodes(e.detail);
      } else {
        reload();
      }
    };

    window.addEventListener('buyer-codes-updated', handleUpdate);

    const channel = supabase
      .channel('dropdown_options_buyer_codes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dropdown_options' }, () => {
        reload();
      })
      .subscribe();

    return () => {
      window.removeEventListener('buyer-codes-updated', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [reload]);

  return {
    buyerCodes,
    isLoading,
    reload
  };
};

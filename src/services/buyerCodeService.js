import { useState, useEffect, useCallback } from 'react';
import supabase from '../SupabaseClient';

export const DEFAULT_BUYER_CODES = [];

const LOCAL_STORAGE_KEY = 'master_buyer_codes_cache';

// Helper to read cached codes from localStorage
export const getCachedBuyerCodes = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading cached buyer codes:', err);
  }
  return [];
};

// Helper to save cached codes
export const setCachedBuyerCodes = (codes) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(codes || []));
    window.dispatchEvent(new CustomEvent('buyer-codes-updated', { detail: codes }));
  } catch (err) {
    console.warn('Error saving cached buyer codes:', err);
  }
};

// Fetch master buyer codes directly from Supabase master_buyer_codes table
export const fetchMasterBuyerCodes = async () => {
  try {
    const { data, error } = await supabase
      .from('master_buyer_codes')
      .select('id, buyer_code, buyer_name, created_at, updated_at')
      .order('buyer_code', { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map(row => ({
      id: row.id,
      buyerCode: (row.buyer_code || '').trim().toUpperCase(),
      buyerName: (row.buyer_name || '').trim(),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })).filter(b => Boolean(b.buyerCode));

    setCachedBuyerCodes(mapped);
    return mapped;
  } catch (err) {
    console.error('Error fetching master buyer codes from master_buyer_codes:', err);
    return getCachedBuyerCodes();
  }
};

// Create a new Buyer Code directly in Supabase master_buyer_codes table
export const createMasterBuyerCode = async ({ buyerName = '', buyerCode }) => {
  const cleanCode = (buyerCode || '').trim().toUpperCase();
  const cleanName = (buyerName || '').trim();

  if (!cleanCode) throw new Error('Buyer Code is required');

  const { data, error } = await supabase
    .from('master_buyer_codes')
    .insert([{
      buyer_code: cleanCode,
      buyer_name: cleanName
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating buyer code in master_buyer_codes:', error);
    if (error.code === '23505' || String(error.message).includes('duplicate') || String(error.message).includes('unique')) {
      throw new Error(`Buyer Code "${cleanCode}" already exists.`);
    }
    throw new Error(error.message || 'Failed to create Buyer Code');
  }

  const newRecord = {
    id: data.id,
    buyerCode: data.buyer_code,
    buyerName: data.buyer_name,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };

  const existing = getCachedBuyerCodes();
  const updatedList = [...existing.filter(b => b.buyerCode !== cleanCode), newRecord]
    .sort((a, b) => a.buyerCode.localeCompare(b.buyerCode));
  setCachedBuyerCodes(updatedList);
  return newRecord;
};

// Update an existing Buyer Code directly in Supabase master_buyer_codes table
export const updateMasterBuyerCode = async (id, { buyerName, buyerCode }) => {
  const cleanCode = (buyerCode || '').trim().toUpperCase();
  const cleanName = (buyerName || '').trim();

  if (!cleanCode) throw new Error('Buyer Code is required');

  const { error } = await supabase
    .from('master_buyer_codes')
    .update({
      buyer_code: cleanCode,
      buyer_name: cleanName,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating buyer code in master_buyer_codes:', error);
    if (error.code === '23505' || String(error.message).includes('duplicate') || String(error.message).includes('unique')) {
      throw new Error(`Buyer Code "${cleanCode}" is already in use by another customer.`);
    }
    throw new Error(error.message || 'Failed to update Buyer Code');
  }

  const existing = getCachedBuyerCodes();
  const updatedList = existing.map(b => (String(b.id) === String(id)
    ? { ...b, buyerCode: cleanCode, buyerName: cleanName }
    : b
  )).sort((a, b) => a.buyerCode.localeCompare(b.buyerCode));

  setCachedBuyerCodes(updatedList);
  return true;
};

// Delete a Buyer Code directly in Supabase master_buyer_codes table
export const deleteMasterBuyerCode = async (id) => {
  const { error } = await supabase
    .from('master_buyer_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting buyer code from master_buyer_codes:', error);
    throw new Error(error.message || 'Failed to delete Buyer Code');
  }

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
      .channel('master_buyer_codes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_buyer_codes' }, () => {
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

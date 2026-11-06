/**
 * Supabase Məlumat & Sorğu Modulu (Realtime & REST Data Fetcher)
 * Papatya Kassa & Satış Paneli
 */

import { getSupabaseClient } from './auth.js';

export async function fetchAllSales(onProgress = null) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase müştərisi aktiv deyil.");

  let allData = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await client
      .from('satislar')
      .select('*')
      .order('tarix', { ascending: false })
      .range(from, from + step - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allData.push(...data);
    if (onProgress) onProgress(allData.length);
    if (data.length < step) break;
    from += step;
  }

  return allData;
}

export function subscribeToRealtimeSales(onInsert, onUpdate, onDelete) {
  const client = getSupabaseClient();
  if (!client) return null;

  return client
    .channel('realtime_satislar_channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'satislar' }, payload => {
      if (onInsert) onInsert(payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'satislar' }, payload => {
      if (onUpdate) onUpdate(payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'satislar' }, payload => {
      if (onDelete) onDelete(payload.old);
    })
    .subscribe();
}

export async function deleteCategoryTableData(targetTable) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase müştərisi aktiv deyil.");

  // Supabase delete requires a where filter; delete all rows by ID greater than zero or non-empty string
  const isSatis = targetTable === 'satislar';
  const query = isSatis
    ? client.from(targetTable).delete().gt('id', 0)
    : client.from(targetTable).delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { error } = await query;
  if (error) throw error;
  return true;
}

/**
 * Konfiqurasiya və Mağaza Profilləri Modulu
 * Papatya Kassa & Satış Paneli
 */

export const STORE_PROFILES = {
  'aburcubur': {
    id: 'aburcubur',
    name: 'Abur Çubur',
    email: '',
    url: 'https://zcjthobakvppowerkxmv.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjanRob2Jha3ZwcG93ZXJreG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTQyNzMsImV4cCI6MjEwNTI5MDI3M30.ZLaSVPvowhwv50cv6W6d8AFYmPpPZ7oS5eZAxZzHI1U'
  },
  'papatya2': {
    id: 'papatya2',
    name: 'Papatya 2',
    email: '',
    url: 'https://ijnbsuupwwyqohysrjlc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbmJzdXVwd3d5cW9oeXNyamxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjA1NDUsImV4cCI6MjEwNTI5NjU0NX0.ZjiHo2gOzFdHHK4d7CXYfXrjDcwTyGG9oyQ-E6YtGKY'
  }
};

export function getActiveProfileId() {
  const sessionSelected = sessionStorage.getItem('kassa_session_profile');
  if (sessionSelected && (STORE_PROFILES[sessionSelected] || sessionSelected === 'custom')) {
    return sessionSelected;
  }

  const href = (window.location.href || '').toLowerCase();
  const path = (window.location.pathname || '').toLowerCase();

  if (href.includes('papatya2') || path.includes('papatya2') || href.includes('store=papatya2')) {
    return 'papatya2';
  }
  if (href.includes('aburcubur') || path.includes('aburcubur') || href.includes('store=aburcubur')) {
    return 'aburcubur';
  }

  let p = localStorage.getItem('kassa_active_profile');
  if (p && (STORE_PROFILES[p] || p === 'custom')) return p;

  const savedUrl = (localStorage.getItem('kassa_supabase_url') || '').toLowerCase();
  if (savedUrl.includes('ijnbsuupwwyqohysrjlc')) return 'papatya2';
  if (savedUrl.includes('zcjthobakvppowerkxmv')) return 'aburcubur';

  return 'papatya2';
}

export function getActiveSupabaseUrl() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].url;
  const saved = (localStorage.getItem('kassa_supabase_url') || '').trim().replace(/\/+$/, '');
  return saved || STORE_PROFILES['papatya2'].url;
}

export function getActiveSupabaseKey() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].key;
  const saved = (localStorage.getItem('kassa_supabase_key') || '').trim();
  return saved || STORE_PROFILES['papatya2'].key;
}

export function getActiveStoreName() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].name;
  const saved = localStorage.getItem('kassa_store_name');
  if (saved && saved !== 'Satış İdarəetmə Paneli' && saved !== 'Papatya' && saved !== 'Papatya — Anbar İdarəetməsi') return saved;
  return 'Papatya 2';
}

export function getActivePwaName() {
  const pid = getActiveProfileId();
  const profilePwa = localStorage.getItem(`kassa_pwa_name_${pid}`);
  if (profilePwa && profilePwa.trim()) return profilePwa.trim();

  const saved = localStorage.getItem('kassa_pwa_name');
  if (saved && saved.trim()) return saved.trim();

  const storeName = getActiveStoreName();
  return storeName ? `${storeName} Kassa` : 'Papatya Kassa';
}

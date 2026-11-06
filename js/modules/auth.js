/**
 * Autentifikasiya və Təhlükəsizlik Modulu
 * Papatya Kassa & Satış Paneli
 */

import { getActiveSupabaseUrl, getActiveSupabaseKey } from './config.js';

let _supabaseClient = null;

export function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  if (typeof window !== 'undefined' && typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    const url = getActiveSupabaseUrl();
    const key = getActiveSupabaseKey();
    if (!url || !key) return null;
    try {
      _supabaseClient = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (e) {
      console.warn("getSupabaseClient xətası:", e);
    }
  }
  return _supabaseClient;
}

export function resetSupabaseClient() {
  _supabaseClient = null;
}

export function togglePasswordVisibility(inputId = 'passwordInput', eyeId = 'pwdEyeIcon') {
  const pInput = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (!pInput) return;
  if (pInput.type === 'password') {
    pInput.type = 'text';
    if (eye) eye.className = 'fa-solid fa-eye-slash';
  } else {
    pInput.type = 'password';
    if (eye) eye.className = 'fa-solid fa-eye';
  }
}

export function isUserAuthenticated() {
  const savedAuth = localStorage.getItem('kassa_auth_token');
  const isRemembered = localStorage.getItem('kassa_remember_login') === 'true';
  return Boolean(savedAuth && isRemembered);
}

export function clearUserSession() {
  localStorage.removeItem('kassa_auth_token');
  localStorage.removeItem('kassa_remember_login');
  sessionStorage.removeItem('kassa_session_profile');
  _supabaseClient = null;
}

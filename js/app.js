/* =====================================================================
   1) KONFİQURASİYA VƏ DEFOLT DƏYƏRLƏR
   ===================================================================== */
const STORE_PROFILES = {
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

let supabaseClient = null;

function getActiveStoreEmail() {
  return '';
}

function getActiveProfileId() {
  // 1. Əgər istifadəçi cari sessiyada ekrandakı menyudan xüsusi seçim edibsə:
  const sessionSelected = sessionStorage.getItem('kassa_session_profile');
  if (sessionSelected && (STORE_PROFILES[sessionSelected] || sessionSelected === 'custom')) {
    return sessionSelected;
  }

  // 2. Link / URL əsasında avtomatik mağaza təyini (DƏQİQ VƏ BİRBAŞA)
  const href = (window.location.href || '').toLowerCase();
  const path = (window.location.pathname || '').toLowerCase();

  // Məsələn: https://elsenhuseynov2015.github.io/papatya2/
  if (href.includes('papatya2') || path.includes('papatya2') || href.includes('store=papatya2')) {
    return 'papatya2';
  }
  // Məsələn: https://elshuseyni1.github.io/aburcubur/
  if (href.includes('aburcubur') || path.includes('aburcubur') || href.includes('store=aburcubur')) {
    return 'aburcubur';
  }

  // 3. Əgər fərdi server və ya test mühitidirsə, yaddaşdan oxu
  let p = localStorage.getItem('kassa_active_profile');
  if (p && (STORE_PROFILES[p] || p === 'custom')) return p;

  const savedUrl = (localStorage.getItem('kassa_supabase_url') || '').toLowerCase();
  if (savedUrl.includes('ijnbsuupwwyqohysrjlc')) return 'papatya2';
  if (savedUrl.includes('zcjthobakvppowerkxmv')) return 'aburcubur';

  // 4. Default olaraq PC və yerli mühitdə Papatya 2 (əsas aktiv baza)
  return 'papatya2';
}

function getActiveSupabaseUrl() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].url;
  const saved = (localStorage.getItem('kassa_supabase_url') || '').trim().replace(/\/+$/, '');
  return saved || STORE_PROFILES['papatya2'].url;
}

function getActiveSupabaseKey() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].key;
  const saved = (localStorage.getItem('kassa_supabase_key') || '').trim();
  return saved || STORE_PROFILES['papatya2'].key;
}

function getActivePassword() {
  return localStorage.getItem('kassa_custom_password') || '';
}

function getActiveStoreName() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].name;
  const saved = localStorage.getItem('kassa_store_name');
  if (saved && saved !== 'Satış İdarəetmə Paneli' && saved !== 'Papatya' && saved !== 'Papatya — Anbar İdarəetməsi') return saved;
  return 'Papatya 2';
}

function getActivePwaName() {
  const pid = getActiveProfileId();
  const profilePwa = localStorage.getItem(`kassa_pwa_name_${pid}`);
  if (profilePwa && profilePwa.trim()) return profilePwa.trim();

  const saved = localStorage.getItem('kassa_pwa_name');
  if (saved && saved.trim()) return saved.trim();

  const storeName = getActiveStoreName();
  return storeName ? `${storeName} Kassa` : 'Papatya Kassa';
}

function updateManifest() {
  const pwaName = getActivePwaName();
  const shortName = pwaName.length > 15 ? pwaName.substring(0, 15) : pwaName;

  // 1. Browser Title & Apple PWA Title
  document.title = `${pwaName} — Satış Paneli`;
  let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appleMeta) {
    appleMeta = document.createElement('meta');
    appleMeta.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleMeta);
  }
  appleMeta.content = shortName;

  // 2. Service Worker mesajı (Dinamik PWA manifest)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_PWA_NAME',
        name: pwaName,
        shortName: shortName
      });
    } catch (e) {}
  }

  // 3. Manifest linkini dinamik parametr ilə yeniləyirik
  const manifestLink = $('manifestLink') || document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    manifestLink.href = `./manifest.json?pwa_name=${encodeURIComponent(pwaName)}&t=${Date.now()}`;
  }
}

function updateStoreTitle() {
  const name = getActiveStoreName();
  const titleEl = $('appStoreTitle');
  if (titleEl) titleEl.textContent = `${name} — Satış Paneli`;
  const loginTitle = $('loginStoreTitle');
  if (loginTitle) loginTitle.textContent = name;
  const storeBadge = $('authStoreName');
  if (storeBadge) storeBadge.textContent = name;
  updateManifest();
}

function syncStoreSelectUI() {
  const pid = getActiveProfileId();
  const sel = $('headerStoreSelect');
  if (sel) sel.value = pid;

  const cardA = $('cardAburCubur');
  const cardP = $('cardPapatya2');
  if (cardA) cardA.classList.toggle('active', pid === 'aburcubur');
  if (cardP) cardP.classList.toggle('active', pid === 'papatya2');
}

function switchStoreProfile(profileId, triggerReload = true) {
  if (!STORE_PROFILES[profileId] && profileId !== 'custom') {
    profileId = 'papatya2';
  }

  supabaseClient = null;
  sessionStorage.setItem('kassa_session_profile', profileId);
  localStorage.setItem('kassa_active_profile', profileId);

  if (STORE_PROFILES[profileId]) {
    localStorage.setItem('kassa_supabase_url', STORE_PROFILES[profileId].url);
    localStorage.setItem('kassa_supabase_key', STORE_PROFILES[profileId].key);
    localStorage.setItem('kassa_store_name', STORE_PROFILES[profileId].name);
  }

  syncStoreSelectUI();
  updateStoreTitle();

  const profName = STORE_PROFILES[profileId] ? STORE_PROFILES[profileId].name : 'Fərdi Baza';
  showToast("🏪 Baza Dəyişdirildi", `${profName} bazasına qoşulur...`, 'insert');

  if (triggerReload) {
    initApp();
  }
}

function onHeaderStoreChange(val) {
  if (val === 'custom') {
    openSettingsModal();
    return;
  }
  sessionStorage.setItem('kassa_session_profile', val);
  switchStoreProfile(val, true);
}

function selectProfileInModal(profileId) {
  if (STORE_PROFILES[profileId]) {
    $('settingStoreName').value = STORE_PROFILES[profileId].name;
    if ($('settingPwaName')) {
      const savedProfPwa = localStorage.getItem(`kassa_pwa_name_${profileId}`);
      $('settingPwaName').value = savedProfPwa || `${STORE_PROFILES[profileId].name} Kassa`;
    }
    $('settingSupabaseUrl').value = STORE_PROFILES[profileId].url;
    $('settingSupabaseKey').value = STORE_PROFILES[profileId].key;
  }
  localStorage.setItem('kassa_active_profile', profileId);
  syncStoreSelectUI();
}

/* =====================================================================
   2) KÖMƏKÇİ FUNKSİYALAR VƏ FORMATTER
   ===================================================================== */
const pad = n => (n < 10 ? '0' + n : '' + n);
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const nf2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('ru-RU');
const money  = n => nf2.format(n || 0) + ' ₼';
const money0 = n => {
  const val = parseFloat(n) || 0;
  if (Math.abs(val) > 0 && Math.abs(val) < 1) {
    return nf2.format(val) + ' ₼';
  }
  if (val % 1 !== 0) {
    return nf2.format(val) + ' ₼';
  }
  return nf0.format(Math.round(val)) + ' ₼';
};
const $ = id => document.getElementById(id) || (id === 'chartSub' ? document.getElementById('mainSliderSubtitle') : null);

/* =====================================================================
   3) SƏS SİSTEMİ (Web Audio API Synthesizer)
   ===================================================================== */
let isSoundMuted = false;

function initSound() {
  isSoundMuted = localStorage.getItem('kassa_sound_muted') === 'true';
  updateSoundIcon();
}

function toggleSound() {
  isSoundMuted = !isSoundMuted;
  localStorage.setItem('kassa_sound_muted', isSoundMuted ? 'true' : 'false');
  updateSoundIcon();
  if (!isSoundMuted) playChime(true);
}

function updateSoundIcon() {
  const icon = $('soundIcon');
  if (isSoundMuted) {
    icon.className = 'fa-solid fa-volume-xmark';
    icon.style.color = '#fda4af';
  } else {
    icon.className = 'fa-solid fa-volume-high';
    icon.style.color = '#67e8f9';
  }
}

function playChime(isSale = true) {
  if (isSoundMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (isSale) {
      // Kassada qazanclı "Ka-ching / Ding" akkordu
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.38);
      });
    } else {
      // Qaytarılma və ya silinmə xəbərdarlıq tonu
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(261.63, ctx.currentTime + 0.26);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.32);
    }
  } catch (e) {
    console.warn("Audio play error:", e);
  }
}

function testSoundInSettings() {
  playChime(true);
}

/* =====================================================================
   4) FLOATING TOAST BİLDİRİŞİ
   ===================================================================== */
let toastTimer = null;
function showToast(title, msg, isSale = true, customDate = null) {
  const toast = $('toastNotification');
  const tTitle = $('toastTitle');
  const tMsg = $('toastMsg');
  const tIco = $('toastIco');
  const tTime = $('toastTime');
  if (!toast || !tTitle) return;

  tTitle.textContent = title;
  if (tMsg) tMsg.textContent = msg;

  const d = customDate ? new Date(customDate) : new Date();
  const dateStr = pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  const timeStr = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());

  if (tTime) {
    tTime.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px"><i class="fa-regular fa-calendar-days"></i> ${dateStr}</span> <span style="opacity:0.4">•</span> <span style="display:inline-flex;align-items:center;gap:4px"><i class="fa-regular fa-clock"></i> ${timeStr}</span>`;
  }

  if (isSale) {
    tIco.className = 'toast-ico';
    tIco.innerHTML = '<i class="fa-solid fa-cart-shopping"></i>';
  } else {
    tIco.className = 'toast-ico ret';
    tIco.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i>';
  }

  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}

/* =====================================================================
   4.1) BİLDİRİŞLƏR SİSTEMİ (Tarixçə, Yaddaş və İdarəetmə)
   ===================================================================== */
let notifications = [];

function notifEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

function loadNotifications() {
  try {
    const raw = localStorage.getItem('kassa_notifications');
    notifications = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(notifications)) notifications = [];
  } catch(e) {
    notifications = [];
  }
  updateNotifBadge();
}

function saveNotifications() {
  try {
    if (notifications.length > 50) {
      notifications = notifications.slice(0, 50);
    }
    localStorage.setItem('kassa_notifications', JSON.stringify(notifications));
  } catch(e) {
    console.error("Bildirişlər yaddaşa yazıla bilmədi:", e);
  }
  updateNotifBadge();
}

function addNotification(title, msg, isSale = true, customDate = null) {
  const d = customDate ? new Date(customDate) : new Date();
  const dateStr = pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  const timeStr = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  const notifItem = {
    id: Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: title || 'Bildiriş',
    msg: msg || '',
    isSale: !!isSale,
    date: dateStr,
    time: timeStr,
    timestamp: d.getTime()
  };

  notifications.unshift(notifItem);
  saveNotifications();

  const modal = $('notifModal');
  if (modal && !modal.classList.contains('hidden')) {
    renderNotificationList();
  }
}

function updateNotifBadge() {
  const badge = $('notifBadge');
  const count = notifications.length;
  const mobDot = $('mobNotifDot');
  if (mobDot) { mobDot.classList.toggle('has-unread', count > 0); }
  if (badge) {
    if (count > 0) {
      badge.style.display = 'inline-flex';
      badge.textContent = count > 99 ? '99+' : count;
    } else {
      badge.style.display = 'none';
      badge.textContent = '0';
    }
  }

  const sub = $('notifSubText');
  if (sub) {
    sub.textContent = count > 0 ? `${count} ədəd bildiriş qeydə alınıb` : '0 bildiriş qeydə alınıb';
  }
}

function renderNotificationList() {
  const container = $('notifListContainer');
  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:34px 10px;color:#707c96">
        <i class="fa-regular fa-bell-slash" style="font-size:32px;margin-bottom:10px;display:block;opacity:0.4"></i>
        <span style="font-size:12.5px;font-weight:600">Hələ heç bir bildiriş yoxdur</span>
      </div>`;
    return;
  }

  let html = '';
  notifications.forEach(n => {
    const icoClass = n.isSale ? 'sale' : 'ret';
    const icoSymbol = n.isSale ? 'fa-cart-shopping' : 'fa-arrow-rotate-left';

    // Tarix və Saat: mövcud deyilsə timestamp və ya bugünkü tarixdən çıxarılır
    let dateStr = n.date || '';
    let timeStr = n.time || '';
    if (!dateStr && n.timestamp) {
      const td = new Date(n.timestamp);
      dateStr = pad(td.getDate()) + '.' + pad(td.getMonth() + 1) + '.' + td.getFullYear();
    } else if (!dateStr) {
      const td = new Date();
      dateStr = pad(td.getDate()) + '.' + pad(td.getMonth() + 1) + '.' + td.getFullYear();
    }

    html += `
      <div class="notif-item" id="notif-${n.id}">
        <div class="notif-item-ico ${icoClass}">
          <i class="fa-solid ${icoSymbol}"></i>
        </div>
        <div class="notif-item-body">
          <div class="notif-item-title">${notifEscape(n.title)}</div>
          <div class="notif-item-desc">${notifEscape(n.msg)}</div>
          <div class="notif-item-time">
            <span class="notif-date"><i class="fa-regular fa-calendar-days"></i> ${dateStr}</span>
            <span class="notif-sep">•</span>
            <span class="notif-clock"><i class="fa-regular fa-clock"></i> ${timeStr}</span>
          </div>
        </div>
        <button type="button" class="notif-item-del" onclick="deleteSingleNotification('${n.id}')" title="Bu bildirişi sil">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  });
  container.innerHTML = html;
}

function toggleNotificationsModal() {
  const modal = $('notifModal');
  if (!modal) return;
  const isHidden = modal.classList.contains('hidden');
  if (isHidden) {
    renderNotificationList();
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

function closeNotificationsModal() {
  const modal = $('notifModal');
  if (modal) modal.classList.add('hidden');
}

function clearAllNotifications() {
  if (notifications.length === 0) return;
  notifications = [];
  saveNotifications();
  renderNotificationList();
  showToast("🗑️ Bildirişlər Təmizləndi", "Bütün bildirişlər silindi", false);
}

function deleteSingleNotification(id) {
  notifications = notifications.filter(n => n.id !== id);
  saveNotifications();
  renderNotificationList();
}

/* =====================================================================
   5) AUTH & ŞİFRƏ PANELİ (SUPABASE AUTH & TƏHLÜKƏSİZ GİRİŞ)
   ===================================================================== */
function getSupabaseClient() {
  if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient;
  if (typeof window !== 'undefined' && typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    const url = getActiveSupabaseUrl();
    const key = getActiveSupabaseKey();
    if (!url || !key) return null;
    try {
      supabaseClient = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (e) {
      console.warn("getSupabaseClient xətası:", e);
    }
  }
  return supabaseClient;
}

async function checkAuth() {
  updateStoreTitle();
  const emailInput = $('authEmailInput');
  // Kiber təhlükəsizlik və məxfilik: Email avtomatik yazılmır, xana həmişə təmiz saxlanılır
  if (emailInput) {
    emailInput.value = '';
  }

  const savedAuth = localStorage.getItem('kassa_auth_token');
  const isRemembered = localStorage.getItem('kassa_remember_login') === 'true';

  // Əgər istifadəçi çıxış edibsə və ya yadda saxlamayıbsa, mütləq giriş ekranını göstər
  if (!savedAuth || !isRemembered) {
    document.documentElement.classList.remove('is-authenticated');
    const authScr = $('authScreen');
    if (authScr) authScr.classList.remove('hidden');
    const pInput = $('passwordInput');
    if (pInput) pInput.disabled = false;
    if (emailInput) emailInput.value = '';
    return;
  }

  const client = getSupabaseClient();
  let hasValidSession = false;

  if (client && client.auth) {
    try {
      const { data } = await client.auth.getSession();
      if (data && data.session) {
        hasValidSession = true;
      }
    } catch (e) {
      console.warn("Supabase Auth session yoxlanışı:", e);
    }
  }

  const currentPassword = getActivePassword();

  // Əgər Supabase Auth sessiyası aktivdirsə və ya lokal fərdi şifrə yadda saxlanılıbsa
  if (hasValidSession || (isRemembered && currentPassword && savedAuth === 'session_' + currentPassword)) {
    const authScr = $('authScreen');
    if (authScr) authScr.classList.add('hidden');
    const pInput = $('passwordInput');
    if (pInput) {
      pInput.blur();
      pInput.disabled = true;
    }
    document.documentElement.classList.add('is-authenticated');
    initApp();
  } else {
    document.documentElement.classList.remove('is-authenticated');
    const authScr = $('authScreen');
    if (authScr) authScr.classList.remove('hidden');
    const pInput = $('passwordInput');
    if (pInput) pInput.disabled = false;
    if (emailInput) emailInput.value = '';
    setTimeout(() => {
      const pInput = $('passwordInput');
      if (pInput) pInput.focus();
    }, 150);
  }
}

async function verifyPassword() {
  const pInput = $('passwordInput');
  const emailInput = $('authEmailInput');
  const entered = (pInput ? pInput.value : '').trim();
  const email = (emailInput ? emailInput.value : '').trim();
  const errorEl = $('authError');
  const box = $('authBox');
  const currentPassword = getActivePassword();
  const rememberChk = $('rememberPasswordChk');
  const shouldRemember = rememberChk ? rememberChk.checked : true;

  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.innerHTML = '';
  }

  if (!email) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Zəhmət olmasa email ünvanınızı daxil edin!';
    }
    if (emailInput) emailInput.focus();
    return;
  }

  if (!entered) {
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Zəhmət olmasa şifrəni daxil edin!';
    }
    if (pInput) pInput.focus();
    return;
  }

  const btn = document.querySelector('#authScreen .cyber-btn-primary');
  const origBtnHtml = '<span>Daxil Ol</span> <i class="fa-solid fa-arrow-right"></i>';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yoxlanılır...';
  }

  let authSuccess = false;
  let authType = 'local';
  let serverErrorMessage = '';

  try {
    let client = getSupabaseClient();
    if (!client && typeof window !== 'undefined' && typeof window.supabase === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 800));
      client = getSupabaseClient();
    }

    // 1. Supabase Server Auth (Email daxil edilibsə)
    if (client && client.auth && email) {
      try {
        // 5 saniyəlik timeout qoruyucusu (heç vaxt fırlanıb ilişib qala bilməz)
        const authPromise = client.auth.signInWithPassword({
          email: email,
          password: entered
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Supabase serveri cavab vermədi (Timeout)")), 5000)
        );

        const res = await Promise.race([authPromise, timeoutPromise]);
        const data = res ? res.data : null;
        const error = res ? res.error : null;

        if (!error && data && data.session) {
          authSuccess = true;
          authType = 'supabase_auth';
        } else if (error) {
          console.warn("Supabase Auth cavabı:", error);
          if (error.message === 'Invalid login credentials') {
            serverErrorMessage = 'Email və ya şifrə yanlışdır!';
          } else if (error.message.includes('Email not confirmed')) {
            serverErrorMessage = 'Supabase: Email təsdiqlənməyib!';
          } else {
            serverErrorMessage = error.message;
          }
        }
      } catch (authErr) {
        console.warn("Supabase Auth sorğu xətası:", authErr);
        serverErrorMessage = authErr.message;
      }
    }

    // 2. Lokal ehtiyat şifrə yoxlanışı (Yalnız istifadəçi əvvəlcədən fərdi şifrə təyin edibsə)
    if (!authSuccess && currentPassword && entered === currentPassword) {
      authSuccess = true;
      authType = 'local_fallback';
    }

    if (authSuccess) {
      // Kiber Təhlükəsizlik: Açıq şifrə heç vaxt localStorage-də saxlanılmır!
      localStorage.setItem('kassa_auth_token', 'session_authenticated');
      localStorage.setItem('kassa_auth_mode', authType);
      // Təhlükəsizlik: Email avtomatik yaddaşa yazılmır
      localStorage.removeItem('kassa_auth_email');

      if (shouldRemember) {
        localStorage.setItem('kassa_remember_login', 'true');
      } else {
        localStorage.removeItem('kassa_remember_login');
      }

      const authScr = $('authScreen');
      if (authScr) authScr.classList.add('hidden');
      if (pInput) {
        pInput.blur();
        pInput.disabled = true;
        pInput.value = '';
      }
      if (emailInput) {
        emailInput.value = '';
      }
      document.documentElement.classList.add('is-authenticated');

      if (authType === 'supabase_auth') {
        showToast("🛡️ Supabase Server Auth", "Server təsdiqi ilə təhlükəsiz giriş edildi!", true);
      } else {
        showToast("🔓 Uğurlu Giriş", "Xoş gəldiniz! Məlumatlar yüklənir...", true);
      }

      if (isPwa()) enterFullScreen();
      initApp();
    } else {
      if (errorEl) {
        errorEl.style.display = 'block';
        const displayErr = serverErrorMessage || 'Şifrə və ya email yanlışdır! Yenidən yoxlayın.';
        errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${displayErr}`;
      }
      if (box) {
        box.classList.remove('shake');
        void box.offsetWidth;
        box.classList.add('shake');
      }
    }
  } catch (err) {
    console.error("verifyPassword ümumi xəta:", err);
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Xəta: ${err.message || 'Giriş uğursuz oldu'}`;
    }
  } finally {
    // Düymə HƏR BİR HALDA açılır və ilkin halına qayıdır (donub qala bilməz)
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnHtml;
    }
  }
}

function togglePasswordVisibility() {
  const input = $('passwordInput');
  const icon = $('pwdToggleIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

async function logout(skipConfirm = false) {
  if (!skipConfirm && !confirm("Hesabdan çıxmaq və yeni email/şifrə ilə daxil olmaq istəyirsiniz?")) {
    return;
  }

  try {
    const client = getSupabaseClient();
    if (client && client.auth) {
      await client.auth.signOut();
    }
  } catch (e) {
    console.warn("Supabase signOut xətası:", e);
  }

  supabaseClient = null;

  // Bütün giriş məlumatlarını təmizləyirik
  localStorage.removeItem('kassa_auth_token');
  localStorage.removeItem('kassa_auth_mode');
  localStorage.removeItem('kassa_remember_login');
  localStorage.removeItem('kassa_auth_email');
  sessionStorage.clear();

  // Supabase auth sessiyalarını localStorage-dən silirik
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') || k.includes('auth-token'))) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {}

  document.documentElement.classList.remove('is-authenticated');
  if (document.body) document.body.classList.remove('is-authenticated');

  closeSettingsModal();

  const authScr = $('authScreen');
  if (authScr) authScr.classList.remove('hidden');

  const pInput = $('passwordInput');
  if (pInput) {
    pInput.disabled = false;
    pInput.value = '';
  }

  const emailInput = $('authEmailInput');
  if (emailInput) {
    emailInput.value = '';
    setTimeout(() => emailInput.focus(), 150);
  } else {
    setTimeout(() => { if (pInput) pInput.focus(); }, 150);
  }

  showToast("🚪 Hesabdan Çıxış Edildi", "Yeni email və şifrənizi daxil edə bilərsiniz.", true);
}

function toggleSettingsKeyVisibility() {
  const input = $('settingSupabaseKey');
  const icon = $('keyToggleIcon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye';
  }
}

function toggleSettingsPwdVisibility() {
  const input = $('settingPassword');
  const icon = $('settingPwdToggleIcon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye';
  }
}

/* =====================================================================
   6) AYARLAR MODALI VƏ SUPABASE TESTİ
   ===================================================================== */
function openSettingsModal() {
  // Təhlükəsizlik: Yalnız daxil olmuş istifadəçi ayarlara baxa bilər
  if (!document.documentElement.classList.contains('is-authenticated')) {
    showToast("🔒 Giriş Tələb Olunur", "Təhlükəsizlik səbəbilə ayarlara yalnız giriş etdikdən sonra baxa bilərsiniz!", false);
    return;
  }

  syncStoreSelectUI();
  $('settingStoreName').value = getActiveStoreName();
  if ($('settingPwaName')) $('settingPwaName').value = getActivePwaName();
  if ($('settingAuthEmail')) $('settingAuthEmail').value = getActiveStoreEmail();
  $('settingSupabaseUrl').value = getActiveSupabaseUrl();
  $('settingSupabaseKey').value = getActiveSupabaseKey();
  $('settingPassword').value = getActivePassword();

  const resDiv = $('testConnResult');
  resDiv.style.display = 'none';
  resDiv.innerHTML = '';

  $('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
  $('settingsModal').classList.add('hidden');
}

function resetDefaultCredentials() {
  if (confirm("Standart parametrlərə (Abur Çubur) qaytarmaq istəyirsiniz?")) {
    selectProfileInModal('aburcubur');
    if ($('settingPwaName')) $('settingPwaName').value = 'Abur Çubur Kassa';
    $('settingPassword').value = '';
  }
}

async function testSupabaseInHtml() {
  const url = $('settingSupabaseUrl').value.trim().replace(/\/+$/, '');
  const key = $('settingSupabaseKey').value.trim();
  const resDiv = $('testConnResult');

  const isLight = document.body.classList.contains('light-theme');
  if (!url || !key) {
    resDiv.style.display = 'block';
    resDiv.style.background = isLight ? 'rgba(239,68,68,.12)' : 'rgba(251,113,133,.12)';
    resDiv.style.border = isLight ? '1px solid rgba(239,68,68,.3)' : '1px solid rgba(251,113,133,.3)';
    resDiv.style.color = isLight ? '#dc2626' : '#fda4af';
    resDiv.innerHTML = '❌ <b>Xəta:</b> Supabase URL və Anon Key daxil edilməlidir!';
    return;
  }

  resDiv.style.display = 'block';
  resDiv.style.background = isLight ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.12)';
  resDiv.style.border = isLight ? '1px solid rgba(99,102,241,.3)' : '1px solid rgba(99,102,241,.3)';
  resDiv.style.color = isLight ? '#4338ca' : '#a5b4fc';
  resDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Supabase ilə əlaqə yoxlanılır...';

  try {
    const resp = await fetch(`${url}/rest/v1/satislar?select=id,maya_deyeri,qazanc&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });

    if (resp.ok) {
      resDiv.style.background = isLight ? 'rgba(16,185,129,.14)' : 'rgba(52,211,153,.12)';
      resDiv.style.border = isLight ? '1px solid rgba(16,185,129,.35)' : '1px solid rgba(52,211,153,.35)';
      resDiv.style.color = isLight ? '#047857' : '#6ee7b7';
      resDiv.innerHTML = '✅ <b>Bağlantı Uğurludur!</b> Supabase layihəsinə qoşuldu, `satislar` cədvəli və bütün sütunlar hazırdır.';
    } else {
      const errText = await resp.text();
      if (errText.includes('maya_deyeri') || errText.includes('qazanc') || errText.includes('42703')) {
        resDiv.style.background = isLight ? 'rgba(217,119,6,.12)' : 'rgba(251,191,36,.12)';
        resDiv.style.border = isLight ? '1px solid rgba(217,119,6,.35)' : '1px solid rgba(251,191,36,.35)';
        resDiv.style.color = isLight ? '#b45309' : '#fde68a';
        resDiv.innerHTML = '⚠️ <b>Sütun Çatışmır!</b> `satislar` cədvəlində `maya_deyeri` sütunu yoxdur.<br>Zəhmət olmasa Supabase SQL Editor-da bu əmri icra edin:<br><code style="font-family:monospace;padding:3px 6px;background:rgba(0,0,0,.06);border-radius:6px;display:inline-block;margin-top:4px">ALTER TABLE satislar ADD COLUMN IF NOT EXISTS maya_deyeri NUMERIC DEFAULT 0;</code>';
      } else if (resp.status === 404) {
        resDiv.style.background = isLight ? 'rgba(239,68,68,.12)' : 'rgba(251,113,133,.12)';
        resDiv.style.border = isLight ? '1px solid rgba(239,68,68,.3)' : '1px solid rgba(251,113,133,.3)';
        resDiv.style.color = isLight ? '#dc2626' : '#fda4af';
        resDiv.innerHTML = '❌ <b>Xəta (404):</b> `satislar` cədvəli tapılmadı! Supabase SQL Editor-da cədvəl yaratma skriptini icra edin.';
      } else if (resp.status === 401 || resp.status === 403) {
        resDiv.style.background = isLight ? 'rgba(239,68,68,.12)' : 'rgba(251,113,133,.12)';
        resDiv.style.border = isLight ? '1px solid rgba(239,68,68,.3)' : '1px solid rgba(251,113,133,.3)';
        resDiv.style.color = isLight ? '#dc2626' : '#fda4af';
        resDiv.innerHTML = `❌ <b>Xəta (${resp.status}):</b> Anon Key yanlışdır və ya oxuma icazəsi (RLS) verilməyib!`;
      } else {
        resDiv.style.background = isLight ? 'rgba(239,68,68,.12)' : 'rgba(251,113,133,.12)';
        resDiv.style.border = isLight ? '1px solid rgba(239,68,68,.3)' : '1px solid rgba(251,113,133,.3)';
        resDiv.style.color = isLight ? '#dc2626' : '#fda4af';
        resDiv.innerHTML = `❌ <b>Xəta (${resp.status}):</b> ${errText.substring(0, 140)}`;
      }
    }
  } catch (err) {
    resDiv.style.background = isLight ? 'rgba(239,68,68,.12)' : 'rgba(251,113,133,.12)';
    resDiv.style.border = isLight ? '1px solid rgba(239,68,68,.3)' : '1px solid rgba(251,113,133,.3)';
    resDiv.style.color = isLight ? '#dc2626' : '#fda4af';
    resDiv.innerHTML = `❌ <b>Şəbəkə Xətası:</b> URL-i və ya internet bağlantınızı yoxlayın (${err.message})`;
  }
}

function saveSettingsFromModal() {
  const storeName = $('settingStoreName').value.trim() || 'Mağaza';
  const pwaName = $('settingPwaName') ? $('settingPwaName').value.trim() : '';
  const authEmail = $('settingAuthEmail') ? $('settingAuthEmail').value.trim() : '';
  const url = $('settingSupabaseUrl').value.trim().replace(/\/+$/, '');
  const key = $('settingSupabaseKey').value.trim();
  const pwd = $('settingPassword').value.trim();

  if (authEmail) {
    localStorage.setItem('kassa_auth_email', authEmail);
  }

  let matchedProfile = 'custom';
  for (const [pid, prof] of Object.entries(STORE_PROFILES)) {
    if (prof.url.toLowerCase() === url.toLowerCase()) {
      matchedProfile = pid;
      break;
    }
  }

  localStorage.setItem('kassa_active_profile', matchedProfile);
  localStorage.setItem('kassa_store_name', storeName);
  if (pwaName) {
    localStorage.setItem('kassa_pwa_name', pwaName);
    localStorage.setItem(`kassa_pwa_name_${matchedProfile}`, pwaName);
  } else {
    localStorage.removeItem('kassa_pwa_name');
    localStorage.removeItem(`kassa_pwa_name_${matchedProfile}`);
  }
  localStorage.setItem('kassa_supabase_url', url);
  localStorage.setItem('kassa_supabase_key', key);
  localStorage.setItem('kassa_custom_password', pwd);
  localStorage.setItem('kassa_auth_token', pwd);

  syncStoreSelectUI();
  updateStoreTitle();
  closeSettingsModal();
  showToast("⚙️ Ayarlar Yeniləndi", `${storeName} ayarları tətbiq edildi!`, 'insert');

  initApp();
}

/* =====================================================================
   KATEQORİYAYA GÖRƏ SİLMƏ MƏNTİQİ (TYPE-TO-CONFIRM TƏHLÜKƏSİZLİK QALXANI)
   ===================================================================== */
const DELETE_CONFIRM_PHRASE = "SİLMƏK İSTƏYİRƏM";
let currentDeleteTarget = ''; // 'satislar' | 'mehsullar' | 'musteriler'

function openDeleteCategoryModal(target) {
  currentDeleteTarget = target;
  if ($('deleteConfirmText')) $('deleteConfirmText').value = '';
  if ($('deleteConfirmPassword')) $('deleteConfirmPassword').value = '';
  if ($('deleteError')) $('deleteError').style.display = 'none';

  let title = 'Məlumatları Sil';
  let desc = 'Supabase-dəki seçilmiş məlumatlar silinəcək.';

  if (target === 'satislar') {
    title = '🛒 Satışları Sil';
    desc = '⚠️ <b style="color:#fb7185">DİQQƏT:</b> Supabase bazasındakı <b>bütün satış qeydləri</b> birdəfəlik silinəcək! Bu əməliyyat geri qaytarıla bilməz.';
  } else if (target === 'mehsullar') {
    title = '📦 Anbardakı Malları Sil';
    desc = '⚠️ <b style="color:#fb7185">DİQQƏT:</b> Supabase bazasındakı <b>bütün anbar məhsulları</b> birdəfəlik silinəcək! Bu əməliyyat geri qaytarıla bilməz.';
  } else if (target === 'musteriler') {
    title = '👥 Müştəriləri və Borcları Sil';
    desc = '⚠️ <b style="color:#fb7185">DİQQƏT:</b> Supabase bazasındakı <b>bütün müştəri və borc qeydləri</b> birdəfəlik silinəcək! Bu əməliyyat geri qaytarıla bilməz.';
  }

  $('deleteModalTitle').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${title}`;
  $('deleteModalDesc').innerHTML = desc;
  updateDeleteBtnState();
  $('deleteCategoryModal').classList.remove('hidden');
  setTimeout(() => {
    if ($('deleteConfirmText')) $('deleteConfirmText').focus();
  }, 150);
}

function updateDeleteBtnState() {
  const textInput = $('deleteConfirmText');
  const pwdInput = $('deleteConfirmPassword');
  const btn = $('btnConfirmDeleteCategory');
  if (!btn) return;

  const enteredText = (textInput ? textInput.value : '').trim().toUpperCase();
  const enteredPwd = (pwdInput ? pwdInput.value : '').trim();

  const isTextValid = enteredText === DELETE_CONFIRM_PHRASE || enteredText === 'SILMEK ISTEYIREM';
  const isPwdProvided = enteredPwd.length >= 3;

  if (isTextValid && isPwdProvided) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 8px 24px -6px rgba(225,29,72,.7)';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.35';
    btn.style.cursor = 'not-allowed';
    btn.style.boxShadow = 'none';
  }
}

function closeDeleteCategoryModal() {
  $('deleteCategoryModal').classList.add('hidden');
  if ($('deleteConfirmText')) $('deleteConfirmText').value = '';
  if ($('deleteConfirmPassword')) $('deleteConfirmPassword').value = '';
}

async function confirmDeleteCategory() {
  const textInput = $('deleteConfirmText');
  const enteredText = (textInput ? textInput.value : '').trim().toUpperCase();
  const entered = ($('deleteConfirmPassword')?.value || '').trim();
  const errorEl = $('deleteError');
  const btn = $('btnConfirmDeleteCategory');

  if (enteredText !== DELETE_CONFIRM_PHRASE && enteredText !== 'SILMEK ISTEYIREM') {
    errorEl.style.display = 'block';
    errorEl.textContent = '❌ Təsdiq üçün yuxarıdakı xanaya "SİLMƏK İSTƏYİRƏM" yazmalısınız!';
    if (textInput) textInput.focus();
    return;
  }

  const validPassword = getActivePassword();
  let isPasswordCorrect = false;

  if (validPassword && entered === validPassword) {
    isPasswordCorrect = true;
  } else {
    // Supabase Auth ilə dinamik server təsdiqi
    const client = getSupabaseClient();
    try {
      const { data: userData } = await client.auth.getUser();
      const currentEmail = userData?.user?.email;
      if (client && currentEmail) {
        const { error: testAuthErr } = await client.auth.signInWithPassword({
          email: currentEmail,
          password: entered
        });
        if (!testAuthErr) isPasswordCorrect = true;
      }
    } catch(e) {}
  }

  if (!isPasswordCorrect) {
    errorEl.style.display = 'block';
    errorEl.textContent = '❌ Şifrə yanlışdır! Silinmə yalnız hesaba daxil olmuş admin şifrəsi ilə icra edilə bilər.';
    if ($('deleteConfirmPassword')) $('deleteConfirmPassword').focus();
    return;
  }

  errorEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Silinir...';

  try {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error("Supabase əlaqəsi aktiv deyil.");
    }

    if (currentDeleteTarget === 'satislar') {
      const { error } = await client.from('satislar').delete().not('id', 'is', null);
      if (error) throw error;
      SALES = [];
      update();
      showToast("🗑️ Satışlar Silindi", "Supabase-dəki bütün satış qeydləri uğurla silindi!", false);
    } 
    else if (currentDeleteTarget === 'mehsullar') {
      const { error } = await client.from('mehsullar').delete().not('id', 'is', null);
      if (error) throw error;
      showToast("🗑️ Anbar Silindi", "Supabase-dəki bütün məhsullar uğurla silindi!", false);
    } 
    else if (currentDeleteTarget === 'musteriler') {
      try { await client.from('borc_odenisleri').delete().not('id', 'is', null); } catch(e) {}
      const { error } = await client.from('musteriler').delete().not('id', 'is', null);
      if (error) throw error;
      showToast("🗑️ Müştərilər Silindi", "Supabase-dəki bütün müştərilər və borclar uğurla silindi!", false);
    }

    closeDeleteCategoryModal();
    closeSettingsModal();
  } catch (err) {
    console.error("Silinmə xətası:", err);
    errorEl.style.display = 'block';
    if (err.message && err.message.toLowerCase().includes('violates row-level security')) {
      errorEl.textContent = '🛡️ XƏTA: Supabase RLS təhlükəsizlik qaydası client tərəfdən bazanı silməyə icazə vermir!';
    } else {
      errorEl.textContent = `❌ Xəta: ${err.message || 'Məlumatlar silinə bilmədi'}`;
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Silinməni Təsdiqlə';
    updateDeleteBtnState();
  }
}

/* =====================================================================
   7) SUPABASE REALTIME & MƏLUMAT MODELİ
   ===================================================================== */
let realtimeChannel = null;
let SALES = [];
const state = { from: null, to: null, fromTime: '00:00', toTime: '23:59', nov: 'all', q: '', sortKey: 'tarix', sortDir: -1 };
const TODAY = new Date(); TODAY.setHours(0,0,0,0);

function setConnectionStatus(status, text) {
  const ind = $('liveIndicator');
  const dot = $('liveDot');
  const txt = $('liveStatusText');

  ind.className = 'live ' + status;
  txt.textContent = text;
}

function initApp() {
  updateStoreTitle();
  syncStoreSelectUI();

  // Supabase CDN kitabxanasının hazır olduğunu yoxlayırıq
  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    setConnectionStatus('connecting', 'BAĞLANTI GÖZLƏNİLİR...');
    setTimeout(initApp, 100);
    return;
  }

  try {
    setConnectionStatus('connecting', 'QOŞULUR...');
    supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      const url = getActiveSupabaseUrl();
      const key = getActiveSupabaseKey();
      supabaseClient = window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }
    fetchData();
    setupRealtime();
  } catch (err) {
    console.error("Supabase client xətası:", err);
    setConnectionStatus('error', 'XƏTA');
    setTimeout(initApp, 1500);
  }
}

async function fetchData(showLoading = true) {
  if (!supabaseClient) {
    initApp();
    return;
  }

  const tblBody = $('tbody');
  if (showLoading && tblBody && (!SALES || SALES.length === 0)) {
    tblBody.innerHTML = `<tr><td colspan="6" style="display:block"><div class="empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:#22d3ee;margin-bottom:8px"></i><p>Məlumatlar Supabase bazasından yüklənir...</p></div></td></tr>`;
  }

  try {
    let allData = [];
    let from = 0;
    const step = 1000;

    while (true) {
      const { data, error } = await supabaseClient
        .from('satislar')
        .select('*')
        .order('tarix', { ascending: false })
        .range(from, from + step - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allData.push(...data);
      if (data.length < step) break;
      from += step;
    }

    // Çəki (Kq) ilə satılan məhsulları avtomatik və dəqiq müəyyən edirik
    const knownKiloNames = new Set();
    allData.forEach(r => {
      const val = parseFloat(r.say) || 0;
      if (Math.abs(val - Math.round(val)) > 0.0001) {
        if (r.mehsul_adi) knownKiloNames.add(r.mehsul_adi.trim().toLowerCase());
      }
      if (r.is_kilo === true || r.is_kilo === 1 || r.is_kilo === 'true' || r.vahid === 'kg' || r.vahid === 'kq') {
        if (r.mehsul_adi) knownKiloNames.add(r.mehsul_adi.trim().toLowerCase());
      }
      if (/\b(kg|kq|kilo|kiloqram|çəki|ceki)\b/i.test(r.mehsul_adi || '')) {
        if (r.mehsul_adi) knownKiloNames.add(r.mehsul_adi.trim().toLowerCase());
      }
    });

    SALES = (allData || []).map(r => {
      const dateObj = new Date(r.tarix);
      const isDateValid = !isNaN(dateObj.getTime());

      const dStr = isDateValid ? iso(dateObj) : (r.tarix ? r.tarix.split('T')[0] : iso(new Date()));
      const sStr = isDateValid ? pad(dateObj.getHours()) + ':' + pad(dateObj.getMinutes()) : '--:--';

      const mebleg = parseFloat(r.mebleg) || 0;
      const maya   = parseFloat(r.maya_deyeri) || 0;
      const qazanc = (r.qazanc !== undefined && r.qazanc !== null) ? parseFloat(r.qazanc) : (mebleg - maya);
      const qty    = parseFloat(r.say) || 1;

      const nameClean = (r.mehsul_adi || '').trim().toLowerCase();
      const isKilo = (r.is_kilo === true || r.is_kilo === 1 || r.is_kilo === 'true' || r.vahid === 'kg' || r.vahid === 'kq')
        || (Math.abs(qty - Math.round(qty)) > 0.0001)
        || /\b(kg|kq|kilo|kiloqram|çəki|ceki)\b/i.test(nameClean)
        || knownKiloNames.has(nameClean);

      const tip = (r.emeliyyat_tipi || 'SATIŞ').toUpperCase();
      const isQaytarma = tip === 'QAYTARILMA';
      const odenisRaw  = (r.odenis_novu || 'Nağd').toLowerCase();
      const isNisye    = odenisRaw.includes('nisy') || odenisRaw.includes('borc');

      let nov = isNisye ? 'nisye' : 'negd';
      if (isQaytarma) nov = 'qaytarma';

      return {
        id: r.qebz_id || ('S' + (r.id || Math.floor(Math.random() * 9000 + 1000))),
        rawId: r.id,
        tarix: dStr,
        saat: sStr,
        mal: r.mehsul_adi || 'Naməlum Məhsul',
        qty,
        isKilo,
        maya,
        satis: mebleg,
        qazanc,
        endirim: 0,
        nov,
        isQaytarma,
        musteri: r.musteri_adi || null,
        odenilen: isNisye ? 0 : mebleg,
        raw: r
      };
    });

    setConnectionStatus('', 'CANLI');
    update();
  } catch (err) {
    console.error("Məlumat çəkilərkən xəta:", err);
    setConnectionStatus('error', 'BAĞLANTI XƏTASI');
  }
}

function setupRealtime() {
  if (!supabaseClient) return;

  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabaseClient
    .channel('satislar-live-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'satislar' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const rec = payload.new;
          const isSale = (rec.emeliyyat_tipi || '').toUpperCase() !== 'QAYTARILMA';
          playChime(isSale);

          const rSay = parseFloat(rec.say) || 1;
          const rName = (rec.mehsul_adi || '').trim().toLowerCase();
          const rIsKilo = (rec.is_kilo === true || rec.is_kilo === 1 || rec.is_kilo === 'true' || rec.vahid === 'kg' || rec.vahid === 'kq')
            || (Math.abs(rSay - Math.round(rSay)) > 0.0001)
            || /\b(kg|kq|kilo|kiloqram|çəki|ceki)\b/i.test(rName);

          const unitStr = rIsKilo ? 'kq' : 'ədəd';
          const title = isSale ? `🛒 Yeni Satış: ${parseFloat(rec.mebleg || 0).toFixed(2)} ₼` : `🔄 Qaytarılma: ${parseFloat(rec.mebleg || 0).toFixed(2)} ₼`;
          const msg = `${rec.mehsul_adi || 'Məhsul'} (${rSay} ${unitStr})`;
          const recDate = rec.tarix ? new Date(rec.tarix) : new Date();
          showToast(title, msg, isSale, recDate);
          addNotification(title, msg, isSale, recDate);
        } else if (payload.eventType === 'DELETE') {
          playChime(false);
          showToast("🗑️ Əməliyyat Silindi", "Bir qeyd bazadan silindi", false);
          addNotification("🗑️ Əməliyyat Silindi", "Bir qeyd bazadan silindi", false);
        }

        fetchData(false);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('', 'CANLI');
      }
    });
}

function refreshData() {
  fetchData();
  showToast("🔄 Yeniləndi", "Məlumatlar Supabase bazasından təkrar oxundu", true);
}

/* =====================================================================
   8) FİLTR VƏ SIRALAMA
   ===================================================================== */
function normalizeAz(str) {
  if (!str) return '';
  return String(str).toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g');
}

function getFiltered(){
  const rawQ = (state.q || '').trim();
  const q = rawQ.toLowerCase();
  const cleanQ = q.replace(/^#/, '').trim();
  const normQ = normalizeAz(cleanQ);

  const fromTime = (state.fromTime || '00:00').trim();
  const toTime   = (state.toTime   || '23:59').trim();

  const startDt = state.from ? (state.from + ' ' + fromTime) : null;
  const endDt   = state.to   ? (state.to   + ' ' + toTime)   : null;

  return SALES.filter(s => {
    const sDt = s.tarix + ' ' + (s.saat || '00:00');
    if (startDt && sDt < startDt) return false;
    if (endDt   && sDt > endDt)   return false;
    if (state.nov === 'loss') {
      if (s.isQaytarma || s.qazanc > 0.001) return false;
    } else if (state.nov !== 'all' && s.nov !== state.nov) {
      return false;
    }
    if (cleanQ) {
      const rawBarcode = s.raw && s.raw.barkod ? String(s.raw.barkod) : '';
      const hay = (String(s.mal || '') + ' ' + String(s.musteri || '') + ' ' + String(s.id || '') + ' ' + rawBarcode).toLowerCase();
      if (!hay.includes(cleanQ) && !normalizeAz(hay).includes(normQ)) return false;
    }
    return true;
  });
}

function sortRows(rows){
  const k = state.sortKey, d = state.sortDir;
  return rows.slice().sort((a, b) => {
    let va = a[k], vb = b[k];
    if (k === 'nov') { va = a.nov; vb = b.nov; }
    if (typeof va === 'string') return va.localeCompare(vb) * d;
    return (va - vb) * d;
  });
}

/* =====================================================================
   9) ANİMASİYALI RƏQƏM
   ===================================================================== */
function animateNum(el, to, fmt, dur = 600){
  const from = el._v || 0;
  el._v = to;
  if (from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  (function step(t){
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

/* =====================================================================
   10) STATİSTİKA HESABLANMASI
   ===================================================================== */
function renderStats(rows){
  let total = 0, maya = 0, qazanc = 0, negd = 0, nisye = 0, borc = 0;
  let count = 0;
  let totalEded = 0, totalKq = 0;

  rows.forEach(s => {
    if (s.isQaytarma) {
      total  -= s.satis;
      maya   -= s.maya;
      qazanc -= s.qazanc;
      if (s.isKilo) {
        totalKq -= s.qty;
      } else {
        totalEded -= s.qty;
      }
    } else {
      total  += s.satis;
      maya   += s.maya;
      qazanc += s.qazanc;
      if (s.nov === 'negd') {
        negd += s.satis;
      } else {
        nisye += s.satis;
        borc  += (s.satis - s.odenilen);
      }
      if (s.isKilo) {
        totalKq += s.qty;
      } else {
        totalEded += s.qty;
      }
      count++;
    }
  });

  totalEded = Math.max(0, totalEded);
  totalKq   = Math.max(0, totalKq);

  const marja   = total > 0 ? (qazanc / total) * 100 : 0;
  const negdPct = (negd + nisye) > 0 ? (negd / (negd + nisye)) * 100 : 0;
  const nisyePct= (negd + nisye) > 0 ? (nisye / (negd + nisye)) * 100 : 0;

  animateNum($('stTotal'),  total,  money);
  animateNum($('stMaya'),   maya,   money);
  animateNum($('stQazanc'), qazanc, money);
  animateNum($('stNegd'),   negd,   money);
  animateNum($('stNisye'),  nisye,  money);

  // Miqdar (Ədəd) və Çəki (Kq) ayrı-ayrı animasiyası
  if ($('stEdedVal')) animateNum($('stEdedVal'), totalEded, n => nf0.format(Math.round(n)));
  if ($('stKiloVal')) animateNum($('stKiloVal'), totalKq, n => {
    const val = Number(n) || 0;
    if (val === 0) return '0';
    if (val % 1 === 0) return nf0.format(Math.round(val));
    const r2 = Math.round(val * 100) / 100;
    return Math.abs(val - r2) > 0.001 ? val.toFixed(3) : val.toFixed(2);
  });

  $('stCount').textContent   = nf0.format(rows.length) + ' əməliyyat';
  $('stMayaPct').textContent = (total > 0 ? (maya / total) * 100 : 0).toFixed(1) + '%';
  $('stMarja').textContent   = marja.toFixed(1) + '% marja';
  $('stNegdPct').textContent = negdPct.toFixed(1) + '% pay';
  $('stBorc').textContent    = money(borc) + ' borc';

  if ($('stEdedSub')) $('stEdedSub').textContent = nf0.format(totalEded) + ' ədəd';
  if ($('stKiloSub')) {
    const kgStr = totalKq % 1 === 0 ? nf0.format(totalKq) : (Math.abs(totalKq - Math.round(totalKq * 100) / 100) > 0.001 ? totalKq.toFixed(3) : totalKq.toFixed(2));
    $('stKiloSub').textContent = kgStr + ' kq';
  }

  const donut = $('donut');
  if ((negd + nisye) > 0) {
    donut.style.background = `conic-gradient(#22d3ee 0% ${negdPct}%, #a855f7 ${negdPct}% 100%)`;
  } else {
    donut.style.background = 'conic-gradient(rgba(255,255,255,.08) 0% 100%)';
  }
  $('donutTotal').textContent = money(total);
  $('lgNegd').textContent  = money(negd);
  $('lgNisye').textContent = money(nisye) + ' (' + nisyePct.toFixed(0) + '%)';

  // Kassa İtkisi və Zərər Dedektoru Hesablaması
  const fromTime = (state.fromTime || '00:00').trim();
  const toTime   = (state.toTime   || '23:59').trim();
  const startDt  = state.from ? (state.from + ' ' + fromTime) : null;
  const endDt    = state.to   ? (state.to   + ' ' + toTime)   : null;

  const dateFiltered = SALES.filter(s => {
    const sDt = s.tarix + ' ' + (s.saat || '00:00');
    if (startDt && sDt < startDt) return false;
    if (endDt   && sDt > endDt)   return false;
    return true;
  });

  const lossItems = dateFiltered.filter(s => !s.isQaytarma && s.qazanc < -0.001);
  const zeroItems = dateFiltered.filter(s => !s.isQaytarma && Math.abs(s.qazanc) <= 0.001);
  const totalLeakCount = lossItems.length + zeroItems.length;
  const totalLossSum = lossItems.reduce((acc, s) => acc + Math.abs(s.qazanc), 0);

  const banner = $('lossAlertBanner');
  const chipCount = $('chipLossCount');
  if (chipCount) {
    if (totalLeakCount > 0) {
      chipCount.style.display = 'inline-block';
      chipCount.textContent = totalLeakCount;
    } else {
      chipCount.style.display = 'none';
    }
  }

  if (banner) {
    // Tələb: Bu xəbərdarlıq banneri YALNIZ ödəniş növündə "Kassa İtkisi" (state.nov === 'loss') seçildikdə görünsün!
    if (state.nov === 'loss' && totalLeakCount > 0) {
      banner.style.display = 'flex';
      if ($('lossBadgeCount')) $('lossBadgeCount').textContent = totalLeakCount + ' əməliyyat';
      if ($('lossTotalSum')) $('lossTotalSum').textContent = '-' + money(totalLossSum);
      if ($('lossAlertDesc')) {
        let descParts = [];
        if (lossItems.length > 0) {
          descParts.push(`<b>${lossItems.length}</b> zərərinə satış (cəmi <b>-${money(totalLossSum)}</b> itki)`);
        }
        if (zeroItems.length > 0) {
          descParts.push(`<b>${zeroItems.length}</b> sıfır qazancla (xeyirsiz) satış`);
        }
        $('lossAlertDesc').innerHTML = `Seçilmiş dövrdə ${descParts.join(' və ')} aşkarlandı.`;
      }
    } else {
      banner.style.display = 'none';
    }
  }
}

/* =====================================================================
   11) QRAFİK (Dinamik Bar Çart)
   ===================================================================== */
function buildBuckets(rows){
  const map = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const o = map.get(s.tarix) || { negd:0, nisye:0, total:0, qazanc:0, count:0 };
    if (s.nov === 'negd') o.negd += s.satis;
    else o.nisye += s.satis;
    o.total  += s.satis;
    o.qazanc += s.qazanc;
    o.count++;
    map.set(s.tarix, o);
  });

  const days = [...map.keys()].sort();
  if (days.length === 0) return [];
  if (days.length <= 62) {
    return days.map(d => ({
      label: d.slice(8) + '.' + d.slice(5, 7),
      full: d,
      ...map.get(d)
    }));
  }
  const out = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const o = { negd:0, nisye:0, total:0, qazanc:0, count:0 };
    chunk.forEach(d => {
      const v = map.get(d);
      if (v) {
        o.negd += v.negd; o.nisye += v.nisye; o.total += v.total;
        o.qazanc += v.qazanc; o.count += v.count;
      }
    });
    out.push({
      label: chunk[0].slice(8) + '.' + chunk[0].slice(5,7),
      full: chunk[0] + ' → ' + chunk[chunk.length-1],
      ...o
    });
  }
  return out;
}

function renderChart(rows){
  const chart = $('chart');
  const data = buildBuckets(rows);
  chart.innerHTML = '';

  if (!data.length) {
    chart.innerHTML = '<div style="margin:auto;color:#5f6b87;font-size:13px;font-weight:600">Seçilmiş dövr üzrə qrafik məlumatı yoxdur</div>';
    if ($('chartSub')) $('chartSub').textContent = 'Məlumat tapılmadı';
    else if ($('mainSliderSubtitle')) $('mainSliderSubtitle').textContent = 'Məlumat tapılmadı';
    return;
  }

  const max = Math.max(...data.map(d => d.total)) || 1;
  const step = Math.ceil(data.length / 14);

  data.forEach((d, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const h = Math.max((d.total / max) * 100, 1.5);
    const pN = d.total ? (d.negd / d.total) * 100 : 0;
    const pC = d.total ? (d.nisye / d.total) * 100 : 0;

    bar.innerHTML = `
      <div class="bar-inner" style="--h:${h}%;animation-delay:${Math.min(i * 14, 500)}ms">
        <div class="seg negd"  style="height:${pN}%"></div>
        <div class="seg nisye" style="height:${pC}%"></div>
      </div>
      ${(i % step === 0 || i === data.length - 1)
        ? `<div class="bar-lbl">${d.label}</div>` : ''}
    `;

    bar.addEventListener('mouseenter', e => showTip(e, d));
    bar.addEventListener('mousemove',  e => moveTip(e));
    bar.addEventListener('mouseleave', hideTip);

    chart.appendChild(bar);
  });

  if ($('mainSliderSubtitle') && currentMainSlide === 0) {
    $('mainSliderSubtitle').textContent =
      `Səhifə 1 / 2 • ${data.length} ${data.length > 62 ? 'həftə' : 'gün'} • pik: ${money(max)}`;
  }
}

const tip = $('tooltip');
function showTip(e, d){
  tip.innerHTML = `
    <b>${d.full}</b>
    <div class="row"><span>Satış sayı</span><span>${d.count}</span></div>
    <div class="row cy"><span>Nəğd</span><span>${money(d.negd)}</span></div>
    <div class="row vi"><span>Nisyə</span><span>${money(d.nisye)}</span></div>
    <div class="row"><span><b style="display:inline;color:#9aa5bd">Cəmi</b></span><span>${money(d.total)}</span></div>
    <div class="row gr"><span>Qazanc</span><span>${money(d.qazanc)}</span></div>
  `;
  tip.classList.add('on');
  moveTip(e);
}
function moveTip(e){
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = e.clientX + 16, y = e.clientY - h - 14;
  if (x + w > window.innerWidth - 12) x = e.clientX - w - 16;
  if (y < 12) y = e.clientY + 18;
  tip.style.left = x + 'px';
  tip.style.top  = y + 'px';
}
function hideTip(){ tip.classList.remove('on'); }

/* =====================================================================
   11-B) DƏRİN ANALİTİKA RENDERİ (Saatlıq Pik, Qazanc, Qiymət Seqmentləri)
   ===================================================================== */
function renderHourlyChart(rows) {
  const chart = $('hourlyChart');
  const banner = $('hourlySummaryBanner');
  if (!chart) return;
  chart.innerHTML = '';

  const hourMap = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const h = parseInt((s.saat || '00:00').split(':')[0], 10);
    const hourKey = isNaN(h) ? 12 : h;
    const o = hourMap.get(hourKey) || { total: 0, qazanc: 0, count: 0, receipts: new Set() };
    o.total += s.satis;
    o.qazanc += s.qazanc;
    o.count += s.qty;
    if (s.id) o.receipts.add(s.id);
    hourMap.set(hourKey, o);
  });

  if (!hourMap.size) {
    chart.innerHTML = '<div style="margin:auto;color:#5f6b87;font-size:13px;font-weight:600">Seçilmiş dövrdə saatlıq məlumat yoxdur</div>';
    if (banner) banner.innerHTML = '<span>Məlumat tapılmadı</span>';
    return;
  }

  let minH = Math.min(...hourMap.keys());
  let maxH = Math.max(...hourMap.keys());
  if (minH > 8) minH = 8;
  if (maxH < 22) maxH = 22;

  const hoursData = [];
  let maxTurnover = 0;
  let peakHour = null;
  let minHour = null;
  let minTurnover = Infinity;

  for (let h = minH; h <= maxH; h++) {
    const o = hourMap.get(h) || { total: 0, qazanc: 0, count: 0, receipts: new Set() };
    const label = (h < 10 ? '0' : '') + h + ':00';
    const item = {
      hour: h,
      label,
      total: o.total,
      qazanc: o.qazanc,
      count: o.count,
      receiptCount: o.receipts.size
    };
    hoursData.push(item);
    if (item.total > maxTurnover) {
      maxTurnover = item.total;
      peakHour = item;
    }
    if (item.total > 0 && item.total < minTurnover) {
      minTurnover = item.total;
      minHour = item;
    }
  }

  if (banner) {
    if (peakHour && peakHour.total > 0) {
      const minText = minHour ? `<span>💤 Sakit saat: <b>${minHour.label}</b> (${money(minHour.total)})</span>` : '';
      banner.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span class="badge-fire"><i class="fa-solid fa-fire"></i> Pik Saat: <b>${peakHour.label}</b></span>
          <span>Dövriyyə: <b>${money(peakHour.total)}</b> (${peakHour.receiptCount} çek)</span>
        </div>
        ${minText}
      `;
    } else {
      banner.innerHTML = `<span>Günün saatları üzrə satış bölgüsü</span>`;
    }
  }

  const maxVal = Math.max(maxTurnover, 1);
  hoursData.forEach(d => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const pct = Math.max((d.total / maxVal) * 100, d.total > 0 ? 4 : 0);
    const isPeak = peakHour && d.hour === peakHour.hour && d.total > 0;

    bar.innerHTML = `
      <div class="bar-inner" style="--h:${pct}%">
        <div class="seg hourly-seg ${isPeak ? 'peak' : ''}" style="height:100%"></div>
      </div>
      <div class="bar-lbl">${d.hour}</div>
    `;

    bar.addEventListener('mouseenter', e => {
      tip.innerHTML = `
        <b>Saat: ${d.label} — ${(d.hour+1<10?'0':'')+(d.hour+1)}:00</b>
        <div class="row cy"><span>Dövriyyə</span><span>${money(d.total)}</span></div>
        <div class="row"><span>Müştəri / Çek</span><span>${d.receiptCount} qəbz</span></div>
        <div class="row"><span>Satılan Miqdar</span><span>${d.count % 1 === 0 ? d.count : d.count.toFixed(2)} əd/kq</span></div>
        <div class="row gr"><span>Qazanc</span><span>${money(d.qazanc)}</span></div>
      `;
      tip.classList.add('on');
      moveTip(e);
    });
    bar.addEventListener('mousemove', moveTip);
    bar.addEventListener('mouseleave', hideTip);

    chart.appendChild(bar);
  });
}

function renderProfitChart(rows) {
  const chart = $('profitChart');
  const banner = $('profitSummaryBanner');
  if (!chart) return;
  chart.innerHTML = '';

  const dayMap = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const o = dayMap.get(s.tarix) || { total: 0, qazanc: 0, count: 0 };
    o.total += s.satis;
    o.qazanc += s.qazanc;
    o.count++;
    dayMap.set(s.tarix, o);
  });

  const days = [...dayMap.keys()].sort();
  if (!days.length) {
    chart.innerHTML = '<div style="margin:auto;color:#5f6b87;font-size:13px;font-weight:600">Seçilmiş dövrdə qazanc məlumatı yoxdur</div>';
    if (banner) banner.innerHTML = '<span>Məlumat tapılmadı</span>';
    return;
  }

  let totalQazanc = 0;
  let totalSatis = 0;
  let maxProfit = -Infinity;
  let bestDay = null;

  const data = days.map(d => {
    const o = dayMap.get(d);
    totalQazanc += o.qazanc;
    totalSatis += o.total;
    const marja = o.total > 0 ? (o.qazanc / o.total) * 100 : 0;
    if (o.qazanc > maxProfit) {
      maxProfit = o.qazanc;
      bestDay = { date: d, qazanc: o.qazanc, marja };
    }
    return {
      date: d,
      label: d.slice(8) + '.' + d.slice(5, 7),
      total: o.total,
      qazanc: o.qazanc,
      marja,
      count: o.count
    };
  });

  const avgMargin = totalSatis > 0 ? (totalQazanc / totalSatis) * 100 : 0;
  if (banner) {
    const bestText = bestDay ? `<span class="badge-win"><i class="fa-solid fa-trophy"></i> Ən Qazanclı Gün: <b>${bestDay.date.slice(8)}.${bestDay.date.slice(5,7)}</b> (+${money(bestDay.qazanc)})</span>` : '';
    banner.innerHTML = `
      ${bestText}
      <span>Orta Marja: <b>${avgMargin.toFixed(1)}%</b> • Cəmi Qazanc: <b>${money(totalQazanc)}</b></span>
    `;
  }

  const maxVal = Math.max(...data.map(d => Math.abs(d.qazanc)), 1);
  const step = Math.ceil(data.length / 15);

  data.forEach((d, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const isNeg = d.qazanc < -0.001;
    const pct = Math.max((Math.abs(d.qazanc) / maxVal) * 100, Math.abs(d.qazanc) > 0 ? 5 : 0);

    bar.innerHTML = `
      <div class="bar-inner" style="--h:${pct}%">
        <div class="seg profit-seg ${isNeg ? 'neg' : ''}" style="height:100%"></div>
      </div>
      ${(i % step === 0 || i === data.length - 1) ? `<div class="bar-lbl">${d.label}</div>` : ''}
    `;

    bar.addEventListener('mouseenter', e => {
      tip.innerHTML = `
        <b>Tarix: ${d.date.split('-').reverse().join('.')}</b>
        <div class="row gr"><span>Xalis Qazanc</span><span>${d.qazanc > 0 ? '+' : ''}${money(d.qazanc)}</span></div>
        <div class="row cy"><span>Dövriyyə</span><span>${money(d.total)}</span></div>
        <div class="row"><span>Marja (%)</span><span>${d.marja.toFixed(1)}%</span></div>
        <div class="row"><span>Əməliyyat</span><span>${d.count} satış</span></div>
      `;
      tip.classList.add('on');
      moveTip(e);
    });
    bar.addEventListener('mousemove', moveTip);
    bar.addEventListener('mouseleave', hideTip);

    chart.appendChild(bar);
  });
}

let bracketsExpanded = false;

function toggleBracketsExpand() {
  bracketsExpanded = !bracketsExpanded;
  renderBrackets(getFiltered());
}

function renderBrackets(rows) {
  const container = $('bracketsContainer');
  if (!container) return;

  const b = {
    b1: { name: '0.00 — 1.00 ₼', desc: 'Xırda mallar (saqqız, kibrit, konfet)', icon: 'fa-cookie-bite', color: '#06b6d4', total: 0, qazanc: 0, count: 0 },
    b2: { name: '1.01 — 5.00 ₼', desc: 'Gündəlik tələbat (çörək, su, süd, biskvit)', icon: 'fa-basket-shopping', color: '#3b82f6', total: 0, qazanc: 0, count: 0 },
    b3: { name: '5.01 — 10.00 ₼', desc: 'Orta səbət (şirniyyat, un, makaron)', icon: 'fa-cart-shopping', color: '#8b5cf6', total: 0, qazanc: 0, count: 0 },
    b4: { name: '10.01 — 20.00 ₼', desc: 'Əsas alışlar (yağ, çay, kolbasa, yuyucu)', icon: 'fa-bag-shopping', color: '#f59e0b', total: 0, qazanc: 0, count: 0 },
    b5: { name: '20.01 ₼ +', desc: 'Böyük alışlar və qutular', icon: 'fa-gem', color: '#10b981', total: 0, qazanc: 0, count: 0 }
  };

  let grandTotal = 0;
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const unitPrice = s.qty > 0 ? (s.satis / s.qty) : s.satis;
    grandTotal += s.satis;

    let target = b.b1;
    if (unitPrice <= 1) target = b.b1;
    else if (unitPrice <= 5) target = b.b2;
    else if (unitPrice <= 10) target = b.b3;
    else if (unitPrice <= 20) target = b.b4;
    else target = b.b5;

    target.total += s.satis;
    target.qazanc += s.qazanc;
    target.count += s.qty;
  });

  const base = Math.max(grandTotal, 0.001);
  const allItems = Object.values(b);
  const isMobile = window.innerWidth <= 768;
  const visibleItems = (isMobile && !bracketsExpanded) ? allItems.slice(0, 2) : allItems;

  let cardsHtml = visibleItems.map(item => {
    const pct = ((item.total / base) * 100);
    return `
      <div class="bracket-card">
        <div class="bracket-top">
          <div class="bracket-lbl">
            <div class="bracket-ico" style="background:${item.color}22;color:${item.color};border:1px solid ${item.color}44">
              <i class="fa-solid ${item.icon}"></i>
            </div>
            <div>
              <div class="bracket-name">${item.name}</div>
              <div class="bracket-desc">${item.desc}</div>
            </div>
          </div>
          <div class="bracket-amt">${money(item.total)}</div>
        </div>
        <div class="bracket-track">
          <div class="bracket-fill" style="width:${pct}%;background:${item.color}"></div>
        </div>
        <div class="bracket-meta">
          <span>Pay: <b>${pct.toFixed(1)}%</b></span>
          <span>Miqdar: <b>${Math.round(item.count)} əd/kq</b></span>
          <span>Qazanc: <b class="bracket-qazanc-val">+${money(item.qazanc)}</b></span>
        </div>
      </div>
    `;
  }).join('');

  let moreBtnHtml = '';
  if (isMobile) {
    const remCount = allItems.length - 2;
    if (!bracketsExpanded) {
      moreBtnHtml = `
        <div style="text-align:center;padding:4px 0 6px;grid-column:1/-1">
          <button type="button" class="btn-top-more" onclick="toggleBracketsExpand()">
            <i class="fa-solid fa-angles-down"></i>
            <span>Daha çox göstər (+${remCount})</span>
            <small style="opacity:.7;margin-left:4px">(2 / ${allItems.length} seqment)</small>
          </button>
        </div>`;
    } else {
      moreBtnHtml = `
        <div style="text-align:center;padding:4px 0 6px;grid-column:1/-1">
          <button type="button" class="btn-top-more btn-brackets-collapse" onclick="toggleBracketsExpand()">
            <i class="fa-solid fa-angles-up"></i>
            <span>İlk 2-yə qayıt</span>
            <small style="opacity:.7;margin-left:4px">(Cəmi ${allItems.length} seqment)</small>
          </button>
        </div>`;
    }
  }

  container.innerHTML = cardsHtml + moreBtnHtml;
}

function renderAdvancedCharts(rows) {
  if (currentMainMode === 'hourly') {
    renderHourlyChart(rows);
  } else if (currentMainMode === 'profit') {
    renderProfitChart(rows);
  } else if (currentMainMode === 'brackets') {
    renderBrackets(rows);
  }
}

/* =====================================================================
   12) TOP QAZANCLI MƏHSULLAR (Səhifələmə & Daha Çox Göstər ilə)
   ===================================================================== */
function getInitialTopLimit() {
  return window.innerWidth <= 768 ? 3 : 5;
}

let topProductsLimit = getInitialTopLimit();
let topSortMode = localStorage.getItem('kassa_top_sort_mode') || 'qty'; // 'qty' (Say / Ədəd / Kq) və ya 'qazanc' (Manat / Gəlir)

function initTopSort() {
  const mode = localStorage.getItem('kassa_top_sort_mode') || 'qty';
  topSortMode = mode;
  const btnQty = $('btnSortQty');
  const btnProfit = $('btnSortProfit');
  if (btnQty) btnQty.classList.toggle('active', mode === 'qty');
  if (btnProfit) btnProfit.classList.toggle('active', mode === 'qazanc');
}

function setTopSortMode(mode) {
  if (mode !== 'qty' && mode !== 'qazanc') mode = 'qty';
  topSortMode = mode;
  localStorage.setItem('kassa_top_sort_mode', mode);

  const btnQty = $('btnSortQty');
  const btnProfit = $('btnSortProfit');
  if (btnQty) btnQty.classList.toggle('active', mode === 'qty');
  if (btnProfit) btnProfit.classList.toggle('active', mode === 'qazanc');

  const titleText = $('sliderTitleText');
  if (titleText && currentSlide === 1) {
    titleText.textContent = mode === 'qty' ? 'Ən Çox Satılan Məhsullar' : 'Ən Qazanclı Məhsullar';
  }

  const subText = $('sliderSubtitle');
  if (subText && currentSlide === 1) {
    subText.textContent = `Səhifə 2 / 2 • Top ${topProductsLimit} (${mode === 'qty' ? 'Sayına görə' : 'Qazanca görə'})`;
  }

  renderTop(getFiltered());
}

function loadMoreTopProducts(){
  topProductsLimit += 5;
  renderTop(getFiltered());
}

function resetTopLimit(){
  topProductsLimit = getInitialTopLimit();
  renderTop(getFiltered());
}

function renderTop(rows){
  const map = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const o = map.get(s.mal) || { qazanc:0, satis:0, qty:0, isKilo:s.isKilo };
    o.qazanc += s.qazanc;
    o.satis  += s.satis;
    o.qty    += s.qty;
    o.isKilo  = s.isKilo;
    map.set(s.mal, o);
  });

  const isQtyMode = topSortMode === 'qty';

  const allSorted = [...map.entries()]
    .sort((a, b) => {
      if (isQtyMode) {
        return (b[1].qty - a[1].qty) || (b[1].qazanc - a[1].qazanc);
      } else {
        return (b[1].qazanc - a[1].qazanc) || (b[1].qty - a[1].qty);
      }
    });

  const box = $('topList');
  if (!allSorted.length) {
    box.innerHTML = '<div style="color:#5f6b87;font-size:12.5px;padding:8px 0;text-align:center">Məlumat yoxdur</div>';
    return;
  }

  const visibleList = allSorted.slice(0, topProductsLimit);
  const maxVal = isQtyMode 
    ? Math.max(allSorted[0][1].qty || 0, 0.0001) 
    : Math.max(allSorted[0][1].qazanc || 0, 0.0001);

  let html = visibleList.map(([ad, v], idx) => {
    const qtyFormatted = v.isKilo ? (v.qty % 1 === 0 ? v.qty : v.qty.toFixed(2)) + ' kq' : (v.qty % 1 === 0 ? v.qty : v.qty.toFixed(2)) + ' ədəd';
    
    let mainValHtml = '';
    let subInfoHtml = '';
    let fillPct = 0;

    const profitStr = (v.qazanc > 0 ? '+' : '') + money(v.qazanc);
    const satisStr = money(v.satis);

    if (isQtyMode) {
      mainValHtml = `<span class="tp-val tp-qty" style="color:#38bdf8">${qtyFormatted}</span>`;
      subInfoHtml = `<div style="font-size:10.5px;color:#64708a">qazanc: <b style="color:#34d399">${profitStr}</b> • satış: ${satisStr}</div>`;
      fillPct = Math.min(100, Math.max((v.qty / maxVal) * 100, 3));
    } else {
      mainValHtml = `<span class="tp-val tp-profit">${profitStr}</span>`;
      subInfoHtml = `<div style="font-size:10.5px;color:#64708a">${qtyFormatted} • satış: ${satisStr}</div>`;
      fillPct = Math.min(100, Math.max((Math.max(0, v.qazanc) / maxVal) * 100, 3));
    }

    return `
    <div class="tp">
      <div class="tp-top">
        <span class="tp-name"><span style="color:#8892ab;font-size:11px;margin-right:5px;font-weight:700">#${idx + 1}</span>${escapeHtml(ad)}</span>
        ${mainValHtml}
      </div>
      <div class="tp-track"><div class="tp-fill ${isQtyMode ? 'fill-qty' : ''}" data-w="${fillPct}"></div></div>
      ${subInfoHtml}
    </div>`;
  }).join('');

  const initialLimit = getInitialTopLimit();
  if (allSorted.length > initialLimit) {
    if (topProductsLimit < allSorted.length) {
      const nextCount = Math.min(5, allSorted.length - topProductsLimit);
      html += `
        <div style="text-align:center;padding-top:6px">
          <button type="button" class="btn-top-more" onclick="loadMoreTopProducts()">
            <i class="fa-solid fa-angles-down"></i>
            <span>Daha çox göstər (+${nextCount})</span>
            <small style="opacity:.7;margin-left:4px">(${visibleList.length} / ${allSorted.length})</small>
          </button>
        </div>`;
    } else {
      html += `
        <div style="text-align:center;padding-top:6px">
          <button type="button" class="btn-top-more" onclick="resetTopLimit()" style="border-color:rgba(255,255,255,.15);color:#94a3b8">
            <i class="fa-solid fa-angles-up"></i>
            <span>İlk ${initialLimit}-ə qayıt</span>
            <small style="opacity:.7;margin-left:4px">(Cəmi ${allSorted.length} məhsul)</small>
          </button>
        </div>`;
    }
  }

  box.innerHTML = html;

  requestAnimationFrame(() => {
    box.querySelectorAll('.tp-fill').forEach(f => { f.style.width = f.dataset.w + '%'; });
  });

  const subText = $('sliderSubtitle');
  if (subText && currentSlide === 1) {
    subText.textContent = `Səhifə 2 / 2 • Top ${visibleList.length} (${isQtyMode ? 'Sayına görə' : 'Qazanca görə'})`;
  }
}

/* =====================================================================
   13) CƏDVƏL RENDERİ (Mobil üçün data-label ilə)
   ===================================================================== */
function escapeHtml(str){
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function initials(name){
  if (!name) return 'N';
  const p = name.trim().split(' ');
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}

/* ============ SƏHİFƏLƏMƏ DƏYİŞƏNLƏRİ VƏ FUNKSİYALARI ============ */
let tableVisibleLimit = 25;
let tableStep = 25;

function resetPagination() {
  if (tableStep !== 'all') {
    tableVisibleLimit = typeof tableStep === 'number' ? tableStep : 25;
  }
  topProductsLimit = getInitialTopLimit();
  bracketsExpanded = false;
}

function loadMoreRows() {
  const stepVal = typeof tableStep === 'number' ? tableStep : 25;
  tableVisibleLimit += stepVal;
  const filtered = getFiltered();
  renderTable(filtered);
}

function setPageStep(step) {
  tableStep = step;
  if (step === 'all') {
    tableVisibleLimit = 999999;
  } else {
    tableVisibleLimit = parseInt(step, 10) || 25;
  }
  const filtered = getFiltered();
  renderTable(filtered);
}

function updatePaginationUI(visibleCount, totalCount) {
  const pgEl = $('tblPagination');
  const visEl = $('pgVisibleCount');
  const totEl = $('pgTotalCount');
  const btnMore = $('btnLoadMore');
  if (!pgEl) return;

  if (totalCount === 0) {
    pgEl.style.display = 'none';
    return;
  }
  pgEl.style.display = 'flex';
  if (visEl) visEl.textContent = nf0.format(visibleCount);
  if (totEl) totEl.textContent = nf0.format(totalCount);

  if (btnMore) {
    if (visibleCount >= totalCount || tableStep === 'all') {
      btnMore.style.display = 'none';
    } else {
      btnMore.style.display = 'inline-flex';
      const stepVal = typeof tableStep === 'number' ? tableStep : 25;
      const remain = totalCount - visibleCount;
      const nextAdd = Math.min(stepVal, remain);
      btnMore.innerHTML = `<i class="fa-solid fa-angles-down"></i> <span>Daha çox göstər (+${nextAdd})</span>`;
    }
  }

  document.querySelectorAll('.ps-chip').forEach(chip => {
    const s = chip.dataset.step;
    const isActive = (s === 'all' && tableStep === 'all') || (parseInt(s, 10) === tableStep);
    chip.classList.toggle('active', isActive);
  });
}

/* ============ KASSA ÇEKİ MƏNTİQİ ============ */
let currentReceiptData = null;

function openReceiptModal(saleId) {
  if (!saleId) return;

  // Qəbzə aid bütün məhsulları toplayırıq
  let items = SALES.filter(x => x.id === saleId || (x.raw && x.raw.qebz_id === saleId));
  if (!items.length) {
    items = SALES.filter(x => String(x.rawId) === String(saleId));
  }
  if (!items.length) {
    const single = SALES.find(x => x.id === saleId || String(x.rawId) === String(saleId));
    if (single) items = [single];
  }

  if (!items.length) {
    showToast("⚠️ Çek Tapılmadı", "Bu satış üçün qəbz detalları tapılmadı.", false);
    return;
  }

  const first = items[0];
  const isQ = first.isQaytarma;
  const isNisye = first.nov === 'nisye';

  let grandTotal = 0;
  let totalDebt = 0;
  let totalItemsCount = 0;

  items.forEach(it => {
    grandTotal += it.isQaytarma ? -it.satis : it.satis;
    if (it.nov === 'nisye') {
      totalDebt += Math.max(0, it.satis - (it.odenilen || 0));
    }
    totalItemsCount += it.qty;
  });

  // Müştəri adı: əgər yoxdursa və ya standartdırsa boş qoyuruq
  const rawMusteri = (first.musteri || '').trim();
  const isDefaultMusteri = !rawMusteri || rawMusteri.toLowerCase() === 'standart alıcı' || rawMusteri.toLowerCase() === 'nəğd müştəri' || rawMusteri.toLowerCase() === 'negd musteri';
  const displayMusteri = isDefaultMusteri ? '' : rawMusteri;

  currentReceiptData = {
    receiptId: first.id,
    storeName: 'Papatya',
    tarix: first.tarix,
    saat: first.saat,
    musteri: displayMusteri,
    nov: first.nov,
    isQaytarma: isQ,
    isNisye: isNisye,
    debt: totalDebt,
    grandTotal: Math.abs(grandTotal),
    items: items
  };

  // Çek məlumatlarını doldururuq
  const storeEl = $('rcptStoreName');
  if (storeEl) storeEl.textContent = 'Papatya';

  const numEl = $('rcptNumber');
  if (numEl) numEl.textContent = '#' + currentReceiptData.receiptId;

  const dateEl = $('rcptDate');
  if (dateEl) dateEl.textContent = currentReceiptData.tarix.split('-').reverse().join('.');

  const timeEl = $('rcptTime');
  if (timeEl) timeEl.textContent = currentReceiptData.saat;

  const custEl = $('rcptCustomer');
  if (custEl) custEl.textContent = displayMusteri;

  const debtRow = $('rcptDebtRow');
  const debtVal = $('rcptDebtVal');
  if (debtRow && debtVal) {
    if (totalDebt > 0) {
      debtRow.style.display = 'flex';
      debtVal.textContent = money(totalDebt);
    } else {
      debtRow.style.display = 'none';
    }
  }

  const itemsListEl = $('rcptItemsList');
  if (itemsListEl) {
    itemsListEl.innerHTML = items.map(it => {
      const unit = it.isKilo ? 'kq' : 'əd';
      const lineTotal = it.isQaytarma ? -it.satis : it.satis;
      const unitPrice = it.qty > 0 ? (it.satis / it.qty) : it.satis;
      return `
        <div class="rcpt-item-row">
          <div class="rcpt-item-left">
            <div class="rcpt-item-name">${escapeHtml(it.mal)}</div>
            <div class="rcpt-item-sub">${it.qty} ${unit} × ${money(unitPrice)}</div>
          </div>
          <div class="rcpt-item-price">${money(lineTotal)}</div>
        </div>
      `;
    }).join('');
  }

  const totalCountEl = $('rcptTotalItems');
  if (totalCountEl) {
    totalCountEl.textContent = `${items.length} adda (${totalItemsCount % 1 === 0 ? totalItemsCount : totalItemsCount.toFixed(3)})`;
  }

  const grandTotalEl = $('rcptGrandTotal');
  if (grandTotalEl) grandTotalEl.textContent = money(currentReceiptData.grandTotal);

  const subTitle = $('rcptSubTitle');
  if (subTitle) subTitle.textContent = `#${currentReceiptData.receiptId} • ${items.length} məhsul`;

  const modal = $('receiptModal');
  if (modal) modal.classList.remove('hidden');
}

function closeReceiptModal() {
  const modal = $('receiptModal');
  if (modal) modal.classList.add('hidden');
}

function shareReceiptWhatsApp() {
  if (!currentReceiptData) return;
  const d = currentReceiptData;
  
  let msg = `🧾 *PAPATYA*\n`;
  msg += `--------------------------------\n`;
  msg += `🔢 *Qəbz №:* #${d.receiptId}\n`;
  msg += `📅 *Tarix:* ${d.tarix.split('-').reverse().join('.')}  ⏰ *Saat:* ${d.saat}\n`;
  msg += `👤 *Müştəri:* ${d.musteri}\n`;
  msg += `--------------------------------\n`;
  msg += `📦 *MƏHSULLAR:*\n`;

  d.items.forEach((it, idx) => {
    const unit = it.isKilo ? 'kq' : 'əd';
    const unitPrice = it.qty > 0 ? (it.satis / it.qty).toFixed(2) : it.satis.toFixed(2);
    msg += `${idx + 1}. *${it.mal}*\n`;
    msg += `   ${it.qty} ${unit} × ${unitPrice} ₼ = *${it.satis.toFixed(2)} ₼*\n`;
  });

  msg += `================================\n`;
  msg += `💰 *YEKUN CƏM: ${d.grandTotal.toFixed(2)} ₼*\n`;
  if (d.debt > 0) {
    msg += `⚠️ *Qalan Borc: ${d.debt.toFixed(2)} ₼*\n`;
  }
  msg += `--------------------------------\n`;
  msg += `🙏 *Bizi seçdiyiniz üçün təşəkkür edirik!*\n`;
  msg += `✨ _Elektron Kassa Sistemi_`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function printReceiptDirect() {
  window.print();
}

function fallbackDownload(canvas, fileName, existingBlob) {
  const doDownload = (blobUrl) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      if (downloadLink.parentNode) document.body.removeChild(downloadLink);
      if (blobUrl && blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
    }, 250);
    showToast("📸 Çek Endirildi!", "Kassa çeki şəkil kimi yükləndi.", true);
  };

  if (existingBlob) {
    doDownload(URL.createObjectURL(existingBlob));
  } else if (canvas.toBlob) {
    canvas.toBlob(blob => {
      if (blob) {
        doDownload(URL.createObjectURL(blob));
      } else {
        doDownload(canvas.toDataURL('image/png'));
      }
    }, 'image/png');
  } else {
    doDownload(canvas.toDataURL('image/png'));
  }
}

async function downloadReceiptImage() {
  const rcptEl = $('thermalReceipt');
  if (!rcptEl || !currentReceiptData) return;

  try {
    if (typeof html2canvas === 'undefined') {
      throw new Error("html2canvas yüklənmədi");
    }

    const safeScale = window.innerWidth <= 768 ? 2 : 2.5;
    const canvas = await html2canvas(rcptEl, {
      scale: safeScale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0
    });

    const fileName = `cek_${currentReceiptData.receiptId || 'papatya'}_${iso(new Date())}.png`;

    // Mobil brauzerlərdə Web Share dəstəyi ilə birbaşa Qalereyaya və ya WhatsApp-a göndərmə
    if (navigator.share && navigator.canShare && canvas.toBlob) {
      canvas.toBlob(async blob => {
        if (!blob) {
          fallbackDownload(canvas, fileName);
          return;
        }
        try {
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Kassa Çeki',
              text: `Kassa Çeki #${currentReceiptData.receiptId || ''}`
            });
            showToast("📸 Çek Paylaşıldı!", "Kassa çeki uğurla paylaşıldı.", true);
            return;
          }
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
        fallbackDownload(canvas, fileName, blob);
      }, 'image/png');
    } else {
      fallbackDownload(canvas, fileName);
    }
  } catch (err) {
    console.error("Şəkil yaradılarkən xəta:", err);
    showToast("⚠️ Xəta", "Çek şəkli yaradılarkən xəta baş verdi.", false);
  }
}

/* =====================================================================
   13) CƏDVƏL RENDERİ (Mobil üçün data-label və Səhifələmə ilə)
   ===================================================================== */
function renderTable(rows){
  const body = $('tbody');
  const sorted = sortRows(rows);

  const totalSalesVal = sorted.reduce((a, s) => a + (s.isQaytarma ? -s.satis : s.satis), 0);
  $('tblSub').textContent = nf0.format(sorted.length) + ' nəticə • cəmi ' + money(totalSalesVal);

  if (!sorted.length) {
    const hasSearch = Boolean(state.q && state.q.trim());
    body.innerHTML = `
      <tr><td colspan="6" style="display:block">
        <div class="empty">
          <i class="fa-regular fa-folder-open"></i>
          <p>Seçilmiş kriteriyalara uyğun əməliyyat tapılmadı</p>
          ${hasSearch ? `<button type="button" class="btn" style="margin-top:10px;padding:6px 14px;font-size:12px;background:rgba(34,211,238,.15);border:1px solid rgba(34,211,238,.3);color:#67e8f9;border-radius:8px;cursor:pointer" onclick="document.querySelector('#presets button[data-preset=\\'all\\']').click()"><i class="fa-solid fa-infinity"></i> Bütün dövr üzrə axtar</button>` : ''}
        </div>
      </td></tr>`;
    updatePaginationUI(0, 0);
    return;
  }

  const currentLimit = tableStep === 'all' ? sorted.length : Math.min(tableVisibleLimit, sorted.length);
  const rowsToRender = sorted.slice(0, currentLimit);
  updatePaginationUI(rowsToRender.length, sorted.length);

  const isMobile = window.innerWidth <= 768;

  const html = rowsToRender.map(s => {
    const isQ = s.isQaytarma;
    const borc = s.nov === 'nisye' ? (s.satis - s.odenilen) : 0;
    const rawIdStr = String(s.id || '');
    const shortId = rawIdStr.length > 8 ? rawIdStr.slice(0, 8) : rawIdStr;

    let musteriCell = '';
    if (isQ) {
      musteriCell = `
        <div class="musteri">
          <span class="avatar ret"><i class="fa-solid fa-arrow-rotate-left"></i></span>
          <div>
            <span class="mname" style="color:#fda4af">${escapeHtml(s.musteri || 'Qaytarılma')}</span>
            <span style="display:block;font-size:10px;color:#fda4af;font-weight:700">Qaytarılma</span>
          </div>
        </div>`;
    } else if (s.musteri) {
      musteriCell = `
        <div class="musteri">
          <span class="avatar ${s.nov === 'nisye' ? '' : 'neg'}">${initials(s.musteri)}</span>
          <div>
            <span class="mname">${escapeHtml(s.musteri)}</span>
            ${s.nov === 'nisye' ? `<span style="display:block;font-size:10px;color:#c084fc;font-weight:600">Nisyə${borc > 0 ? ' • Borc: ' + money(borc) : ''}</span>` : ''}
          </div>
        </div>`;
    } else {
      musteriCell = `
        <div class="musteri">
          <span class="avatar neg">N</span>
          <span class="mname" style="color:#8b96ad">Nəğd müştəri</span>
        </div>`;
    }

    const isLoss = !isQ && s.qazanc < -0.001;
    const isZero = !isQ && Math.abs(s.qazanc) <= 0.001;

    let qazancCell = '';
    if (isQ) {
      qazancCell = `<td class="num neg" data-label="Qazanc">-${money(Math.abs(s.qazanc))}</td>`;
    } else if (isLoss) {
      qazancCell = `
        <td class="num neg" data-label="Qazanc">
          <div class="loss-cell">
            <span class="loss-val">-${money(Math.abs(s.qazanc))}</span>
            <span class="leak-tag loss-tag" title="Maya: ${money(s.maya)} | Satış: ${money(s.satis)}"><i class="fa-solid fa-triangle-exclamation"></i> Zərər</span>
          </div>
        </td>`;
    } else if (isZero) {
      qazancCell = `
        <td class="num" data-label="Qazanc">
          <div class="loss-cell">
            <span class="zero-val">0.00 ₼</span>
            <span class="leak-tag zero-tag" title="Maya və Satış qiyməti bərabərdir!"><i class="fa-solid fa-circle-minus"></i> 0 qazanc</span>
          </div>
        </td>`;
    } else {
      qazancCell = `<td class="num pos" data-label="Qazanc">+${money(s.qazanc)}</td>`;
    }

    if (isMobile) {
      // =========================================================
      // MOBİL (TELEFON) — MƏHSUL ADI BAŞDA & YIĞCAM BİRLƏŞDİRİLMİŞ KART (3 SƏTİRLİ)
      // Satış ID-si qısaldılır (#4331bbd9), Maya/Satış bir yerdə, qutu hündürlüyü yığcam
      // =========================================================
      return `
        <tr class="${s.nov} ${isLoss ? 'row-loss-warning' : ''}">
          <td class="td-mob-mal" data-label="Məhsul">
            <div class="mob-card-head">
              <div class="mob-mal-info">
                <span class="mob-mal-name">${escapeHtml(s.mal)}</span>
                <span class="mob-mal-qty">${s.qty} ${s.isKilo ? 'kq' : 'əd'}</span>
              </div>
              <div class="mob-id-btn-grp">
                <span class="tid" title="${escapeHtml(rawIdStr)}">#${escapeHtml(shortId)}</span>
                <button type="button" class="row-receipt-btn" onclick="openReceiptModal('${s.id}')" title="Kassa çekinə bax və paylaş">
                  <i class="fa-solid fa-receipt"></i> Çek
                </button>
              </div>
            </div>
          </td>
          <td class="td-mob-tarix" data-label="Tarix & Saat">
            <div class="mob-tarix-val">
              <span class="d">${s.tarix.split('-').reverse().join('.')}</span>
              <span class="t-sep">•</span>
              <span class="t">${s.saat}</span>
            </div>
          </td>
          <td class="td-mob-musteri" data-label="Müştəri">
            ${musteriCell}
          </td>
          <td class="td-mob-qiymet" data-label="Maya / Satış">
            <div class="mob-combo">
              <span class="c-maya">${isQ ? '-' : ''}${money(s.maya)}</span>
              <span class="c-slash">/</span>
              <span class="c-satis">${isQ ? '-' : ''}${money(s.satis)}</span>
            </div>
          </td>
          <td class="td-mob-qazanc ${isQ ? 'neg' : (isLoss ? 'neg' : (isZero ? '' : 'pos'))}" data-label="Qazanc">
            ${isQ
              ? `<span class="mob-qazanc-val neg">-${money(Math.abs(s.qazanc))}</span>`
              : isLoss
              ? `<div class="loss-cell"><span class="loss-val">-${money(Math.abs(s.qazanc))}</span><span class="leak-tag loss-tag" title="Maya: ${money(s.maya)} | Satış: ${money(s.satis)}"><i class="fa-solid fa-triangle-exclamation"></i> Zərər</span></div>`
              : isZero
              ? `<div class="loss-cell"><span class="zero-val">0.00 ₼</span><span class="leak-tag zero-tag"><i class="fa-solid fa-circle-minus"></i> 0 qazanc</span></div>`
              : `<span class="mob-qazanc-val pos">+${money(s.qazanc)}</span>`
            }
          </td>
        </tr>`;
    }

    // =========================================================
    // KOMPÜTER (PC) — ORİGİNAL 6 SÜTUNLU DƏQİQ CƏDVƏL (TOXUNULMAZ)
    // =========================================================
    return `
      <tr class="${s.nov} ${isLoss ? 'row-loss-warning' : ''}">
        <td data-label="Tarix">
          <div class="td-tarix">
            <div class="td-dt-row">
              <span class="d">${s.tarix.split('-').reverse().join('.')}</span>
              <span class="t-sep">•</span>
              <span class="t">${s.saat}</span>
            </div>
            <div class="td-id-row">
              <span class="tid">${s.id}</span>
              <button type="button" class="row-receipt-btn" onclick="openReceiptModal('${s.id}')" title="Kassa çekinə bax və paylaş">
                <i class="fa-solid fa-receipt"></i> Çek
              </button>
            </div>
          </div>
        </td>
        <td data-label="Müştəri">${musteriCell}</td>
        <td data-label="Məhsul">
          <div class="mal-cell">
            <span class="mn">${escapeHtml(s.mal)}</span>
            <span class="mq">${s.qty} ${s.isKilo ? 'kq' : 'ədəd'}</span>
          </div>
        </td>
        <td class="num mut" data-label="Maya">${isQ ? '-' : ''}${money(s.maya)}</td>
        <td class="num ${isQ ? 'neg' : ''}" data-label="Satış Qiyməti">${isQ ? '-' : ''}${money(s.satis)}</td>
        ${qazancCell}
      </tr>`;
  }).join('');

  body.innerHTML = html;
}

let salesTableResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(salesTableResizeTimer);
  salesTableResizeTimer = setTimeout(() => {
    if (SALES && SALES.length > 0) {
      const filtered = getFiltered();
      renderTable(filtered);
    }
  }, 150);
});

/* =====================================================================
   KASSA İTKİSİ VƏ ZƏRƏR DEDEKTORU MODAL FUNKSİYALARI
   ===================================================================== */
let currentLossItems = [];

function filterLossSalesOnly() {
  document.querySelectorAll('#payTypes button').forEach(b => b.classList.remove('active'));
  const lossBtn = document.querySelector('#payTypes button[data-nov="loss"]');
  if (lossBtn) lossBtn.classList.add('active');
  state.nov = 'loss';
  state.sortKey = 'qazanc';
  state.sortDir = 1; // ən böyük zərər yuxarıda
  resetPagination();
  update();
  const tblSection = document.querySelector('.table-panel');
  if (tblSection) tblSection.scrollIntoView({ behavior: 'smooth' });
}

function openLossModal() {
  const fromTime = (state.fromTime || '00:00').trim();
  const toTime   = (state.toTime   || '23:59').trim();
  const startDt = state.from ? (state.from + ' ' + fromTime) : null;
  const endDt   = state.to   ? (state.to   + ' ' + toTime)   : null;

  const dateFiltered = SALES.filter(s => {
    const sDt = s.tarix + ' ' + (s.saat || '00:00');
    if (startDt && sDt < startDt) return false;
    if (endDt   && sDt > endDt)   return false;
    return true;
  });

  const leakItems = dateFiltered.filter(s => !s.isQaytarma && s.qazanc <= 0.001);
  currentLossItems = leakItems;

  const lossOnly = leakItems.filter(s => s.qazanc < -0.001);
  const zeroOnly = leakItems.filter(s => Math.abs(s.qazanc) <= 0.001);
  const totalLoss = lossOnly.reduce((acc, s) => acc + Math.abs(s.qazanc), 0);
  const totalTurnover = leakItems.reduce((acc, s) => acc + s.satis, 0);

  if ($('lossModalTotalLoss')) $('lossModalTotalLoss').textContent = '-' + money(totalLoss);
  if ($('lossModalLossCount')) $('lossModalLossCount').textContent = `${lossOnly.length} əməliyyatda birbaşa zərər`;
  if ($('lossModalZeroCount')) $('lossModalZeroCount').textContent = `${zeroOnly.length} ədəd`;
  if ($('lossModalTurnover'))  $('lossModalTurnover').textContent  = money(totalTurnover);
  if ($('lossModalTotalCount')) $('lossModalTotalCount').textContent = `Cəmi ${leakItems.length} şübhəli satış`;

  const tbody = $('lossModalTbody');
  if (tbody) {
    if (!leakItems.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8">
        <i class="fa-solid fa-circle-check" style="color:#34d399;font-size:24px;display:block;margin-bottom:8px"></i>
        Təbriklər! Seçilmiş dövrdə heç bir zərərli və ya sıfır qazanclı satış aşkarlanmadı.
      </td></tr>`;
    } else {
      const sorted = leakItems.slice().sort((a,b) => a.qazanc - b.qazanc);
      tbody.innerHTML = sorted.map(s => {
        const isLoss = s.qazanc < -0.001;
        const unit = s.isKilo ? 'kq' : 'əd';
        return `
          <tr>
            <td>
              <div style="font-weight:700">${s.tarix.split('-').reverse().join('.')}</div>
              <div style="font-size:10.5px;color:#94a3b8">${s.saat}</div>
            </td>
            <td style="font-weight:700;color:#fff">${escapeHtml(s.mal)}</td>
            <td>${s.qty} ${unit}</td>
            <td style="color:#fbbf24">${money(s.maya)}</td>
            <td style="color:#67e8f9">${money(s.satis)}</td>
            <td style="font-weight:800;color:${isLoss ? '#fb7185' : '#fbbf24'}">
              ${isLoss ? '-' + money(Math.abs(s.qazanc)) : '0.00 ₼'}
            </td>
            <td>
              ${isLoss 
                ? '<span class="leak-tag loss-tag"><i class="fa-solid fa-triangle-exclamation"></i> Zərər</span>'
                : '<span class="leak-tag zero-tag"><i class="fa-solid fa-circle-minus"></i> 0 qazanc</span>'}
            </td>
            <td>
              <button type="button" class="row-receipt-btn" onclick="closeLossModal(); openReceiptModal('${s.id}')" title="Çekə bax">
                <i class="fa-solid fa-receipt"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  const m = $('lossModal');
  if (m) m.classList.remove('hidden');
}

function closeLossModal() {
  const m = $('lossModal');
  if (m) m.classList.add('hidden');
}

function exportLossExcel() {
  if (!currentLossItems || !currentLossItems.length) {
    alert("İxrac üçün heç bir itkili satış tapılmadı!");
    return;
  }
  const sheetData = [];
  sheetData.push([`KASSA İTKİSİ VƏ SIFIR QAZANC HESABATI`]);
  sheetData.push([`Mağaza: ${getActiveStoreName()}`]);
  sheetData.push([`Hesabat Tarixi: ${iso(new Date())}`]);
  sheetData.push([]);
  sheetData.push(["Tarix", "Saat", "Qəbz №", "Məhsul", "Miqdar", "Maya Dəyəri", "Satış Qiyməti", "Fərq (Zərər/Qazanc)", "Status", "Müştəri"]);

  currentLossItems.forEach(s => {
    const isLoss = s.qazanc < -0.001;
    const unit = s.isKilo ? 'kq' : 'əd';
    sheetData.push([
      s.tarix,
      s.saat,
      s.id,
      s.mal,
      `${s.qty} ${unit}`,
      parseFloat(s.maya.toFixed(2)),
      parseFloat(s.satis.toFixed(2)),
      parseFloat(s.qazanc.toFixed(2)),
      isLoss ? 'ZƏRƏR' : 'SIFIR QAZANC',
      s.musteri || ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kassa İtkisi");
  XLSX.writeFile(wb, `kassa_itkisi_${iso(new Date())}.xlsx`);
}

/* =====================================================================
   14) ƏSAS YENİLƏNMƏ DÖVRÜ
   ===================================================================== */
let rafId = null;
function update(){
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    const rows = getFiltered();
    renderStats(rows);
    renderChart(rows);
    renderAdvancedCharts(rows);
    renderTop(rows);
    renderTable(rows);
  });
}

/* =====================================================================
   15) FİLTR VƏ HADİSƏ DİNLƏYİCİLƏRİ
   ===================================================================== */
const fromEl = $('from'), toEl = $('to');
const fromTimeEl = $('fromTime'), toTimeEl = $('toTime');

function setRange(f, t, fTime = '00:00', tTime = '23:59'){
  state.from = f; state.to = t;
  state.fromTime = fTime || '00:00';
  state.toTime   = tTime || '23:59';
  fromEl.value = f || '';
  toEl.value   = t || '';
  if (fromTimeEl) fromTimeEl.value = state.fromTime;
  if (toTimeEl) toTimeEl.value = state.toTime;
}

document.querySelectorAll('#presets button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#presets button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const p = btn.dataset.preset;
    const t = new Date(TODAY);
    let f = new Date(TODAY), to = new Date(TODAY);

    if (p === 'today')      { /* f, to = TODAY */ }
    else if (p === 'yesterday') {
      f.setDate(f.getDate() - 1); to.setDate(to.getDate() - 1);
    }
    else if (p === 'week')  { f.setDate(f.getDate() - 6); }
    else if (p === 'month') { f = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); }
    else if (p === 'lastmonth') {
      f = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
      to = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0);
    }
    else if (p === 'd30')   { f.setDate(f.getDate() - 29); }
    else if (p === 'all')   { setRange(null, null, '00:00', '23:59'); resetPagination(); update(); return; }

    setRange(iso(f), iso(to), '00:00', '23:59');
    resetPagination();
    update();
  });
});

[fromEl, toEl].forEach(el => {
  el.addEventListener('change', () => {
    state.from = fromEl.value || null;
    state.to   = toEl.value   || null;
    state.fromTime = fromTimeEl ? (fromTimeEl.value || '00:00') : '00:00';
    state.toTime   = toTimeEl   ? (toTimeEl.value   || '23:59') : '23:59';
    document.querySelectorAll('#presets button').forEach(b => b.classList.remove('active'));
    resetPagination();
    update();
  });
});

[fromTimeEl, toTimeEl].forEach(el => {
  if (!el) return;
  el.addEventListener('change', () => {
    state.fromTime = fromTimeEl ? (fromTimeEl.value || '00:00') : '00:00';
    state.toTime   = toTimeEl   ? (toTimeEl.value   || '23:59') : '23:59';
    document.querySelectorAll('#presets button').forEach(b => b.classList.remove('active'));
    resetPagination();
    update();
  });
});

document.querySelectorAll('#payTypes button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#payTypes button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.nov = btn.dataset.nov;
    resetPagination();
    update();
  });
});

let searchTimer;
$('search').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = e.target.value;
    resetPagination();
    update();
  }, 200);
});

document.querySelectorAll('thead th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const k = th.dataset.sort;
    if (state.sortKey === k) state.sortDir *= -1;
    else { state.sortKey = k; state.sortDir = -1; }

    document.querySelectorAll('thead th').forEach(x => x.classList.remove('sorted'));
    th.classList.add('sorted');
    th.querySelector('.arw').textContent = state.sortDir === -1 ? '▼' : '▲';
    update();
  });
});

/* =====================================================================
   16) EXCEL (.xlsx) VƏ CSV İXRACI (WPF Uyğun Kompakt Format)
   ===================================================================== */
$('btnExcel').addEventListener('click', exportToExcel);

function exportToExcel() {
  const filtered = sortRows(getFiltered());
  if (!filtered.length) {
    alert("Çıxarış üçün heç bir qeyd mövcud deyil!");
    return;
  }

  const startTimeStr = (state.fromTime && state.fromTime !== '00:00') ? ` ${state.fromTime}` : '';
  const endTimeStr   = (state.toTime && state.toTime !== '23:59') ? ` ${state.toTime}` : '';
  const startDate = state.from ? (state.from + startTimeStr) : 'Başlanğıc';
  const endDate   = state.to   ? (state.to   + endTimeStr)   : 'Son';

  let toplamSatis = 0, toplamMaya = 0, toplamQazanc = 0, toplamEded = 0, toplamKq = 0;
  filtered.forEach(s => {
    if (s.isQaytarma) {
      toplamSatis -= s.satis;
      toplamMaya -= s.maya;
      toplamQazanc -= s.qazanc;
      if (s.isKilo) toplamKq -= s.qty; else toplamEded -= s.qty;
    } else {
      toplamSatis += s.satis;
      toplamMaya += s.maya;
      toplamQazanc += s.qazanc;
      if (s.isKilo) toplamKq += s.qty; else toplamEded += s.qty;
    }
  });

  toplamEded = Math.max(0, toplamEded);
  toplamKq   = Math.max(0, Math.round(toplamKq * 1000) / 1000);

  const sheetData = [];
  sheetData.push([`Hesabat Dövrü: ${startDate} — ${endDate}`]);
  sheetData.push([`Mağaza: ${getActiveStoreName()}`]);
  sheetData.push([`Toplam Satış: ${toplamSatis.toFixed(2)}`]);
  sheetData.push([`Toplam Maya: ${toplamMaya.toFixed(2)}`]);
  sheetData.push([`Toplam Gəlir: ${toplamQazanc.toFixed(2)}`]);
  sheetData.push([`Toplam Miqdar: ${toplamEded} ədəd / ${toplamKq % 1 === 0 ? toplamKq : toplamKq.toFixed(2)} kq`]);
  sheetData.push([]);

  sheetData.push(["Tarix", "Saat", "Məhsul", "Miqdar", "Satış", "Maya", "Gəlir", "Ödəniş", "Müştəri"]);

  filtered.forEach(s => {
    const isQ = s.isQaytarma;
    const unitLabel = s.isKilo ? 'kq' : 'əd';
    sheetData.push([
      s.tarix,
      s.saat,
      s.mal,
      isQ ? `${s.qty} ${unitLabel} (Qaytarma)` : `${s.qty} ${unitLabel}`,
      parseFloat((isQ ? -s.satis : s.satis).toFixed(2)),
      parseFloat((isQ ? -s.maya : s.maya).toFixed(2)),
      parseFloat((isQ ? -s.qazanc : s.qazanc).toFixed(2)),
      isQ ? 'Qaytarılma' : (s.nov === 'nisye' ? 'Nisyə' : 'Nağd'),
      s.musteri || ''
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = [
    { wch: 11 }, // Tarix
    { wch: 7 },  // Saat
    { wch: 24 }, // Məhsul
    { wch: 8 },  // Miqdar
    { wch: 8 },  // Satış
    { wch: 8 },  // Maya
    { wch: 8 },  // Gəlir
    { wch: 10 }, // Ödəniş
    { wch: 15 }  // Müştəri
  ];

  worksheet['!pageSetup'] = {
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToWidth: 1,
    fitToHeight: 0
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Satış Hesabatı");
  XLSX.writeFile(workbook, `hesabat_${iso(new Date())}.xlsx`);
}

function exportToCsv() {
  const rows = sortRows(getFiltered());
  const head = ['Tarix','Saat','Kod','Odenis_novu','Musteri','Mehsul','Say','Maya','Satis_qiymeti','Qazanc','Marja_faiz'];
  const lines = [head.join(';')];
  rows.forEach(s => {
    const isQ = s.isQaytarma;
    lines.push([
      s.tarix, s.saat, s.id,
      isQ ? 'Qaytarilma' : (s.nov === 'negd' ? 'Negd' : 'Nisye'),
      s.musteri || '-',
      '"' + s.mal.replace(/"/g, '""') + '"',
      s.qty,
      (isQ ? -s.maya : s.maya).toFixed(2),
      (isQ ? -s.satis : s.satis).toFixed(2),
      (isQ ? -s.qazanc : s.qazanc).toFixed(2),
      ((s.satis > 0 ? (s.qazanc / s.satis) * 100 : 0)).toFixed(1)
    ].join(';'));
  });
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'satislar_' + iso(new Date()) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

if ($('btnCsv')) {
  $('btnCsv').addEventListener('click', exportToCsv);
}

/* =====================================================================
   17) SÜRÜŞDÜRÜLƏ BİLƏN SLİDER (Ödəniş Bölgüsü & Top Məhsullar)
   ===================================================================== */
let currentSlide = 0;

function goToSlide(idx) {
  currentSlide = idx === 1 ? 1 : 0;
  const track = $('sliderTrack');
  const titleText = $('sliderTitleText');
  const dots = document.querySelectorAll('#sliderDots .s-dot');

  if (track) {
    track.style.transform = `translateX(-${currentSlide * 50}%)`;
  }

  if (titleText) {
    titleText.textContent = currentSlide === 0 
      ? 'Ödəniş Bölgüsü' 
      : (topSortMode === 'qty' ? 'Ən Çox Satılan Məhsullar' : 'Ən Qazanclı Məhsullar');
  }

  const subText = $('sliderSubtitle');
  if (subText) {
    subText.textContent = currentSlide === 0 
      ? 'Səhifə 1 / 2 • Nəğd və Nisyə payı' 
      : `Səhifə 2 / 2 • Top ${topProductsLimit} (${topSortMode === 'qty' ? 'Sayına görə' : 'Qazanca görə'})`;
  }

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });

  if (currentSlide === 1) {
    const box = $('topList');
    if (box) {
      box.querySelectorAll('.tp-fill').forEach(f => {
        f.style.width = (f.dataset.w || 0) + '%';
      });
    }
  }
}

function initSlider() {
  const prevBtn = $('slidePrev');
  const nextBtn = $('slideNext');
  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(0));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(1));

  document.querySelectorAll('#sliderDots .s-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.slide, 10) || 0;
      goToSlide(idx);
    });
  });

  const viewport = $('sliderViewport');
  if (viewport) {
    let touchStartX = 0;
    let touchStartY = 0;

    viewport.addEventListener('touchstart', e => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    viewport.addEventListener('touchend', e => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = touchStartX - e.changedTouches[0].clientX;
        const deltaY = touchStartY - e.changedTouches[0].clientY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
          if (deltaX > 0) {
            goToSlide(1);
          } else {
            goToSlide(0);
          }
        }
      }
    }, { passive: true });
  }
}

/* =====================================================================
   18) SÜRÜŞDÜRÜLƏ BİLƏN ƏSAS QRAFİK PANELİ (Günlük Dinamika & Dərin Analitika)
   ===================================================================== */
let currentMainSlide = 0;
let currentMainMode = localStorage.getItem('kassa_main_chart_mode') || 'hourly'; // 'hourly', 'profit', 'brackets'

function updateMainSliderHeader() {
  const titleText = $('mainSliderTitleText');
  const subText = $('mainSliderSubtitle');
  const legend = $('mainChartLegend');

  if (currentMainSlide === 0) {
    if (titleText) titleText.textContent = 'Günlük Satış Dinamikası';
    if (subText) subText.textContent = 'Səhifə 1 / 2 • Nəğd və nisyə satışların müqayisəsi';
    if (legend) legend.style.display = 'flex';
  } else {
    if (titleText) titleText.textContent = 'Dərin Satış Analitikası';
    if (legend) legend.style.display = 'none';

    if (subText) {
      if (currentMainMode === 'hourly') {
        subText.textContent = 'Səhifə 2 / 2 • Saatlar üzrə kassa dövriyyəsi və pik saatlar';
      } else if (currentMainMode === 'profit') {
        subText.textContent = 'Səhifə 2 / 2 • Gündəlik xalis qazanc və marja dinamikası';
      } else {
        subText.textContent = 'Səhifə 2 / 2 • Qiymət seqmentləri üzrə dövriyyə payı';
      }
    }
  }
}

function setMainChartMode(mode) {
  if (!['hourly', 'profit', 'brackets'].includes(mode)) mode = 'hourly';
  currentMainMode = mode;
  localStorage.setItem('kassa_main_chart_mode', mode);

  // Pills aktiv statusu
  document.querySelectorAll('.mode-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Konteynerlərin gizlədilməsi / göstərilməsi
  const boxHourly = $('modeHourlyBox');
  const boxProfit = $('modeProfitBox');
  const boxBrackets = $('modeBracketsBox');
  if (boxHourly) boxHourly.style.display = mode === 'hourly' ? 'block' : 'none';
  if (boxProfit) boxProfit.style.display = mode === 'profit' ? 'block' : 'none';
  if (boxBrackets) boxBrackets.style.display = mode === 'brackets' ? 'block' : 'none';

  updateMainSliderHeader();
  renderAdvancedCharts(getFiltered());
}

function goToMainSlide(idx) {
  currentMainSlide = idx === 1 ? 1 : 0;
  const track = $('mainSliderTrack');
  const dots = document.querySelectorAll('#mainSliderDots .main-s-dot');

  if (track) {
    track.style.transform = `translateX(-${currentMainSlide * 50}%)`;
  }

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentMainSlide);
  });

  updateMainSliderHeader();

  if (currentMainSlide === 1) {
    renderAdvancedCharts(getFiltered());
  }
}

function initMainSlider() {
  const prevBtn = $('mainSlidePrev');
  const nextBtn = $('mainSlideNext');
  if (prevBtn) prevBtn.addEventListener('click', () => goToMainSlide(0));
  if (nextBtn) nextBtn.addEventListener('click', () => goToMainSlide(1));

  document.querySelectorAll('#mainSliderDots .main-s-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.slide, 10) || 0;
      goToMainSlide(idx);
    });
  });

  const viewport = $('mainSliderViewport');
  if (viewport) {
    let touchStartX = 0;
    let touchStartY = 0;

    viewport.addEventListener('touchstart', e => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    viewport.addEventListener('touchend', e => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = touchStartX - e.changedTouches[0].clientX;
        const deltaY = touchStartY - e.changedTouches[0].clientY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
          if (deltaX > 0) {
            goToMainSlide(1);
          } else {
            goToMainSlide(0);
          }
        }
      }
    }, { passive: true });
  }

  const savedMode = localStorage.getItem('kassa_main_chart_mode') || 'hourly';
  setMainChartMode(savedMode);
}

/* =====================================================================
   19) GECƏ / GÜNDÜZ (DARK / LIGHT) TEMA DƏYİŞMƏSİ
   ===================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('kassa_theme') || 'dark';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  const newTheme = isLight ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('kassa_theme', newTheme);
  showToast(
    newTheme === 'light' ? '☀️ Ağ Tema Aktiv' : '🌙 Qaranlıq Tema Aktiv',
    newTheme === 'light' ? 'Gündüz rejimi tətbiq edildi' : 'Gecə kiber rejimi tətbiq edildi',
    true
  );
}

function applyTheme(theme) {
  const themeIcon = $('themeIcon');
  const themeBtn = $('themeBtn');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-moon';
      themeIcon.style.color = '#6366f1';
    }
    if (themeBtn) themeBtn.title = 'Qaranlıq rejimə keç';
  } else {
    document.body.classList.remove('light-theme');
    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-sun';
      themeIcon.style.color = '#fbbf24';
    }
    if (themeBtn) themeBtn.title = 'Ağ rejimə keç';
  }
}

/* =====================================================================
   20) SAAT VƏ AÇILIŞ
   ===================================================================== */
(function tick(){
  const d = new Date();
  $('clock').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  setTimeout(tick, 1000);
})();

function startApplication() {
  initTheme();
  initSound();
  loadNotifications();
  initSlider();
  initMainSlider();
  initTopSort();
  syncStoreSelectUI();
  updateStoreTitle();
  const first = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  setRange(iso(first), iso(TODAY), '00:00', '23:59');
  checkAuth();
  initPwaFullscreen();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  startApplication();
}

window.addEventListener('resize', () => {
  clearTimeout(window.__rz);
  window.__rz = setTimeout(update, 250);
});


/* =====================================================================
   28) APARAT SÜRƏTLƏNDİRMƏLİ VƏ DONDURMAYAN SCROLL İDARƏETMƏSİ (60 FPS)
   ===================================================================== */
let isScrollTicking = false;

function onWindowScrollThrottled() {
  if (!isScrollTicking) {
    window.requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      const bar = $('scrollProgress');
      if (bar) bar.style.width = progress + '%';

      const tblScroll = $('tblScroll');
      if (tblScroll) {
        const headers = document.querySelectorAll('thead th');
        const isStuck = tblScroll.getBoundingClientRect().top <= 64;
        headers.forEach(th => th.classList.toggle('is-stuck', isStuck));
      }

      // Mobil Bottom Nav aktiv bölmə izlənməsi
      if (window.innerWidth <= 768) {
        const sheet = $('moreSheet');
        if (!sheet || !sheet.classList.contains('show')) {
          const scrollY = scrollTop + 180;
          const sections = [
            { id: 'sec-table', nav: 'mobNavSales' },
            { id: 'sec-charts', nav: 'mobNavAnalytics' },
            { id: 'sec-kpis', nav: 'mobNavHome' }
          ];
          for (const s of sections) {
            const el = $(s.id);
            if (el && scrollY >= el.offsetTop) {
              document.querySelectorAll('.mob-nav-item').forEach(b => b.classList.remove('active'));
              const activeBtn = $(s.nav);
              if (activeBtn) activeBtn.classList.add('active');
              break;
            }
          }
        }
      }

      isScrollTicking = false;
    });
    isScrollTicking = true;
  }
}

window.addEventListener('scroll', onWindowScrollThrottled, { passive: true });

/* =====================================================================
   29) TAM EKRAN (FULLSCREEN), MOBİL NAV VƏ PWA DƏSTƏYİ
   ===================================================================== */
function isPwa() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

function isCurrentlyFullscreen() {
  return !!(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement ||
            window.matchMedia('(display-mode: fullscreen)').matches);
}

function enterFullScreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
    if (el.requestFullscreen) return el.requestFullscreen().catch(() => {});
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
  }
}

function toggleFullScreen() {
  if (!isCurrentlyFullscreen()) {
    enterFullScreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
  setTimeout(updateFullscreenIcon, 150);
}

function updateFullscreenIcon() {
  const isFull = isCurrentlyFullscreen() || isPwa();
  const ico = $('fullscreenIcon');
  const btn = $('fullscreenBtn');
  if (ico) {
    ico.className = isFull ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
  }
  if (btn) {
    btn.setAttribute('title', isFull ? 'Tam ekrandan çıx (Esc)' : 'Tam ekran rejimi (F11)');
    btn.classList.toggle('active', isFull);
  }
}

function initPwaFullscreen() {
  if (isPwa()) {
    // 1. Birbaşa tam ekrana cəhd edirik (PWA runtime icazə verirsə)
    enterFullScreen();
    updateFullscreenIcon();

    // 2. Brauzerin "user gesture" təhlükəsizliyinə görə istifadəçinin ekrana ilk toxunuşunda tam ekranı aktivləşdiririk
    const onFirstUserAction = () => {
      enterFullScreen();
      updateFullscreenIcon();
    };

    window.addEventListener('pointerdown', onFirstUserAction, { once: true, passive: true });
    window.addEventListener('touchstart', onFirstUserAction, { once: true, passive: true });
    window.addEventListener('click', onFirstUserAction, { once: true });
  } else {
    updateFullscreenIcon();
  }
}

document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
document.addEventListener('MSFullscreenChange', updateFullscreenIcon);
if (window.matchMedia) {
  try {
    window.matchMedia('(display-mode: fullscreen)').addEventListener('change', updateFullscreenIcon);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', updateFullscreenIcon);
  } catch (e) {}
}

function scrollToSection(secId) {
  const el = $(secId) || document.querySelector('.' + secId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  updateMobileNavActive(secId);
}

function updateMobileNavActive(targetId) {
  document.querySelectorAll('.mob-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.target === targetId);
  });
}

function openMoreSheet() {
  const sheet = $('moreSheet');
  const backdrop = $('moreSheetBackdrop');
  if (sheet) sheet.classList.add('show');
  if (backdrop) backdrop.classList.add('show');
  updateMobileNavActive('moreMenu');
}

function closeMoreSheet() {
  const sheet = $('moreSheet');
  const backdrop = $('moreSheetBackdrop');
  if (sheet) sheet.classList.remove('show');
  if (backdrop) backdrop.classList.remove('show');
  onWindowScrollThrottled();
}

function handleMobNav(tab) {
  if (tab === 'home') {
    scrollToSection('sec-kpis');
    closeMoreSheet();
  } else if (tab === 'analytics') {
    scrollToSection('sec-charts');
    closeMoreSheet();
  } else if (tab === 'sales') {
    scrollToSection('sec-table');
    closeMoreSheet();
  } else if (tab === 'notifications') {
    toggleNotificationsModal();
    closeMoreSheet();
    updateMobileNavActive('notifModal');
  } else if (tab === 'more') {
    const sheet = $('moreSheet');
    if (sheet && sheet.classList.contains('show')) {
      closeMoreSheet();
    } else {
      openMoreSheet();
    }
  }
}

// PWA Service Worker & Install
let deferredPwaPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('✅ PWA ServiceWorker qeydiyyatdan keçdi:', reg.scope);
      })
      .catch(err => {
        console.warn('PWA ServiceWorker qeydiyyat xətası:', err);
      });
  });
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPwaPrompt = e;
  const pwaBtn = $('morePwaBtn');
  if (pwaBtn) {
    pwaBtn.style.borderColor = 'rgba(168, 85, 247, 0.4)';
    pwaBtn.style.background = 'rgba(168, 85, 247, 0.08)';
  }
});

function triggerPwaInstall() {
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.then(choice => {
      if (choice.outcome === 'accepted') {
        showToast('PWA Quraşdırma', 'Tətbiq ana ekrana uğurla əlavə olundu!', true);
      }
      deferredPwaPrompt = null;
    });
  } else {
    showToast('PWA Quraşdırma', 'Tətbiqi telefonunuza quraşdırmaq üçün brauzerin menyusundan "Ana ekrana əlavə et" seçin.', true);
  }
}

window.addEventListener('appinstalled', () => {
  showToast('PWA Quraşdırma', 'Tətbiq artıq telefonunuzdadır!', true);
  deferredPwaPrompt = null;
});

/* =====================================================================
   26) SÜRƏTLİ ƏMR & AXTARIŞ (COMMAND PALETTE - Ctrl+K)
   ===================================================================== */
let cmdActiveIndex = 0;
let cmdFiltered = [];

const CMD_ITEMS = [
  { title: 'Bugün', sub: 'Bugünkü satışları göstər', icon: 'fa-calendar-day', action: () => document.querySelector('#presets button[data-preset="today"]')?.click() },
  { title: 'Dünən', sub: 'Dünənki satışlar', icon: 'fa-calendar-minus', action: () => document.querySelector('#presets button[data-preset="yesterday"]')?.click() },
  { title: 'Son 7 gün', sub: 'Həftəlik nəticələr', icon: 'fa-calendar-week', action: () => document.querySelector('#presets button[data-preset="week"]')?.click() },
  { title: 'Bu ay', sub: 'Cari ay', icon: 'fa-calendar', action: () => document.querySelector('#presets button[data-preset="month"]')?.click() },
  { title: 'Keçən ay', sub: 'Əvvəlki ay', icon: 'fa-calendar-plus', action: () => document.querySelector('#presets button[data-preset="lastmonth"]')?.click() },
  { title: 'Son 30 gün', sub: '30 günlük dövr', icon: 'fa-calendar-check', action: () => document.querySelector('#presets button[data-preset="d30"]')?.click() },
  { title: 'Hamısı', sub: 'Bütün dövr', icon: 'fa-infinity', action: () => document.querySelector('#presets button[data-preset="all"]')?.click() },
  { title: 'Nəğd satışlar', sub: 'Yalnız nəğd əməliyyatlar', icon: 'fa-money-bill', action: () => document.querySelector('#payTypes button[data-nov="negd"]')?.click() },
  { title: 'Nisyə satışlar', sub: 'Yalnız nisyə (borc) əməliyyatları', icon: 'fa-file-invoice', action: () => document.querySelector('#payTypes button[data-nov="nisye"]')?.click() },
  { title: 'Qaytarılmalar', sub: 'Yalnız qaytarma əməliyyatları', icon: 'fa-arrow-rotate-left', action: () => document.querySelector('#payTypes button[data-nov="qaytarma"]')?.click() },
  { title: 'Kassa İtkisi', sub: 'Zərərli və xeyirsiz satışlar', icon: 'fa-triangle-exclamation', action: () => filterLossSalesOnly() },
  { title: 'Məlumatları Yenilə', sub: 'Baza ilə təkrar sinxronizasiya', icon: 'fa-rotate', action: () => refreshData() },
  { title: 'Excel İxrac', sub: 'Hesabatı Excel (.xlsx) olaraq yüklə', icon: 'fa-file-excel', action: () => exportToExcel() },
  { title: 'CSV İxrac', sub: 'Hesabatı CSV olaraq yüklə', icon: 'fa-file-csv', action: () => exportToCsv() },
  { title: 'Tema Dəyiş', sub: 'Ağ / Qaranlıq rejim', icon: 'fa-circle-half-stroke', action: () => toggleTheme() },
  { title: 'Ayarlar', sub: 'Panel və baza parametrləri', icon: 'fa-gear', action: () => openSettingsModal() },
  { title: 'Bildirişlər', sub: 'Canlı kassa bildirişləri', icon: 'fa-bell', action: () => toggleNotificationsModal() },
  { title: 'Kassa İtkisi Detalları', sub: 'Detallı itki analizi pəncərəsi', icon: 'fa-list-check', action: () => openLossModal() },
  { title: 'Anbar Paneli', sub: 'Məhsullar və qalıqlar bazası', icon: 'fa-boxes-stacked', action: () => { window.location.href = 'anbar.html'; } },
  { title: 'Müştərilər Paneli', sub: 'Müştərilər və borclar bazası', icon: 'fa-users', action: () => { window.location.href = 'musteriler.html'; } },
  { title: 'Tam Ekran', sub: 'Ekranı böyüt və ya kiçilt', icon: 'fa-expand', action: () => toggleFullScreen() }
];

function openCmdPalette() {
  const overlay = $('cmdOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  const input = $('cmdInput');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }
  cmdActiveIndex = 0;
  renderCmdResults('');
}

function closeCmdPalette() {
  const overlay = $('cmdOverlay');
  if (overlay) overlay.classList.remove('show');
}

function renderCmdResults(query) {
  const container = $('cmdResults');
  if (!container) return;

  const rawQ = (query || '').trim();
  const q = rawQ.toLowerCase();
  const cleanQ = q.replace(/^#/, '');
  const normQ = typeof normalizeAz === 'function' ? normalizeAz(cleanQ) : cleanQ;

  let list = [];

  // 1. Əgər istifadəçi axtarış sorğusu yazıbsa, cədvəldə axtarış üçün birinci sıraya qoyuruq
  if (cleanQ) {
    list.push({
      title: `Axtar: "${rawQ}"`,
      sub: 'Cədvəli bu açar sözlə süzgəcdən keçir və cədvələ keç',
      icon: 'fa-magnifying-glass',
      action: () => {
        const sInput = $('search');
        if (sInput) sInput.value = rawQ;
        state.q = rawQ;
        resetPagination();
        update();
        const secTable = $('sec-table') || document.querySelector('.table-panel');
        if (secTable) secTable.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // 2. Canlı məhsul / satış / çek uyğunluqları tapırıq
    if (SALES && SALES.length > 0) {
      const matchedSales = [];
      const seen = new Set();
      for (const s of SALES) {
        const rawBarcode = s.raw && s.raw.barkod ? String(s.raw.barkod) : '';
        const hay = (String(s.mal || '') + ' ' + String(s.musteri || '') + ' ' + String(s.id || '') + ' ' + rawBarcode).toLowerCase();
        const normHay = typeof normalizeAz === 'function' ? normalizeAz(hay) : hay;
        if (hay.includes(cleanQ) || normHay.includes(normQ)) {
          const key = s.id || (s.mal + s.tarix);
          if (!seen.has(key)) {
            seen.add(key);
            matchedSales.push(s);
            if (matchedSales.length >= 4) break;
          }
        }
      }

      matchedSales.forEach(s => {
        const rawId = String(s.id || '');
        const shortId = rawId.length > 8 ? rawId.slice(0, 8) : rawId;
        list.push({
          title: `${s.mal} (${s.qty} ${s.isKilo ? 'kq' : 'əd'}) — ${money(s.satis)}`,
          sub: `${s.tarix} • ${s.musteri || 'Nəğd'} • #${shortId}`,
          icon: 'fa-receipt',
          action: () => {
            if (s.id) openReceiptModal(s.id);
          }
        });
      });
    }
  }

  // 3. Əmrləri süzgəcdən keçiririk
  const matchingCmds = cleanQ ? CMD_ITEMS.filter(item => {
    const t = item.title.toLowerCase();
    const s = item.sub.toLowerCase();
    const normT = typeof normalizeAz === 'function' ? normalizeAz(t) : t;
    const normS = typeof normalizeAz === 'function' ? normalizeAz(s) : s;
    return t.includes(cleanQ) || s.includes(cleanQ) || normT.includes(normQ) || normS.includes(normQ);
  }) : CMD_ITEMS;

  list.push(...matchingCmds);
  cmdFiltered = list;

  if (!cmdFiltered.length) {
    container.innerHTML = `<div style="text-align:center;padding:30px 10px;color:#707c96"><i class="fa-solid fa-magnifying-glass" style="font-size:24px;margin-bottom:8px;display:block;opacity:.4"></i>Heç nə tapılmadı</div>`;
    return;
  }

  container.innerHTML = cmdFiltered.map((item, i) => `
    <div class="cmd-item ${i === cmdActiveIndex ? 'active' : ''}" onclick="executeCmdItem(${i})">
      <div class="cmd-item-ico"><i class="fa-solid ${item.icon}"></i></div>
      <div class="cmd-item-body">
        <div class="cmd-item-title">${escapeHtml(item.title)}</div>
        <div class="cmd-item-sub">${escapeHtml(item.sub)}</div>
      </div>
    </div>`).join('');
}

function executeCmdItem(idx) {
  const item = cmdFiltered[idx];
  if (!item) return;
  closeCmdPalette();
  setTimeout(() => item.action(), 120);
}

// Global pəncərəyə bağlayırıq (inline onclick-lər üçün)
window.openCmdPalette = openCmdPalette;
window.closeCmdPalette = closeCmdPalette;
window.executeCmdItem = executeCmdItem;
window.exportToCsv = exportToCsv;

/* =====================================================================
   27) KEYBOARD SHORTCUTS (KLAVİATURA QISA YOLLARI)
   ===================================================================== */
document.addEventListener('keydown', e => {
  // Ctrl+K və ya Cmd+K -> Command Palette
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCmdPalette();
    return;
  }

  // Esc -> Pəncərələri bağla
  if (e.key === 'Escape') {
    closeCmdPalette();
    if (typeof closeSettingsModal === 'function') closeSettingsModal();
    if (typeof closeNotificationsModal === 'function') closeNotificationsModal();
    if (typeof closeReceiptModal === 'function') closeReceiptModal();
    if (typeof closeLossModal === 'function') closeLossModal();
    if (typeof closeDeleteCategoryModal === 'function') closeDeleteCategoryModal();
    if (typeof closeMoreSheet === 'function') closeMoreSheet();
    return;
  }

  // Əgər Command Palette açıqdırsa, ox düymələri və Enter idarəetməsi
  const cmdOverlay = $('cmdOverlay');
  if (cmdOverlay && cmdOverlay.classList.contains('show')) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cmdActiveIndex = Math.min(cmdActiveIndex + 1, cmdFiltered.length - 1);
      renderCmdResults($('cmdInput')?.value || '');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cmdActiveIndex = Math.max(cmdActiveIndex - 1, 0);
      renderCmdResults($('cmdInput')?.value || '');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCmdItem(cmdActiveIndex);
    }
    return;
  }

  // Əgər istifadəçi input, textarea və ya select daxilində yazırsa, tək düymə qısa yollarını dayandır
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

  // Tək düyməli qısa yollar
  const key = e.key.toLowerCase();
  if (key === 'r') {
    if (typeof refreshData === 'function') refreshData();
  } else if (key === 't') {
    if (typeof toggleTheme === 'function') toggleTheme();
  } else if (key === 'e') {
    if (typeof exportToExcel === 'function') exportToExcel();
  } else if (key === '/') {
    e.preventDefault();
    const sInput = $('search');
    if (sInput) {
      sInput.focus();
      sInput.select();
    }
  } else if (key >= '1' && key <= '7') {
    const presets = ['today','yesterday','week','month','lastmonth','d30','all'];
    const btn = document.querySelector(`#presets button[data-preset="${presets[parseInt(key, 10) - 1]}"]`);
    if (btn) btn.click();
  }
});

const cmdInputEl = $('cmdInput');
if (cmdInputEl) {
  cmdInputEl.addEventListener('input', e => {
    cmdActiveIndex = 0;
    renderCmdResults(e.target.value);
  });
}

const cmdOverlayEl = $('cmdOverlay');
if (cmdOverlayEl) {
  cmdOverlayEl.addEventListener('click', e => {
    if (e.target === cmdOverlayEl) closeCmdPalette();
  });
}
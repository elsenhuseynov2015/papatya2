/* =====================================================================
   1) KONFİQURASİYA
   ===================================================================== */
const STORE_PROFILES = {
  'aburcubur': {
    id: 'aburcubur', name: 'Abur Çubur',
    url: 'https://zcjthobakvppowerkxmv.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjanRob2Jha3ZwcG93ZXJreG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTQyNzMsImV4cCI6MjEwNTI5MDI3M30.ZLaSVPvowhwv50cv6W6d8AFYmPpPZ7oS5eZAxZzHI1U'
  },
  'papatya2': {
    id: 'papatya2', name: 'Papatya 2',
    url: 'https://ijnbsuupwwyqohysrjlc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbmJzdXVwd3d5cW9oeXNyamxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjA1NDUsImV4cCI6MjEwNTI5NjU0NX0.ZjiHo2gOzFdHHK4d7CXYfXrjDcwTyGG9oyQ-E6YtGKY'
  }
};
const DEFAULT_APP_PASSWORD = "Elsen0123456789-";

function getActiveProfileId() {
  let p = localStorage.getItem('kassa_active_profile');
  if (p && (STORE_PROFILES[p] || p === 'custom')) return p;
  const savedUrl = (localStorage.getItem('kassa_supabase_url') || '').toLowerCase();
  if (savedUrl.includes('zcjthobakvppowerkxmv')) return 'aburcubur';
  if (savedUrl.includes('ijnbsuupwwyqohysrjlc')) return 'papatya2';
  return 'aburcubur';
}
function getActiveSupabaseUrl() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].url;
  const saved = (localStorage.getItem('kassa_supabase_url') || '').trim().replace(/\/+$/, '');
  return saved || STORE_PROFILES['aburcubur'].url;
}
function getActiveSupabaseKey() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].key;
  const saved = (localStorage.getItem('kassa_supabase_key') || '').trim();
  return saved || STORE_PROFILES['aburcubur'].key;
}
function getActivePassword() { return localStorage.getItem('kassa_custom_password') || DEFAULT_APP_PASSWORD; }
function getActiveStoreName() {
  const pid = getActiveProfileId();
  if (STORE_PROFILES[pid]) return STORE_PROFILES[pid].name;
  const saved = localStorage.getItem('kassa_store_name');
  if (saved && saved !== 'Satış İdarəetmə Paneli' && saved !== 'Papatya' && saved !== 'Papatya — Anbar İdarəetməsi') return saved;
  return 'Abur Çubur';
}
function updateStoreTitle() {
  const name = getActiveStoreName();
  const titleEl = $('appStoreTitle');
  if (titleEl) titleEl.textContent = `${name} — Satış Paneli`;
  const loginTitle = $('loginStoreTitle');
  if (loginTitle) loginTitle.textContent = name;
  document.title = `${name} — Satış Paneli`;
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
  if (!STORE_PROFILES[profileId] && profileId !== 'custom') profileId = 'aburcubur';
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
  if (triggerReload) initApp();
}
function onHeaderStoreChange(val) {
  if (val === 'custom') { openSettingsModal(); return; }
  switchStoreProfile(val, true);
}
function selectProfileInModal(profileId) {
  if (STORE_PROFILES[profileId]) {
    $('settingStoreName').value = STORE_PROFILES[profileId].name;
    $('settingSupabaseUrl').value = STORE_PROFILES[profileId].url;
    $('settingSupabaseKey').value = STORE_PROFILES[profileId].key;
  }
  localStorage.setItem('kassa_active_profile', profileId);
  syncStoreSelectUI();
}

/* =====================================================================
   2) KÖMƏKÇİLƏR
   ===================================================================== */
const pad = n => (n < 10 ? '0' + n : '' + n);
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const nf2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('ru-RU');
const money  = n => nf2.format(n || 0) + ' ₼';
const $ = id => document.getElementById(id);
function escapeHtml(str){
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function initials(name){
  if (!name) return 'N';
  const p = name.trim().split(' ');
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}

/* =====================================================================
   3) SƏS
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
  if (isSoundMuted) { icon.className = 'fa-solid fa-volume-xmark'; icon.style.color = '#fda4af'; }
  else { icon.className = 'fa-solid fa-volume-high'; icon.style.color = '#67e8f9'; }
}
function playChime(isSale = true) {
  if (isSoundMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (isSale) {
      const notes = [587.33, 880, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.38);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.38);
      });
    } else {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(261.63, ctx.currentTime + 0.26);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.32);
    }
  } catch (e) { console.warn("Audio play error:", e); }
}
function testSoundInSettings() { playChime(true); }

/* =====================================================================
   4) TOAST STACK
   ===================================================================== */
function showToast(title, msg, isSale = true, customDate = null) {
  const container = $('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const d = customDate ? new Date(customDate) : new Date();
  const dateStr = pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  const timeStr = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  const icoCls = isSale ? 'toast-ico' : 'toast-ico ret';
  const icoSym = isSale ? 'fa-cart-shopping' : 'fa-arrow-rotate-left';
  toast.innerHTML = `
    <div class="${icoCls}"><i class="fa-solid ${icoSym}"></i></div>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(msg)}</div>
      <div style="font-size:10px;color:#8894af;margin-top:2px;display:flex;gap:5px;align-items:center;font-weight:600">
        <span><i class="fa-regular fa-calendar-days"></i> ${dateStr}</span>
        <span style="opacity:.4">•</span>
        <span><i class="fa-regular fa-clock"></i> ${timeStr}</span>
      </div>
    </div>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4500);
  while (container.children.length > 3) container.removeChild(container.firstChild);
}

/* =====================================================================
   5) CONFETTI EFFECT
   ===================================================================== */
function triggerConfetti() {
  const layer = $('confettiLayer');
  const colors = ['#22d3ee', '#6366f1', '#a855f7', '#f472b6', '#34d399', '#fbbf24'];
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    if (Math.random() > 0.5) piece.style.borderRadius = '50%';
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 4500);
  }
}

/* =====================================================================
   6) BİLDİRİŞLƏR
   ===================================================================== */
let notifications = [];
function notifEscape(str) { return escapeHtml(str); }
function loadNotifications() {
  try {
    const raw = localStorage.getItem('kassa_notifications');
    notifications = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(notifications)) notifications = [];
  } catch(e) { notifications = []; }
  updateNotifBadge();
}
function saveNotifications() {
  try {
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
    localStorage.setItem('kassa_notifications', JSON.stringify(notifications));
  } catch(e) { console.error(e); }
  updateNotifBadge();
}
function addNotification(title, msg, isSale = true, customDate = null) {
  const d = customDate ? new Date(customDate) : new Date();
  const dateStr = pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  const timeStr = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  const notifItem = {
    id: Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: title || 'Bildiriş', msg: msg || '', isSale: !!isSale,
    date: dateStr, time: timeStr, timestamp: d.getTime()
  };
  notifications.unshift(notifItem);
  saveNotifications();
  const modal = $('notifModal');
  if (modal && !modal.classList.contains('hidden')) renderNotificationList();
}
function updateNotifBadge() {
  const badge = $('notifBadge');
  const count = notifications.length;
  const mobDot = $('mobNotifDot');
  if (mobDot) { mobDot.classList.toggle('has-unread', count > 0); }
  if (badge) {
    if (count > 0) { badge.style.display = 'inline-flex'; badge.textContent = count > 99 ? '99+' : count; }
    else { badge.style.display = 'none'; badge.textContent = '0'; }
  }
  const sub = $('notifSubText');
  if (sub) sub.textContent = count > 0 ? `${count} ədəd bildiriş qeydə alınıb` : '0 bildiriş qeydə alınıb';
}
function renderNotificationList() {
  const container = $('notifListContainer');
  if (!container) return;
  if (notifications.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:34px 10px;color:#707c96"><i class="fa-regular fa-bell-slash" style="font-size:32px;margin-bottom:10px;display:block;opacity:0.4"></i><span style="font-size:12.5px;font-weight:600">Hələ heç bir bildiriş yoxdur</span></div>`;
    return;
  }
  let html = '';
  notifications.forEach(n => {
    const icoClass = n.isSale ? 'sale' : 'ret';
    const icoSymbol = n.isSale ? 'fa-cart-shopping' : 'fa-arrow-rotate-left';
    let dateStr = n.date || '';
    let timeStr = n.time || '';
    if (!dateStr && n.timestamp) {
      const td = new Date(n.timestamp);
      dateStr = pad(td.getDate()) + '.' + pad(td.getMonth() + 1) + '.' + td.getFullYear();
    } else if (!dateStr) {
      const td = new Date();
      dateStr = pad(td.getDate()) + '.' + pad(td.getMonth() + 1) + '.' + td.getFullYear();
    }
    html += `<div class="notif-item" id="notif-${n.id}">
      <div class="notif-item-ico ${icoClass}"><i class="fa-solid ${icoSymbol}"></i></div>
      <div class="notif-item-body">
        <div class="notif-item-title">${notifEscape(n.title)}</div>
        <div class="notif-item-desc">${notifEscape(n.msg)}</div>
        <div class="notif-item-time">
          <span><i class="fa-regular fa-calendar-days"></i> ${dateStr}</span>
          <span class="notif-sep">•</span>
          <span><i class="fa-regular fa-clock"></i> ${timeStr}</span>
        </div>
      </div>
      <button type="button" class="notif-item-del" onclick="deleteSingleNotification('${n.id}')"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
  });
  container.innerHTML = html;
}
function toggleNotificationsModal() {
  const modal = $('notifModal');
  if (!modal) return;
  const isHidden = modal.classList.contains('hidden');
  if (isHidden) { renderNotificationList(); modal.classList.remove('hidden'); }
  else modal.classList.add('hidden');
}
function closeNotificationsModal() { const m = $('notifModal'); if (m) m.classList.add('hidden'); }
function clearAllNotifications() {
  if (notifications.length === 0) return;
  notifications = []; saveNotifications(); renderNotificationList();
  showToast("🗑️ Bildirişlər Təmizləndi", "Bütün bildirişlər silindi", false);
}
function deleteSingleNotification(id) {
  notifications = notifications.filter(n => n.id !== id);
  saveNotifications(); renderNotificationList();
}

/* =====================================================================
   7) AUTH
   ===================================================================== */
function checkAuth() {
  updateStoreTitle();
  const currentPassword = getActivePassword();
  const savedAuth = localStorage.getItem('kassa_auth_token');
  if (savedAuth === currentPassword) { $('authScreen').classList.add('hidden'); initApp(); }
  else { $('authScreen').classList.remove('hidden'); setTimeout(() => $('passwordInput').focus(), 150); }
}
function verifyPassword() {
  const entered = $('passwordInput').value;
  const errorEl = $('authError'); const box = $('authBox');
  const currentPassword = getActivePassword();
  if (entered === currentPassword) {
    localStorage.setItem('kassa_auth_token', currentPassword);
    $('authScreen').classList.add('hidden');
    errorEl.style.display = 'none';
    initApp();
  } else {
    errorEl.style.display = 'block';
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
}
function togglePasswordVisibility() {
  const input = $('passwordInput'); const icon = $('pwdToggleIcon');
  if (input.type === 'password') { input.type = 'text'; icon.className = 'fa-solid fa-eye-slash'; }
  else { input.type = 'password'; icon.className = 'fa-solid fa-eye'; }
}
function logout() {
  if (confirm("Paneldən çıxmaq istəyirsiniz?")) {
    localStorage.removeItem('kassa_auth_token');
    $('passwordInput').value = '';
    $('authScreen').classList.remove('hidden');
  }
}

/* =====================================================================
   8) AYARLAR
   ===================================================================== */
function openSettingsModal() {
  syncStoreSelectUI();
  $('settingStoreName').value = getActiveStoreName();
  $('settingSupabaseUrl').value = getActiveSupabaseUrl();
  $('settingSupabaseKey').value = getActiveSupabaseKey();
  $('settingPassword').value = getActivePassword();
  const resDiv = $('testConnResult'); resDiv.style.display = 'none'; resDiv.innerHTML = '';
  $('settingsModal').classList.remove('hidden');
}
function closeSettingsModal() { $('settingsModal').classList.add('hidden'); }
function resetDefaultCredentials() {
  if (confirm("Standart parametrlərə (Abur Çubur) qaytarmaq istəyirsiniz?")) {
    selectProfileInModal('aburcubur');
    $('settingPassword').value = DEFAULT_APP_PASSWORD;
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
  resDiv.style.background = 'rgba(99,102,241,.12)';
  resDiv.style.border = '1px solid rgba(99,102,241,.3)';
  resDiv.style.color = isLight ? '#4338ca' : '#a5b4fc';
  resDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Supabase ilə əlaqə yoxlanılır...';
  try {
    const resp = await fetch(`${url}/rest/v1/satislar?select=id,maya_deyeri,qazanc&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    if (resp.ok) {
      resDiv.style.background = isLight ? 'rgba(16,185,129,.14)' : 'rgba(52,211,153,.12)';
      resDiv.style.border = isLight ? '1px solid rgba(16,185,129,.35)' : '1px solid rgba(52,211,153,.35)';
      resDiv.style.color = isLight ? '#047857' : '#6ee7b7';
      resDiv.innerHTML = '✅ <b>Bağlantı Uğurludur!</b> Supabase layihəsinə qoşuldu.';
    } else {
      const errText = await resp.text();
      if (errText.includes('maya_deyeri') || errText.includes('qazanc') || errText.includes('42703')) {
        resDiv.style.background = isLight ? 'rgba(217,119,6,.12)' : 'rgba(251,191,36,.12)';
        resDiv.style.color = isLight ? '#b45309' : '#fde68a';
        resDiv.innerHTML = '⚠️ <b>Sütun Çatışmır!</b> `satislar` cədvəlində `maya_deyeri` sütunu yoxdur.';
      } else if (resp.status === 404) {
        resDiv.innerHTML = '❌ <b>Xəta (404):</b> `satislar` cədvəli tapılmadı!';
      } else if (resp.status === 401 || resp.status === 403) {
        resDiv.innerHTML = `❌ <b>Xəta (${resp.status}):</b> Anon Key yanlışdır!`;
      } else {
        resDiv.innerHTML = `❌ <b>Xəta (${resp.status}):</b> ${errText.substring(0, 140)}`;
      }
    }
  } catch (err) {
    resDiv.innerHTML = `❌ <b>Şəbəkə Xətası:</b> ${err.message}`;
  }
}
function saveSettingsFromModal() {
  const storeName = $('settingStoreName').value.trim() || 'Mağaza';
  const url = $('settingSupabaseUrl').value.trim().replace(/\/+$/, '');
  const key = $('settingSupabaseKey').value.trim();
  const pwd = $('settingPassword').value.trim() || DEFAULT_APP_PASSWORD;
  let matchedProfile = 'custom';
  for (const [pid, prof] of Object.entries(STORE_PROFILES)) {
    if (prof.url.toLowerCase() === url.toLowerCase()) { matchedProfile = pid; break; }
  }
  localStorage.setItem('kassa_active_profile', matchedProfile);
  localStorage.setItem('kassa_store_name', storeName);
  localStorage.setItem('kassa_supabase_url', url);
  localStorage.setItem('kassa_supabase_key', key);
  localStorage.setItem('kassa_custom_password', pwd);
  localStorage.setItem('kassa_auth_token', pwd);
  syncStoreSelectUI(); updateStoreTitle(); closeSettingsModal();
  showToast("⚙️ Ayarlar Yeniləndi", `${storeName} ayarları tətbiq edildi!`, true);
  initApp();
}

/* =====================================================================
   9) DELETE CATEGORY
   ===================================================================== */
const REQUIRED_DELETE_PASSWORD = "Elsen0123456789-";
let currentDeleteTarget = '';
function openDeleteCategoryModal(target) {
  currentDeleteTarget = target;
  $('deleteConfirmPassword').value = '';
  $('deleteError').style.display = 'none';
  let title = 'Məlumatları Sil'; let desc = '';
  if (target === 'satislar') { title = '🛒 Satışları Sil'; desc = '⚠️ <b>DİQQƏT:</b> Bütün satış qeydləri silinəcək!'; }
  else if (target === 'mehsullar') { title = '📦 Anbardakı Malları Sil'; desc = '⚠️ <b>DİQQƏT:</b> Bütün anbar məhsulları silinəcək!'; }
  else if (target === 'musteriler') { title = '👥 Müştəriləri və Borcları Sil'; desc = '⚠️ <b>DİQQƏT:</b> Bütün müştəri və borc qeydləri silinəcək!'; }
  $('deleteModalTitle').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${title}`;
  $('deleteModalDesc').innerHTML = `${desc}<br><br>Təsdiq üçün şifrə: <code style="color:#fbbf24;font-weight:700">Elsen0123456789-</code>`;
  $('deleteCategoryModal').classList.remove('hidden');
  setTimeout(() => $('deleteConfirmPassword').focus(), 150);
}
function closeDeleteCategoryModal() { $('deleteCategoryModal').classList.add('hidden'); }
async function confirmDeleteCategory() {
  const entered = ($('deleteConfirmPassword').value || '').trim();
  const errorEl = $('deleteError'); const btn = $('btnConfirmDeleteCategory');
  const validPassword = getActivePassword() || REQUIRED_DELETE_PASSWORD;
  if (entered !== REQUIRED_DELETE_PASSWORD && entered !== validPassword) {
    errorEl.style.display = 'block'; errorEl.textContent = '❌ Şifrə yanlışdır!'; return;
  }
  errorEl.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Silinir...';
  try {
    if (!supabaseClient) throw new Error("Supabase əlaqəsi aktiv deyil.");
    if (currentDeleteTarget === 'satislar') {
      const { error } = await supabaseClient.from('satislar').delete().not('id', 'is', null);
      if (error) throw error;
      SALES = []; update();
      showToast("🗑️ Satışlar Silindi", "Bütün satış qeydləri silindi!", false);
    } else if (currentDeleteTarget === 'mehsullar') {
      const { error } = await supabaseClient.from('mehsullar').delete().not('id', 'is', null);
      if (error) throw error;
      showToast("🗑️ Anbar Silindi", "Bütün məhsullar silindi!", false);
    } else if (currentDeleteTarget === 'musteriler') {
      try { await supabaseClient.from('borc_odenisleri').delete().not('id', 'is', null); } catch(e) {}
      const { error } = await supabaseClient.from('musteriler').delete().not('id', 'is', null);
      if (error) throw error;
      showToast("🗑️ Müştərilər Silindi", "Bütün müştərilər silindi!", false);
    }
    closeDeleteCategoryModal(); closeSettingsModal(); $('deleteConfirmPassword').value = '';
  } catch (err) {
    errorEl.style.display = 'block';
    errorEl.textContent = `❌ Xəta: ${err.message || 'Silinmə alınmadı'}`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Sil';
  }
}

/* =====================================================================
   10) SUPABASE + DATA
   ===================================================================== */
let supabaseClient = null;
let realtimeChannel = null;
let SALES = [];
const state = { from: null, to: null, fromTime: '00:00', toTime: '23:59', nov: 'all', q: '', sortKey: 'tarix', sortDir: -1 };
const TODAY = new Date(); TODAY.setHours(0,0,0,0);
function setConnectionStatus(status, text) {
  const ind = $('liveIndicator'); const txt = $('liveStatusText');
  ind.className = 'live ' + status;
  txt.textContent = text;
}
function initApp() {
  updateStoreTitle();
  const url = getActiveSupabaseUrl(); const key = getActiveSupabaseKey();
  try {
    setConnectionStatus('connecting', 'QOŞULUR...');
    supabaseClient = window.supabase.createClient(url, key);
    fetchData();
    setupRealtime();
  } catch (err) { console.error(err); setConnectionStatus('error', 'XƏTA'); }
}
async function fetchData(showLoading = true) {
  if (!supabaseClient) return;
  try {
    let allData = []; let from = 0; const step = 1000;
    while (true) {
      const { data, error } = await supabaseClient.from('satislar').select('*').order('tarix', { ascending: false }).range(from, from + step - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData.push(...data);
      if (data.length < step) break;
      from += step;
    }
    const knownKiloNames = new Set();
    allData.forEach(r => {
      const val = parseFloat(r.say) || 0;
      if (Math.abs(val - Math.round(val)) > 0.0001) { if (r.mehsul_adi) knownKiloNames.add(r.mehsul_adi.trim().toLowerCase()); }
      if (r.is_kilo === true || r.is_kilo === 1 || r.is_kilo === 'true' || r.vahid === 'kg' || r.vahid === 'kq') { if (r.mehsul_adi) knownKiloNames.add(r.mehsul_adi.trim().toLowerCase()); }
      if (/\b(kg|kq|kilo|kiloqram|çəki|ceki)\b/i.test(r.mehsul_adi || '')) { if (r.mehsul_adi) knownKiloNames.add(r.mehsul_adi.trim().toLowerCase()); }
    });
    SALES = (allData || []).map(r => {
      const dateObj = new Date(r.tarix);
      const isDateValid = !isNaN(dateObj.getTime());
      const dStr = isDateValid ? iso(dateObj) : (r.tarix ? r.tarix.split('T')[0] : iso(new Date()));
      const sStr = isDateValid ? pad(dateObj.getHours()) + ':' + pad(dateObj.getMinutes()) : '--:--';
      const mebleg = parseFloat(r.mebleg) || 0;
      const maya = parseFloat(r.maya_deyeri) || 0;
      const qazanc = (r.qazanc !== undefined && r.qazanc !== null) ? parseFloat(r.qazanc) : (mebleg - maya);
      const qty = parseFloat(r.say) || 1;
      const nameClean = (r.mehsul_adi || '').trim().toLowerCase();
      const isKilo = (r.is_kilo === true || r.is_kilo === 1 || r.is_kilo === 'true' || r.vahid === 'kg' || r.vahid === 'kq')
        || (Math.abs(qty - Math.round(qty)) > 0.0001)
        || /\b(kg|kq|kilo|kiloqram|çəki|ceki)\b/i.test(nameClean)
        || knownKiloNames.has(nameClean);
      const tip = (r.emeliyyat_tipi || 'SATIŞ').toUpperCase();
      const isQaytarma = tip === 'QAYTARILMA';
      const odenisRaw = (r.odenis_novu || 'Nağd').toLowerCase();
      const isNisye = odenisRaw.includes('nisy') || odenisRaw.includes('borc');
      let nov = isNisye ? 'nisye' : 'negd';
      if (isQaytarma) nov = 'qaytarma';
      return {
        id: r.qebz_id || ('S' + (r.id || Math.floor(Math.random() * 9000 + 1000))),
        rawId: r.id, tarix: dStr, saat: sStr, mal: r.mehsul_adi || 'Naməlum Məhsul',
        qty, isKilo, maya, satis: mebleg, qazanc, endirim: 0, nov, isQaytarma,
        musteri: r.musteri_adi || null, odenilen: isNisye ? 0 : mebleg, raw: r
      };
    });
    setConnectionStatus('', 'CANLI');
    update();
  } catch (err) { console.error(err); setConnectionStatus('error', 'BAĞLANTI XƏTASI'); }
}
function setupRealtime() {
  if (!supabaseClient) return;
  if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel);
  realtimeChannel = supabaseClient.channel('satislar-live-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'satislar' }, (payload) => {
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
        // Confetti for big sale
        if (isSale && parseFloat(rec.mebleg) >= 100) triggerConfetti();
      } else if (payload.eventType === 'DELETE') {
        playChime(false);
        showToast("🗑️ Əməliyyat Silindi", "Bir qeyd bazadan silindi", false);
        addNotification("🗑️ Əməliyyat Silindi", "Bir qeyd bazadan silindi", false);
      }
      fetchData(false);
    })
    .subscribe((status) => { if (status === 'SUBSCRIBED') setConnectionStatus('', 'CANLI'); });
}
function refreshData() {
  fetchData();
  showToast("🔄 Yeniləndi", "Məlumatlar təkrar oxundu", true);
}

/* =====================================================================
   11) FILTER & SORT
   ===================================================================== */
function getFiltered(){
  const q = state.q.trim().toLowerCase();
  const fromTime = (state.fromTime || '00:00').trim();
  const toTime = (state.toTime || '23:59').trim();
  const startDt = state.from ? (state.from + ' ' + fromTime) : null;
  const endDt = state.to ? (state.to + ' ' + toTime) : null;
  return SALES.filter(s => {
    const sDt = s.tarix + ' ' + (s.saat || '00:00');
    if (startDt && sDt < startDt) return false;
    if (endDt && sDt > endDt) return false;
    if (state.nov === 'loss') { if (s.isQaytarma || s.qazanc > 0.001) return false; }
    else if (state.nov !== 'all' && s.nov !== state.nov) return false;
    if (q) {
      const hay = (s.mal + ' ' + (s.musteri || '') + ' ' + s.id).toLowerCase();
      if (!hay.includes(q)) return false;
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
   12) ANIMATED NUMBER
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
   14) STATS
   ===================================================================== */
function renderStats(rows){
  let total = 0, maya = 0, qazanc = 0, negd = 0, nisye = 0, borc = 0;
  let count = 0, totalEded = 0, totalKq = 0;
  rows.forEach(s => {
    if (s.isQaytarma) {
      total -= s.satis; maya -= s.maya; qazanc -= s.qazanc;
      if (s.isKilo) totalKq -= s.qty; else totalEded -= s.qty;
    } else {
      total += s.satis; maya += s.maya; qazanc += s.qazanc;
      if (s.nov === 'negd') negd += s.satis;
      else { nisye += s.satis; borc += (s.satis - s.odenilen); }
      if (s.isKilo) totalKq += s.qty; else totalEded += s.qty;
      count++;
    }
  });
  totalEded = Math.max(0, totalEded);
  totalKq = Math.max(0, totalKq);
  const marja = total > 0 ? (qazanc / total) * 100 : 0;
  const negdPct = (negd + nisye) > 0 ? (negd / (negd + nisye)) * 100 : 0;
  const nisyePct = (negd + nisye) > 0 ? (nisye / (negd + nisye)) * 100 : 0;

  animateNum($('stTotal'), total, money);
  animateNum($('stMaya'), maya, money);
  animateNum($('stQazanc'), qazanc, money);
  animateNum($('stNegd'), negd, money);
  animateNum($('stNisye'), nisye, money);
  if ($('stEdedVal')) animateNum($('stEdedVal'), totalEded, n => nf0.format(Math.round(n)));
  if ($('stKiloVal')) animateNum($('stKiloVal'), totalKq, n => {
    const val = Number(n) || 0;
    if (val === 0) return '0';
    if (val % 1 === 0) return nf0.format(Math.round(val));
    const r2 = Math.round(val * 100) / 100;
    return Math.abs(val - r2) > 0.001 ? val.toFixed(3) : val.toFixed(2);
  });
  $('stCount').textContent = nf0.format(rows.length) + ' əməliyyat';
  $('stMayaPct').textContent = (total > 0 ? (maya / total) * 100 : 0).toFixed(1) + '%';
  $('stMarja').textContent = marja.toFixed(1) + '% marja';
  $('stNegdPct').textContent = negdPct.toFixed(1) + '% pay';
  $('stBorc').textContent = money(borc) + ' borc';
  if ($('stEdedSub')) $('stEdedSub').textContent = nf0.format(totalEded) + ' ədəd';
  if ($('stKiloSub')) {
    const kgStr = totalKq % 1 === 0 ? nf0.format(totalKq) : (Math.abs(totalKq - Math.round(totalKq * 100) / 100) > 0.001 ? totalKq.toFixed(3) : totalKq.toFixed(2));
    $('stKiloSub').textContent = kgStr + ' kq';
  }

  // Sparklines (7-day trend)
  const dayMap = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const o = dayMap.get(s.tarix) || { total: 0, qazanc: 0 };
    o.total += s.satis; o.qazanc += s.qazanc;
    dayMap.set(s.tarix, o);
  });
  const days = [...dayMap.keys()].sort().slice(-7);
  renderSparkline($('sparkTotal'), days.map(d => dayMap.get(d).total), '#22d3ee');
  renderSparkline($('sparkQazanc'), days.map(d => dayMap.get(d).qazanc), '#34d399');

  // Donut
  const donut = $('donut');
  if ((negd + nisye) > 0) donut.style.background = `conic-gradient(#22d3ee 0% ${negdPct}%, #a855f7 ${negdPct}% 100%)`;
  else donut.style.background = 'conic-gradient(rgba(255,255,255,.08) 0% 100%)';
  $('donutTotal').textContent = money(total);
  $('lgNegd').textContent = money(negd);
  $('lgNisye').textContent = money(nisye) + ' (' + nisyePct.toFixed(0) + '%)';

  // Loss detection
  const fromTime = (state.fromTime || '00:00').trim();
  const toTime = (state.toTime || '23:59').trim();
  const startDt = state.from ? (state.from + ' ' + fromTime) : null;
  const endDt = state.to ? (state.to + ' ' + toTime) : null;
  const dateFiltered = SALES.filter(s => {
    const sDt = s.tarix + ' ' + (s.saat || '00:00');
    if (startDt && sDt < startDt) return false;
    if (endDt && sDt > endDt) return false;
    return true;
  });
  const lossItems = dateFiltered.filter(s => !s.isQaytarma && s.qazanc < -0.001);
  const zeroItems = dateFiltered.filter(s => !s.isQaytarma && Math.abs(s.qazanc) <= 0.001);
  const totalLeakCount = lossItems.length + zeroItems.length;
  const totalLossSum = lossItems.reduce((acc, s) => acc + Math.abs(s.qazanc), 0);
  const banner = $('lossAlertBanner');
  const chipCount = $('chipLossCount');
  if (chipCount) {
    if (totalLeakCount > 0) { chipCount.style.display = 'inline-block'; chipCount.textContent = totalLeakCount; }
    else chipCount.style.display = 'none';
  }
  if (banner) {
    if (totalLeakCount > 0) {
      banner.style.display = 'flex';
      if ($('lossBadgeCount')) $('lossBadgeCount').textContent = totalLeakCount + ' əməliyyat';
      if ($('lossTotalSum')) $('lossTotalSum').textContent = '-' + money(totalLossSum);
      if ($('lossAlertDesc')) {
        let descParts = [];
        if (lossItems.length > 0) descParts.push(`<b>${lossItems.length}</b> zərərinə satış (cəmi <b>-${money(totalLossSum)}</b> itki)`);
        if (zeroItems.length > 0) descParts.push(`<b>${zeroItems.length}</b> sıfır qazancla satış`);
        $('lossAlertDesc').innerHTML = `Seçilmiş dövrdə ${descParts.join(' və ')} aşkarlandı.`;
      }
    } else banner.style.display = 'none';
  }
}

/* =====================================================================
   17) TOP PRODUCTS
   ===================================================================== */
let topProductsLimit = 5;
let topSortMode = localStorage.getItem('kassa_top_sort_mode') || 'qty';
function initTopSort() {
  const mode = localStorage.getItem('kassa_top_sort_mode') || 'qty';
  topSortMode = mode;
  const btnQty = $('btnSortQty'); const btnProfit = $('btnSortProfit');
  if (btnQty) btnQty.classList.toggle('active', mode === 'qty');
  if (btnProfit) btnProfit.classList.toggle('active', mode === 'qazanc');
}
function setTopSortMode(mode) {
  if (mode !== 'qty' && mode !== 'qazanc') mode = 'qty';
  topSortMode = mode;
  localStorage.setItem('kassa_top_sort_mode', mode);
  const btnQty = $('btnSortQty'); const btnProfit = $('btnSortProfit');
  if (btnQty) btnQty.classList.toggle('active', mode === 'qty');
  if (btnProfit) btnProfit.classList.toggle('active', mode === 'qazanc');
  const titleText = $('sliderTitleText');
  if (titleText && currentSlide === 1) titleText.textContent = mode === 'qty' ? 'Ən Çox Satılan Məhsullar' : 'Ən Qazanclı Məhsullar';
  const subText = $('sliderSubtitle');
  if (subText && currentSlide === 1) subText.textContent = `Səhifə 2 / 2 • Top ${topProductsLimit} (${mode === 'qty' ? 'Sayına görə' : 'Qazanca görə'})`;
  renderTop(getFiltered());
}
function loadMoreTopProducts() { topProductsLimit += 5; renderTop(getFiltered()); }
function resetTopLimit() { topProductsLimit = 5; renderTop(getFiltered()); }
function renderTop(rows){
  const map = new Map();
  rows.forEach(s => {
    if (s.isQaytarma) return;
    const o = map.get(s.mal) || { qazanc:0, satis:0, qty:0, isKilo:s.isKilo };
    o.qazanc += s.qazanc; o.satis += s.satis; o.qty += s.qty; o.isKilo = s.isKilo;
    map.set(s.mal, o);
  });
  const isQtyMode = topSortMode === 'qty';
  const allSorted = [...map.entries()].sort((a, b) => {
    if (isQtyMode) return (b[1].qty - a[1].qty) || (b[1].qazanc - a[1].qazanc);
    return (b[1].qazanc - a[1].qazanc) || (b[1].qty - a[1].qty);
  });
  const box = $('topList');
  if (!allSorted.length) {
    box.innerHTML = '<div style="color:#5f6b87;font-size:12.5px;padding:8px 0;text-align:center">Məlumat yoxdur</div>';
    return;
  }
  const visibleList = allSorted.slice(0, topProductsLimit);
  const maxVal = isQtyMode ? Math.max(allSorted[0][1].qty || 0, 0.0001) : Math.max(allSorted[0][1].qazanc || 0, 0.0001);
  let html = visibleList.map(([ad, v], idx) => {
    const qtyFormatted = v.isKilo ? (v.qty % 1 === 0 ? v.qty : v.qty.toFixed(2)) + ' kq' : (v.qty % 1 === 0 ? v.qty : v.qty.toFixed(2)) + ' ədəd';
    let mainValHtml = '', subInfoHtml = '', fillPct = 0;
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
    return `<div class="tp">
      <div class="tp-top">
        <span class="tp-name"><span style="color:#8892ab;font-size:11px;margin-right:5px;font-weight:700">#${idx + 1}</span>${escapeHtml(ad)}</span>
        ${mainValHtml}
      </div>
      <div class="tp-track"><div class="tp-fill ${isQtyMode ? 'fill-qty' : ''}" data-w="${fillPct}"></div></div>
      ${subInfoHtml}
    </div>`;
  }).join('');
  if (allSorted.length > 5) {
    if (topProductsLimit < allSorted.length) {
      const nextCount = Math.min(5, allSorted.length - topProductsLimit);
      html += `<div style="text-align:center;padding-top:6px"><button type="button" class="btn-top-more" onclick="loadMoreTopProducts()"><i class="fa-solid fa-angles-down"></i><span>Daha çox göstər (+${nextCount})</span><small style="opacity:.7;margin-left:4px">(${visibleList.length} / ${allSorted.length})</small></button></div>`;
    } else {
      html += `<div style="text-align:center;padding-top:6px"><button type="button" class="btn-top-more" onclick="resetTopLimit()" style="border-color:rgba(255,255,255,.15);color:#94a3b8"><i class="fa-solid fa-angles-up"></i><span>İlk 5-ə qayıt</span><small style="opacity:.7;margin-left:4px">(Cəmi ${allSorted.length})</small></button></div>`;
    }
  }
  box.innerHTML = html;
  requestAnimationFrame(() => {
    box.querySelectorAll('.tp-fill').forEach(f => { f.style.width = f.dataset.w + '%'; });
  });
  const subText = $('sliderSubtitle');
  if (subText && currentSlide === 1) subText.textContent = `Səhifə 2 / 2 • Top ${visibleList.length} (${isQtyMode ? 'Sayına görə' : 'Qazanca görə'})`;
}

/* =====================================================================
   18) TABLE
   ===================================================================== */
let tableVisibleLimit = 25;
let tableStep = 25;
function resetPagination() {
  if (tableStep !== 'all') tableVisibleLimit = typeof tableStep === 'number' ? tableStep : 25;
  topProductsLimit = 5;
}
function loadMoreRows() {
  const stepVal = typeof tableStep === 'number' ? tableStep : 25;
  tableVisibleLimit += stepVal;
  renderTable(getFiltered());
}
function setPageStep(step) {
  tableStep = step;
  if (step === 'all') tableVisibleLimit = 999999;
  else tableVisibleLimit = parseInt(step, 10) || 25;
  renderTable(getFiltered());
}
function updatePaginationUI(visibleCount, totalCount) {
  const pgEl = $('tblPagination');
  const visEl = $('pgVisibleCount'); const totEl = $('pgTotalCount');
  const btnMore = $('btnLoadMore');
  if (!pgEl) return;
  if (totalCount === 0) { pgEl.style.display = 'none'; return; }
  pgEl.style.display = 'flex';
  if (visEl) visEl.textContent = nf0.format(visibleCount);
  if (totEl) totEl.textContent = nf0.format(totalCount);
  if (btnMore) {
    if (visibleCount >= totalCount || tableStep === 'all') btnMore.style.display = 'none';
    else {
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
function renderTable(rows){
  const body = $('tbody');
  const sorted = sortRows(rows);
  const totalSalesVal = sorted.reduce((a, s) => a + (s.isQaytarma ? -s.satis : s.satis), 0);
  $('tblSub').textContent = nf0.format(sorted.length) + ' nəticə • cəmi ' + money(totalSalesVal);
  if (!sorted.length) {
    body.innerHTML = `<tr><td colspan="6" style="display:block"><div class="empty"><i class="fa-regular fa-folder-open"></i><p>Seçilmiş kriteriyalara uyğun əməliyyat tapılmadı</p></div></td></tr>`;
    updatePaginationUI(0, 0); return;
  }
  const currentLimit = tableStep === 'all' ? sorted.length : Math.min(tableVisibleLimit, sorted.length);
  const rowsToRender = sorted.slice(0, currentLimit);
  updatePaginationUI(rowsToRender.length, sorted.length);
  const html = rowsToRender.map(s => {
    const isQ = s.isQaytarma;
    const borc = s.nov === 'nisye' ? (s.satis - s.odenilen) : 0;
    let musteriCell = '';
    if (isQ) {
      musteriCell = `<div class="musteri"><span class="avatar ret"><i class="fa-solid fa-arrow-rotate-left"></i></span><div><span class="mname" style="color:#fda4af">${escapeHtml(s.musteri || 'Qaytarılma')}</span><span style="display:block;font-size:10px;color:#fda4af;font-weight:700">Qaytarılma</span></div></div>`;
    } else if (s.musteri) {
      musteriCell = `<div class="musteri"><span class="avatar ${s.nov === 'nisye' ? '' : 'neg'}">${initials(s.musteri)}</span><div><span class="mname">${escapeHtml(s.musteri)}</span>${s.nov === 'nisye' ? `<span style="display:block;font-size:10px;color:#c084fc;font-weight:600">Nisyə${borc > 0 ? ' • Borc: ' + money(borc) : ''}</span>` : ''}</div></div>`;
    } else {
      musteriCell = `<div class="musteri"><span class="avatar neg">N</span><span class="mname" style="color:#8b96ad">Nəğd müştəri</span></div>`;
    }
    const isLoss = !isQ && s.qazanc < -0.001;
    const isZero = !isQ && Math.abs(s.qazanc) <= 0.001;
    let qazancCell = '';
    if (isQ) qazancCell = `<td class="num neg" data-label="Qazanc">-${money(Math.abs(s.qazanc))}</td>`;
    else if (isLoss) qazancCell = `<td class="num neg" data-label="Qazanc"><div class="loss-cell"><span class="loss-val">-${money(Math.abs(s.qazanc))}</span><span class="leak-tag loss-tag"><i class="fa-solid fa-triangle-exclamation"></i> Zərər</span></div></td>`;
    else if (isZero) qazancCell = `<td class="num" data-label="Qazanc"><div class="loss-cell"><span class="zero-val">0.00 ₼</span><span class="leak-tag zero-tag"><i class="fa-solid fa-circle-minus"></i> 0 qazanc</span></div></td>`;
    else qazancCell = `<td class="num pos" data-label="Qazanc">+${money(s.qazanc)}</td>`;
    return `<tr class="${s.nov} ${isLoss ? 'row-loss-warning' : ''}">
      <td data-label="Tarix">
        <div class="td-tarix">
          <div class="td-dt-row">
            <span class="d">${s.tarix.split('-').reverse().join('.')}</span>
            <span class="t-sep">•</span>
            <span class="t">${s.saat}</span>
          </div>
          <div class="td-id-row">
            <span class="tid">${s.id}</span>
            <button type="button" class="row-receipt-btn" onclick="openReceiptModal('${s.id}')" title="Kassa çekinə bax"><i class="fa-solid fa-receipt"></i> Çek</button>
          </div>
        </div>
      </td>
      <td data-label="Müştəri">${musteriCell}</td>
      <td data-label="Məhsul"><div class="mal-cell"><span class="mn">${escapeHtml(s.mal)}</span><span class="mq">${s.qty} ${s.isKilo ? 'kq' : 'ədəd'}</span></div></td>
      <td class="num mut" data-label="Maya">${isQ ? '-' : ''}${money(s.maya)}</td>
      <td class="num ${isQ ? 'neg' : ''}" data-label="Satış Qiyməti">${isQ ? '-' : ''}${money(s.satis)}</td>
      ${qazancCell}
    </tr>`;
  }).join('');
  body.innerHTML = html;
}

/* =====================================================================
   19) RECEIPT MODAL
   ===================================================================== */
let currentReceiptData = null;
function openReceiptModal(saleId) {
  if (!saleId) return;
  let items = SALES.filter(x => x.id === saleId || (x.raw && x.raw.qebz_id === saleId));
  if (!items.length) items = SALES.filter(x => String(x.rawId) === String(saleId));
  if (!items.length) { showToast("⚠️ Çek Tapılmadı", "Bu satış üçün qəbz detalları tapılmadı.", false); return; }
  const first = items[0];
  const isQ = first.isQaytarma;
  const isNisye = first.nov === 'nisye';
  let grandTotal = 0, totalDebt = 0, totalItemsCount = 0;
  items.forEach(it => {
    grandTotal += it.isQaytarma ? -it.satis : it.satis;
    if (it.nov === 'nisye') totalDebt += Math.max(0, it.satis - (it.odenilen || 0));
    totalItemsCount += it.qty;
  });
  const rawMusteri = (first.musteri || '').trim();
  const isDefaultMusteri = !rawMusteri || rawMusteri.toLowerCase() === 'standart alıcı' || rawMusteri.toLowerCase() === 'nəğd müştəri' || rawMusteri.toLowerCase() === 'negd musteri';
  const displayMusteri = isDefaultMusteri ? '' : rawMusteri;
  currentReceiptData = { receiptId: first.id, storeName: 'Papatya', tarix: first.tarix, saat: first.saat, musteri: displayMusteri, nov: first.nov, isQaytarma: isQ, isNisye, debt: totalDebt, grandTotal: Math.abs(grandTotal), items };
  const storeEl = $('rcptStoreName'); if (storeEl) storeEl.textContent = 'Papatya';
  const numEl = $('rcptNumber'); if (numEl) numEl.textContent = '#' + currentReceiptData.receiptId;
  const dateEl = $('rcptDate'); if (dateEl) dateEl.textContent = currentReceiptData.tarix.split('-').reverse().join('.');
  const timeEl = $('rcptTime'); if (timeEl) timeEl.textContent = currentReceiptData.saat;
  const custEl = $('rcptCustomer'); if (custEl) custEl.textContent = displayMusteri;
  const debtRow = $('rcptDebtRow'); const debtVal = $('rcptDebtVal');
  if (debtRow && debtVal) {
    if (totalDebt > 0) { debtRow.style.display = 'flex'; debtVal.textContent = money(totalDebt); }
    else debtRow.style.display = 'none';
  }
  const itemsListEl = $('rcptItemsList');
  if (itemsListEl) {
    itemsListEl.innerHTML = items.map(it => {
      const unit = it.isKilo ? 'kq' : 'əd';
      const lineTotal = it.isQaytarma ? -it.satis : it.satis;
      const unitPrice = it.qty > 0 ? (it.satis / it.qty) : it.satis;
      return `<div class="rcpt-item-row">
        <div class="rcpt-item-left">
          <div class="rcpt-item-name">${escapeHtml(it.mal)}</div>
          <div class="rcpt-item-sub">${it.qty} ${unit} × ${money(unitPrice)}</div>
        </div>
        <div class="rcpt-item-price">${money(lineTotal)}</div>
      </div>`;
    }).join('');
  }
  const totalCountEl = $('rcptTotalItems');
  if (totalCountEl) totalCountEl.textContent = `${items.length} adda (${totalItemsCount % 1 === 0 ? totalItemsCount : totalItemsCount.toFixed(3)})`;
  const grandTotalEl = $('rcptGrandTotal'); if (grandTotalEl) grandTotalEl.textContent = money(currentReceiptData.grandTotal);
  const subTitle = $('rcptSubTitle'); if (subTitle) subTitle.textContent = `#${currentReceiptData.receiptId} • ${items.length} məhsul`;
  const modal = $('receiptModal'); if (modal) modal.classList.remove('hidden');
}
function closeReceiptModal() { const m = $('receiptModal'); if (m) m.classList.add('hidden'); }
function shareReceiptWhatsApp() {
  if (!currentReceiptData) return;
  const d = currentReceiptData;
  let msg = `🧾 *PAPATYA*\n--------------------------------\n`;
  msg += `🔢 *Qəbz №:* #${d.receiptId}\n`;
  msg += `📅 *Tarix:* ${d.tarix.split('-').reverse().join('.')}  ⏰ *Saat:* ${d.saat}\n`;
  msg += `👤 *Müştəri:* ${d.musteri}\n--------------------------------\n📦 *MƏHSULLAR:*\n`;
  d.items.forEach((it, idx) => {
    const unit = it.isKilo ? 'kq' : 'əd';
    const unitPrice = it.qty > 0 ? (it.satis / it.qty).toFixed(2) : it.satis.toFixed(2);
    msg += `${idx + 1}. *${it.mal}*\n   ${it.qty} ${unit} × ${unitPrice} ₼ = *${it.satis.toFixed(2)} ₼*\n`;
  });
  msg += `================================\n💰 *YEKUN CƏM: ${d.grandTotal.toFixed(2)} ₼*\n`;
  if (d.debt > 0) msg += `⚠️ *Qalan Borc: ${d.debt.toFixed(2)} ₼*\n`;
  msg += `--------------------------------\n🙏 *Bizi seçdiyiniz üçün təşəkkür edirik!*`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}
function printReceiptDirect() { window.print(); }
async function downloadReceiptImage() {
  const rcptEl = $('thermalReceipt');
  if (!rcptEl || !currentReceiptData) return;
  try {
    if (typeof html2canvas === 'undefined') throw new Error("html2canvas yüklənmədi");
    const canvas = await html2canvas(rcptEl, { scale: 3, backgroundColor: '#ffffff', useCORS: true, logging: false, scrollY: -window.scrollY });
    canvas.toBlob(blob => {
      if (!blob) return;
      const fileUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.download = `cek_${currentReceiptData.receiptId || 'papatya'}_${iso(new Date())}.png`;
      downloadLink.click();
      URL.revokeObjectURL(fileUrl);
      showToast("📸 Çek Endirildi!", "Kassa çeki PNG şəkli kimi yükləndi.", true);
    }, 'image/png');
  } catch (err) {
    console.error(err);
    showToast("⚠️ Xəta", "Çek şəkli yaradılarkən xəta baş verdi.", false);
  }
}

/* =====================================================================
   20) LOSS MODAL
   ===================================================================== */
let currentLossItems = [];
function filterLossSalesOnly() {
  document.querySelectorAll('#payTypes button').forEach(b => b.classList.remove('active'));
  const lossBtn = document.querySelector('#payTypes button[data-nov="loss"]');
  if (lossBtn) lossBtn.classList.add('active');
  state.nov = 'loss';
  state.sortKey = 'qazanc'; state.sortDir = 1;
  resetPagination(); update();
  const tblSection = document.querySelector('.table-panel');
  if (tblSection) tblSection.scrollIntoView({ behavior: 'smooth' });
}
function openLossModal() {
  const fromTime = (state.fromTime || '00:00').trim();
  const toTime = (state.toTime || '23:59').trim();
  const startDt = state.from ? (state.from + ' ' + fromTime) : null;
  const endDt = state.to ? (state.to + ' ' + toTime) : null;
  const dateFiltered = SALES.filter(s => {
    const sDt = s.tarix + ' ' + (s.saat || '00:00');
    if (startDt && sDt < startDt) return false;
    if (endDt && sDt > endDt) return false;
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
  if ($('lossModalTurnover')) $('lossModalTurnover').textContent = money(totalTurnover);
  if ($('lossModalTotalCount')) $('lossModalTotalCount').textContent = `Cəmi ${leakItems.length} şübhəli satış`;
  const tbody = $('lossModalTbody');
  if (tbody) {
    if (!leakItems.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8"><i class="fa-solid fa-circle-check" style="color:#34d399;font-size:24px;display:block;margin-bottom:8px"></i>Təbriklər! Heç bir zərərli satış aşkarlanmadı.</td></tr>`;
    } else {
      const sorted = leakItems.slice().sort((a,b) => a.qazanc - b.qazanc);
      tbody.innerHTML = sorted.map(s => {
        const isLoss = s.qazanc < -0.001;
        const unit = s.isKilo ? 'kq' : 'əd';
        return `<tr>
          <td><div style="font-weight:700">${s.tarix.split('-').reverse().join('.')}</div><div style="font-size:10.5px;color:#94a3b8">${s.saat}</div></td>
          <td style="font-weight:700;color:#fff">${escapeHtml(s.mal)}</td>
          <td>${s.qty} ${unit}</td>
          <td style="color:#fbbf24">${money(s.maya)}</td>
          <td style="color:#67e8f9">${money(s.satis)}</td>
          <td style="font-weight:800;color:${isLoss ? '#fb7185' : '#fbbf24'}">${isLoss ? '-' + money(Math.abs(s.qazanc)) : '0.00 ₼'}</td>
          <td>${isLoss ? '<span class="leak-tag loss-tag"><i class="fa-solid fa-triangle-exclamation"></i> Zərər</span>' : '<span class="leak-tag zero-tag"><i class="fa-solid fa-circle-minus"></i> 0 qazanc</span>'}</td>
          <td><button type="button" class="row-receipt-btn" onclick="closeLossModal(); openReceiptModal('${s.id}')"><i class="fa-solid fa-receipt"></i></button></td>
        </tr>`;
      }).join('');
    }
  }
  const m = $('lossModal'); if (m) m.classList.remove('hidden');
}
function closeLossModal() { const m = $('lossModal'); if (m) m.classList.add('hidden'); }
function exportLossExcel() {
  if (!currentLossItems || !currentLossItems.length) { alert("İxrac üçün heç bir itkili satış tapılmadı!"); return; }
  const sheetData = [];
  sheetData.push([`KASSA İTKİSİ VƏ SIFIR QAZANC HESABATI`]);
  sheetData.push([`Mağaza: ${getActiveStoreName()}`]);
  sheetData.push([`Hesabat Tarixi: ${iso(new Date())}`]);
  sheetData.push([]);
  sheetData.push(["Tarix", "Saat", "Qəbz №", "Məhsul", "Miqdar", "Maya", "Satış", "Fərq", "Status", "Müştəri"]);
  currentLossItems.forEach(s => {
    const isLoss = s.qazanc < -0.001;
    const unit = s.isKilo ? 'kq' : 'əd';
    sheetData.push([s.tarix, s.saat, s.id, s.mal, `${s.qty} ${unit}`, parseFloat(s.maya.toFixed(2)), parseFloat(s.satis.toFixed(2)), parseFloat(s.qazanc.toFixed(2)), isLoss ? 'ZƏRƏR' : 'SIFIR QAZANC', s.musteri || '']);
  });
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kassa İtkisi");
  XLSX.writeFile(wb, `kassa_itkisi_${iso(new Date())}.xlsx`);
}

/* =====================================================================
   21) UPDATE CYCLE
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
   22) FILTERS & EVENTS
   ===================================================================== */
const fromEl = $('from'), toEl = $('to');
const fromTimeEl = $('fromTime'), toTimeEl = $('toTime');
function setRange(f, t, fTime = '00:00', tTime = '23:59'){
  state.from = f; state.to = t;
  state.fromTime = fTime || '00:00'; state.toTime = tTime || '23:59';
  fromEl.value = f || ''; toEl.value = t || '';
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
    if (p === 'today') {}
    else if (p === 'yesterday') { f.setDate(f.getDate() - 1); to.setDate(to.getDate() - 1); }
    else if (p === 'week') f.setDate(f.getDate() - 6);
    else if (p === 'month') f = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    else if (p === 'lastmonth') { f = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1); to = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0); }
    else if (p === 'd30') f.setDate(f.getDate() - 29);
    else if (p === 'all') { setRange(null, null, '00:00', '23:59'); resetPagination(); update(); return; }
    setRange(iso(f), iso(to), '00:00', '23:59');
    resetPagination(); update();
  });
});
[fromEl, toEl].forEach(el => {
  el.addEventListener('change', () => {
    state.from = fromEl.value || null; state.to = toEl.value || null;
    state.fromTime = fromTimeEl ? (fromTimeEl.value || '00:00') : '00:00';
    state.toTime = toTimeEl ? (toTimeEl.value || '23:59') : '23:59';
    document.querySelectorAll('#presets button').forEach(b => b.classList.remove('active'));
    resetPagination(); update();
  });
});
[fromTimeEl, toTimeEl].forEach(el => {
  if (!el) return;
  el.addEventListener('change', () => {
    state.fromTime = fromTimeEl ? (fromTimeEl.value || '00:00') : '00:00';
    state.toTime = toTimeEl ? (toTimeEl.value || '23:59') : '23:59';
    document.querySelectorAll('#presets button').forEach(b => b.classList.remove('active'));
    resetPagination(); update();
  });
});
document.querySelectorAll('#payTypes button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#payTypes button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.nov = btn.dataset.nov;
    resetPagination(); update();
  });
});
let searchTimer;
$('search').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value; resetPagination(); update(); }, 200);
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
   23) EXPORT
   ===================================================================== */
$('btnExcel').addEventListener('click', exportToExcel);
function exportToExcel() {
  const filtered = sortRows(getFiltered());
  if (!filtered.length) { alert("Çıxarış üçün heç bir qeyd yoxdur!"); return; }
  const startTimeStr = (state.fromTime && state.fromTime !== '00:00') ? ` ${state.fromTime}` : '';
  const endTimeStr = (state.toTime && state.toTime !== '23:59') ? ` ${state.toTime}` : '';
  const startDate = state.from ? (state.from + startTimeStr) : 'Başlanğıc';
  const endDate = state.to ? (state.to + endTimeStr) : 'Son';
  let toplamSatis = 0, toplamMaya = 0, toplamQazanc = 0, toplamEded = 0, toplamKq = 0;
  filtered.forEach(s => {
    if (s.isQaytarma) {
      toplamSatis -= s.satis; toplamMaya -= s.maya; toplamQazanc -= s.qazanc;
      if (s.isKilo) toplamKq -= s.qty; else toplamEded -= s.qty;
    } else {
      toplamSatis += s.satis; toplamMaya += s.maya; toplamQazanc += s.qazanc;
      if (s.isKilo) toplamKq += s.qty; else toplamEded += s.qty;
    }
  });
  toplamEded = Math.max(0, toplamEded);
  toplamKq = Math.max(0, Math.round(toplamKq * 1000) / 1000);
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
    sheetData.push([s.tarix, s.saat, s.mal, isQ ? `${s.qty} ${unitLabel} (Qaytarma)` : `${s.qty} ${unitLabel}`, parseFloat((isQ ? -s.satis : s.satis).toFixed(2)), parseFloat((isQ ? -s.maya : s.maya).toFixed(2)), parseFloat((isQ ? -s.qazanc : s.qazanc).toFixed(2)), isQ ? 'Qaytarılma' : (s.nov === 'nisye' ? 'Nisyə' : 'Nağd'), s.musteri || '']);
  });
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = [{ wch: 11 },{ wch: 7 },{ wch: 24 },{ wch: 8 },{ wch: 8 },{ wch: 8 },{ wch: 8 },{ wch: 10 },{ wch: 15 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Satış Hesabatı");
  XLSX.writeFile(workbook, `hesabat_${iso(new Date())}.xlsx`);
}
$('btnCsv').addEventListener('click', () => {
  const rows = sortRows(getFiltered());
  const head = ['Tarix','Saat','Kod','Odenis_novu','Musteri','Mehsul','Say','Maya','Satis_qiymeti','Qazanc','Marja_faiz'];
  const lines = [head.join(';')];
  rows.forEach(s => {
    const isQ = s.isQaytarma;
    lines.push([s.tarix, s.saat, s.id, isQ ? 'Qaytarilma' : (s.nov === 'negd' ? 'Negd' : 'Nisye'), s.musteri || '-', '"' + s.mal.replace(/"/g, '""') + '"', s.qty, (isQ ? -s.maya : s.maya).toFixed(2), (isQ ? -s.satis : s.satis).toFixed(2), (isQ ? -s.qazanc : s.qazanc).toFixed(2), ((s.satis > 0 ? (s.qazanc / s.satis) * 100 : 0)).toFixed(1)].join(';'));
  });
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'satislar_' + iso(new Date()) + '.csv';
  a.click(); URL.revokeObjectURL(a.href);
});

/* =====================================================================
   25) THEME
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
  showToast(newTheme === 'light' ? '☀️ Ağ Tema Aktiv' : '🌙 Qaranlıq Tema Aktiv', newTheme === 'light' ? 'Gündüz rejimi tətbiq edildi' : 'Gecə rejimi tətbiq edildi', true);
}
function applyTheme(theme) {
  const themeIcon = $('themeIcon'); const themeBtn = $('themeBtn');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    if (themeIcon) { themeIcon.className = 'fa-solid fa-moon'; themeIcon.style.color = '#6366f1'; }
    if (themeBtn) themeBtn.title = 'Qaranlıq rejimə keç';
  } else {
    document.body.classList.remove('light-theme');
    if (themeIcon) { themeIcon.className = 'fa-solid fa-sun'; themeIcon.style.color = '#fbbf24'; }
    if (themeBtn) themeBtn.title = 'Ağ rejimə keç';
  }
}

/* =====================================================================
   26) COMMAND PALETTE
   ===================================================================== */
let cmdActiveIndex = 0;
let cmdFiltered = [];
const CMD_ITEMS = [
  { title: 'Bugün', sub: 'Bugünkü satışları göstər', icon: 'fa-calendar-day', action: () => document.querySelector('#presets button[data-preset="today"]').click() },
  { title: 'Dünən', sub: 'Dünənki satışlar', icon: 'fa-calendar-minus', action: () => document.querySelector('#presets button[data-preset="yesterday"]').click() },
  { title: 'Son 7 gün', sub: 'Həftəlik nəticələr', icon: 'fa-calendar-week', action: () => document.querySelector('#presets button[data-preset="week"]').click() },
  { title: 'Bu ay', sub: 'Cari ay', icon: 'fa-calendar', action: () => document.querySelector('#presets button[data-preset="month"]').click() },
  { title: 'Keçən ay', sub: 'Əvvəlki ay', icon: 'fa-calendar-plus', action: () => document.querySelector('#presets button[data-preset="lastmonth"]').click() },
  { title: 'Son 30 gün', sub: '30 günlük dövr', icon: 'fa-calendar-check', action: () => document.querySelector('#presets button[data-preset="d30"]').click() },
  { title: 'Hamısı', sub: 'Bütün dövr', icon: 'fa-infinity', action: () => document.querySelector('#presets button[data-preset="all"]').click() },
  { title: 'Nəğd satışlar', sub: 'Yalnız nəğd', icon: 'fa-money-bill', action: () => document.querySelector('#payTypes button[data-nov="negd"]').click() },
  { title: 'Nisyə satışlar', sub: 'Yalnız nisyə', icon: 'fa-file-invoice', action: () => document.querySelector('#payTypes button[data-nov="nisye"]').click() },
  { title: 'Qaytarılmalar', sub: 'Yalnız qaytarma', icon: 'fa-arrow-rotate-left', action: () => document.querySelector('#payTypes button[data-nov="qaytarma"]').click() },
  { title: 'Kassa İtkisi', sub: 'Zərərli satışlar', icon: 'fa-triangle-exclamation', action: () => document.querySelector('#payTypes button[data-nov="loss"]').click() },
  { title: 'Məlumatları Yenilə', sub: 'Supabase-dən təkrar oxu', icon: 'fa-rotate', action: () => refreshData() },
  { title: 'Excel İxrac', sub: 'Excel faylı yüklə', icon: 'fa-file-excel', action: () => exportToExcel() },
  { title: 'Tema Dəyiş', sub: 'Ağ / Qaranlıq rejim', icon: 'fa-moon', action: () => toggleTheme() },
  { title: 'Tam Ekran Rejimi', sub: 'Tam ekran rejiminə keç / çıx (F11)', icon: 'fa-expand', action: () => toggleFullScreen() },
  { title: 'Ayarlar', sub: 'Panel parametrləri', icon: 'fa-gear', action: () => openSettingsModal() },
  { title: 'Bildirişlər', sub: 'Son bildirişlər', icon: 'fa-bell', action: () => toggleNotificationsModal() },
  { title: 'Kassa İtkisi Detalları', sub: 'Detallı itki analizi', icon: 'fa-list-check', action: () => openLossModal() },
  { title: 'Anbar Paneli', sub: 'Məhsullar idarəsi', icon: 'fa-boxes-stacked', action: () => window.location.href = 'anbar.html' },
  { title: 'Müştərilər Paneli', sub: 'Borclar idarəsi', icon: 'fa-users', action: () => window.location.href = 'musteriler.html' }
];
function openCmdPalette() {
  const overlay = $('cmdOverlay');
  overlay.classList.add('show');
  const input = $('cmdInput');
  input.value = ''; input.focus();
  cmdActiveIndex = 0;
  renderCmdResults('');
}
function closeCmdPalette() {
  const overlay = $('cmdOverlay');
  overlay.classList.remove('show');
}
function renderCmdResults(query) {
  const q = query.toLowerCase().trim();
  cmdFiltered = q ? CMD_ITEMS.filter(item => item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)) : CMD_ITEMS;
  const container = $('cmdResults');
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
  setTimeout(() => item.action(), 150);
}

/* =====================================================================
   27) KEYBOARD SHORTCUTS
   ===================================================================== */
document.addEventListener('keydown', e => {
  // Ctrl+K / Cmd+K → Command Palette
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCmdPalette();
    return;
  }
  // Esc → Close modals
  if (e.key === 'Escape') {
    closeCmdPalette();
    closeSettingsModal();
    closeNotificationsModal();
    closeReceiptModal();
    closeLossModal();
    closeDeleteCategoryModal();
    return;
  }
  // If cmd palette is open, handle arrow keys
  if ($('cmdOverlay').classList.contains('show')) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cmdActiveIndex = Math.min(cmdActiveIndex + 1, cmdFiltered.length - 1);
      renderCmdResults($('cmdInput').value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cmdActiveIndex = Math.max(cmdActiveIndex - 1, 0);
      renderCmdResults($('cmdInput').value);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCmdItem(cmdActiveIndex);
    }
    return;
  }
  // Ignore if typing in input
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  // Single-key shortcuts
  const key = e.key.toLowerCase();
  if (key === 'r') refreshData();
  else if (key === 't') toggleTheme();
  else if (key === 'e') exportToExcel();
  else if (key === '/') { e.preventDefault(); $('search').focus(); }
  else if (key >= '1' && key <= '7') {
    const presets = ['today','yesterday','week','month','lastmonth','d30','all'];
    const btn = document.querySelector(`#presets button[data-preset="${presets[parseInt(key) - 1]}"]`);
    if (btn) btn.click();
  }
});
$('cmdInput').addEventListener('input', e => {
  cmdActiveIndex = 0;
  renderCmdResults(e.target.value);
});
$('cmdOverlay').addEventListener('click', e => {
  if (e.target === $('cmdOverlay')) closeCmdPalette();
});



/* =====================================================================
   29) CLOCK & INIT
   ===================================================================== */
(function tick(){
  const d = new Date();
  $('clock').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  setTimeout(tick, 1000);
})();

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSound();
  loadNotifications();
  initSlider();
  initMainSlider();
  initTopSort();
  syncStoreSelectUI();
  const first = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  setRange(iso(first), iso(TODAY), '00:00', '23:59');
  checkAuth();
});

window.addEventListener('resize', () => {
  clearTimeout(window.__rz);
  window.__rz = setTimeout(update, 250);
});



/* =====================================================================
   28) TAM EKRAN, MOBİL BOTTOM NAV VƏ PWA DƏSTƏYİ (ŞƏKİLDƏKİ KİMİ)
   ===================================================================== */

// --- TAM EKRAN (FULLSCREEN) ---
function toggleFullScreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
}

function updateFullscreenIcon() {
  const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
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

document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

// --- MOBİL BOTTOM NAV VƏ BOTTOM SHEET MENYU ---
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
  updateMobNavOnScroll();
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






// --- PWA SERVICE WORKER VƏ QURAŞDIRMA İDARƏETMƏSİ ---
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
    showToast('PWA Quraşdırma', 'Tətbiqi telefonunuza quraşdırmaq üçün brauzerin menyusundan "Ana ekrana əlavə et" (Add to Home screen) seçin.', true);
  }
}

window.addEventListener('appinstalled', () => {
  showToast('PWA Quraşdırma', 'Tətbiq artıq telefonunuzdadır!', true);
  deferredPwaPrompt = null;
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

function updateMobNavOnScroll() {
  if (window.innerWidth > 768) return;
  const sheet = $('moreSheet');
  if (sheet && sheet.classList.contains('show')) return;
  const scrollY = window.scrollY + 180;
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

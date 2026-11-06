/* =====================================================================
   PAPATYA KASSA & SATIŞ PANELI — SERVICE WORKER (PWA)
   Versiya: 2.6.0 (High-Speed Cache & Memory Self-Heal)
   ===================================================================== */

const CACHE_NAME = 'papatya-kassa-cache-v2-6-0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './anbar.html',
  './musteriler.html',
  './diaqnostika.html',
  './css/style.css',
  './css/mobile.css',
  './js/app.js',
  './js/modules/config.js',
  './js/modules/sound.js',
  './js/modules/auth.js',
  './js/modules/api.js',
  './js/modules/export.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg'
];

let dynamicPwaName = '';
let dynamicPwaShortName = '';

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_PWA_NAME') {
    dynamicPwaName = event.data.name || '';
    dynamicPwaShortName = event.data.shortName || '';
  }
  // Keşi və köhnə resursları tam məhv etmək üçün əmr
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    );
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Quraşdırma (Install)
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          // Bir resurs olmasa belə digərlərini keşləyirik
        }
      }
    })
  );
});

// Aktivasiya (Köhnə bütün keşlərin dərhal təmizlənməsi)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Köhnə keş silindi:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Şəbəkə Sorğularının İdarə Olunması (Fetch)
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Brauzer daxili, uzantı və ya qeyri-http protokollarını burax
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. Canlı Supabase sorğuları və qeyri-GET əməliyyatları heç vaxt keşlənməməlidir
  if (url.hostname.includes('supabase.co') || req.method !== 'GET') {
    return;
  }

  // Kənar xidmətləri (CDN, xarici scriptlər və s.) Service Worker qarışmadan birbaşa brauzerə ver
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1b. Manifest sorğusunu dinamik tətbiq adı ilə qaytarırıq (Hər proqram üçün fərqli PWA adı)
  if (url.pathname.endsWith('manifest.json')) {
    event.respondWith(
      (async () => {
        try {
          const cached = await caches.match('./manifest.json');
          const resp = cached || await fetch('./manifest.json');
          const manifest = await resp.json();
          const queryName = url.searchParams.get('pwa_name');
          const finalName = queryName || dynamicPwaName;
          if (finalName) {
            manifest.name = finalName;
            manifest.short_name = finalName.length > 15 ? finalName.substring(0, 15) : finalName;
          }
          manifest.display = 'fullscreen';
          manifest.display_override = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
          return new Response(JSON.stringify(manifest), {
            headers: {
              'Content-Type': 'application/manifest+json; charset=utf-8',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        } catch (e) {
          return fetch(req);
        }
      })()
    );
    return;
  }

  // 2. İkon və Şəkillər üçün: Cache-First ilə dərhal açılış
  if (req.url.includes('/icons/')) {
    event.respondWith(
      caches.match(req).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. HTML Səhifələri, CSS və JavaScript: Network-First (Şəbəkədən ən son yeniliyi dərhal gətir, oflayndırsa keşdən oxu)
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(networkResponse => {
        // Yalnız uğurlu 200 statuslu və daimi faylları keşlə (təsadüfi reload query-lərini keşə yığma)
        if (networkResponse && networkResponse.status === 200 && !url.searchParams.has('reload')) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return (await caches.match('./index.html')) ||
                 (await caches.match('./anbar.html')) ||
                 (await caches.match('./musteriler.html')) ||
                 (await caches.match('./'));
        }
      })
  );
});

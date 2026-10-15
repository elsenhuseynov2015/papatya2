/* =====================================================================
   PAPATYA KASSA & SATIŞ PANELI — SERVICE WORKER (PWA)
   Versiya: 2.1.0 (Modular & High-Speed Mobile Cache)
   ===================================================================== */

const CACHE_NAME = 'papatya-kassa-cache-v2-1-0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './indexv2.html',
  './css/style.css',
  './css/mobile.css',
  './js/charts.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg'
];

// Quraşdırma (Install)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          // Bir resurs olmasa belə digərlərini keşləyirik
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// Aktivasiya (Köhnə keşlərin təmizlənməsi)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Köhnə keş silindi:', key);
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

  // 1. Canlı Supabase sorğuları heç vaxt keşlənməməlidir (həmişə canlı şəbəkə)
  if (url.hostname.includes('supabase.co') || req.method !== 'GET') {
    return;
  }

  // 2. Modul CSS, JS və Statik Resurslar üçün: Cache-First ilə dərhal açılış
  if (req.url.includes('/css/') || req.url.includes('/js/') || req.url.includes('/icons/')) {
    event.respondWith(
      caches.match(req).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. HTML Səhifəsi üçün: Network-First (Şəbəkədən gətir, oflayndırsa keşdən ver)
  event.respondWith(
    fetch(req)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return (await caches.match('./index.html')) ||
                 (await caches.match('./indexv2.html')) ||
                 (await caches.match('./'));
        }
      })
  );
});

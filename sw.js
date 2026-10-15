/* =====================================================================
   PAPATYA KASSA & SATIŞ PANELI — SERVICE WORKER (PWA)
   Versiya: 2.0.2
   ===================================================================== */

const CACHE_NAME = 'papatya-kassa-cache-v2-0-2';
const STATIC_ASSETS = [
  './',
  './indexv2.html',
  './index.html',
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
      // Hər faylı tək-tək yoxlayaraq keşləyirik ki, biri olmasa belə digərləri keşlənsin
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          // Məsələn, index.html və ya indexv2.html-dən biri mövcud deyilsə xəta verməsin
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
            console.log('Köhnə keş təmizləndi:', key);
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

  // 1. Supabase API və ya qeyri-GET sorğular birbaşa şəbəkədən getməlidir
  if (url.hostname.includes('supabase.co') || req.method !== 'GET') {
    return;
  }

  // 2. Statik səhifələr və resurslar: Network-First (Şəbəkədən gətir, oflayndırsa keşdən ver)
  event.respondWith(
    fetch(req)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Şəbəkə kəsilərsə keşdən cavab ver
        const cached = await caches.match(req);
        if (cached) return cached;

        // Əgər HTML səhifəsidirsə ana səhifəni təqdim et
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          const fallback = (await caches.match('./indexv2.html')) ||
                           (await caches.match('./index.html')) ||
                           (await caches.match('./'));
          if (fallback) return fallback;
        }
      })
  );
});

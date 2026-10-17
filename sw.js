/* =====================================================================
   PAPATYA KASSA & SATIŞ PANELI — SERVICE WORKER (PWA)
   Versiya: 2.1.0 (Modular & High-Speed Mobile Cache)
   ===================================================================== */

const CACHE_NAME = 'papatya-kassa-cache-v2-3-1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './indexv2.html',
  './anbar.html',
  './musteriler.html',
  './css/style.css',
  './css/mobile.css',
  './js/app.js',
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
});

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

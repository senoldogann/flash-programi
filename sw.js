const CACHE_NAME = 'flash-nick-pro-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/gif.js',
  '/gif.worker.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Lobster&family=Pacifico&family=Dancing+Script&family=Great+Vibes&family=Satisfy&family=Kaushan+Script&family=Permanent+Marker&family=Righteous&family=Russo+One&family=Orbitron&family=Press+Start+2P&family=Creepster&family=Bungee&family=Bangers&family=Fredoka+One&family=Concert+One&family=Luckiest+Guy&family=Titan+One&family=Passion+One&family=Black+Ops+One&display=swap'
];

// Service Worker Yükleme
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache açıldı');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache hatası:', err);
      })
  );
  self.skipWaiting();
});

// Service Worker Aktivasyon
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eski cache siliniyor:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch İstekleri
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache'de varsa döndür
        if (response) {
          return response;
        }
        
        // Yoksa network'den al
        return fetch(event.request).then((response) => {
          // Geçerli bir yanıt değilse direkt döndür
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Yanıtı cache'e ekle
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Offline durumunda ana sayfayı göster
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});

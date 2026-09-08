const LEGACY_CACHE_PREFIX = 'flash-nick-pro';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith(LEGACY_CACHE_PREFIX))
            .map((name) => caches.delete(name)),
        );
      } finally {
        await self.registration.unregister();

        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });

        for (const client of clients) {
          client.navigate(client.url);
        }
      }
    })(),
  );
});

self.addEventListener('fetch', () => {
  // Intentionally empty. This worker exists only to retire the legacy PWA worker.
});

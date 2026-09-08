const LEGACY_CACHE_PREFIX = 'flash-nick-pro';

export async function retireLegacyPwa(): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.serviceWorker?.getRegistrations) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.unregister()));
    } catch {
      // Legacy cleanup must never prevent V3 from starting.
    }
  }

  if (typeof caches !== 'undefined') {
    try {
      const cacheNames = await caches.keys();
      const legacyCacheNames = cacheNames.filter((name) => name.startsWith(LEGACY_CACHE_PREFIX));
      await Promise.allSettled(legacyCacheNames.map((name) => caches.delete(name)));
    } catch {
      // Cache Storage may be unavailable or blocked by the browser.
    }
  }
}

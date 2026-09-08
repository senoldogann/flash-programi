import { afterEach, describe, expect, it, vi } from 'vitest';
import { retireLegacyPwa } from './legacy-pwa';

describe('retireLegacyPwa', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unregisters existing service workers and removes legacy Flash Nick caches', async () => {
    const unregisterFirst = vi.fn().mockResolvedValue(true);
    const unregisterSecond = vi.fn().mockResolvedValue(true);
    const deleteCache = vi.fn().mockResolvedValue(true);

    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistrations: vi.fn().mockResolvedValue([
          { unregister: unregisterFirst },
          { unregister: unregisterSecond },
        ]),
      },
    });

    vi.stubGlobal('caches', {
      keys: vi.fn().mockResolvedValue([
        'flash-nick-pro-v2',
        'flash-nick-pro-v1',
        'unrelated-cache',
      ]),
      delete: deleteCache,
    });

    await retireLegacyPwa();

    expect(unregisterFirst).toHaveBeenCalledTimes(1);
    expect(unregisterSecond).toHaveBeenCalledTimes(1);
    expect(deleteCache).toHaveBeenCalledTimes(2);
    expect(deleteCache).toHaveBeenCalledWith('flash-nick-pro-v2');
    expect(deleteCache).toHaveBeenCalledWith('flash-nick-pro-v1');
    expect(deleteCache).not.toHaveBeenCalledWith('unrelated-cache');
  });

  it('is safe when service worker and Cache Storage APIs are unavailable', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('caches', undefined);

    await expect(retireLegacyPwa()).resolves.toBeUndefined();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GifProfile } from '../model/project';
import { createBrowserGifEncoder, loadGifConstructor, type GifConstructor } from './gif-browser';

class FakeGif {
  static options: Record<string, unknown> | null = null;

  constructor(options: Record<string, unknown>) {
    FakeGif.options = options;
  }

  addFrame() {}
  on() {}
  render() {}
}

afterEach(() => {
  delete (window as Window & { GIF?: GifConstructor }).GIF;
  document.querySelectorAll('script[data-flash-gif-lib]').forEach((script) => script.remove());
  FakeGif.options = null;
  vi.restoreAllMocks();
});

describe('browser GIF runtime', () => {
  it('reuses an already loaded GIF constructor', async () => {
    (window as Window & { GIF?: GifConstructor }).GIF = FakeGif as unknown as GifConstructor;
    const appendSpy = vi.spyOn(document.head, 'appendChild');

    await expect(loadGifConstructor()).resolves.toBe(FakeGif);
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('loads gif.js once when the constructor is not present', async () => {
    const loading = loadGifConstructor();
    const script = document.querySelector<HTMLScriptElement>('script[data-flash-gif-lib]');

    expect(script).not.toBeNull();
    expect(script?.src).toContain('/gif.js');

    (window as Window & { GIF?: GifConstructor }).GIF = FakeGif as unknown as GifConstructor;
    script?.dispatchEvent(new Event('load'));

    await expect(loading).resolves.toBe(FakeGif);
  });

  it.each([
    ['small', 15],
    ['balanced', 10],
    ['quality', 8],
  ] as const)('creates gif.js with the %s profile encoder quality', (profile: GifProfile, quality) => {
    createBrowserGifEncoder(FakeGif as unknown as GifConstructor, 300, 220, profile);

    expect(FakeGif.options).toEqual({
      workers: 2,
      quality,
      repeat: 0,
      width: 300,
      height: 220,
      workerScript: '/gif.worker.js',
    });
  });
});

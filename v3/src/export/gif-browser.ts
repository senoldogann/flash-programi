import type { GifEncoderLike } from './gif';

export type GifJsOptions = {
  workers: number;
  quality: number;
  repeat: number;
  width: number;
  height: number;
  workerScript: string;
};

export type GifConstructor = new (options: GifJsOptions) => GifEncoderLike;

type GifWindow = Window & { GIF?: GifConstructor };

function currentGifConstructor(): GifConstructor | undefined {
  return (window as GifWindow).GIF;
}

export function loadGifConstructor(src = '/gif.js'): Promise<GifConstructor> {
  const existing = currentGifConstructor();
  if (existing) return Promise.resolve(existing);

  const selector = 'script[data-flash-gif-lib]';
  let script = document.querySelector<HTMLScriptElement>(selector);
  let shouldAppend = false;

  if (!script) {
    script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.flashGifLib = 'true';
    shouldAppend = true;
  }

  return new Promise<GifConstructor>((resolve, reject) => {
    const cleanup = () => {
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
    };

    const handleLoad = () => {
      const constructor = currentGifConstructor();
      cleanup();
      if (constructor) {
        resolve(constructor);
      } else {
        reject(new Error('GIF motoru yüklendi ancak başlatılamadı.'));
      }
    };

    const handleError = () => {
      cleanup();
      script?.remove();
      reject(new Error('GIF motoru yüklenemedi. İnternet bağlantınızı kontrol edin.'));
    };

    script?.addEventListener('load', handleLoad, { once: true });
    script?.addEventListener('error', handleError, { once: true });

    if (shouldAppend && script) {
      document.head.appendChild(script);
    }
  });
}

export function createBrowserGifEncoder(
  Gif: GifConstructor,
  width: number,
  height: number,
): GifEncoderLike {
  return new Gif({
    workers: 2,
    quality: 10,
    repeat: 0,
    width,
    height,
    workerScript: '/gif.worker.js',
  });
}

export const DEFAULT_GIF_MAX_FPS = 15;

export type GifPlan = {
  fps: number;
  frameDelayMs: number;
  times: number[];
};

export interface GifEncoderLike {
  addFrame(frame: HTMLCanvasElement, options: { copy: true; delay: number }): void;
  on(event: 'finished', listener: (blob: Blob) => void): void;
  on(event: 'progress', listener: (value: number) => void): void;
  render(): void;
}

export type EncodeGifFramesOptions = {
  durationMs: number;
  fps: number;
  frameTimesMs?: number[];
  frameDelayMs?: number;
  encoder: GifEncoderLike;
  renderFrame: (timeMs: number) => Promise<HTMLCanvasElement>;
  onProgress?: (value: number) => void;
};

function finitePositive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} pozitif bir sayı olmalıdır.`);
  }

  return value;
}

function resolveFramePlan(options: EncodeGifFramesOptions): { times: number[]; frameDelayMs: number } {
  if (options.frameTimesMs && options.frameDelayMs !== undefined) {
    const frameDelayMs = finitePositive(options.frameDelayMs, 'GIF kare gecikmesi');
    if (options.frameTimesMs.length === 0) {
      throw new Error('GIF en az bir kare zamanı içermelidir.');
    }
    const times = options.frameTimesMs.map((timeMs) => {
      if (!Number.isFinite(timeMs) || timeMs < 0) {
        throw new Error('GIF kare zamanları sıfır veya pozitif sonlu sayılar olmalıdır.');
      }
      return timeMs;
    });
    return { times, frameDelayMs };
  }

  const plan = createGifPlan(options.durationMs, options.fps);
  return { times: plan.times, frameDelayMs: plan.frameDelayMs };
}

export function createGifPlan(
  durationMs: number,
  requestedFps: number,
  maxFps = DEFAULT_GIF_MAX_FPS,
): GifPlan {
  const duration = finitePositive(durationMs, 'GIF süresi');
  const requested = finitePositive(requestedFps, 'GIF FPS');
  const maximum = finitePositive(maxFps, 'Maksimum GIF FPS');
  const fps = Math.max(1, Math.min(maximum, Math.round(requested)));
  const frameDelayMs = 1000 / fps;
  const times: number[] = [];

  for (let index = 0; ; index += 1) {
    const timeMs = index * frameDelayMs;
    if (timeMs >= duration) break;
    times.push(timeMs);
  }

  if (times.length === 0) times.push(0);

  return { fps, frameDelayMs, times };
}

export async function encodeGifFrames(options: EncodeGifFramesOptions): Promise<Blob> {
  const { encoder, renderFrame, onProgress } = options;
  const plan = resolveFramePlan(options);

  for (const timeMs of plan.times) {
    const frame = await renderFrame(timeMs);
    encoder.addFrame(frame, {
      copy: true,
      delay: plan.frameDelayMs,
    });
  }

  return new Promise<Blob>((resolve, reject) => {
    encoder.on('progress', (value) => onProgress?.(value));
    encoder.on('finished', resolve);

    try {
      encoder.render();
    } catch (error) {
      reject(error);
    }
  });
}

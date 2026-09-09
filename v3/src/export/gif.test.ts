import { describe, expect, it, vi } from 'vitest';
import { createGifPlan, encodeGifFrames, type GifEncoderLike } from './gif';

class FakeEncoder implements GifEncoderLike {
  frames: Array<{ frame: HTMLCanvasElement; delay: number }> = [];
  private finished?: (blob: Blob) => void;
  private progress?: (value: number) => void;

  addFrame(frame: HTMLCanvasElement, options: { copy: true; delay: number }) {
    this.frames.push({ frame, delay: options.delay });
  }

  on(event: 'finished' | 'progress', listener: ((blob: Blob) => void) | ((value: number) => void)) {
    if (event === 'finished') this.finished = listener as (blob: Blob) => void;
    if (event === 'progress') this.progress = listener as (value: number) => void;
  }

  render() {
    this.progress?.(1);
    this.finished?.(new Blob(['GIF89a'], { type: 'image/gif' }));
  }
}

describe('GIF export', () => {
  it('caps preview projects to a practical GIF frame rate while preserving duration', () => {
    const plan = createGifPlan(3000, 24);

    expect(plan.fps).toBe(15);
    expect(plan.times).toHaveLength(45);
    expect(plan.times[0]).toBe(0);
    expect(plan.times.at(-1)).toBeLessThan(3000);
    expect(plan.frameDelayMs).toBeCloseTo(1000 / 15, 5);
  });

  it('renders deterministic timestamps in order and encodes every frame', async () => {
    const encoder = new FakeEncoder();
    const renderFrame = vi.fn(async (timeMs: number) => {
      const canvas = document.createElement('canvas');
      canvas.dataset.time = String(timeMs);
      return canvas;
    });
    const progress = vi.fn();

    const blob = await encodeGifFrames({
      durationMs: 1000,
      fps: 4,
      encoder,
      renderFrame,
      onProgress: progress,
    });

    expect(renderFrame.mock.calls.map(([time]) => time)).toEqual([0, 250, 500, 750]);
    expect(encoder.frames).toHaveLength(4);
    expect(encoder.frames.every(({ delay }) => delay === 250)).toBe(true);
    expect(blob.type).toBe('image/gif');
    expect(blob.size).toBeGreaterThan(0);
    expect(progress).toHaveBeenCalledWith(1);
  });

  it('uses caller-supplied deterministic frame times and delay without recomputing them', async () => {
    const encoder = new FakeEncoder();
    const renderFrame = vi.fn(async () => document.createElement('canvas'));

    await encodeGifFrames({
      durationMs: 1000,
      fps: 4,
      frameTimesMs: [0, 125, 875],
      frameDelayMs: 125,
      encoder,
      renderFrame,
    });

    expect(renderFrame.mock.calls.map(([time]) => time)).toEqual([0, 125, 875]);
    expect(encoder.frames).toHaveLength(3);
    expect(encoder.frames.every(({ delay }) => delay === 125)).toBe(true);
  });
});

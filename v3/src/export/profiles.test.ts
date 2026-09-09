import { describe, expect, it } from 'vitest';
import {
  assertSafeExportDimensions,
  assertSafeGifWorkBudget,
  getExportDimensions,
  getGifFramePlan,
  getGifWorkBudget,
  isSafeExportDimensions,
} from './profiles';

describe('export profiles', () => {
  it('computes final export pixels from logical project dimensions and scale', () => {
    expect(getExportDimensions(300, 100, 2)).toEqual({ width: 600, height: 200 });
    expect(getExportDimensions(450, 150, 4)).toEqual({ width: 1800, height: 600 });
  });

  it('rejects PNG/GIF output dimensions above the 4096px hard limit', () => {
    expect(isSafeExportDimensions(4096, 4096)).toBe(true);
    expect(isSafeExportDimensions(4097, 200)).toBe(false);
    expect(isSafeExportDimensions(200, 4097)).toBe(false);
    expect(() => assertSafeExportDimensions(4096, 4096)).not.toThrow();
    expect(() => assertSafeExportDimensions(4800, 200)).toThrow(/4096/i);
  });

  it('builds a deterministic balanced plan with evenly spaced frame times', () => {
    const plan = getGifFramePlan(1000, 'balanced');

    expect(plan.frameCount).toBe(12);
    expect(plan.delayMs).toBeCloseTo(1000 / 12, 8);
    expect(plan.frameTimesMs).toHaveLength(12);
    expect(plan.frameTimesMs[0]).toBe(0);
    expect(plan.frameTimesMs[1]).toBeCloseTo(1000 / 12, 8);
    expect(plan.frameTimesMs.at(-1)).toBeCloseTo((11 * 1000) / 12, 8);
    expect(getGifFramePlan(1000, 'balanced')).toEqual(plan);
  });

  it.each([
    ['small', 8, 16],
    ['balanced', 12, 36],
    ['quality', 20, 60],
  ] as const)('uses the %s profile target fps and max-frame clamp', (profile, targetFps, maxFrames) => {
    const oneSecond = getGifFramePlan(1000, profile);
    const tenSeconds = getGifFramePlan(10_000, profile);

    expect(oneSecond.frameCount).toBe(targetFps);
    expect(tenSeconds.frameCount).toBe(maxFrames);
  });

  it('keeps at least two frames for very short GIFs', () => {
    expect(getGifFramePlan(100, 'small')).toMatchObject({
      frameCount: 2,
      frameTimesMs: [0, 50],
      delayMs: 50,
    });
  });

  it('computes pixel-frame work and rejects work above the hard ceiling', () => {
    expect(getGifWorkBudget(600, 200, 36)).toBe(4_320_000);
    expect(() => assertSafeGifWorkBudget(100_000_000)).not.toThrow();
    expect(() => assertSafeGifWorkBudget(100_000_001)).toThrow(/100/i);
  });
});

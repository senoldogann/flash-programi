import { describe, expect, it } from 'vitest';
import { FRAME_PRESETS, frameNeedsClock, getFramePreset } from './presets';

describe('frame presets', () => {
  it('exposes all approved frames including no frame', () => {
    expect(FRAME_PRESETS.map((preset) => preset.id)).toEqual([
      'none',
      'neon',
      'gold',
      'hearts',
      'stars',
      'rainbow',
      'fire',
      'ice',
      'glitter',
      'turkish',
      'rose-gold',
      'electric',
      'cosmic',
      'ocean',
      'matrix',
      'pearls',
      'love-neon',
      'minimal-white',
    ]);
  });

  it('returns a stable preset definition and clock requirement', () => {
    expect(getFramePreset('gold')).toMatchObject({ id: 'gold', label: 'Altın' });
    expect(frameNeedsClock({ preset: 'rainbow', width: 8 })).toBe(true);
    expect(frameNeedsClock({ preset: 'electric', width: 8 })).toBe(true);
    expect(frameNeedsClock({ preset: 'gold', width: 8 })).toBe(false);
  });
});

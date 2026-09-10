import { describe, expect, it } from 'vitest';
import { CLASSIC_HISTORICAL_SIZES } from './historical-sizes';

describe('Classic historical canvas sizes', () => {
  it('contains every approved SesliChat size exactly once', () => {
    const dimensions = CLASSIC_HISTORICAL_SIZES.map(({ width, height }) => `${width}x${height}`);

    expect(dimensions).toEqual([
      '120x70',
      '125x75',
      '130x70',
      '130x95',
      '130x100',
      '133x33',
      '300x100',
    ]);
    expect(new Set(dimensions).size).toBe(dimensions.length);
  });

  it('provides a human-readable label for every preset', () => {
    expect(CLASSIC_HISTORICAL_SIZES.every((preset) => preset.label.length > 0)).toBe(true);
  });
});

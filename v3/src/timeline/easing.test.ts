import { describe, expect, it } from 'vitest';
import { applyEasing } from './easing';

describe('timeline easing', () => {
  it('keeps linear progress unchanged', () => {
    expect(applyEasing('linear', 0)).toBe(0);
    expect(applyEasing('linear', 0.25)).toBeCloseTo(0.25, 8);
    expect(applyEasing('linear', 1)).toBe(1);
  });

  it('applies deterministic quadratic ease-in and ease-out curves', () => {
    expect(applyEasing('ease-in', 0.5)).toBeCloseTo(0.25, 8);
    expect(applyEasing('ease-out', 0.5)).toBeCloseTo(0.75, 8);
  });

  it('applies a symmetric ease-in-out curve', () => {
    expect(applyEasing('ease-in-out', 0.25)).toBeCloseTo(0.125, 8);
    expect(applyEasing('ease-in-out', 0.5)).toBeCloseTo(0.5, 8);
    expect(applyEasing('ease-in-out', 0.75)).toBeCloseTo(0.875, 8);
  });

  it('clamps progress before applying easing', () => {
    expect(applyEasing('linear', -2)).toBe(0);
    expect(applyEasing('ease-in', -1)).toBe(0);
    expect(applyEasing('ease-out', 2)).toBe(1);
    expect(applyEasing('ease-in-out', 3)).toBe(1);
  });
});
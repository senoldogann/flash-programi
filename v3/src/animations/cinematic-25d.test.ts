import { describe, expect, it } from 'vitest';
import { createDefaultAnimation, type AnimationPreset } from '../model/project';
import { evaluateAnimation } from './evaluator';

const cinematicPresets = [
  'walk-25d',
  'depth-tilt',
  'dolly-zoom',
  'camera-orbit-25d',
  'parallax-walk',
  'perspective-card',
  'levitate-25d',
  'cinematic-push',
] as const satisfies readonly AnimationPreset[];

describe('cinematic 2.5D animation presets', () => {
  it.each(cinematicPresets)('%s produces a deterministic visible transform', (preset) => {
    const animation = {
      ...createDefaultAnimation(),
      preset,
      intensity: 'strong' as const,
      direction: 'right' as const,
    };

    const first = evaluateAnimation(animation, 475);
    const second = evaluateAnimation(animation, 475);

    expect(first).toEqual(second);
    expect(first).not.toEqual({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      skewX: 0,
      skewY: 0,
      hueShift: 0,
      blurAmount: 0,
      revealProgress: 1,
      chromaticOffset: 0,
      pixelateAmount: 0,
    });
    for (const value of Object.values(first)) expect(Number.isFinite(value)).toBe(true);
  });
});

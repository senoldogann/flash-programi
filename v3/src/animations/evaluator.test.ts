import { describe, expect, it } from 'vitest';
import { createDefaultAnimation, type AnimationPreset } from '../model/project';
import { animationNeedsClock, evaluateAnimation } from './evaluator';

const identity = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1,
};

describe('animation evaluator', () => {
  it('returns identity for the none preset', () => {
    expect(evaluateAnimation(createDefaultAnimation(), 720)).toEqual(identity);
    expect(animationNeedsClock(createDefaultAnimation())).toBe(false);
  });

  it('is deterministic for the same animation and timestamp', () => {
    const animation = { ...createDefaultAnimation(), preset: 'shake' as const, speed: 'fast' as const };
    expect(evaluateAnimation(animation, 913)).toEqual(evaluateAnimation(animation, 913));
  });

  it.each<AnimationPreset>([
    'pulse',
    'float',
    'swing',
    'spin',
    'blink',
    'zoom',
    'shake',
    'slide',
    'bounce',
    'wave',
  ])('evaluates %s as an animated transform', (preset) => {
    const animation = { ...createDefaultAnimation(), preset };
    expect(animationNeedsClock(animation)).toBe(true);
    expect(evaluateAnimation(animation, 375)).not.toEqual(identity);
  });

  it('respects animation delay', () => {
    const animation = { ...createDefaultAnimation(), preset: 'pulse' as const, delayMs: 500 };
    expect(evaluateAnimation(animation, 300)).toEqual(identity);
  });
});

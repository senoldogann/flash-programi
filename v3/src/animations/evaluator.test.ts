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
  skewX: 0,
  skewY: 0,
  hueShift: 0,
  blurAmount: 0,
  revealProgress: 1,
  chromaticOffset: 0,
  pixelateAmount: 0,
};

const animatedPresets = [
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
  'ken-burns',
  'slow-pan',
  'orbit',
  'breathing-zoom',
  'rubber',
  'flip-x',
  'flip-y',
  'pendulum',
  'drift',
  'parallax',
  'jello',
  'wobble',
  'heartbeat',
  'flash',
  'reveal',
  'scanline',
  'glitch-rgb',
  'chromatic-shake',
  'focus-pulse',
  'pixel-pulse',
  'soft-sway',
  'tilt',
  'spiral',
  'pop',
  'shimmer',
  'camera-pan',
  'micro-vibrate',
  'rise-fade',
] as const;

describe('animation evaluator', () => {
  it('returns the expanded identity for the none preset', () => {
    expect(evaluateAnimation(createDefaultAnimation(), 720)).toEqual(identity);
    expect(animationNeedsClock(createDefaultAnimation())).toBe(false);
  });

  it.each(animatedPresets)('evaluates %s deterministically with finite render channels', (preset) => {
    const animation = {
      ...createDefaultAnimation(),
      preset: preset as AnimationPreset,
      speed: 'fast' as const,
      intensity: 'strong' as const,
      direction: 'right' as const,
    };

    const first = evaluateAnimation(animation, 913);
    const second = evaluateAnimation(animation, 913);

    expect(animationNeedsClock(animation)).toBe(true);
    expect(first).toEqual(second);
    expect(first).not.toEqual(identity);
    for (const value of Object.values(first)) expect(Number.isFinite(value)).toBe(true);
  });

  it('respects animation delay for expanded presets', () => {
    const animation = {
      ...createDefaultAnimation(),
      preset: 'orbit' as AnimationPreset,
      delayMs: 500,
    };
    expect(evaluateAnimation(animation, 300)).toEqual(identity);
  });

  it('clamps non-looping animations after one period', () => {
    const animation = {
      ...createDefaultAnimation(),
      preset: 'ken-burns' as AnimationPreset,
      speed: 'normal' as const,
      loop: false,
    };

    expect(evaluateAnimation(animation, 1600)).toEqual(evaluateAnimation(animation, 99_000));
  });

  it('applies intensity deterministically', () => {
    const subtle = evaluateAnimation({
      ...createDefaultAnimation(),
      preset: 'orbit' as AnimationPreset,
      intensity: 'subtle',
    }, 375);
    const strong = evaluateAnimation({
      ...createDefaultAnimation(),
      preset: 'orbit' as AnimationPreset,
      intensity: 'strong',
    }, 375);

    expect(Math.hypot(strong.x, strong.y)).toBeGreaterThan(Math.hypot(subtle.x, subtle.y));
  });
});

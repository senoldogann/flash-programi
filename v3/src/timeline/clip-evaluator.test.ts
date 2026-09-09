import { describe, expect, it } from 'vitest';
import type { AnimationClipV3 } from '../model/v3/project-v3';
import { evaluateClip } from './clip-evaluator';

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

function clip(overrides: Partial<AnimationClipV3> = {}): AnimationClipV3 {
  return {
    id: 'clip-1',
    effect: 'spin',
    startMs: 100,
    durationMs: 3000,
    loop: true,
    speed: 'normal',
    intensity: 'normal',
    easing: 'linear',
    ...overrides,
  };
}

describe('V3 clip evaluator', () => {
  it('is active only inside the half-open clip window', () => {
    expect(evaluateClip(clip(), 99)).toEqual({
      clipId: 'clip-1',
      effect: 'spin',
      active: false,
      animation: identity,
      alternateFace: false,
    });

    expect(evaluateClip(clip(), 100).active).toBe(true);
    expect(evaluateClip(clip(), 3099).active).toBe(true);
    expect(evaluateClip(clip(), 3100)).toEqual({
      clipId: 'clip-1',
      effect: 'spin',
      active: false,
      animation: identity,
      alternateFace: false,
    });
  });

  it('repeats looping effects according to the speed period', () => {
    const firstQuarter = evaluateClip(clip(), 500);
    const repeatedQuarter = evaluateClip(clip(), 2100);

    expect(firstQuarter.active).toBe(true);
    expect(firstQuarter.animation.rotation).toBeCloseTo(90, 6);
    expect(repeatedQuarter.animation.rotation).toBeCloseTo(90, 6);
  });

  it('clamps non-looping effects after one period while the clip remains active', () => {
    const definition = clip({ loop: false });

    expect(evaluateClip(definition, 1700).animation.rotation).toBeCloseTo(360, 6);
    expect(evaluateClip(definition, 2500).active).toBe(true);
    expect(evaluateClip(definition, 2500).animation.rotation).toBeCloseTo(360, 6);
  });

  it('applies easing to normalized effect progress', () => {
    const eased = evaluateClip(clip({ startMs: 0, easing: 'ease-in' }), 800);
    const linear = evaluateClip(clip({ startMs: 0, easing: 'linear' }), 800);

    expect(eased.animation.rotation).toBeCloseTo(90, 6);
    expect(linear.animation.rotation).toBeCloseTo(180, 6);
  });

  it('preserves direction and intensity semantics from the shared animation engine', () => {
    const result = evaluateClip(clip({
      effect: 'slide',
      startMs: 0,
      direction: 'left',
      intensity: 'strong',
    }), 400);

    expect(result.animation.x).toBeCloseTo(-29.7, 6);
    expect(result.animation.y).toBeCloseTo(0, 6);
  });

  it('resolves Xara alternate-face state from clip progress', () => {
    const result = evaluateClip(clip({
      effect: 'xara-double-sided',
      startMs: 0,
    }), 800);

    expect(result.active).toBe(true);
    expect(result.alternateFace).toBe(true);
  });
});

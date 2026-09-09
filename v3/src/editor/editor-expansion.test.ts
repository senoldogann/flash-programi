import { describe, expect, it } from 'vitest';
import { evaluateAnimation } from '../animations/evaluator';
import { DECORATION_PRESETS } from '../decorations/presets';
import { buildImageEffectRenderPlan } from '../effects/image-effects';
import { FRAME_PRESETS } from '../frames/presets';
import {
  createDefaultImageEffects,
  type AnimationDefinition,
  type ImageEffects,
} from '../model/project';

const baseAnimation = {
  speed: 'normal',
  intensity: 'normal',
  delayMs: 0,
  loop: true,
} as const;

describe('expanded creative editor', () => {
  it('supports a real vignette image effect in the shared render pipeline', () => {
    const effects = {
      ...createDefaultImageEffects(),
      vignette: 0.65,
    } as unknown as ImageEffects;

    const plan = buildImageEffectRenderPlan(effects);

    expect(plan.requiresCache).toBe(true);
    expect(plan.filters.length).toBeGreaterThan(0);
  });

  it('exposes additional premium-looking frame families', () => {
    expect(FRAME_PRESETS.map((preset) => preset.id)).toEqual(expect.arrayContaining([
      'rose-gold',
      'electric',
      'cosmic',
      'ocean',
      'matrix',
      'pearls',
      'love-neon',
      'minimal-white',
    ]));
  });

  it('exposes additional decorative layer families', () => {
    expect(DECORATION_PRESETS.map((preset) => preset.id)).toEqual(expect.arrayContaining([
      'diamonds',
      'music',
      'crowns',
      'roses',
      'moon-stars',
      'cherry-blossom',
      'money',
      'smoke',
      'rain',
    ]));
  });

  it.each([
    'soft-sway',
    'tilt',
    'spiral',
    'pop',
    'shimmer',
    'camera-pan',
    'micro-vibrate',
    'rise-fade',
  ])('evaluates the %s motion preset to a visible non-identity frame', (preset) => {
    const animation = {
      ...baseAnimation,
      preset,
    } as unknown as AnimationDefinition;

    const frame = evaluateAnimation(animation, 375);

    expect(frame).not.toEqual({
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
  });
});

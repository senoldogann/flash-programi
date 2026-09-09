import { describe, expect, it } from 'vitest';
import type { EvaluatedAnimation } from '../animations/evaluator';
import type { EvaluatedClipV3 } from './clip-evaluator';
import { composeClipEvaluations } from './composition';

const identityAnimation: EvaluatedAnimation = {
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

function evaluatedClip(
  overrides: Partial<EvaluatedClipV3> = {},
  animation: Partial<EvaluatedAnimation> = {},
): EvaluatedClipV3 {
  return {
    clipId: 'clip-1',
    effect: 'pulse',
    active: true,
    animation: {
      ...identityAnimation,
      ...animation,
    },
    alternateFace: false,
    ...overrides,
  };
}

describe('multi-clip composition', () => {
  it('returns identity when no active clips contribute', () => {
    expect(composeClipEvaluations([])).toEqual({
      ...identityAnimation,
      alternateFace: false,
    });

    expect(composeClipEvaluations([
      evaluatedClip({ active: false }, { x: 99, scaleX: 4, opacity: 0.1 }),
    ])).toEqual({
      ...identityAnimation,
      alternateFace: false,
    });
  });

  it('adds additive render channels from simultaneous active clips', () => {
    const result = composeClipEvaluations([
      evaluatedClip({ clipId: 'a' }, {
        x: 5,
        y: -2,
        rotation: 10,
        skewX: 3,
        skewY: -1,
        hueShift: 8,
        blurAmount: 2,
        chromaticOffset: 1.5,
        pixelateAmount: 4,
      }),
      evaluatedClip({ clipId: 'b' }, {
        x: -1,
        y: 7,
        rotation: -4,
        skewX: 2,
        skewY: 5,
        hueShift: -3,
        blurAmount: 1,
        chromaticOffset: 2.5,
        pixelateAmount: 3,
      }),
    ]);

    expect(result).toMatchObject({
      x: 4,
      y: 5,
      rotation: 6,
      skewX: 5,
      skewY: 4,
      hueShift: 5,
      blurAmount: 3,
      chromaticOffset: 4,
      pixelateAmount: 7,
    });
  });

  it('multiplies scale, opacity, and reveal channels', () => {
    const result = composeClipEvaluations([
      evaluatedClip({ clipId: 'a' }, {
        scaleX: 1.1,
        scaleY: 0.8,
        opacity: 0.8,
        revealProgress: 0.75,
      }),
      evaluatedClip({ clipId: 'b' }, {
        scaleX: 0.9,
        scaleY: 1.25,
        opacity: 0.5,
        revealProgress: 0.5,
      }),
    ]);

    expect(result.scaleX).toBeCloseTo(0.99, 8);
    expect(result.scaleY).toBeCloseTo(1, 8);
    expect(result.opacity).toBeCloseTo(0.4, 8);
    expect(result.revealProgress).toBeCloseTo(0.375, 8);
  });

  it('uses the last active Xara double-sided clip for alternate-face state', () => {
    const result = composeClipEvaluations([
      evaluatedClip({
        clipId: 'xara-front',
        effect: 'xara-double-sided',
        alternateFace: true,
      }),
      evaluatedClip({
        clipId: 'ordinary',
        effect: 'pulse',
        alternateFace: true,
      }),
      evaluatedClip({
        clipId: 'xara-back',
        effect: 'xara-double-sided',
        alternateFace: false,
      }),
    ]);

    expect(result.alternateFace).toBe(false);
  });

  it('ignores inactive Xara clips when resolving alternate face', () => {
    const result = composeClipEvaluations([
      evaluatedClip({
        clipId: 'xara-active',
        effect: 'xara-double-sided',
        alternateFace: true,
      }),
      evaluatedClip({
        clipId: 'xara-inactive',
        effect: 'xara-double-sided',
        active: false,
        alternateFace: false,
      }),
    ]);

    expect(result.alternateFace).toBe(true);
  });
});

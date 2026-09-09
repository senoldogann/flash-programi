import { describe, expect, it } from 'vitest';
import { evaluateAnimation } from './evaluator';
import type { AnimationDefinition } from '../model/project';

function animation(preset: string): AnimationDefinition {
  return {
    preset: preset as AnimationDefinition['preset'],
    speed: 'normal',
    intensity: 'normal',
    delayMs: 0,
    loop: true,
  };
}

describe('classic Xara-style nick animation', () => {
  it('turns the text edge-on and exposes its back face during a double-sided rotation', () => {
    const front = evaluateAnimation(animation('xara-double-sided'), 0);
    const edge = evaluateAnimation(animation('xara-double-sided'), 400);
    const back = evaluateAnimation(animation('xara-double-sided'), 800);

    expect(front.scaleX).toBeCloseTo(1, 3);
    expect(front.alternateFace).toBe(false);
    expect(Math.abs(edge.scaleX)).toBeLessThan(0.08);
    expect(back.scaleX).toBeCloseTo(1, 3);
    expect(back.alternateFace).toBe(true);
  });
});

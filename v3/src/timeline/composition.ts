import type { EvaluatedAnimation } from '../animations/evaluator';
import type { EvaluatedClipV3 } from './clip-evaluator';

export type ComposedAnimationV3 = EvaluatedAnimation & {
  alternateFace: boolean;
};

const IDENTITY: ComposedAnimationV3 = {
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
  alternateFace: false,
};

export function composeClipEvaluations(
  evaluations: readonly EvaluatedClipV3[],
): ComposedAnimationV3 {
  const result: ComposedAnimationV3 = { ...IDENTITY };

  for (const evaluation of evaluations) {
    if (!evaluation.active) continue;

    const animation = evaluation.animation;

    result.x += animation.x;
    result.y += animation.y;
    result.rotation += animation.rotation;
    result.skewX += animation.skewX;
    result.skewY += animation.skewY;
    result.hueShift += animation.hueShift;
    result.blurAmount += animation.blurAmount;
    result.chromaticOffset += animation.chromaticOffset;
    result.pixelateAmount += animation.pixelateAmount;

    result.scaleX *= animation.scaleX;
    result.scaleY *= animation.scaleY;
    result.opacity *= animation.opacity;
    result.revealProgress *= animation.revealProgress;

    if (evaluation.effect === 'xara-double-sided') {
      result.alternateFace = evaluation.alternateFace;
    }
  }

  return result;
}

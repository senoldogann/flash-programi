import {
  animationPeriodMs,
  animationShowsAlternateFaceAtProgress,
  evaluateAnimationAtProgress,
  type EvaluatedAnimation,
} from '../animations/evaluator';
import type { AnimationDefinition } from '../model/project';
import type { AnimationClipV3 } from '../model/v3/project-v3';
import { applyEasing } from './easing';

const IDENTITY: EvaluatedAnimation = {
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

export type EvaluatedClipV3 = {
  clipId: string;
  effect: AnimationClipV3['effect'];
  active: boolean;
  animation: EvaluatedAnimation;
  alternateFace: boolean;
};

function animationDefinitionFromClip(clip: AnimationClipV3): AnimationDefinition {
  return {
    preset: clip.effect,
    speed: clip.speed,
    intensity: clip.intensity,
    delayMs: 0,
    loop: clip.loop,
    ...(clip.direction !== undefined ? { direction: clip.direction } : {}),
  };
}

function inactiveResult(clip: AnimationClipV3): EvaluatedClipV3 {
  return {
    clipId: clip.id,
    effect: clip.effect,
    active: false,
    animation: { ...IDENTITY },
    alternateFace: false,
  };
}

export function evaluateClip(
  clip: AnimationClipV3,
  timeMs: number,
): EvaluatedClipV3 {
  const endMs = clip.startMs + clip.durationMs;
  if (timeMs < clip.startMs || timeMs >= endMs) {
    return inactiveResult(clip);
  }

  const localTimeMs = Math.max(0, timeMs - clip.startMs);
  const periodMs = animationPeriodMs(clip.speed);
  const rawProgress = clip.loop
    ? (localTimeMs % periodMs) / periodMs
    : Math.min(localTimeMs / periodMs, 1);
  const progress = applyEasing(clip.easing, rawProgress);
  const definition = animationDefinitionFromClip(clip);

  return {
    clipId: clip.id,
    effect: clip.effect,
    active: true,
    animation: evaluateAnimationAtProgress(definition, progress),
    alternateFace: animationShowsAlternateFaceAtProgress(definition, progress),
  };
}

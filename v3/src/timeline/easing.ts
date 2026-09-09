import type { AnimationEasingV3 } from '../model/v3/project-v3';

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function applyEasing(
  easing: AnimationEasingV3,
  progress: number,
): number {
  const t = clamp01(progress);

  switch (easing) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t < 0.5
        ? 2 * t * t
        : 1 - 2 * (1 - t) * (1 - t);
    case 'linear':
    default:
      return t;
  }
}

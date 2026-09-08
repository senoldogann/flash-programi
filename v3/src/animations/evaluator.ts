import type { AnimationDefinition } from '../model/project';

export type EvaluatedAnimation = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
};

const IDENTITY: EvaluatedAnimation = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1,
};

const PERIOD_BY_SPEED = {
  slow: 2800,
  normal: 1600,
  fast: 850,
} as const;

export function animationNeedsClock(animation: AnimationDefinition): boolean {
  return animation.preset !== 'none';
}

export function evaluateAnimation(
  animation: AnimationDefinition,
  timeMs: number,
): EvaluatedAnimation {
  if (animation.preset === 'none' || timeMs < animation.delayMs) {
    return { ...IDENTITY };
  }

  const period = PERIOD_BY_SPEED[animation.speed];
  const elapsed = Math.max(0, timeMs - animation.delayMs);
  const progress = animation.loop
    ? (elapsed % period) / period
    : Math.min(elapsed / period, 1);
  const theta = progress * Math.PI * 2;

  switch (animation.preset) {
    case 'pulse': {
      const scale = 1 + Math.sin(theta) * 0.08;
      return { ...IDENTITY, scaleX: scale, scaleY: scale };
    }
    case 'float':
      return { ...IDENTITY, y: Math.sin(theta) * 10 };
    case 'swing':
      return { ...IDENTITY, rotation: Math.sin(theta) * 7 };
    case 'spin':
      return { ...IDENTITY, rotation: progress * 360 };
    case 'blink':
      return { ...IDENTITY, opacity: 0.6 + Math.sin(theta) * 0.4 };
    case 'zoom': {
      const scale = 1 + Math.sin(theta) * 0.15;
      return { ...IDENTITY, scaleX: scale, scaleY: scale };
    }
    case 'shake':
      return {
        ...IDENTITY,
        x: Math.sin(theta * 5) * 4,
        y: Math.cos(theta * 7) * 4,
      };
    case 'slide':
      return { ...IDENTITY, x: Math.sin(theta) * 18 };
    case 'bounce':
      return { ...IDENTITY, y: -Math.abs(Math.sin(theta)) * 18 };
    case 'wave':
      return {
        ...IDENTITY,
        y: Math.sin(theta * 2) * 7,
        rotation: Math.sin(theta) * 4,
      };
    default:
      return { ...IDENTITY };
  }
}

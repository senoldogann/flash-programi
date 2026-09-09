import type { AnimationDefinition, AnimationDirection } from '../model/project';

export type EvaluatedAnimation = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  skewX: number;
  skewY: number;
  hueShift: number;
  blurAmount: number;
  revealProgress: number;
  chromaticOffset: number;
  pixelateAmount: number;
};

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

const PERIOD_BY_SPEED = {
  slow: 2800,
  normal: 1600,
  fast: 850,
} as const;

const INTENSITY_MULTIPLIER = {
  subtle: 0.55,
  normal: 1,
  strong: 1.65,
} as const;

function directionVector(direction: AnimationDirection | undefined): { x: number; y: number } {
  switch (direction) {
    case 'left': return { x: -1, y: 0 };
    case 'up': return { x: 0, y: -1 };
    case 'down': return { x: 0, y: 1 };
    case 'right':
    default:
      return { x: 1, y: 0 };
  }
}

function withIntensity(value: number, multiplier: number): number {
  return value * multiplier;
}

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
  const intensity = INTENSITY_MULTIPLIER[animation.intensity];
  const direction = directionVector(animation.direction);
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);

  switch (animation.preset) {
    case 'pulse': {
      const scale = 1 + withIntensity(sin * 0.08, intensity);
      return { ...IDENTITY, scaleX: scale, scaleY: scale };
    }
    case 'float':
      return { ...IDENTITY, y: withIntensity(sin * 10, intensity) };
    case 'swing':
      return { ...IDENTITY, rotation: withIntensity(sin * 7, intensity) };
    case 'spin':
      return { ...IDENTITY, rotation: progress * 360 * intensity };
    case 'blink':
      return { ...IDENTITY, opacity: Math.max(0.08, 0.65 + sin * 0.35 * intensity) };
    case 'zoom': {
      const scale = 1 + withIntensity(sin * 0.15, intensity);
      return { ...IDENTITY, scaleX: scale, scaleY: scale };
    }
    case 'shake':
      return {
        ...IDENTITY,
        x: withIntensity(Math.sin(theta * 5) * 4, intensity),
        y: withIntensity(Math.cos(theta * 7) * 4, intensity),
      };
    case 'slide':
      return {
        ...IDENTITY,
        x: direction.x * withIntensity(sin * 18, intensity),
        y: direction.y * withIntensity(sin * 18, intensity),
      };
    case 'bounce':
      return { ...IDENTITY, y: -withIntensity(Math.abs(sin) * 18, intensity) };
    case 'wave':
      return {
        ...IDENTITY,
        y: withIntensity(Math.sin(theta * 2) * 7, intensity),
        rotation: withIntensity(sin * 4, intensity),
      };
    case 'ken-burns': {
      const scale = 1 + progress * 0.14 * intensity;
      const travel = (progress - 0.5) * 12 * intensity;
      return {
        ...IDENTITY,
        x: direction.x * travel,
        y: direction.y * travel,
        scaleX: scale,
        scaleY: scale,
      };
    }
    case 'slow-pan': {
      const travel = (progress - 0.5) * 34 * intensity;
      return { ...IDENTITY, x: direction.x * travel, y: direction.y * travel };
    }
    case 'orbit':
      return {
        ...IDENTITY,
        x: withIntensity(cos * 14, intensity),
        y: withIntensity(sin * 10, intensity),
      };
    case 'breathing-zoom': {
      const scale = 1 + (0.04 + (sin + 1) * 0.04) * intensity;
      return { ...IDENTITY, scaleX: scale, scaleY: scale };
    }
    case 'rubber':
      return {
        ...IDENTITY,
        scaleX: 1 + withIntensity(Math.sin(theta * 2) * 0.13, intensity),
        scaleY: 1 - withIntensity(Math.sin(theta * 2) * 0.09, intensity),
      };
    case 'flip-x':
      return { ...IDENTITY, scaleX: Math.cos(theta) };
    case 'flip-y':
      return { ...IDENTITY, scaleY: Math.cos(theta) };
    case 'pendulum':
      return { ...IDENTITY, rotation: withIntensity(sin * 13, intensity) };
    case 'drift':
      return {
        ...IDENTITY,
        x: withIntensity(Math.sin(theta * 0.8) * 13, intensity),
        y: withIntensity(Math.cos(theta * 0.6) * 8, intensity),
      };
    case 'parallax': {
      const travel = withIntensity(sin * 11, intensity);
      return {
        ...IDENTITY,
        x: direction.x * travel,
        y: direction.y * travel,
        scaleX: 1.025,
        scaleY: 1.025,
      };
    }
    case 'jello':
      return {
        ...IDENTITY,
        skewX: withIntensity(Math.sin(theta * 3) * 7, intensity),
        skewY: withIntensity(Math.cos(theta * 2) * 4, intensity),
      };
    case 'wobble':
      return {
        ...IDENTITY,
        x: withIntensity(Math.sin(theta * 2) * 8, intensity),
        rotation: withIntensity(Math.sin(theta * 3) * 5, intensity),
      };
    case 'heartbeat': {
      const beat = Math.pow(Math.abs(Math.sin(theta * 2)), 5);
      const scale = 1 + beat * 0.16 * intensity;
      return { ...IDENTITY, scaleX: scale, scaleY: scale };
    }
    case 'flash':
      return { ...IDENTITY, opacity: Math.max(0.05, 0.55 + 0.45 * Math.cos(theta * 2)) };
    case 'reveal':
      return { ...IDENTITY, revealProgress: progress };
    case 'scanline':
      return {
        ...IDENTITY,
        revealProgress: progress,
        opacity: 0.9 + Math.sin(theta * 4) * 0.1,
      };
    case 'glitch-rgb':
      return {
        ...IDENTITY,
        x: withIntensity(Math.sin(theta * 9) * 2.5, intensity),
        hueShift: withIntensity(Math.sin(theta * 5) * 12, intensity),
        chromaticOffset: withIntensity(2 + Math.abs(Math.sin(theta * 7)) * 5, intensity),
      };
    case 'chromatic-shake':
      return {
        ...IDENTITY,
        x: withIntensity(Math.sin(theta * 11) * 3, intensity),
        y: withIntensity(Math.cos(theta * 13) * 2, intensity),
        chromaticOffset: withIntensity(1.5 + Math.abs(sin) * 4, intensity),
      };
    case 'focus-pulse':
      return {
        ...IDENTITY,
        blurAmount: withIntensity(1 + Math.abs(sin) * 6, intensity),
      };
    case 'pixel-pulse':
      return {
        ...IDENTITY,
        pixelateAmount: withIntensity(2 + Math.abs(sin) * 9, intensity),
      };
    default:
      return { ...IDENTITY };
  }
}

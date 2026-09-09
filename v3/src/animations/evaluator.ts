import type {
  AnimationDefinition,
  AnimationDirection,
  AnimationSpeed,
} from '../model/project';

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

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

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

export function animationPeriodMs(speed: AnimationSpeed): number {
  return PERIOD_BY_SPEED[speed];
}

function animationProgress(animation: AnimationDefinition, timeMs: number): number | null {
  if (animation.preset === 'none' || timeMs < animation.delayMs) return null;
  const period = animationPeriodMs(animation.speed);
  const elapsed = Math.max(0, timeMs - animation.delayMs);
  return animation.loop ? (elapsed % period) / period : Math.min(elapsed / period, 1);
}

export function animationNeedsClock(animation: AnimationDefinition): boolean {
  return animation.preset !== 'none';
}

export function animationShowsAlternateFaceAtProgress(
  animation: AnimationDefinition,
  progress: number,
): boolean {
  if (animation.preset !== 'xara-double-sided') return false;
  const normalizedProgress = clamp01(progress);
  return Math.cos(normalizedProgress * Math.PI * 2) < 0;
}

export function animationShowsAlternateFace(animation: AnimationDefinition, timeMs: number): boolean {
  const progress = animationProgress(animation, timeMs);
  if (progress === null) return false;
  return animationShowsAlternateFaceAtProgress(animation, progress);
}

export function evaluateAnimationAtProgress(
  animation: AnimationDefinition,
  progress: number,
): EvaluatedAnimation {
  if (animation.preset === 'none') return { ...IDENTITY };

  const normalizedProgress = clamp01(progress);
  const theta = normalizedProgress * Math.PI * 2;
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
      return { ...IDENTITY, rotation: normalizedProgress * 360 * intensity };
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
      const scale = 1 + normalizedProgress * 0.14 * intensity;
      const travel = (normalizedProgress - 0.5) * 12 * intensity;
      return {
        ...IDENTITY,
        x: direction.x * travel,
        y: direction.y * travel,
        scaleX: scale,
        scaleY: scale,
      };
    }
    case 'slow-pan': {
      const travel = (normalizedProgress - 0.5) * 34 * intensity;
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
      return { ...IDENTITY, revealProgress: normalizedProgress };
    case 'scanline':
      return {
        ...IDENTITY,
        revealProgress: normalizedProgress,
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
      return { ...IDENTITY, blurAmount: withIntensity(1 + Math.abs(sin) * 6, intensity) };
    case 'pixel-pulse':
      return { ...IDENTITY, pixelateAmount: withIntensity(2 + Math.abs(sin) * 9, intensity) };
    case 'soft-sway':
      return {
        ...IDENTITY,
        x: withIntensity(sin * 6, intensity),
        rotation: withIntensity(Math.sin(theta * 0.8) * 2.8, intensity),
      };
    case 'tilt':
      return {
        ...IDENTITY,
        rotation: withIntensity(sin * 9, intensity),
        skewX: withIntensity(cos * 3.5, intensity),
      };
    case 'spiral':
      return {
        ...IDENTITY,
        x: withIntensity(cos * 12, intensity),
        y: withIntensity(sin * 12, intensity),
        rotation: normalizedProgress * 96 * intensity,
      };
    case 'pop': {
      const scale = 0.92 + Math.abs(sin) * 0.18 * intensity;
      return { ...IDENTITY, scaleX: scale, scaleY: scale };
    }
    case 'shimmer':
      return {
        ...IDENTITY,
        opacity: Math.min(1, 0.84 + Math.abs(Math.sin(theta * 3)) * 0.16),
        hueShift: withIntensity(sin * 7, intensity),
      };
    case 'camera-pan': {
      const travel = (normalizedProgress - 0.5) * 24 * intensity;
      return {
        ...IDENTITY,
        x: direction.x * travel,
        y: direction.y * travel,
        scaleX: 1.045,
        scaleY: 1.045,
      };
    }
    case 'micro-vibrate':
      return {
        ...IDENTITY,
        x: withIntensity(Math.sin(theta * 13) * 1.7, intensity),
        y: withIntensity(Math.cos(theta * 17) * 1.3, intensity),
      };
    case 'rise-fade':
      return {
        ...IDENTITY,
        y: -withIntensity(Math.abs(sin) * 12, intensity),
        opacity: Math.min(1, 0.65 + Math.abs(sin) * 0.35),
      };
    case 'walk-25d': {
      const step = Math.sin(theta * 2);
      const stride = Math.sin(theta);
      return {
        ...IDENTITY,
        x: direction.x * withIntensity(stride * 10, intensity),
        y: -withIntensity(Math.abs(step) * 4, intensity),
        rotation: withIntensity(step * 1.4, intensity),
        scaleX: 1 + withIntensity(Math.cos(theta * 2) * 0.018, intensity),
        scaleY: 1 - withIntensity(Math.cos(theta * 2) * 0.012, intensity),
        skewX: withIntensity(step * 1.2, intensity),
      };
    }
    case 'depth-tilt':
      return {
        ...IDENTITY,
        rotation: withIntensity(sin * 2.2, intensity),
        skewX: withIntensity(sin * 5, intensity),
        skewY: withIntensity(cos * 2.5, intensity),
        scaleX: 1 + withIntensity(cos * 0.025, intensity),
        scaleY: 1 + withIntensity(sin * 0.018, intensity),
      };
    case 'dolly-zoom': {
      const dolly = (sin + 1) / 2;
      const scale = 1 + dolly * 0.13 * intensity;
      const travel = withIntensity((0.5 - dolly) * 8, intensity);
      return {
        ...IDENTITY,
        x: direction.x * travel,
        y: direction.y * travel,
        scaleX: scale,
        scaleY: scale,
      };
    }
    case 'camera-orbit-25d': {
      const scale = 1.025 + withIntensity(cos * 0.012, intensity);
      return {
        ...IDENTITY,
        x: withIntensity(cos * 14, intensity),
        y: withIntensity(sin * 8, intensity),
        scaleX: scale,
        scaleY: scale,
        rotation: withIntensity(sin * 2.5, intensity),
        skewX: withIntensity(sin * 3.5, intensity),
      };
    }
    case 'parallax-walk': {
      const step = Math.sin(theta * 2);
      const travel = withIntensity(sin * 18, intensity);
      return {
        ...IDENTITY,
        x: direction.x * travel,
        y: direction.y * travel - withIntensity(Math.abs(step) * 3.5, intensity),
        scaleX: 1.025 + withIntensity(cos * 0.015, intensity),
        scaleY: 1.025 - withIntensity(cos * 0.008, intensity),
        skewX: withIntensity(step * 2.5, intensity),
      };
    }
    case 'perspective-card':
      return {
        ...IDENTITY,
        scaleX: 0.76 + Math.abs(cos) * 0.24,
        scaleY: 1 + withIntensity(sin * 0.025, intensity),
        rotation: withIntensity(sin * 2, intensity),
        skewY: withIntensity(sin * 7, intensity),
      };
    case 'levitate-25d': {
      const scale = 1.03 + withIntensity(cos * 0.025, intensity);
      return {
        ...IDENTITY,
        x: withIntensity(cos * 4, intensity),
        y: withIntensity(sin * 12, intensity),
        scaleX: scale,
        scaleY: scale,
        rotation: withIntensity(sin * 2, intensity),
      };
    }
    case 'cinematic-push': {
      const eased = 0.5 - 0.5 * Math.cos(theta);
      const travel = withIntensity((eased - 0.5) * 10, intensity);
      const scale = 1 + eased * 0.11 * intensity;
      return {
        ...IDENTITY,
        x: direction.x * travel,
        y: direction.y * travel,
        scaleX: scale,
        scaleY: scale,
      };
    }
    case 'xara-double-sided':
      return { ...IDENTITY, scaleX: Math.abs(cos) };
    default:
      return { ...IDENTITY };
  }
}

export function evaluateAnimation(
  animation: AnimationDefinition,
  timeMs: number,
): EvaluatedAnimation {
  const progress = animationProgress(animation, timeMs);
  if (progress === null) return { ...IDENTITY };
  return evaluateAnimationAtProgress(animation, progress);
}
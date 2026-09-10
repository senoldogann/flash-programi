export type TextAlign = 'left' | 'center' | 'right';
export type TextWritingMode = 'horizontal' | 'vertical-stacked';
export type TextMaterialPreset =
  | 'flat'
  | 'xara-gold'
  | 'xara-chrome'
  | 'xara-ruby'
  | 'xara-ice'
  | 'xara-purple-glass'
  | 'xara-emerald'
  | 'xara-fire';

export type AnimationPreset =
  | 'none'
  | 'pulse'
  | 'float'
  | 'swing'
  | 'spin'
  | 'blink'
  | 'zoom'
  | 'shake'
  | 'slide'
  | 'bounce'
  | 'wave'
  | 'ken-burns'
  | 'slow-pan'
  | 'orbit'
  | 'breathing-zoom'
  | 'rubber'
  | 'flip-x'
  | 'flip-y'
  | 'pendulum'
  | 'drift'
  | 'parallax'
  | 'jello'
  | 'wobble'
  | 'heartbeat'
  | 'flash'
  | 'reveal'
  | 'scanline'
  | 'glitch-rgb'
  | 'chromatic-shake'
  | 'focus-pulse'
  | 'pixel-pulse'
  | 'soft-sway'
  | 'tilt'
  | 'spiral'
  | 'pop'
  | 'shimmer'
  | 'camera-pan'
  | 'micro-vibrate'
  | 'rise-fade'
  | 'walk-25d'
  | 'depth-tilt'
  | 'dolly-zoom'
  | 'camera-orbit-25d'
  | 'parallax-walk'
  | 'perspective-card'
  | 'levitate-25d'
  | 'cinematic-push'
  | 'xara-double-sided';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type AnimationIntensity = 'subtle' | 'normal' | 'strong';
export type AnimationDirection = 'left' | 'right' | 'up' | 'down';
export type ExportScale = 1 | 2 | 3 | 4;
export type GifProfile = 'small' | 'balanced' | 'quality';
export type GifPaletteProfile = 'adaptive' | 'classic-64' | 'classic-27';
export type GifDitherProfile = 'none' | 'ordered-4x4';

export type AnimationDefinition = {
  preset: AnimationPreset;
  speed: AnimationSpeed;
  intensity: AnimationIntensity;
  delayMs: number;
  loop: boolean;
  direction?: AnimationDirection;
};

export type ImageEffects = {
  brightness: number;
  contrast: number;
  saturation: number;
  blurRadius: number;
  grayscale: boolean;
  sepia: boolean;
  hue: number;
  temperature: number;
  tint: number;
  enhance: number;
  emboss: number;
  invert: boolean;
  noise: number;
  pixelate: number;
  posterize: number;
  solarize: boolean;
  threshold: number;
  vignette: number;
};

export type DecorationPreset =
  | 'stars'
  | 'hearts'
  | 'sparkles'
  | 'snow'
  | 'bubbles'
  | 'confetti'
  | 'flowers'
  | 'butterflies'
  | 'fire'
  | 'lightning'
  | 'turkish'
  | 'diamonds'
  | 'music'
  | 'crowns'
  | 'roses'
  | 'moon-stars'
  | 'cherry-blossom'
  | 'money'
  | 'smoke'
  | 'rain';

export type DecorationLayer = {
  id: string;
  preset: DecorationPreset;
  count: number;
  opacity: number;
  speed: AnimationSpeed;
};

export type FramePreset =
  | 'none'
  | 'neon'
  | 'gold'
  | 'hearts'
  | 'stars'
  | 'rainbow'
  | 'fire'
  | 'ice'
  | 'glitter'
  | 'turkish'
  | 'rose-gold'
  | 'electric'
  | 'cosmic'
  | 'ocean'
  | 'matrix'
  | 'pearls'
  | 'love-neon'
  | 'minimal-white';

export type FrameDefinition = {
  preset: FramePreset;
  width: number;
};

export type ExportSettings = {
  scale: ExportScale;
  gifProfile: GifProfile;
  gifPalette?: GifPaletteProfile;
  gifDither?: GifDitherProfile;
};

export type ElementBase = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  animation: AnimationDefinition;
};

export type TextElement = ElementBase & {
  type: 'text';
  text: string;
  backText?: string;
  writingMode: TextWritingMode;
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  align: TextAlign;
  materialPreset?: TextMaterialPreset;
  extrusionDepth?: number;
  extrusionColor?: string;
};

export type ImageElement = ElementBase & {
  type: 'image';
  assetUrl: string;
  effects: ImageEffects;
};

export type EditorElement = TextElement | ImageElement;

export type Project = {
  version: 2;
  id: string;
  name: string;
  width: number;
  height: number;
  durationMs: number;
  fps: number;
  background: string;
  elements: EditorElement[];
  decorations: DecorationLayer[];
  frame: FrameDefinition;
  exportSettings: ExportSettings;
};

export function createId(): string {
  return crypto.randomUUID();
}

export function createDefaultAnimation(): AnimationDefinition {
  return {
    preset: 'none',
    speed: 'normal',
    intensity: 'normal',
    delayMs: 0,
    loop: true,
  };
}

export function createDefaultImageEffects(): ImageEffects {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blurRadius: 0,
    grayscale: false,
    sepia: false,
    hue: 0,
    temperature: 0,
    tint: 0,
    enhance: 0,
    emboss: 0,
    invert: false,
    noise: 0,
    pixelate: 0,
    posterize: 0,
    solarize: false,
    threshold: 0,
    vignette: 0,
  };
}

export function createEmptyProject(): Project {
  return {
    version: 2,
    id: createId(),
    name: 'Yeni Tasarım',
    width: 300,
    height: 300,
    durationMs: 3000,
    fps: 24,
    background: '#101827',
    elements: [],
    decorations: [],
    frame: {
      preset: 'none',
      width: 8,
    },
    exportSettings: {
      scale: 1,
      gifProfile: 'balanced',
      gifPalette: 'adaptive',
      gifDither: 'none',
    },
  };
}

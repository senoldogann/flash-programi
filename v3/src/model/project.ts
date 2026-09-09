export type TextAlign = 'left' | 'center' | 'right';
export type TextWritingMode = 'horizontal' | 'vertical-stacked';

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
  | 'wave';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type AnimationIntensity = 'subtle' | 'normal' | 'strong';
export type AnimationDirection = 'left' | 'right' | 'up' | 'down';
export type ExportScale = 1 | 2 | 3 | 4;
export type GifProfile = 'small' | 'balanced' | 'quality';

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
  | 'turkish';

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
  | 'turkish';

export type FrameDefinition = {
  preset: FramePreset;
  width: number;
};

export type ExportSettings = {
  scale: ExportScale;
  gifProfile: GifProfile;
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
  writingMode: TextWritingMode;
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  align: TextAlign;
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
    },
  };
}

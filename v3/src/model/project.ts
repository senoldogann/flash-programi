export type TextAlign = 'left' | 'center' | 'right';

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

export type AnimationDefinition = {
  preset: AnimationPreset;
  speed: AnimationSpeed;
  delayMs: number;
  loop: boolean;
};

export type ImageEffects = {
  brightness: number;
  contrast: number;
  saturation: number;
  blurRadius: number;
  grayscale: boolean;
  sepia: boolean;
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
  version: 1;
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
};

export function createId(): string {
  return crypto.randomUUID();
}

export function createDefaultAnimation(): AnimationDefinition {
  return {
    preset: 'none',
    speed: 'normal',
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
  };
}

export function createEmptyProject(): Project {
  return {
    version: 1,
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
  };
}

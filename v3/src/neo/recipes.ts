import {
  createDefaultAnimation,
  createDefaultImageEffects,
  type AnimationPreset,
  type AnimationSpeed,
  type DecorationPreset,
  type FrameDefinition,
  type ImageEffects,
  type ImageElement,
  type Project,
  type TextElement,
  type TextMaterialPreset,
} from '../model/project';
import { parseProject } from '../model/schema';
import { resizeProjectProportionally } from '../sizing/project-size';
import { getFlashTextMaterial } from '../text/flash-materials';

export type NeoRecipeId =
  | 'golden-queen'
  | 'neon-night'
  | 'purple-glass'
  | 'cyber-blue'
  | 'royal-red'
  | 'diamond'
  | 'fire-goddess'
  | 'frozen'
  | 'dark-luxury'
  | 'angel'
  | 'dream'
  | 'fashion-walk'
  | 'cinematic-portrait'
  | 'holographic'
  | 'chrome-future';

export type NeoLayoutFamily = 'nick' | 'portrait-left' | 'portrait-full';

type NeoDecorationRecipe = {
  preset: DecorationPreset;
  count: number;
  opacity: number;
  speed: AnimationSpeed;
};

export type NeoSceneRecipe = {
  id: NeoRecipeId;
  name: string;
  width: number;
  height: number;
  background: string;
  frame: FrameDefinition;
  decorations: readonly NeoDecorationRecipe[];
  materialPreset: Exclude<TextMaterialPreset, 'flat'>;
  textMotion: AnimationPreset;
  imageMotion: AnimationPreset;
  layout: NeoLayoutFamily;
  imageEffects?: Partial<ImageEffects>;
};

export const NEO_SCENE_RECIPES: readonly NeoSceneRecipe[] = [
  {
    id: 'golden-queen', name: 'Golden Queen', width: 320, height: 180,
    background: '#100b16', frame: { preset: 'gold', width: 3 },
    decorations: [
      { preset: 'ambient-orbs', count: 5, opacity: 0.42, speed: 'slow' },
      { preset: 'light-sweep', count: 2, opacity: 0.55, speed: 'slow' },
      { preset: 'glow-dust', count: 18, opacity: 0.58, speed: 'normal' },
    ],
    materialPreset: 'neo-gold', textMotion: 'shimmer', imageMotion: 'cinematic-push', layout: 'portrait-full',
    imageEffects: { contrast: 9, saturation: 0.08, vignette: 0.18, temperature: 5 },
  },
  {
    id: 'neon-night', name: 'Neon Night', width: 320, height: 180,
    background: '#050718', frame: { preset: 'neon', width: 3 },
    decorations: [
      { preset: 'ambient-orbs', count: 6, opacity: 0.5, speed: 'slow' },
      { preset: 'glow-dust', count: 22, opacity: 0.66, speed: 'normal' },
    ],
    materialPreset: 'neo-neon', textMotion: 'chromatic-shake', imageMotion: 'parallax', layout: 'portrait-full',
    imageEffects: { contrast: 13, saturation: 0.22, vignette: 0.28, tint: 7 },
  },
  {
    id: 'purple-glass', name: 'Purple Glass', width: 320, height: 180,
    background: '#100820', frame: { preset: 'cosmic', width: 3 },
    decorations: [
      { preset: 'ambient-orbs', count: 5, opacity: 0.46, speed: 'slow' },
      { preset: 'light-sweep', count: 2, opacity: 0.46, speed: 'normal' },
    ],
    materialPreset: 'neo-purple-glass', textMotion: 'soft-sway', imageMotion: 'depth-tilt', layout: 'portrait-left',
    imageEffects: { saturation: 0.16, contrast: 8, vignette: 0.16, tint: 9 },
  },
  {
    id: 'cyber-blue', name: 'Cyber Blue', width: 360, height: 200,
    background: '#03101d', frame: { preset: 'electric', width: 3 },
    decorations: [
      { preset: 'glow-dust', count: 20, opacity: 0.62, speed: 'fast' },
      { preset: 'light-sweep', count: 2, opacity: 0.5, speed: 'normal' },
    ],
    materialPreset: 'neo-cyber-blue', textMotion: 'glitch-rgb', imageMotion: 'camera-orbit-25d', layout: 'portrait-left',
    imageEffects: { contrast: 15, saturation: 0.18, vignette: 0.24, temperature: -8 },
  },
  {
    id: 'royal-red', name: 'Royal Red', width: 320, height: 180,
    background: '#1a050c', frame: { preset: 'rose-gold', width: 3 },
    decorations: [
      { preset: 'ambient-orbs', count: 4, opacity: 0.38, speed: 'slow' },
      { preset: 'light-sweep', count: 2, opacity: 0.45, speed: 'slow' },
    ],
    materialPreset: 'neo-royal-red', textMotion: 'heartbeat', imageMotion: 'cinematic-push', layout: 'portrait-full',
    imageEffects: { contrast: 12, saturation: 0.18, vignette: 0.24, temperature: 5 },
  },
  {
    id: 'diamond', name: 'Diamond', width: 300, height: 180,
    background: '#07121c', frame: { preset: 'pearls', width: 3 },
    decorations: [
      { preset: 'glow-dust', count: 24, opacity: 0.72, speed: 'normal' },
      { preset: 'light-sweep', count: 3, opacity: 0.5, speed: 'slow' },
      { preset: 'diamonds', count: 7, opacity: 0.5, speed: 'slow' },
    ],
    materialPreset: 'neo-diamond', textMotion: 'shimmer', imageMotion: 'dolly-zoom', layout: 'portrait-full',
    imageEffects: { contrast: 10, saturation: 0.04, vignette: 0.18, temperature: -4 },
  },
  {
    id: 'fire-goddess', name: 'Fire Goddess', width: 320, height: 180,
    background: '#190603', frame: { preset: 'fire', width: 4 },
    decorations: [
      { preset: 'ambient-orbs', count: 4, opacity: 0.34, speed: 'normal' },
      { preset: 'glow-dust', count: 16, opacity: 0.58, speed: 'fast' },
      { preset: 'fire', count: 8, opacity: 0.48, speed: 'normal' },
    ],
    materialPreset: 'neo-fire', textMotion: 'pulse', imageMotion: 'cinematic-push', layout: 'portrait-full',
    imageEffects: { contrast: 14, saturation: 0.25, vignette: 0.25, temperature: 12 },
  },
  {
    id: 'frozen', name: 'Frozen', width: 320, height: 180,
    background: '#061321', frame: { preset: 'ice', width: 3 },
    decorations: [
      { preset: 'ambient-orbs', count: 5, opacity: 0.34, speed: 'slow' },
      { preset: 'glow-dust', count: 20, opacity: 0.58, speed: 'slow' },
      { preset: 'snow', count: 10, opacity: 0.4, speed: 'slow' },
    ],
    materialPreset: 'neo-frozen', textMotion: 'float', imageMotion: 'depth-tilt', layout: 'portrait-full',
    imageEffects: { contrast: 8, saturation: -0.02, vignette: 0.16, temperature: -16 },
  },
  {
    id: 'dark-luxury', name: 'Dark Luxury', width: 320, height: 180,
    background: '#07070a', frame: { preset: 'gold', width: 2 },
    decorations: [
      { preset: 'light-sweep', count: 2, opacity: 0.36, speed: 'slow' },
      { preset: 'glow-dust', count: 12, opacity: 0.36, speed: 'slow' },
    ],
    materialPreset: 'neo-dark-luxury', textMotion: 'soft-sway', imageMotion: 'dolly-zoom', layout: 'portrait-left',
    imageEffects: { contrast: 18, saturation: -0.06, vignette: 0.34 },
  },
  {
    id: 'angel', name: 'Angel', width: 320, height: 180,
    background: '#e9f3fb', frame: { preset: 'minimal-white', width: 3 },
    decorations: [
      { preset: 'ambient-orbs', count: 5, opacity: 0.3, speed: 'slow' },
      { preset: 'glow-dust', count: 22, opacity: 0.5, speed: 'slow' },
    ],
    materialPreset: 'neo-angel', textMotion: 'levitate-25d', imageMotion: 'breathing-zoom', layout: 'portrait-full',
    imageEffects: { contrast: 4, saturation: -0.04, vignette: 0.08, temperature: -3 },
  },
  {
    id: 'dream', name: 'Dream', width: 320, height: 180,
    background: '#100d2a', frame: { preset: 'cosmic', width: 3 },
    decorations: [
      { preset: 'ambient-orbs', count: 7, opacity: 0.42, speed: 'slow' },
      { preset: 'glow-dust', count: 20, opacity: 0.55, speed: 'slow' },
    ],
    materialPreset: 'neo-dream', textMotion: 'float', imageMotion: 'parallax', layout: 'portrait-full',
    imageEffects: { saturation: 0.12, contrast: 6, vignette: 0.18, tint: 7 },
  },
  {
    id: 'fashion-walk', name: 'Fashion Walk', width: 360, height: 200,
    background: '#151214', frame: { preset: 'rose-gold', width: 2 },
    decorations: [
      { preset: 'light-sweep', count: 3, opacity: 0.42, speed: 'normal' },
      { preset: 'glow-dust', count: 10, opacity: 0.32, speed: 'slow' },
    ],
    materialPreset: 'neo-fashion', textMotion: 'rise-fade', imageMotion: 'walk-25d', layout: 'portrait-left',
    imageEffects: { contrast: 10, saturation: -0.02, vignette: 0.2, temperature: 4 },
  },
  {
    id: 'cinematic-portrait', name: 'Cinematic Portrait', width: 360, height: 200,
    background: '#070b10', frame: { preset: 'minimal-white', width: 2 },
    decorations: [
      { preset: 'ambient-orbs', count: 3, opacity: 0.25, speed: 'slow' },
      { preset: 'light-sweep', count: 2, opacity: 0.32, speed: 'slow' },
    ],
    materialPreset: 'neo-cinematic', textMotion: 'rise-fade', imageMotion: 'cinematic-push', layout: 'portrait-full',
    imageEffects: { contrast: 15, saturation: -0.08, vignette: 0.34, temperature: 2 },
  },
  {
    id: 'holographic', name: 'Holographic', width: 320, height: 180,
    background: '#080b1b', frame: { preset: 'rainbow', width: 3 },
    decorations: [
      { preset: 'ambient-orbs', count: 6, opacity: 0.38, speed: 'normal' },
      { preset: 'light-sweep', count: 3, opacity: 0.5, speed: 'normal' },
      { preset: 'glow-dust', count: 18, opacity: 0.5, speed: 'fast' },
    ],
    materialPreset: 'neo-holographic', textMotion: 'shimmer', imageMotion: 'camera-orbit-25d', layout: 'portrait-full',
    imageEffects: { contrast: 10, saturation: 0.22, vignette: 0.18, tint: 5 },
  },
  {
    id: 'chrome-future', name: 'Chrome Future', width: 360, height: 200,
    background: '#05090d', frame: { preset: 'electric', width: 3 },
    decorations: [
      { preset: 'light-sweep', count: 3, opacity: 0.46, speed: 'normal' },
      { preset: 'glow-dust', count: 16, opacity: 0.5, speed: 'normal' },
    ],
    materialPreset: 'neo-chrome-future', textMotion: 'depth-tilt', imageMotion: 'camera-orbit-25d', layout: 'portrait-left',
    imageEffects: { contrast: 16, saturation: -0.12, vignette: 0.3, temperature: -5 },
  },
] as const;

function clampFontSize(height: number, ratio: number): number {
  return Math.max(12, Math.min(108, height * ratio));
}

function fitContain(
  image: ImageElement,
  left: number,
  top: number,
  regionWidth: number,
  regionHeight: number,
): Pick<ImageElement, 'x' | 'y' | 'width' | 'height'> {
  const scale = Math.min(regionWidth / Math.max(1, image.width), regionHeight / Math.max(1, image.height));
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    width,
    height,
    x: left + (regionWidth - width) / 2,
    y: top + (regionHeight - height) / 2,
  };
}

function fitCover(
  image: ImageElement,
  canvasWidth: number,
  canvasHeight: number,
): Pick<ImageElement, 'x' | 'y' | 'width' | 'height'> {
  const scale = Math.max(canvasWidth / Math.max(1, image.width), canvasHeight / Math.max(1, image.height));
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    width,
    height,
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
  };
}

function textGeometry(recipe: NeoSceneRecipe, hasPhoto: boolean): Pick<TextElement, 'x' | 'y' | 'width' | 'height' | 'fontSize'> {
  if (recipe.layout === 'portrait-left' && hasPhoto) {
    return {
      x: recipe.width * 0.48,
      y: recipe.height * 0.18,
      width: recipe.width * 0.48,
      height: recipe.height * 0.64,
      fontSize: clampFontSize(recipe.height, 0.24),
    };
  }

  if (recipe.layout === 'portrait-full' && hasPhoto) {
    return {
      x: recipe.width * 0.08,
      y: recipe.height * 0.66,
      width: recipe.width * 0.84,
      height: recipe.height * 0.25,
      fontSize: clampFontSize(recipe.height, 0.2),
    };
  }

  return {
    x: recipe.width * 0.08,
    y: recipe.height * 0.27,
    width: recipe.width * 0.84,
    height: recipe.height * 0.46,
    fontSize: clampFontSize(recipe.height, 0.3),
  };
}

function makeDefaultText(recipe: NeoSceneRecipe): TextElement {
  const material = getFlashTextMaterial(recipe.materialPreset);
  return {
    id: `neo-${recipe.id}-text`,
    type: 'text',
    name: 'Yazı',
    text: 'NICK',
    writingMode: 'horizontal',
    x: 0,
    y: 0,
    width: recipe.width * 0.84,
    height: recipe.height * 0.46,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    animation: { ...createDefaultAnimation(), preset: recipe.textMotion },
    fontFamily: 'Arial Black',
    fontSize: clampFontSize(recipe.height, 0.3),
    fill: material.fill,
    stroke: material.stroke,
    strokeWidth: material.strokeWidth,
    shadowColor: material.shadowColor,
    shadowBlur: material.shadowBlur,
    align: 'center',
    materialPreset: material.id,
    extrusionDepth: material.extrusionDepth,
    extrusionColor: material.extrusionColor,
  };
}

function styledText(text: TextElement, recipe: NeoSceneRecipe, hasPhoto: boolean): TextElement {
  const material = getFlashTextMaterial(recipe.materialPreset);
  return {
    ...text,
    ...textGeometry(recipe, hasPhoto),
    writingMode: 'horizontal',
    fontFamily: 'Arial Black',
    align: 'center',
    fill: material.fill,
    stroke: material.stroke,
    strokeWidth: material.strokeWidth,
    shadowColor: material.shadowColor,
    shadowBlur: material.shadowBlur,
    materialPreset: material.id,
    extrusionDepth: material.extrusionDepth,
    extrusionColor: material.extrusionColor,
    animation: {
      ...text.animation,
      preset: recipe.textMotion,
      speed: text.animation.speed === 'slow' ? 'slow' : 'normal',
      intensity: 'normal',
      delayMs: 0,
      loop: true,
    },
  };
}

function deterministicDecorations(recipe: NeoSceneRecipe) {
  return recipe.decorations.map((layer, index) => ({
    id: `neo-${recipe.id}-${layer.preset}-${index}`,
    ...layer,
  }));
}

export function getNeoSceneRecipe(id: NeoRecipeId): NeoSceneRecipe {
  const recipe = NEO_SCENE_RECIPES.find((candidate) => candidate.id === id);
  if (!recipe) throw new Error(`Bilinmeyen Neo recipe: ${id}`);
  return recipe;
}

export function applyNeoSceneRecipe(project: Project, recipeId: NeoRecipeId): Project {
  const recipe = getNeoSceneRecipe(recipeId);
  const resized = resizeProjectProportionally(project, recipe.width, recipe.height);
  const hasExistingText = resized.elements.some((element) => element.type === 'text');
  const withText = hasExistingText ? resized.elements : [...resized.elements, makeDefaultText(recipe)];
  const latestImageIndex = withText.reduce(
    (found, element, index) => element.type === 'image' ? index : found,
    -1,
  );
  const hasPhoto = latestImageIndex >= 0;

  const elements = withText.map((element, index) => {
    if (element.type === 'text') return styledText(element, recipe, hasPhoto);
    if (element.type !== 'image' || index !== latestImageIndex) return element;

    const geometry = recipe.layout === 'portrait-left'
      ? fitContain(element, recipe.width * 0.04, recipe.height * 0.06, recipe.width * 0.4, recipe.height * 0.88)
      : fitCover(element, recipe.width, recipe.height);

    return {
      ...element,
      ...geometry,
      animation: {
        ...element.animation,
        preset: recipe.imageMotion,
        speed: 'slow' as const,
        intensity: 'subtle' as const,
        delayMs: 0,
        loop: true,
      },
      effects: {
        ...createDefaultImageEffects(),
        ...element.effects,
        ...(recipe.imageEffects ?? {}),
      },
    };
  });

  return parseProject({
    ...resized,
    mode: 'neo',
    width: recipe.width,
    height: recipe.height,
    background: recipe.background,
    elements,
    decorations: deterministicDecorations(recipe),
    frame: recipe.frame,
    exportSettings: {
      ...resized.exportSettings,
      gifPalette: 'adaptive',
      gifDither: 'none',
    },
  });
}

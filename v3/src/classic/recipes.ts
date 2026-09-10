import {
  createDefaultAnimation,
  createDefaultImageEffects,
  type AnimationPreset,
  type AnimationSpeed,
  type DecorationLayer,
  type DecorationPreset,
  type FrameDefinition,
  type FramePreset,
  type ImageEffects,
  type ImageElement,
  type Project,
  type TextElement,
  type TextMaterialPreset,
} from '../model/project';
import { parseProject } from '../model/schema';
import { resizeProjectProportionally } from '../sizing/project-size';
import { getFlashTextMaterial } from '../text/flash-materials';

export type ClassicRecipeId =
  | 'altin-doner-nick'
  | 'krom-doner-nick'
  | 'mor-bayan-flash'
  | 'kirmizi-kalpli-bayan'
  | 'mavi-erkek-flash'
  | 'sapkali-flash'
  | 'ates-nick'
  | 'turk-bayrakli'
  | 'gotik-siyah'
  | 'glitter-princess'
  | 'cift-nick'
  | 'resimli-doner-nick'
  | 'sinevizyon-portre'
  | 'ask-flash'
  | 'kral-tac-nick';

export type ClassicLayoutFamily = 'nick' | 'portrait-left' | 'portrait-full';

type ClassicDecorationRecipe = {
  preset: DecorationPreset;
  count: number;
  opacity: number;
  speed: AnimationSpeed;
};

export type ClassicSceneRecipe = {
  id: ClassicRecipeId;
  name: string;
  width: number;
  height: number;
  background: string;
  frame: FrameDefinition;
  decorations: readonly ClassicDecorationRecipe[];
  materialPreset: Exclude<TextMaterialPreset, 'flat'>;
  textMotion: AnimationPreset;
  layout: ClassicLayoutFamily;
  imageEffects?: Partial<ImageEffects>;
  gifPalette: 'classic-64' | 'classic-27';
};

export const CLASSIC_SCENE_RECIPES: readonly ClassicSceneRecipe[] = [
  {
    id: 'altin-doner-nick', name: 'Altın Döner Nick', width: 133, height: 33,
    background: '#090704', frame: { preset: 'gold', width: 3 },
    decorations: [{ preset: 'sparkles', count: 8, opacity: 0.82, speed: 'normal' }],
    materialPreset: 'xara-gold', textMotion: 'xara-double-sided', layout: 'nick', gifPalette: 'classic-64',
  },
  {
    id: 'krom-doner-nick', name: 'Krom Döner Nick', width: 133, height: 33,
    background: '#060b12', frame: { preset: 'ice', width: 3 },
    decorations: [{ preset: 'stars', count: 7, opacity: 0.72, speed: 'slow' }],
    materialPreset: 'xara-chrome', textMotion: 'flip-x', layout: 'nick', gifPalette: 'classic-64',
  },
  {
    id: 'mor-bayan-flash', name: 'Mor Bayan Flash', width: 130, height: 95,
    background: '#160520', frame: { preset: 'glitter', width: 4 },
    decorations: [
      { preset: 'sparkles', count: 12, opacity: 0.86, speed: 'normal' },
      { preset: 'butterflies', count: 4, opacity: 0.72, speed: 'slow' },
    ],
    materialPreset: 'xara-purple-glass', textMotion: 'shimmer', layout: 'portrait-left',
    imageEffects: { saturation: 0.22, contrast: 10, vignette: 0.18 }, gifPalette: 'classic-64',
  },
  {
    id: 'kirmizi-kalpli-bayan', name: 'Kırmızı Kalpli Bayan', width: 130, height: 100,
    background: '#21050d', frame: { preset: 'hearts', width: 4 },
    decorations: [
      { preset: 'hearts', count: 14, opacity: 0.84, speed: 'normal' },
      { preset: 'roses', count: 6, opacity: 0.68, speed: 'slow' },
    ],
    materialPreset: 'xara-ruby', textMotion: 'heartbeat', layout: 'portrait-left',
    imageEffects: { saturation: 0.28, contrast: 8, vignette: 0.2 }, gifPalette: 'classic-64',
  },
  {
    id: 'mavi-erkek-flash', name: 'Mavi Erkek Flash', width: 130, height: 95,
    background: '#031426', frame: { preset: 'electric', width: 4 },
    decorations: [
      { preset: 'lightning', count: 5, opacity: 0.72, speed: 'normal' },
      { preset: 'sparkles', count: 8, opacity: 0.64, speed: 'fast' },
    ],
    materialPreset: 'xara-ice', textMotion: 'pulse', layout: 'portrait-left',
    imageEffects: { contrast: 12, saturation: 0.12, vignette: 0.22 }, gifPalette: 'classic-64',
  },
  {
    id: 'sapkali-flash', name: 'Şapkalı Flash', width: 125, height: 75,
    background: '#120b03', frame: { preset: 'gold', width: 4 },
    decorations: [
      { preset: 'crowns', count: 5, opacity: 0.94, speed: 'slow' },
      { preset: 'stars', count: 8, opacity: 0.72, speed: 'normal' },
    ],
    materialPreset: 'xara-gold', textMotion: 'pendulum', layout: 'portrait-full', gifPalette: 'classic-27',
  },
  {
    id: 'ates-nick', name: 'Ateş Nick', width: 120, height: 70,
    background: '#180300', frame: { preset: 'fire', width: 4 },
    decorations: [
      { preset: 'fire', count: 14, opacity: 0.88, speed: 'fast' },
      { preset: 'sparkles', count: 5, opacity: 0.6, speed: 'normal' },
    ],
    materialPreset: 'xara-fire', textMotion: 'pulse', layout: 'nick', gifPalette: 'classic-27',
  },
  {
    id: 'turk-bayrakli', name: 'Türk Bayraklı', width: 130, height: 70,
    background: '#350006', frame: { preset: 'turkish', width: 4 },
    decorations: [
      { preset: 'turkish', count: 5, opacity: 0.9, speed: 'slow' },
      { preset: 'moon-stars', count: 7, opacity: 0.72, speed: 'normal' },
    ],
    materialPreset: 'xara-ruby', textMotion: 'shimmer', layout: 'nick', gifPalette: 'classic-27',
  },
  {
    id: 'gotik-siyah', name: 'Gotik Siyah', width: 120, height: 70,
    background: '#030303', frame: { preset: 'minimal-white', width: 2 },
    decorations: [
      { preset: 'smoke', count: 8, opacity: 0.58, speed: 'slow' },
      { preset: 'lightning', count: 3, opacity: 0.58, speed: 'slow' },
    ],
    materialPreset: 'xara-chrome', textMotion: 'pendulum', layout: 'nick', gifPalette: 'classic-27',
  },
  {
    id: 'glitter-princess', name: 'Glitter Princess', width: 130, height: 100,
    background: '#25082e', frame: { preset: 'glitter', width: 5 },
    decorations: [
      { preset: 'sparkles', count: 18, opacity: 0.92, speed: 'fast' },
      { preset: 'diamonds', count: 7, opacity: 0.76, speed: 'normal' },
      { preset: 'crowns', count: 3, opacity: 0.84, speed: 'slow' },
    ],
    materialPreset: 'xara-purple-glass', textMotion: 'shimmer', layout: 'portrait-full',
    imageEffects: { saturation: 0.3, vignette: 0.14 }, gifPalette: 'classic-64',
  },
  {
    id: 'cift-nick', name: 'Çift Nick', width: 133, height: 33,
    background: '#07020d', frame: { preset: 'neon', width: 3 },
    decorations: [{ preset: 'sparkles', count: 8, opacity: 0.86, speed: 'normal' }],
    materialPreset: 'xara-purple-glass', textMotion: 'xara-double-sided', layout: 'nick', gifPalette: 'classic-64',
  },
  {
    id: 'resimli-doner-nick', name: 'Resimli Döner Nick', width: 300, height: 100,
    background: '#07101b', frame: { preset: 'neon', width: 5 },
    decorations: [
      { preset: 'sparkles', count: 12, opacity: 0.78, speed: 'normal' },
      { preset: 'stars', count: 7, opacity: 0.68, speed: 'slow' },
    ],
    materialPreset: 'xara-chrome', textMotion: 'xara-double-sided', layout: 'portrait-left',
    imageEffects: { contrast: 8, saturation: 0.12 }, gifPalette: 'classic-64',
  },
  {
    id: 'sinevizyon-portre', name: 'Sinevizyon Portre', width: 130, height: 100,
    background: '#05080f', frame: { preset: 'cosmic', width: 4 },
    decorations: [
      { preset: 'sparkles', count: 10, opacity: 0.72, speed: 'slow' },
      { preset: 'smoke', count: 5, opacity: 0.42, speed: 'slow' },
    ],
    materialPreset: 'xara-ice', textMotion: 'slow-pan', layout: 'portrait-full',
    imageEffects: { contrast: 10, saturation: 0.16, vignette: 0.28 }, gifPalette: 'classic-64',
  },
  {
    id: 'ask-flash', name: 'Aşk Flash', width: 125, height: 75,
    background: '#250615', frame: { preset: 'love-neon', width: 4 },
    decorations: [
      { preset: 'hearts', count: 15, opacity: 0.88, speed: 'normal' },
      { preset: 'roses', count: 5, opacity: 0.7, speed: 'slow' },
    ],
    materialPreset: 'xara-ruby', textMotion: 'heartbeat', layout: 'portrait-full',
    imageEffects: { saturation: 0.24, vignette: 0.18 }, gifPalette: 'classic-27',
  },
  {
    id: 'kral-tac-nick', name: 'Kral / Taç Nick', width: 130, height: 70,
    background: '#160e02', frame: { preset: 'gold', width: 5 },
    decorations: [
      { preset: 'crowns', count: 5, opacity: 0.94, speed: 'slow' },
      { preset: 'stars', count: 9, opacity: 0.78, speed: 'normal' },
      { preset: 'diamonds', count: 5, opacity: 0.68, speed: 'slow' },
    ],
    materialPreset: 'xara-gold', textMotion: 'shimmer', layout: 'nick', gifPalette: 'classic-64',
  },
] as const;

function clampFontSize(height: number, ratio: number): number {
  return Math.max(10, Math.min(92, height * ratio));
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

function textGeometry(recipe: ClassicSceneRecipe, hasPhoto: boolean): Pick<TextElement, 'x' | 'y' | 'width' | 'height' | 'fontSize'> {
  if (recipe.layout === 'portrait-left' && hasPhoto) {
    const x = recipe.width * 0.45;
    return {
      x,
      y: recipe.height * 0.08,
      width: recipe.width * 0.52,
      height: recipe.height * 0.84,
      fontSize: clampFontSize(recipe.height, 0.34),
    };
  }

  if (recipe.layout === 'portrait-full' && hasPhoto) {
    return {
      x: recipe.width * 0.05,
      y: recipe.height * 0.56,
      width: recipe.width * 0.9,
      height: recipe.height * 0.37,
      fontSize: clampFontSize(recipe.height, 0.29),
    };
  }

  return {
    x: recipe.width * 0.03,
    y: recipe.height * 0.06,
    width: recipe.width * 0.94,
    height: recipe.height * 0.88,
    fontSize: clampFontSize(recipe.height, 0.66),
  };
}

function makeDefaultText(recipe: ClassicSceneRecipe): TextElement {
  const material = getFlashTextMaterial(recipe.materialPreset);
  return {
    id: `classic-${recipe.id}-text`,
    type: 'text',
    name: 'Yazı',
    text: 'NICK',
    writingMode: 'horizontal',
    x: 0,
    y: 0,
    width: Math.max(1, recipe.width * 0.94),
    height: Math.max(1, recipe.height * 0.88),
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    animation: { ...createDefaultAnimation(), preset: recipe.textMotion },
    fontFamily: 'Impact',
    fontSize: clampFontSize(recipe.height, 0.66),
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

function styledText(text: TextElement, recipe: ClassicSceneRecipe, hasPhoto: boolean): TextElement {
  const material = getFlashTextMaterial(recipe.materialPreset);
  return {
    ...text,
    ...textGeometry(recipe, hasPhoto),
    writingMode: 'horizontal',
    fontFamily: 'Impact',
    fill: material.fill,
    stroke: material.stroke,
    strokeWidth: material.strokeWidth,
    shadowColor: material.shadowColor,
    shadowBlur: material.shadowBlur,
    align: 'center',
    materialPreset: material.id,
    extrusionDepth: material.extrusionDepth,
    extrusionColor: material.extrusionColor,
    animation: {
      ...text.animation,
      preset: recipe.textMotion,
      speed: 'normal',
      intensity: 'normal',
      delayMs: 0,
      loop: true,
    },
  };
}

function deterministicDecorations(recipe: ClassicSceneRecipe): DecorationLayer[] {
  return recipe.decorations.map((decoration, index) => ({
    id: `classic-${recipe.id}-${index}`,
    preset: decoration.preset,
    count: decoration.count,
    opacity: decoration.opacity,
    speed: decoration.speed,
  }));
}

export function getClassicSceneRecipe(id: ClassicRecipeId): ClassicSceneRecipe {
  const recipe = CLASSIC_SCENE_RECIPES.find((candidate) => candidate.id === id);
  if (!recipe) throw new Error(`Bilinmeyen Classic recipe: ${id}`);
  return recipe;
}

export function applyClassicSceneRecipe(project: Project, recipeId: ClassicRecipeId): Project {
  const recipe = getClassicSceneRecipe(recipeId);
  const resized = resizeProjectProportionally(project, recipe.width, recipe.height);
  const hasExistingText = resized.elements.some((element) => element.type === 'text');
  const withText = hasExistingText ? resized.elements : [...resized.elements, makeDefaultText(recipe)];
  const latestImageIndex = withText.reduce((found, element, index) => element.type === 'image' ? index : found, -1);
  const hasPhoto = latestImageIndex >= 0;

  const elements = withText.map((element, index) => {
    if (element.type === 'text') return styledText(element, recipe, hasPhoto);
    if (element.type !== 'image' || index !== latestImageIndex) return element;

    const geometry = recipe.layout === 'portrait-left'
      ? fitContain(element, recipe.width * 0.02, recipe.height * 0.03, recipe.width * 0.4, recipe.height * 0.94)
      : recipe.layout === 'portrait-full'
        ? fitCover(element, recipe.width, recipe.height)
        : fitContain(element, recipe.width * 0.08, recipe.height * 0.1, recipe.width * 0.84, recipe.height * 0.8);

    return {
      ...element,
      ...geometry,
      effects: {
        ...createDefaultImageEffects(),
        ...element.effects,
        ...(recipe.imageEffects ?? {}),
      },
    };
  });

  return parseProject({
    ...resized,
    width: recipe.width,
    height: recipe.height,
    background: recipe.background,
    elements,
    decorations: deterministicDecorations(recipe),
    frame: recipe.frame,
    exportSettings: {
      ...resized.exportSettings,
      gifPalette: recipe.gifPalette,
      gifDither: 'ordered-4x4',
    },
  });
}

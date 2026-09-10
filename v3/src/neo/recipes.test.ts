import { describe, expect, it } from 'vitest';
import {
  createDefaultAnimation,
  createDefaultImageEffects,
  createEmptyProject,
  type ImageElement,
  type TextElement,
} from '../model/project';
import { parseProject } from '../model/schema';
import { NEO_SCENE_RECIPES, applyNeoSceneRecipe } from './recipes';

const NEO_NAMES = [
  'Golden Queen',
  'Neon Night',
  'Purple Glass',
  'Cyber Blue',
  'Royal Red',
  'Diamond',
  'Fire Goddess',
  'Frozen',
  'Dark Luxury',
  'Angel',
  'Dream',
  'Fashion Walk',
  'Cinematic Portrait',
  'Holographic',
  'Chrome Future',
] as const;

function fixtureProject() {
  const project = createEmptyProject();
  const image: ImageElement = {
    id: 'photo-stable',
    type: 'image',
    name: 'Photo',
    assetUrl: 'blob:portrait-stable',
    x: 20,
    y: 20,
    width: 220,
    height: 280,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    animation: createDefaultAnimation(),
    effects: createDefaultImageEffects(),
  };
  const text: TextElement = {
    id: 'text-stable',
    type: 'text',
    name: 'Nick',
    text: 'SENOL',
    writingMode: 'horizontal',
    x: 30,
    y: 230,
    width: 240,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    animation: createDefaultAnimation(),
    fontFamily: 'Arial',
    fontSize: 44,
    fill: '#ffffff',
    stroke: '#111827',
    strokeWidth: 1,
    shadowColor: '#000000',
    shadowBlur: 5,
    align: 'center',
  };
  return { ...project, elements: [image, text] };
}

describe('Neo scene recipes', () => {
  it('ships exactly the 15 approved unique recipes', () => {
    expect(NEO_SCENE_RECIPES.map((recipe) => recipe.name)).toEqual(NEO_NAMES);
    expect(new Set(NEO_SCENE_RECIPES.map((recipe) => recipe.id)).size).toBe(15);
  });

  it('gives every recipe a dedicated Neo material and a modern ambient/light layer', () => {
    for (const recipe of NEO_SCENE_RECIPES) {
      expect(String(recipe.materialPreset).startsWith('neo-')).toBe(true);
      expect(recipe.decorations.some((layer) =>
        ['ambient-orbs', 'glow-dust', 'light-sweep'].includes(layer.preset),
      )).toBe(true);
      expect(recipe.textMotion).not.toBe('none');
      expect(recipe.imageMotion).not.toBe('none');
    }
  });

  it('applies a full Neo composition while preserving existing photo/text identity and content', () => {
    const source = fixtureProject();
    const result = applyNeoSceneRecipe(source, 'cinematic-portrait');
    const image = result.elements.find(
      (element): element is ImageElement => element.id === 'photo-stable' && element.type === 'image',
    );
    const text = result.elements.find(
      (element): element is TextElement => element.id === 'text-stable' && element.type === 'text',
    );

    expect(parseProject(result)).toEqual(result);
    expect(result.mode).toBe('neo');
    expect(result.exportSettings.gifPalette).toBe('adaptive');
    expect(result.exportSettings.gifDither).toBe('none');
    expect(result.elements.map((element) => element.id)).toEqual(['photo-stable', 'text-stable']);
    expect(image?.assetUrl).toBe('blob:portrait-stable');
    expect(text?.text).toBe('SENOL');
    expect(result.decorations.length).toBeGreaterThanOrEqual(1);
    expect(result.decorations.length).toBeLessThanOrEqual(3);
  });

  it('promotes portrait-left Neo photos to subject layers for cutout motion', () => {
    const result = applyNeoSceneRecipe(fixtureProject(), 'fashion-walk');
    const image = result.elements.find(
      (element): element is ImageElement => element.id === 'photo-stable' && element.type === 'image',
    );

    expect(image).toMatchObject({
      role: 'subject',
      animation: { preset: 'walk-25d', speed: 'slow', intensity: 'subtle' },
    });
  });

  it('creates a usable default nick when a project has no text', () => {
    const source = createEmptyProject();
    const result = applyNeoSceneRecipe(source, 'golden-queen');
    const text = result.elements.find(
      (element): element is TextElement => element.type === 'text',
    );

    expect(text?.text).toBe('NICK');
    expect(text?.materialPreset).toBe('neo-gold');
  });
});

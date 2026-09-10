import { describe, expect, it } from 'vitest';
import {
  createDefaultAnimation,
  createDefaultImageEffects,
  createEmptyProject,
  type ImageElement,
  type Project,
} from '../model/project';
import { parseProject } from '../model/schema';
import { CLASSIC_HISTORICAL_SIZES } from './historical-sizes';
import { applyClassicSceneRecipe, CLASSIC_SCENE_RECIPES } from './recipes';

const APPROVED_NAMES = [
  'Altın Döner Nick',
  'Krom Döner Nick',
  'Mor Bayan Flash',
  'Kırmızı Kalpli Bayan',
  'Mavi Erkek Flash',
  'Şapkalı Flash',
  'Ateş Nick',
  'Türk Bayraklı',
  'Gotik Siyah',
  'Glitter Princess',
  'Çift Nick',
  'Resimli Döner Nick',
  'Sinevizyon Portre',
  'Aşk Flash',
  'Kral / Taç Nick',
] as const;

function projectWithPhoto(): Project {
  const project = createEmptyProject();
  const image: ImageElement = {
    id: 'photo-1',
    type: 'image',
    name: 'Fotoğraf',
    assetUrl: 'blob:classic-photo',
    x: 40,
    y: 50,
    width: 200,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    animation: createDefaultAnimation(),
    effects: createDefaultImageEffects(),
  };
  return { ...project, elements: [image] };
}

describe('Classic SesliChat scene recipes', () => {
  it('ships exactly the 15 approved recipe names in a stable order', () => {
    expect(CLASSIC_SCENE_RECIPES.map((recipe) => recipe.name)).toEqual(APPROVED_NAMES);
    expect(new Set(CLASSIC_SCENE_RECIPES.map((recipe) => recipe.id)).size).toBe(15);
  });

  it('uses only approved historical sizes and 1-3 deterministic particle layers', () => {
    const approvedSizes = new Set(
      CLASSIC_HISTORICAL_SIZES.map(({ width, height }) => `${width}x${height}`),
    );

    for (const recipe of CLASSIC_SCENE_RECIPES) {
      expect(approvedSizes.has(`${recipe.width}x${recipe.height}`)).toBe(true);
      expect(recipe.decorations.length).toBeGreaterThanOrEqual(1);
      expect(recipe.decorations.length).toBeLessThanOrEqual(3);
      expect(['nick', 'portrait-left', 'portrait-full']).toContain(recipe.layout);
      expect(recipe.materialPreset).toMatch(/^xara-/);
    }
  });

  it('applies every recipe as a schema-valid project and deterministically replaces Classic decoration composition', () => {
    for (const recipe of CLASSIC_SCENE_RECIPES) {
      const source = projectWithPhoto();
      const first = applyClassicSceneRecipe(source, recipe.id);
      const second = applyClassicSceneRecipe(source, recipe.id);

      expect(parseProject(first)).toEqual(first);
      expect(first.width).toBe(recipe.width);
      expect(first.height).toBe(recipe.height);
      expect(first.decorations).toEqual(second.decorations);
      expect(first.frame).toEqual(recipe.frame);
      expect(first.exportSettings.gifPalette).toMatch(/^classic-/);
      expect(first.exportSettings.gifDither).toBe('ordered-4x4');
    }
  });

  it('preserves existing photo identity/assets while laying out the latest photo', () => {
    const source = projectWithPhoto();
    const result = applyClassicSceneRecipe(source, 'resimli-doner-nick');
    const photo = result.elements.find((element) => element.id === 'photo-1');

    expect(photo).toMatchObject({
      id: 'photo-1',
      type: 'image',
      assetUrl: 'blob:classic-photo',
    });
    expect(source.elements[0]).toMatchObject({ x: 40, y: 50, width: 200, height: 100 });
  });

  it('creates one default NICK only when no text exists and styles it as Text3D source data', () => {
    const source = projectWithPhoto();
    const result = applyClassicSceneRecipe(source, 'altin-doner-nick');
    const texts = result.elements.filter((element) => element.type === 'text');

    expect(texts).toHaveLength(1);
    expect(texts[0]).toMatchObject({
      text: 'NICK',
      materialPreset: 'xara-gold',
      animation: { preset: 'xara-double-sided' },
    });

    const reapplied = applyClassicSceneRecipe(result, 'krom-doner-nick');
    expect(reapplied.elements.filter((element) => element.type === 'text')).toHaveLength(1);
  });
});

import Konva from 'konva';
import { describe, expect, it } from 'vitest';
import { createDefaultImageEffects } from '../model/project';
import { buildImageEffectRenderPlan } from './image-effects';

function onePixel(r = 100, g = 100, b = 100): ImageData {
  return {
    data: new Uint8ClampedArray([r, g, b, 255]),
    width: 1,
    height: 1,
    colorSpace: 'srgb',
  } as ImageData;
}

describe('image effect render plan', () => {
  it('keeps neutral effects uncached and filter-free', () => {
    const plan = buildImageEffectRenderPlan(createDefaultImageEffects());

    expect(plan.filters).toEqual([]);
    expect(plan.attrs).toEqual({});
    expect(plan.requiresCache).toBe(false);
    expect(plan.cacheKey).toBeTruthy();
  });

  it('uses Konva 10 Brightness with a CSS-like multiplier', () => {
    const effects = createDefaultImageEffects();
    effects.brightness = 0.25;

    const plan = buildImageEffectRenderPlan(effects);

    expect(plan.filters).toEqual([Konva.Filters.Brightness]);
    expect(plan.filters).not.toContain(Konva.Filters.Brighten);
    expect(plan.attrs).toMatchObject({ brightness: 1.25 });
    expect(plan.requiresCache).toBe(true);
  });

  it('builds advanced filters in one stable deterministic order', () => {
    const effects = {
      ...createDefaultImageEffects(),
      brightness: 0.2,
      contrast: 20,
      saturation: 0.5,
      hue: -45,
      blurRadius: 4,
      grayscale: true,
      sepia: true,
      enhance: 0.3,
      emboss: 0.4,
      invert: true,
      noise: 0.2,
      pixelate: 5,
      posterize: 0.6,
      solarize: true,
      threshold: 0.5,
    };

    const plan = buildImageEffectRenderPlan(effects);

    expect(plan.filters).toHaveLength(14);
    expect(plan.filters.slice(0, 9)).toEqual([
      Konva.Filters.Brightness,
      Konva.Filters.Contrast,
      Konva.Filters.HSL,
      Konva.Filters.Blur,
      Konva.Filters.Grayscale,
      Konva.Filters.Sepia,
      Konva.Filters.Enhance,
      Konva.Filters.Emboss,
      Konva.Filters.Invert,
    ]);
    expect(plan.filters[9]).not.toBe(Konva.Filters.Noise);
    expect(plan.filters.slice(10)).toEqual([
      Konva.Filters.Pixelate,
      Konva.Filters.Posterize,
      Konva.Filters.Solarize,
      Konva.Filters.Threshold,
    ]);
    expect(plan.attrs).toMatchObject({
      brightness: 1.2,
      contrast: 20,
      saturation: 0.5,
      hue: 315,
      luminance: 0,
      blurRadius: 4,
      enhance: 0.3,
      embossStrength: 0.4,
      embossWhiteLevel: 0.5,
      embossDirection: 'top-left',
      embossBlend: true,
      pixelSize: 5,
      levels: 0.6,
      threshold: 0.5,
    });
  });

  it('applies temperature and tint with a deterministic custom pixel filter', () => {
    const effects = {
      ...createDefaultImageEffects(),
      temperature: 50,
      tint: 40,
    };
    const plan = buildImageEffectRenderPlan(effects);
    const imageData = onePixel();

    expect(plan.filters).toHaveLength(1);
    plan.filters[0](imageData);

    expect(Array.from(imageData.data)).not.toEqual([100, 100, 100, 255]);
    expect(imageData.data[0]).toBeGreaterThan(100);
    expect(imageData.data[1]).toBeLessThan(100);
    expect(imageData.data[2]).toBeGreaterThan(0);
    expect(imageData.data[3]).toBe(255);
  });

  it('uses deterministic noise instead of Konva random noise', () => {
    const effects = {
      ...createDefaultImageEffects(),
      noise: 0.5,
    };
    const firstPlan = buildImageEffectRenderPlan(effects);
    const secondPlan = buildImageEffectRenderPlan(effects);
    const first = onePixel(120, 90, 70);
    const second = onePixel(120, 90, 70);

    expect(firstPlan.filters).toHaveLength(1);
    expect(firstPlan.filters[0]).not.toBe(Konva.Filters.Noise);

    firstPlan.filters[0](first);
    secondPlan.filters[0](second);

    expect(Array.from(first.data)).toEqual(Array.from(second.data));
    expect(Array.from(first.data)).not.toEqual([120, 90, 70, 255]);
  });

  it('changes cacheKey when a pixel-affecting setting changes', () => {
    const neutral = createDefaultImageEffects();
    const changed = { ...neutral, contrast: 10 };

    expect(buildImageEffectRenderPlan(neutral).cacheKey).not.toBe(
      buildImageEffectRenderPlan(changed).cacheKey,
    );
  });
});

import Konva from 'konva';
import type { ImageEffects } from '../model/project';

type ImageFilter = (imageData: ImageData) => void;

export type ImageEffectRenderOverrides = {
  hueShift?: number;
  blurAmount?: number;
  pixelateAmount?: number;
};

export type ImageEffectRenderPlan = {
  filters: ImageFilter[];
  attrs: Record<string, number | boolean | string>;
  requiresCache: boolean;
  cacheKey: string;
};

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function deterministicUnit(seed: number): number {
  let value = seed >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

function createTemperatureTintFilter(temperature: number, tint: number): ImageFilter {
  const warmth = (temperature / 100) * 64;
  const magenta = (tint / 100) * 48;

  return (imageData) => {
    const { data } = imageData;
    for (let index = 0; index < data.length; index += 4) {
      data[index] = clampByte(data[index] + warmth + magenta * 0.5);
      data[index + 1] = clampByte(data[index + 1] - magenta);
      data[index + 2] = clampByte(data[index + 2] - warmth + magenta * 0.5);
    }
  };
}

function createDeterministicNoiseFilter(amount: number): ImageFilter {
  const amplitude = amount * 255;

  return (imageData) => {
    const { data } = imageData;
    for (let index = 0; index < data.length; index += 4) {
      const pixel = index / 4;
      data[index] = clampByte(data[index] + (deterministicUnit(pixel * 3 + 1) - 0.5) * amplitude);
      data[index + 1] = clampByte(data[index + 1] + (deterministicUnit(pixel * 3 + 2) - 0.5) * amplitude);
      data[index + 2] = clampByte(data[index + 2] + (deterministicUnit(pixel * 3 + 3) - 0.5) * amplitude);
    }
  };
}

function createVignetteFilter(amount: number): ImageFilter {
  const strength = Math.max(0, Math.min(1, amount)) * 0.88;

  return (imageData) => {
    const { data, width, height } = imageData;
    const centerX = Math.max(1, width - 1) / 2;
    const centerY = Math.max(1, height - 1) / 2;

    for (let y = 0; y < height; y += 1) {
      const normalizedY = (y - centerY) / Math.max(centerY, 1);
      for (let x = 0; x < width; x += 1) {
        const normalizedX = (x - centerX) / Math.max(centerX, 1);
        const distance = Math.min(1, Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY) / Math.SQRT2);
        const edge = Math.max(0, (distance - 0.28) / 0.72);
        const factor = 1 - strength * Math.pow(edge, 1.7);
        const index = (y * width + x) * 4;
        data[index] = clampByte(data[index] * factor);
        data[index + 1] = clampByte(data[index + 1] * factor);
        data[index + 2] = clampByte(data[index + 2] * factor);
      }
    }
  };
}

function asImageFilter(filter: unknown): ImageFilter {
  return filter as ImageFilter;
}

export function buildImageEffectRenderPlan(
  effects: ImageEffects,
  overrides: ImageEffectRenderOverrides = {},
): ImageEffectRenderPlan {
  const filters: ImageFilter[] = [];
  const attrs: Record<string, number | boolean | string> = {};
  const effectiveHue = effects.hue + (overrides.hueShift ?? 0);
  const effectiveBlur = Math.max(0, effects.blurRadius + (overrides.blurAmount ?? 0));
  const effectivePixelate = Math.max(0, effects.pixelate + (overrides.pixelateAmount ?? 0));

  if (effects.brightness !== 0) {
    filters.push(asImageFilter(Konva.Filters.Brightness));
    attrs.brightness = 1 + effects.brightness;
  }

  if (effects.contrast !== 0) {
    filters.push(asImageFilter(Konva.Filters.Contrast));
    attrs.contrast = effects.contrast;
  }

  if (effectiveHue !== 0 || effects.saturation !== 0) {
    filters.push(asImageFilter(Konva.Filters.HSL));
    attrs.hue = normalizeHue(effectiveHue);
    attrs.saturation = effects.saturation;
    attrs.luminance = 0;
  }

  if (effects.temperature !== 0 || effects.tint !== 0) {
    filters.push(createTemperatureTintFilter(effects.temperature, effects.tint));
  }

  if (effects.vignette > 0) {
    filters.push(createVignetteFilter(effects.vignette));
  }

  if (effectiveBlur > 0) {
    filters.push(asImageFilter(Konva.Filters.Blur));
    attrs.blurRadius = effectiveBlur;
  }

  if (effects.grayscale) filters.push(asImageFilter(Konva.Filters.Grayscale));
  if (effects.sepia) filters.push(asImageFilter(Konva.Filters.Sepia));

  if (effects.enhance !== 0) {
    filters.push(asImageFilter(Konva.Filters.Enhance));
    attrs.enhance = effects.enhance;
  }

  if (effects.emboss > 0) {
    filters.push(asImageFilter(Konva.Filters.Emboss));
    attrs.embossStrength = effects.emboss;
    attrs.embossWhiteLevel = 0.5;
    attrs.embossDirection = 'top-left';
    attrs.embossBlend = true;
  }

  if (effects.invert) filters.push(asImageFilter(Konva.Filters.Invert));

  if (effects.noise > 0) {
    filters.push(createDeterministicNoiseFilter(effects.noise));
  }

  if (effectivePixelate > 0) {
    filters.push(asImageFilter(Konva.Filters.Pixelate));
    attrs.pixelSize = Math.max(1, Math.round(effectivePixelate));
  }

  if (effects.posterize > 0) {
    filters.push(asImageFilter(Konva.Filters.Posterize));
    attrs.levels = effects.posterize;
  }

  if (effects.solarize) filters.push(asImageFilter(Konva.Filters.Solarize));

  if (effects.threshold > 0) {
    filters.push(asImageFilter(Konva.Filters.Threshold));
    attrs.threshold = effects.threshold;
  }

  const cacheKey = JSON.stringify([
    effects.brightness,
    effects.contrast,
    effects.saturation,
    effectiveBlur,
    effects.grayscale,
    effects.sepia,
    effectiveHue,
    effects.temperature,
    effects.tint,
    effects.enhance,
    effects.emboss,
    effects.invert,
    effects.noise,
    effectivePixelate,
    effects.posterize,
    effects.solarize,
    effects.threshold,
    effects.vignette,
  ]);

  return {
    filters,
    attrs,
    requiresCache: filters.length > 0,
    cacheKey,
  };
}

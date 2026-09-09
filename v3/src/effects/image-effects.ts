import Konva from 'konva';
import type { ImageEffects } from '../model/project';

type ImageFilter = (imageData: ImageData) => void;

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

function asImageFilter(filter: unknown): ImageFilter {
  return filter as ImageFilter;
}

export function buildImageEffectRenderPlan(effects: ImageEffects): ImageEffectRenderPlan {
  const filters: ImageFilter[] = [];
  const attrs: Record<string, number | boolean | string> = {};

  if (effects.brightness !== 0) {
    filters.push(asImageFilter(Konva.Filters.Brightness));
    attrs.brightness = 1 + effects.brightness;
  }

  if (effects.contrast !== 0) {
    filters.push(asImageFilter(Konva.Filters.Contrast));
    attrs.contrast = effects.contrast;
  }

  if (effects.hue !== 0 || effects.saturation !== 0) {
    filters.push(asImageFilter(Konva.Filters.HSL));
    attrs.hue = normalizeHue(effects.hue);
    attrs.saturation = effects.saturation;
    attrs.luminance = 0;
  }

  if (effects.temperature !== 0 || effects.tint !== 0) {
    filters.push(createTemperatureTintFilter(effects.temperature, effects.tint));
  }

  if (effects.blurRadius > 0) {
    filters.push(asImageFilter(Konva.Filters.Blur));
    attrs.blurRadius = effects.blurRadius;
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
    filters.push(asImageFilter(Konva.Filters.Noise));
    attrs.noise = effects.noise;
  }

  if (effects.pixelate > 0) {
    filters.push(asImageFilter(Konva.Filters.Pixelate));
    attrs.pixelSize = Math.max(1, Math.round(effects.pixelate));
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
    effects.blurRadius,
    effects.grayscale,
    effects.sepia,
    effects.hue,
    effects.temperature,
    effects.tint,
    effects.enhance,
    effects.emboss,
    effects.invert,
    effects.noise,
    effects.pixelate,
    effects.posterize,
    effects.solarize,
    effects.threshold,
  ]);

  return {
    filters,
    attrs,
    requiresCache: filters.length > 0,
    cacheKey,
  };
}

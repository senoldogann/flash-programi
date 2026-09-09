import type { AnimationSpeed, DecorationLayer, DecorationPreset } from '../model/project';

export type DecorationPresetDefinition = {
  id: DecorationPreset;
  label: string;
  symbol: string;
  color: string;
};

export type DecorationPoint = {
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  symbol: string;
  color: string;
};

export const DECORATION_PRESETS: DecorationPresetDefinition[] = [
  { id: 'stars', label: 'Yıldız', symbol: '★', color: '#ffd34e' },
  { id: 'hearts', label: 'Kalp', symbol: '♥', color: '#ff5b8d' },
  { id: 'sparkles', label: 'Parıltı', symbol: '✦', color: '#fff7c2' },
  { id: 'snow', label: 'Kar', symbol: '❄', color: '#c8f3ff' },
  { id: 'bubbles', label: 'Baloncuk', symbol: '○', color: '#90e7ff' },
  { id: 'confetti', label: 'Konfeti', symbol: '◆', color: '#b696ff' },
  { id: 'flowers', label: 'Çiçek', symbol: '✿', color: '#ff94cd' },
  { id: 'butterflies', label: 'Kelebek', symbol: '🦋', color: '#b99cff' },
  { id: 'fire', label: 'Ateş', symbol: '🔥', color: '#ff6a3d' },
  { id: 'lightning', label: 'Şimşek', symbol: '⚡', color: '#ffe14d' },
  { id: 'turkish', label: 'Türk Bayrağı', symbol: '🇹🇷', color: '#ffffff' },
];

const SPEED_FACTOR: Record<AnimationSpeed, number> = {
  slow: 0.55,
  normal: 1,
  fast: 1.7,
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(seed: number): number {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

export function decorationNeedsClock(layer: DecorationLayer): boolean {
  return ['snow', 'bubbles', 'confetti', 'butterflies', 'fire', 'lightning', 'sparkles'].includes(layer.preset);
}

export function decorationPoints(
  layer: DecorationLayer,
  width: number,
  height: number,
  timeMs: number,
): DecorationPoint[] {
  const preset = DECORATION_PRESETS.find((item) => item.id === layer.preset) ?? DECORATION_PRESETS[0];
  const speed = SPEED_FACTOR[layer.speed];

  return Array.from({ length: layer.count }, (_, index) => {
    const seed = hashString(`${layer.id}:${index}`);
    const ux = unit(seed);
    const uy = unit(seed + 17);
    const us = unit(seed + 31);
    const ur = unit(seed + 47);
    const up = unit(seed + 61);
    const phase = timeMs / 1000 + up * Math.PI * 2;
    let x = ux * width;
    let y = uy * height;
    let rotation = ur * 360;

    if (layer.preset === 'snow') {
      y = positiveModulo(y + timeMs * 0.018 * speed, height);
      x += Math.sin(phase) * 5;
    } else if (layer.preset === 'bubbles') {
      y = positiveModulo(y - timeMs * 0.015 * speed, height);
      x += Math.sin(phase * 0.8) * 4;
    } else if (layer.preset === 'confetti') {
      y = positiveModulo(y + timeMs * 0.022 * speed, height);
      rotation += timeMs * 0.08 * speed;
    } else if (layer.preset === 'butterflies') {
      x = positiveModulo(x + timeMs * 0.012 * speed, width);
      y += Math.sin(phase * 2) * 8;
      rotation = Math.sin(phase) * 15;
    } else if (layer.preset === 'fire') {
      y = height - positiveModulo((1 - uy) * height * 0.38 + timeMs * 0.02 * speed, height * 0.4);
      x += Math.sin(phase * 2) * 3;
    } else if (layer.preset === 'lightning') {
      rotation = -15 + ur * 30;
    } else if (layer.preset === 'sparkles') {
      rotation += timeMs * 0.04 * speed;
    }

    const twinkle = 0.68 + Math.abs(Math.sin(phase * 1.7)) * 0.32;

    return {
      x,
      y,
      size: 11 + us * 15,
      rotation,
      opacity: layer.opacity * twinkle,
      symbol: preset.symbol,
      color: preset.color,
    };
  });
}

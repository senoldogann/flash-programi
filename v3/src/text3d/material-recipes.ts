import type { TextElement, TextMaterialPreset } from '../model/project';
import type {
  Text3DGradientStopV3,
  Text3DStyleV3,
  Text3DSurfaceV3,
} from '../model/v3/project-v3';
import { getFlashTextMaterial } from '../text/flash-materials';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function materialMetallicity(preset: TextMaterialPreset | undefined): number {
  switch (preset) {
    case 'xara-chrome':
      return 0.95;
    case 'xara-gold':
      return 0.8;
    case 'xara-purple-glass':
      return 0.68;
    case 'xara-ice':
      return 0.62;
    case 'xara-ruby':
    case 'xara-emerald':
    case 'xara-fire':
      return 0.58;
    case 'flat':
    default:
      return 0.12;
  }
}

function legacyGradientToStops(values: Array<string | number>): Text3DGradientStopV3[] {
  const stops: Text3DGradientStopV3[] = [];
  for (let index = 0; index + 1 < values.length; index += 2) {
    const offset = values[index];
    const color = values[index + 1];
    if (typeof offset !== 'number' || !Number.isFinite(offset) || typeof color !== 'string') continue;
    stops.push({ offset: clamp01(offset), color });
  }
  return stops.sort((left, right) => left.offset - right.offset).slice(0, 16);
}

function darkenHexColor(color: string, factor: number): string {
  const normalized = /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : null;
  if (!normalized) return color;

  const red = Math.round(Number.parseInt(normalized.slice(0, 2), 16) * factor);
  const green = Math.round(Number.parseInt(normalized.slice(2, 4), 16) * factor);
  const blue = Math.round(Number.parseInt(normalized.slice(4, 6), 16) * factor);
  const hex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
  return `#${hex(red)}${hex(green)}${hex(blue)}`;
}

function surface(color: string, gradient: Text3DGradientStopV3[], metallicity: number): Text3DSurfaceV3 {
  return {
    color,
    gradient,
    metallicity: clamp01(metallicity),
  };
}

export function createDefaultText3DStyle(): Text3DStyleV3 {
  return {
    bevel: { size: 2, strength: 0.7 },
    extrusion: { depth: 5, angleDeg: 45 },
    surfaces: {
      front: surface('#f6c84e', [
        { offset: 0, color: '#fffbe0' },
        { offset: 0.38, color: '#f4c84a' },
        { offset: 0.72, color: '#ffe899' },
        { offset: 1, color: '#6d3f00' },
      ], 0.8),
      side: surface('#5a3200', [], 0.45),
      back: surface('#8c741c', [], 0.55),
    },
    outline: { color: '#6f4300', width: 2 },
    shadow: {
      color: '#000000',
      blur: 8,
      offsetX: 2,
      offsetY: 3,
      opacity: 0.8,
    },
    gloss: { strength: 0.7, size: 0.42 },
    texture: { kind: 'none', strength: 0 },
    light: {
      azimuthDeg: -45,
      elevationDeg: 35,
      intensity: 0.9,
      ambient: 0.3,
    },
  };
}

export function createText3DStyleFromLegacy(element: TextElement): Text3DStyleV3 {
  const material = getFlashTextMaterial(element.materialPreset);
  const usesMaterial = element.materialPreset !== undefined && element.materialPreset !== 'flat';
  const frontColor = usesMaterial ? material.fill : element.fill;
  const frontGradient = usesMaterial ? legacyGradientToStops(material.gradientStops) : [];
  const metallicity = materialMetallicity(element.materialPreset);
  const sideColor = element.extrusionColor ?? material.extrusionColor;
  const depth = element.extrusionDepth ?? material.extrusionDepth;

  return {
    bevel: {
      size: usesMaterial ? 2 : 1,
      strength: usesMaterial ? 0.7 : 0.35,
    },
    extrusion: {
      depth: Math.max(0, Math.min(16, Math.round(depth))),
      angleDeg: 45,
    },
    surfaces: {
      front: surface(frontColor, frontGradient, metallicity),
      side: surface(sideColor, [], Math.max(0.12, metallicity * 0.56)),
      back: surface(darkenHexColor(frontColor, 0.58), [], Math.max(0.1, metallicity * 0.7)),
    },
    outline: {
      color: element.stroke,
      width: Math.max(0, Math.min(16, element.strokeWidth)),
    },
    shadow: {
      color: element.shadowColor,
      blur: Math.max(0, Math.min(64, element.shadowBlur)),
      offsetX: 2,
      offsetY: 3,
      opacity: 0.8,
    },
    gloss: {
      strength: usesMaterial ? 0.7 : 0.2,
      size: usesMaterial ? 0.42 : 0.32,
    },
    texture: {
      kind: 'none',
      strength: 0,
    },
    light: {
      azimuthDeg: -45,
      elevationDeg: 35,
      intensity: 0.9,
      ambient: 0.3,
    },
  };
}

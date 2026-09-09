import type {
  Text3DLayerV3,
  Text3DStyleV3,
  Text3DSurfaceV3,
} from '../model/v3/project-v3';
import type { ResolvedLayerV3 } from '../timeline';

export const TEXT3D_MAX_SUPERSAMPLE = 4;
export const TEXT3D_MAX_OFFSCREEN_PIXELS = 16_777_216;

export type Text3DShadowPass = {
  kind: 'shadow';
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
};

export type Text3DSidePass = {
  kind: 'side';
  offsetX: number;
  offsetY: number;
  surface: Text3DSurfaceV3;
  shade: number;
};

export type Text3DBevelPass = {
  kind: 'bevel';
  size: number;
  highlightOffsetX: number;
  highlightOffsetY: number;
  strength: number;
};

export type Text3DFacePass = {
  kind: 'face';
  surface: Text3DSurfaceV3;
};

export type Text3DOutlinePass = {
  kind: 'outline';
  color: string;
  width: number;
};

export type Text3DGlossPass = {
  kind: 'gloss';
  strength: number;
  size: number;
  angleDeg: number;
};

export type Text3DTexturePass = {
  kind: 'texture';
  texture: Text3DStyleV3['texture'];
  seed: number;
};

export type Text3DPass =
  | Text3DShadowPass
  | Text3DSidePass
  | Text3DBevelPass
  | Text3DFacePass
  | Text3DOutlinePass
  | Text3DGlossPass
  | Text3DTexturePass;

export type Text3DRenderPlan = {
  text: string;
  fontFamily: string;
  fontSize: number;
  align: Text3DLayerV3['align'];
  writingMode: Text3DLayerV3['writingMode'];
  logicalWidth: number;
  logicalHeight: number;
  padding: number;
  supersample: number;
  passes: Text3DPass[];
};

export type ResolvedText3DLayerForPlan = ResolvedLayerV3 & {
  source: Text3DLayerV3;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function degToRad(value: number): number {
  return value * Math.PI / 180;
}

function cleanCoordinate(value: number): number {
  if (Math.abs(value) < 1e-10) return 0;
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function stableHash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function sideShade(style: Text3DStyleV3): number {
  const sideNormalDeg = style.extrusion.angleDeg + 90;
  const azimuthDifference = degToRad(style.light.azimuthDeg - sideNormalDeg);
  const elevation = degToRad(style.light.elevationDeg);
  const directional = Math.max(0, Math.cos(azimuthDifference) * Math.cos(elevation));
  return clamp(
    style.light.ambient + directional * style.light.intensity * (1 - style.light.ambient),
    0,
    1,
  );
}

function bevelHighlight(style: Text3DStyleV3): { x: number; y: number } {
  const angle = degToRad(style.light.azimuthDeg + 180);
  return {
    x: cleanCoordinate(Math.cos(angle) * style.bevel.size),
    y: cleanCoordinate(Math.sin(angle) * style.bevel.size),
  };
}

function requiredPadding(style: Text3DStyleV3): number {
  const extrusionReach = Math.abs(style.extrusion.depth);
  const edgeReach = style.outline.width + style.bevel.size;
  const shadowReach = Math.max(
    Math.abs(style.shadow.offsetX) + style.shadow.blur,
    Math.abs(style.shadow.offsetY) + style.shadow.blur,
  );
  return Math.ceil(Math.max(extrusionReach, edgeReach, shadowReach) + 2);
}

export function chooseText3DSupersample(
  width: number,
  height: number,
  padding: number,
): number {
  const paddedWidth = Math.max(1, Math.ceil(width + padding * 2));
  const paddedHeight = Math.max(1, Math.ceil(height + padding * 2));

  for (let factor = TEXT3D_MAX_SUPERSAMPLE; factor >= 1; factor -= 1) {
    const highResPixels = paddedWidth * factor * paddedHeight * factor;
    if (highResPixels <= TEXT3D_MAX_OFFSCREEN_PIXELS) return factor;
  }

  return 1;
}

export function buildText3DRenderPlan(layer: ResolvedText3DLayerForPlan): Text3DRenderPlan {
  const source = layer.source;
  const style = source.style;
  const useBackFace = Boolean(layer.animation.alternateFace && source.backText?.trim());
  const text = useBackFace ? source.backText!.trim() : source.text;
  const faceSurface = useBackFace ? style.surfaces.back : style.surfaces.front;
  const padding = requiredPadding(style);
  const extrusionAngle = degToRad(style.extrusion.angleDeg);
  const shade = sideShade(style);
  const highlight = bevelHighlight(style);
  const passes: Text3DPass[] = [
    {
      kind: 'shadow',
      color: style.shadow.color,
      blur: style.shadow.blur,
      offsetX: style.shadow.offsetX,
      offsetY: style.shadow.offsetY,
      opacity: style.shadow.opacity,
    },
  ];

  for (let depth = style.extrusion.depth; depth >= 1; depth -= 1) {
    passes.push({
      kind: 'side',
      offsetX: cleanCoordinate(Math.cos(extrusionAngle) * depth),
      offsetY: cleanCoordinate(Math.sin(extrusionAngle) * depth),
      surface: style.surfaces.side,
      shade,
    });
  }

  passes.push(
    {
      kind: 'bevel',
      size: style.bevel.size,
      highlightOffsetX: highlight.x,
      highlightOffsetY: highlight.y,
      strength: style.bevel.strength,
    },
    {
      kind: 'face',
      surface: faceSurface,
    },
    {
      kind: 'outline',
      color: style.outline.color,
      width: style.outline.width,
    },
    {
      kind: 'gloss',
      strength: style.gloss.strength,
      size: style.gloss.size,
      angleDeg: style.light.azimuthDeg,
    },
    {
      kind: 'texture',
      texture: { ...style.texture },
      seed: stableHash32(`${source.id}\u0000${text}`),
    },
  );

  return {
    text,
    fontFamily: source.fontFamily,
    fontSize: source.fontSize,
    align: source.align,
    writingMode: source.writingMode,
    logicalWidth: layer.transform.width,
    logicalHeight: layer.transform.height,
    padding,
    supersample: chooseText3DSupersample(layer.transform.width, layer.transform.height, padding),
    passes,
  };
}

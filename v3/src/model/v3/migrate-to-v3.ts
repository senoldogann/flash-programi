import { migrateProject } from '../migrate';
import type {
  DecorationLayer,
  EditorElement,
  FrameDefinition,
  ImageElement,
  Project,
  TextElement,
} from '../project';
import type {
  AnimationClipV3,
  FrameLayerV3,
  ImageLayerV3,
  LayerTransformV3,
  ParticleLayerV3,
  ProjectV3,
  Text3DLayerV3,
  TextLayerV3,
} from './project-v3';
import { parseProjectV3 } from './schema-v3';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrateTransform(element: EditorElement): LayerTransformV3 {
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    scaleX: 1,
    scaleY: 1,
  };
}

function migrateAnimationClip(
  element: EditorElement,
  durationMs: number,
): AnimationClipV3[] {
  const animation = element.animation;
  if (animation.preset === 'none') return [];

  const clip: AnimationClipV3 = {
    id: `${element.id}-animation`,
    effect: animation.preset,
    startMs: animation.delayMs,
    durationMs: Math.max(1, durationMs - animation.delayMs),
    loop: animation.loop,
    speed: animation.speed,
    intensity: animation.intensity,
    easing: 'linear',
  };

  if (animation.direction !== undefined) {
    clip.direction = animation.direction;
  }

  return [clip];
}

function baseLayerFields(element: EditorElement, durationMs: number) {
  return {
    id: element.id,
    name: element.name,
    visible: element.visible,
    locked: element.locked,
    opacity: element.opacity,
    transform: migrateTransform(element),
    clips: migrateAnimationClip(element, durationMs),
  };
}

function textFields(element: TextElement) {
  return {
    text: element.text,
    writingMode: element.writingMode,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fill: element.fill,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    shadowColor: element.shadowColor,
    shadowBlur: element.shadowBlur,
    align: element.align,
  };
}

function isText3D(element: TextElement): boolean {
  return (
    (element.materialPreset !== undefined && element.materialPreset !== 'flat') ||
    (element.extrusionDepth ?? 0) > 0 ||
    element.extrusionColor !== undefined
  );
}

function migrateImageToLayer(
  element: ImageElement,
  durationMs: number,
): ImageLayerV3 {
  return {
    ...baseLayerFields(element, durationMs),
    type: 'image',
    assetUrl: element.assetUrl,
    effects: element.effects,
  };
}

function migrateTextToLayer(
  element: TextElement,
  durationMs: number,
): TextLayerV3 | Text3DLayerV3 {
  const base = {
    ...baseLayerFields(element, durationMs),
    ...textFields(element),
  };

  if (!isText3D(element)) {
    return {
      ...base,
      type: 'text',
    };
  }

  return {
    ...base,
    type: 'text3d',
    ...(element.backText !== undefined ? { backText: element.backText } : {}),
    ...(element.materialPreset !== undefined ? { materialPreset: element.materialPreset } : {}),
    ...(element.extrusionDepth !== undefined ? { extrusionDepth: element.extrusionDepth } : {}),
    ...(element.extrusionColor !== undefined ? { extrusionColor: element.extrusionColor } : {}),
  };
}

function migrateElementToLayer(
  element: EditorElement,
  durationMs: number,
): ImageLayerV3 | TextLayerV3 | Text3DLayerV3 {
  return element.type === 'image'
    ? migrateImageToLayer(element, durationMs)
    : migrateTextToLayer(element, durationMs);
}

function fullCanvasTransform(width: number, height: number): LayerTransformV3 {
  return {
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };
}

function migrateDecorationToLayer(
  decoration: DecorationLayer,
  canvasWidth: number,
  canvasHeight: number,
): ParticleLayerV3 {
  return {
    id: decoration.id,
    name: `Decoration: ${decoration.preset}`,
    type: 'particle',
    visible: true,
    locked: false,
    opacity: decoration.opacity,
    transform: fullCanvasTransform(canvasWidth, canvasHeight),
    clips: [],
    preset: decoration.preset,
    count: decoration.count,
    speed: decoration.speed,
  };
}

function migrateFrameToLayer(
  frame: FrameDefinition,
  canvasWidth: number,
  canvasHeight: number,
): FrameLayerV3 | null {
  if (frame.preset === 'none') return null;

  return {
    id: 'project-frame',
    name: `Frame: ${frame.preset}`,
    type: 'frame',
    visible: true,
    locked: false,
    opacity: 1,
    transform: fullCanvasTransform(canvasWidth, canvasHeight),
    clips: [],
    preset: frame.preset,
    width: frame.width,
  };
}

function migrateV2Project(source: Project): ProjectV3 {
  const elementLayers = source.elements.map((element) =>
    migrateElementToLayer(element, source.durationMs));
  const particleLayers = source.decorations.map((decoration) =>
    migrateDecorationToLayer(decoration, source.width, source.height));
  const frameLayer = migrateFrameToLayer(source.frame, source.width, source.height);

  return parseProjectV3({
    version: 3,
    id: source.id,
    name: source.name,
    mode: 'classic',
    canvas: {
      width: source.width,
      height: source.height,
      background: source.background,
    },
    timeline: {
      durationMs: source.durationMs,
      fps: source.fps,
    },
    layers: [
      ...elementLayers,
      ...particleLayers,
      ...(frameLayer ? [frameLayer] : []),
    ],
    exportSettings: source.exportSettings,
  });
}

export function migrateProjectToV3(input: unknown): ProjectV3 {
  if (isRecord(input) && input.version === 3) {
    return parseProjectV3(input);
  }

  const source = migrateProject(input);
  return migrateV2Project(source);
}
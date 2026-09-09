import { z } from 'zod';
import {
  animationSchema,
  decorationLayerSchema,
  exportSettingsSchema,
  frameDefinitionSchema,
  imageEffectsSchema,
  textElementSchema,
} from '../schema';
import type { ProjectV3 } from './project-v3';

const finiteNumber = z.number().finite();
const layerDimension = z.number().finite().positive().max(8192);
const boundedColor = z.string().min(1).max(120);

export const layerTransformV3Schema = z.object({
  x: finiteNumber,
  y: finiteNumber,
  width: layerDimension,
  height: layerDimension,
  rotation: finiteNumber,
  scaleX: finiteNumber,
  scaleY: finiteNumber,
}).strict();

export const animationClipV3Schema = z.object({
  id: z.string().min(1).max(120),
  effect: animationSchema.shape.preset,
  startMs: z.number().int().min(0).max(30_000),
  durationMs: z.number().int().min(1).max(30_000),
  loop: z.boolean(),
  speed: animationSchema.shape.speed,
  intensity: animationSchema.shape.intensity,
  easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']),
  direction: animationSchema.shape.direction,
}).strict();

const sceneLayerBaseV3Shape = {
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  visible: z.boolean(),
  locked: z.boolean(),
  opacity: z.number().finite().min(0).max(1),
  transform: layerTransformV3Schema,
  clips: z.array(animationClipV3Schema).max(64),
};

export const text3DGradientStopV3Schema = z.object({
  offset: z.number().finite().min(0).max(1),
  color: boundedColor,
}).strict();

export const text3DSurfaceV3Schema = z.object({
  color: boundedColor,
  gradient: z.array(text3DGradientStopV3Schema).max(16),
  metallicity: z.number().finite().min(0).max(1),
}).strict();

export const text3DStyleV3Schema = z.object({
  bevel: z.object({
    size: z.number().finite().min(0).max(8),
    strength: z.number().finite().min(0).max(1),
  }).strict(),
  extrusion: z.object({
    depth: z.number().int().min(0).max(16),
    angleDeg: z.number().finite().min(-360).max(360),
  }).strict(),
  surfaces: z.object({
    front: text3DSurfaceV3Schema,
    side: text3DSurfaceV3Schema,
    back: text3DSurfaceV3Schema,
  }).strict(),
  outline: z.object({
    color: boundedColor,
    width: z.number().finite().min(0).max(16),
  }).strict(),
  shadow: z.object({
    color: boundedColor,
    blur: z.number().finite().min(0).max(64),
    offsetX: z.number().finite().min(-64).max(64),
    offsetY: z.number().finite().min(-64).max(64),
    opacity: z.number().finite().min(0).max(1),
  }).strict(),
  gloss: z.object({
    strength: z.number().finite().min(0).max(1),
    size: z.number().finite().min(0).max(1),
  }).strict(),
  texture: z.object({
    kind: z.enum(['none', 'speckle', 'brushed']),
    strength: z.number().finite().min(0).max(1),
  }).strict(),
  light: z.object({
    azimuthDeg: z.number().finite().min(-360).max(360),
    elevationDeg: z.number().finite().min(-90).max(90),
    intensity: z.number().finite().min(0).max(2),
    ambient: z.number().finite().min(0).max(1),
  }).strict(),
}).strict();

export const imageLayerV3Schema = z.object({
  ...sceneLayerBaseV3Shape,
  type: z.literal('image'),
  assetUrl: z.string().min(1),
  effects: imageEffectsSchema,
}).strict();

export const textLayerV3Schema = z.object({
  ...sceneLayerBaseV3Shape,
  type: z.literal('text'),
  text: textElementSchema.shape.text,
  writingMode: textElementSchema.shape.writingMode,
  fontFamily: textElementSchema.shape.fontFamily,
  fontSize: textElementSchema.shape.fontSize,
  fill: textElementSchema.shape.fill,
  stroke: textElementSchema.shape.stroke,
  strokeWidth: textElementSchema.shape.strokeWidth,
  shadowColor: textElementSchema.shape.shadowColor,
  shadowBlur: textElementSchema.shape.shadowBlur,
  align: textElementSchema.shape.align,
}).strict();

export const text3DLayerV3Schema = z.object({
  ...sceneLayerBaseV3Shape,
  type: z.literal('text3d'),
  text: textElementSchema.shape.text,
  backText: textElementSchema.shape.backText,
  writingMode: textElementSchema.shape.writingMode,
  fontFamily: textElementSchema.shape.fontFamily,
  fontSize: textElementSchema.shape.fontSize,
  fill: textElementSchema.shape.fill,
  stroke: textElementSchema.shape.stroke,
  strokeWidth: textElementSchema.shape.strokeWidth,
  shadowColor: textElementSchema.shape.shadowColor,
  shadowBlur: textElementSchema.shape.shadowBlur,
  align: textElementSchema.shape.align,
  materialPreset: textElementSchema.shape.materialPreset,
  extrusionDepth: textElementSchema.shape.extrusionDepth,
  extrusionColor: textElementSchema.shape.extrusionColor,
  style: text3DStyleV3Schema,
}).strict();

export const particleLayerV3Schema = z.object({
  ...sceneLayerBaseV3Shape,
  type: z.literal('particle'),
  preset: decorationLayerSchema.shape.preset,
  count: decorationLayerSchema.shape.count,
  speed: decorationLayerSchema.shape.speed,
}).strict();

export const frameLayerV3Schema = z.object({
  ...sceneLayerBaseV3Shape,
  type: z.literal('frame'),
  preset: frameDefinitionSchema.shape.preset,
  width: frameDefinitionSchema.shape.width,
}).strict();

export const sceneLayerV3Schema = z.discriminatedUnion('type', [
  imageLayerV3Schema,
  textLayerV3Schema,
  text3DLayerV3Schema,
  particleLayerV3Schema,
  frameLayerV3Schema,
]);

export const projectV3Schema = z.object({
  version: z.literal(3),
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  mode: z.enum(['classic', 'neo']),
  canvas: z.object({
    width: z.number().int().min(32).max(4096),
    height: z.number().int().min(32).max(4096),
    background: z.string().min(1).max(120),
  }).strict(),
  timeline: z.object({
    durationMs: z.number().int().min(100).max(30_000),
    fps: z.number().int().min(1).max(60),
  }).strict(),
  layers: z.array(sceneLayerV3Schema).max(200),
  exportSettings: exportSettingsSchema,
}).strict();

export function parseProjectV3(input: unknown): ProjectV3 {
  return projectV3Schema.parse(input) as ProjectV3;
}
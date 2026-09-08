import { z } from 'zod';
import type { Project } from './project';

const finiteNumber = z.number().finite();
const dimension = z.number().finite().positive().max(8192);

export const animationSchema = z.object({
  preset: z.enum([
    'none',
    'pulse',
    'float',
    'swing',
    'spin',
    'blink',
    'zoom',
    'shake',
    'slide',
    'bounce',
    'wave',
  ]),
  speed: z.enum(['slow', 'normal', 'fast']),
  delayMs: z.number().finite().min(0).max(30_000),
  loop: z.boolean(),
});

export const imageEffectsSchema = z.object({
  brightness: z.number().finite().min(-1).max(1),
  contrast: z.number().finite().min(-100).max(100),
  saturation: z.number().finite().min(-2).max(2),
  blurRadius: z.number().finite().min(0).max(40),
  grayscale: z.boolean(),
  sepia: z.boolean(),
});

const elementBaseShape = {
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  x: finiteNumber,
  y: finiteNumber,
  width: dimension,
  height: dimension,
  rotation: finiteNumber,
  opacity: z.number().finite().min(0).max(1),
  visible: z.boolean(),
  locked: z.boolean(),
  animation: animationSchema,
};

export const textElementSchema = z.object({
  ...elementBaseShape,
  type: z.literal('text'),
  text: z.string().max(500),
  fontFamily: z.string().min(1).max(120),
  fontSize: z.number().finite().min(6).max(512),
  fill: z.string().min(1).max(120),
  stroke: z.string().min(1).max(120),
  strokeWidth: z.number().finite().min(0).max(64),
  shadowColor: z.string().min(1).max(120),
  shadowBlur: z.number().finite().min(0).max(128),
  align: z.enum(['left', 'center', 'right']),
});

export const imageElementSchema = z.object({
  ...elementBaseShape,
  type: z.literal('image'),
  assetUrl: z.string().min(1),
  effects: imageEffectsSchema,
});

export const editorElementSchema = z.discriminatedUnion('type', [
  textElementSchema,
  imageElementSchema,
]);

export const decorationLayerSchema = z.object({
  id: z.string().min(1).max(120),
  preset: z.enum([
    'stars',
    'hearts',
    'sparkles',
    'snow',
    'bubbles',
    'confetti',
    'flowers',
    'butterflies',
    'fire',
    'lightning',
    'turkish',
  ]),
  count: z.number().int().min(1).max(60),
  opacity: z.number().finite().min(0).max(1),
  speed: z.enum(['slow', 'normal', 'fast']),
});

export const frameDefinitionSchema = z.object({
  preset: z.enum([
    'none',
    'neon',
    'gold',
    'hearts',
    'stars',
    'rainbow',
    'fire',
    'ice',
    'glitter',
    'turkish',
  ]),
  width: z.number().finite().min(1).max(32),
});

export const projectSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  width: z.number().int().min(32).max(4096),
  height: z.number().int().min(32).max(4096),
  durationMs: z.number().int().min(100).max(30_000),
  fps: z.number().int().min(1).max(60),
  background: z.string().min(1).max(120),
  elements: z.array(editorElementSchema).max(200),
  decorations: z.array(decorationLayerSchema).max(12),
  frame: frameDefinitionSchema,
});

export function parseProject(input: unknown): Project {
  return projectSchema.parse(input) as Project;
}

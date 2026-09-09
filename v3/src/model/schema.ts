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
    'ken-burns',
    'slow-pan',
    'orbit',
    'breathing-zoom',
    'rubber',
    'flip-x',
    'flip-y',
    'pendulum',
    'drift',
    'parallax',
    'jello',
    'wobble',
    'heartbeat',
    'flash',
    'reveal',
    'scanline',
    'glitch-rgb',
    'chromatic-shake',
    'focus-pulse',
    'pixel-pulse',
    'soft-sway',
    'tilt',
    'spiral',
    'pop',
    'shimmer',
    'camera-pan',
    'micro-vibrate',
    'rise-fade',
  ]),
  speed: z.enum(['slow', 'normal', 'fast']),
  intensity: z.enum(['subtle', 'normal', 'strong']),
  delayMs: z.number().finite().min(0).max(30_000),
  loop: z.boolean(),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),
}).strict();

export const imageEffectsSchema = z.object({
  brightness: z.number().finite().min(-1).max(1),
  contrast: z.number().finite().min(-100).max(100),
  saturation: z.number().finite().min(-2).max(2),
  blurRadius: z.number().finite().min(0).max(40),
  grayscale: z.boolean(),
  sepia: z.boolean(),
  hue: z.number().finite().min(-180).max(180),
  temperature: z.number().finite().min(-100).max(100),
  tint: z.number().finite().min(-100).max(100),
  enhance: z.number().finite().min(-1).max(1),
  emboss: z.number().finite().min(0).max(1),
  invert: z.boolean(),
  noise: z.number().finite().min(0).max(1),
  pixelate: z.number().finite().min(0).max(64),
  posterize: z.number().finite().min(0).max(1),
  solarize: z.boolean(),
  threshold: z.number().finite().min(0).max(1),
  vignette: z.number().finite().min(0).max(1).default(0),
}).strict();

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
  writingMode: z.enum(['horizontal', 'vertical-stacked']),
  fontFamily: z.string().min(1).max(120),
  fontSize: z.number().finite().min(6).max(512),
  fill: z.string().min(1).max(120),
  stroke: z.string().min(1).max(120),
  strokeWidth: z.number().finite().min(0).max(64),
  shadowColor: z.string().min(1).max(120),
  shadowBlur: z.number().finite().min(0).max(128),
  align: z.enum(['left', 'center', 'right']),
}).strict();

export const imageElementSchema = z.object({
  ...elementBaseShape,
  type: z.literal('image'),
  assetUrl: z.string().min(1),
  effects: imageEffectsSchema,
}).strict();

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
    'diamonds',
    'music',
    'crowns',
    'roses',
    'moon-stars',
    'cherry-blossom',
    'money',
    'smoke',
    'rain',
  ]),
  count: z.number().int().min(1).max(60),
  opacity: z.number().finite().min(0).max(1),
  speed: z.enum(['slow', 'normal', 'fast']),
}).strict();

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
    'rose-gold',
    'electric',
    'cosmic',
    'ocean',
    'matrix',
    'pearls',
    'love-neon',
    'minimal-white',
  ]),
  width: z.number().finite().min(1).max(32),
}).strict();

export const exportSettingsSchema = z.object({
  scale: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  gifProfile: z.enum(['small', 'balanced', 'quality']),
}).strict();

export const projectSchema = z.object({
  version: z.literal(2),
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
  exportSettings: exportSettingsSchema,
}).strict();

export function parseProject(input: unknown): Project {
  return projectSchema.parse(input) as Project;
}

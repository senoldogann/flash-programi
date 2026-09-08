import { z } from 'zod';
import type { Project } from './project';

const finiteNumber = z.number().finite();
const dimension = z.number().finite().positive().max(8192);

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
});

export const editorElementSchema = z.discriminatedUnion('type', [
  textElementSchema,
  imageElementSchema,
]);

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
});

export function parseProject(input: unknown): Project {
  return projectSchema.parse(input) as Project;
}

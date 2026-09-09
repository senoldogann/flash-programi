import type {
  FlashModeV3,
  LayerTransformV3,
  ProjectV3,
  SceneLayerV3,
} from '../model/v3/project-v3';
import { evaluateClip } from './clip-evaluator';
import { composeClipEvaluations } from './composition';

export type ResolvedLayerTransformV3 = LayerTransformV3 & {
  skewX: number;
  skewY: number;
};

export type ResolvedAnimationChannelsV3 = {
  hueShift: number;
  blurAmount: number;
  revealProgress: number;
  chromaticOffset: number;
  pixelateAmount: number;
  alternateFace: boolean;
};

export type ResolvedLayerV3 = {
  source: SceneLayerV3;
  id: string;
  name: string;
  type: SceneLayerV3['type'];
  visible: boolean;
  locked: boolean;
  opacity: number;
  transform: ResolvedLayerTransformV3;
  animation: ResolvedAnimationChannelsV3;
};

export type ResolvedSceneV3 = {
  projectId: string;
  projectName: string;
  mode: FlashModeV3;
  timeMs: number;
  canvas: ProjectV3['canvas'];
  timeline: ProjectV3['timeline'];
  layers: ResolvedLayerV3[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveLayer(layer: SceneLayerV3, timeMs: number): ResolvedLayerV3 {
  const composed = composeClipEvaluations(
    layer.clips.map((clip) => evaluateClip(clip, timeMs)),
  );

  return {
    source: layer,
    id: layer.id,
    name: layer.name,
    type: layer.type,
    visible: layer.visible,
    locked: layer.locked,
    opacity: clamp(layer.opacity * composed.opacity, 0, 1),
    transform: {
      x: layer.transform.x + composed.x,
      y: layer.transform.y + composed.y,
      width: layer.transform.width,
      height: layer.transform.height,
      rotation: layer.transform.rotation + composed.rotation,
      scaleX: layer.transform.scaleX * composed.scaleX,
      scaleY: layer.transform.scaleY * composed.scaleY,
      skewX: composed.skewX,
      skewY: composed.skewY,
    },
    animation: {
      hueShift: composed.hueShift,
      blurAmount: composed.blurAmount,
      revealProgress: composed.revealProgress,
      chromaticOffset: composed.chromaticOffset,
      pixelateAmount: composed.pixelateAmount,
      alternateFace: composed.alternateFace,
    },
  };
}

export function evaluateScene(
  project: ProjectV3,
  timeMs: number,
): ResolvedSceneV3 {
  const resolvedTimeMs = clamp(timeMs, 0, project.timeline.durationMs);

  return {
    projectId: project.id,
    projectName: project.name,
    mode: project.mode,
    timeMs: resolvedTimeMs,
    canvas: { ...project.canvas },
    timeline: { ...project.timeline },
    layers: project.layers.map((layer) => resolveLayer(layer, resolvedTimeMs)),
  };
}

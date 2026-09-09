import type { EvaluatedAnimation } from '../../animations/evaluator';
import type { Project } from '../../model/project';
import { migrateProjectToV3 } from '../../model/v3/migrate-to-v3';
import { evaluateScene, type ResolvedLayerV3, type ResolvedSceneV3 } from '../../timeline';

function safeRatio(value: number, base: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(base)) return 1;
  if (Math.abs(base) < 0.000001) return 1;
  return value / base;
}

export function resolveEditorScene(project: Project, timeMs: number): ResolvedSceneV3 {
  return evaluateScene(migrateProjectToV3(project), timeMs);
}

export function resolvedLayerAnimation(layer: ResolvedLayerV3): EvaluatedAnimation {
  const source = layer.source;
  return {
    x: layer.transform.x - source.transform.x,
    y: layer.transform.y - source.transform.y,
    scaleX: safeRatio(layer.transform.scaleX, source.transform.scaleX),
    scaleY: safeRatio(layer.transform.scaleY, source.transform.scaleY),
    rotation: layer.transform.rotation - source.transform.rotation,
    opacity: safeRatio(layer.opacity, source.opacity),
    skewX: layer.transform.skewX,
    skewY: layer.transform.skewY,
    hueShift: layer.animation.hueShift,
    blurAmount: layer.animation.blurAmount,
    revealProgress: layer.animation.revealProgress,
    chromaticOffset: layer.animation.chromaticOffset,
    pixelateAmount: layer.animation.pixelateAmount,
  };
}

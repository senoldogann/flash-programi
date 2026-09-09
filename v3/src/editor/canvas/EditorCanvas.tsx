import { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Layer, Stage } from 'react-konva';
import { animationNeedsClock, type EvaluatedAnimation } from '../../animations/evaluator';
import { useAnimationClock } from '../../animations/useAnimationClock';
import { decorationNeedsClock } from '../../decorations/presets';
import { frameNeedsClock } from '../../frames/presets';
import type { Project } from '../../model/project';
import { migrateProjectToV3 } from '../../model/v3/migrate-to-v3';
import { useEditorStore } from '../../store/editor-store';
import { evaluateScene, type ResolvedLayerV3 } from '../../timeline';
import type { GeometryNode } from './layer-interaction';
import { resolvedLayerAnimation } from './render-scene';
import { SceneRenderer } from './SceneRenderer';
import { normalizeTransform } from './transform';

type Viewport = { width: number; height: number; scale: number };

export type EditorCanvasProps = {
  onStageReady?: (stage: Konva.Stage | null) => void;
  timeOverrideMs?: number | null;
  onRequestImage?: () => void;
};

function snapshotProject(): Project {
  return structuredClone(useEditorStore.getState().project);
}

function commitNodeGeometry(
  elementId: string,
  node: GeometryNode,
  beforeProject: Project,
  animation: EvaluatedAnimation,
): void {
  const state = useEditorStore.getState();
  const element = state.project.elements.find((candidate) => candidate.id === elementId);
  if (!element) return;

  const safeScaleX = Math.abs(animation.scaleX) < 0.001 ? 1 : animation.scaleX;
  const safeScaleY = Math.abs(animation.scaleY) < 0.001 ? 1 : animation.scaleY;
  const geometry = normalizeTransform(
    {
      x: node.x() - animation.x,
      y: node.y() - animation.y,
      width: node.width(),
      height: node.height(),
      rotation: node.rotation() - animation.rotation,
      scaleX: node.scaleX() / safeScaleX,
      scaleY: node.scaleY() / safeScaleY,
    },
    element,
  );

  node.scaleX(animation.scaleX);
  node.scaleY(animation.scaleY);

  const afterProject: Project = {
    ...state.project,
    elements: state.project.elements.map((candidate) =>
      candidate.id === elementId ? { ...candidate, ...geometry } : candidate,
    ),
  };
  state.commitTransform(beforeProject, afterProject);
}

export function EditorCanvas({ onStageReady, timeOverrideMs, onRequestImage }: EditorCanvasProps) {
  const project = useEditorStore((state) => state.project);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectElement = useEditorStore((state) => state.selectElement);
  const animationActive =
    project.elements.some((element) => animationNeedsClock(element.animation)) ||
    project.decorations.some(decorationNeedsClock) ||
    frameNeedsClock(project.frame);
  const liveTimeMs = useAnimationClock(animationActive && timeOverrideMs == null);
  const timeMs = timeOverrideMs ?? liveTimeMs;
  const v3Project = useMemo(() => migrateProjectToV3(project), [project]);
  const scene = useMemo(() => evaluateScene(v3Project, timeMs), [timeMs, v3Project]);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const beforeProjectRef = useRef<Project | null>(null);
  const [viewport, setViewport] = useState<Viewport>({
    width: project.width,
    height: project.height,
    scale: 1,
  });

  useEffect(() => {
    onStageReady?.(stageRef.current);
    return () => onStageReady?.(null);
  }, [onStageReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const availableWidth = container.clientWidth || project.width;
      const availableHeight = container.clientHeight || project.height;
      const scale = Math.min(availableWidth / project.width, availableHeight / project.height);
      setViewport({ width: project.width * scale, height: project.height * scale, scale });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [project.height, project.width]);

  const clearSelection = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = event.target.getStage();
    if (event.target === stage || event.target.name() === 'canvas-background') selectElement(null);
  };

  const beginInteraction = () => {
    beforeProjectRef.current = snapshotProject();
  };

  const finishInteraction = (layer: ResolvedLayerV3, node: GeometryNode) => {
    const beforeProject = beforeProjectRef.current ?? snapshotProject();
    commitNodeGeometry(layer.id, node, beforeProject, resolvedLayerAnimation(layer));
    beforeProjectRef.current = null;
  };

  return (
    <div ref={containerRef} className="editor-canvas" data-testid="editor-canvas">
      <Stage
        ref={stageRef}
        width={viewport.width}
        height={viewport.height}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        onMouseDown={clearSelection}
        onTouchStart={clearSelection}
      >
        <Layer>
          <SceneRenderer
            scene={scene}
            selectedElementId={selectedElementId}
            previewScale={viewport.scale}
            onSelectElement={selectElement}
            onInteractionStart={beginInteraction}
            onInteractionFinish={finishInteraction}
          />
        </Layer>
      </Stage>

      {project.elements.length === 0 && project.decorations.length === 0 ? (
        <div className="canvas-empty-overlay">
          <button
            type="button"
            className="canvas-empty-action"
            aria-label="Fotoğraf seç ve başla"
            onClick={onRequestImage}
            disabled={!onRequestImage}
          >
            <span className="empty-icon" aria-hidden="true">＋</span>
            <strong>Tasarımına başla</strong>
            <span>Fotoğraf seç ve düzenlemeye hemen başla.</span>
          </button>
        </div>
      ) : null}
      <span className="visually-hidden" aria-live="polite">
        {selectedElementId ? 'Bir öğe seçildi.' : 'Seçili öğe yok.'}
      </span>
    </div>
  );
}

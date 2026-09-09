import { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import { animationNeedsClock, evaluateAnimation, type EvaluatedAnimation } from '../../animations/evaluator';
import { useAnimationClock } from '../../animations/useAnimationClock';
import { decorationNeedsClock } from '../../decorations/presets';
import { DecorationRenderer } from '../../decorations/renderer';
import { buildImageEffectRenderPlan } from '../../effects/image-effects';
import { frameNeedsClock } from '../../frames/presets';
import { FrameRenderer } from '../../frames/renderer';
import type { ImageElement, Project, TextElement } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';
import { normalizeTransform } from './transform';

type Viewport = { width: number; height: number; scale: number };

type GeometryNode = {
  x(): number;
  y(): number;
  width(): number;
  height(): number;
  rotation(): number;
  scaleX(): number;
  scaleX(value: number): unknown;
  scaleY(): number;
  scaleY(value: number): unknown;
};

type TransformableProps = {
  isSelected: boolean;
  previewScale: number;
  timeMs: number;
  onSelect: () => void;
};

export type EditorCanvasProps = {
  onStageReady?: (stage: Konva.Stage | null) => void;
  timeOverrideMs?: number | null;
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

function transformerSize(previewScale: number, pixels: number): number {
  return pixels / Math.max(previewScale, 0.1);
}

type CanvasImageElementProps = TransformableProps & { element: ImageElement };

function CanvasImageElement({ element, isSelected, previewScale, timeMs, onSelect }: CanvasImageElementProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const beforeProjectRef = useRef<Project | null>(null);
  const interactionTimeRef = useRef<number | null>(null);
  const renderTime = interactionTimeRef.current ?? timeMs;
  const animation = evaluateAnimation(element.animation, renderTime);
  const effectPlan = useMemo(() => buildImageEffectRenderPlan(element.effects), [element.effects]);
  const effectAttrs = effectPlan.attrs as {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
    luminance?: number;
    blurRadius?: number;
    enhance?: number;
    embossStrength?: number;
    embossWhiteLevel?: number;
    embossDirection?: string;
    embossBlend?: boolean;
    noise?: number;
    pixelSize?: number;
    levels?: number;
    threshold?: number;
  };

  useEffect(() => {
    let active = true;
    const nextImage = new window.Image();
    nextImage.onload = () => active && setImage(nextImage);
    nextImage.onerror = () => active && setImage(null);
    nextImage.src = element.assetUrl;
    return () => {
      active = false;
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [element.assetUrl]);

  useEffect(() => {
    const node = shapeRef.current;
    if (!node || !image) return;

    if (effectPlan.requiresCache) {
      node.cache();
    } else {
      node.clearCache();
    }
    node.getLayer()?.batchDraw();
  }, [effectPlan.cacheKey, effectPlan.requiresCache, image]);

  useEffect(() => {
    if (!isSelected || element.locked || !shapeRef.current || !transformerRef.current) return;
    transformerRef.current.nodes([shapeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [element.locked, isSelected]);

  const beginInteraction = () => {
    onSelect();
    interactionTimeRef.current = timeMs;
    beforeProjectRef.current = snapshotProject();
  };

  const finishInteraction = () => {
    if (!shapeRef.current) return;
    const frozenAnimation = evaluateAnimation(element.animation, interactionTimeRef.current ?? timeMs);
    const beforeProject = beforeProjectRef.current ?? snapshotProject();
    commitNodeGeometry(element.id, shapeRef.current, beforeProject, frozenAnimation);
    beforeProjectRef.current = null;
    interactionTimeRef.current = null;
  };

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        id={element.id}
        image={image ?? undefined}
        x={element.x + animation.x}
        y={element.y + animation.y}
        width={element.width}
        height={element.height}
        scaleX={animation.scaleX}
        scaleY={animation.scaleY}
        rotation={element.rotation + animation.rotation}
        opacity={element.opacity * animation.opacity}
        visible={element.visible}
        draggable={!element.locked}
        filters={effectPlan.filters}
        brightness={effectAttrs.brightness}
        contrast={effectAttrs.contrast}
        saturation={effectAttrs.saturation}
        hue={effectAttrs.hue}
        luminance={effectAttrs.luminance}
        blurRadius={effectAttrs.blurRadius}
        enhance={effectAttrs.enhance}
        embossStrength={effectAttrs.embossStrength}
        embossWhiteLevel={effectAttrs.embossWhiteLevel}
        embossDirection={effectAttrs.embossDirection}
        embossBlend={effectAttrs.embossBlend}
        noise={effectAttrs.noise}
        pixelSize={effectAttrs.pixelSize}
        levels={effectAttrs.levels}
        threshold={effectAttrs.threshold}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={beginInteraction}
        onDragEnd={finishInteraction}
        onTransformStart={beginInteraction}
        onTransformEnd={finishInteraction}
      />
      {isSelected && !element.locked ? (
        <Transformer
          name="selection-transformer"
          ref={transformerRef}
          flipEnabled={false}
          keepRatio
          borderStroke="#8b7cff"
          borderStrokeWidth={transformerSize(previewScale, 1.5)}
          anchorFill="#ffffff"
          anchorStroke="#6d5dfc"
          anchorStrokeWidth={transformerSize(previewScale, 1.5)}
          anchorSize={transformerSize(previewScale, 11)}
          anchorCornerRadius={transformerSize(previewScale, 2)}
          rotateAnchorOffset={transformerSize(previewScale, 28)}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={4}
        />
      ) : null}
    </>
  );
}

type CanvasTextElementProps = TransformableProps & { element: TextElement };

function CanvasTextElement({ element, isSelected, previewScale, timeMs, onSelect }: CanvasTextElementProps) {
  const shapeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const beforeProjectRef = useRef<Project | null>(null);
  const interactionTimeRef = useRef<number | null>(null);
  const renderTime = interactionTimeRef.current ?? timeMs;
  const animation = evaluateAnimation(element.animation, renderTime);

  useEffect(() => {
    if (!isSelected || element.locked || !shapeRef.current || !transformerRef.current) return;
    transformerRef.current.nodes([shapeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [element.locked, isSelected]);

  const beginInteraction = () => {
    onSelect();
    interactionTimeRef.current = timeMs;
    beforeProjectRef.current = snapshotProject();
  };

  const finishInteraction = () => {
    if (!shapeRef.current) return;
    const frozenAnimation = evaluateAnimation(element.animation, interactionTimeRef.current ?? timeMs);
    const beforeProject = beforeProjectRef.current ?? snapshotProject();
    commitNodeGeometry(element.id, shapeRef.current, beforeProject, frozenAnimation);
    beforeProjectRef.current = null;
    interactionTimeRef.current = null;
  };

  return (
    <>
      <Text
        ref={shapeRef}
        id={element.id}
        x={element.x + animation.x}
        y={element.y + animation.y}
        width={element.width}
        height={element.height}
        scaleX={animation.scaleX}
        scaleY={animation.scaleY}
        rotation={element.rotation + animation.rotation}
        opacity={element.opacity * animation.opacity}
        visible={element.visible}
        draggable={!element.locked}
        text={element.text}
        fontFamily={element.fontFamily}
        fontSize={element.fontSize}
        fill={element.fill}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        shadowColor={element.shadowColor}
        shadowBlur={element.shadowBlur}
        align={element.align}
        verticalAlign="middle"
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={beginInteraction}
        onDragEnd={finishInteraction}
        onTransformStart={beginInteraction}
        onTransformEnd={finishInteraction}
      />
      {isSelected && !element.locked ? (
        <Transformer
          name="selection-transformer"
          ref={transformerRef}
          flipEnabled={false}
          keepRatio={false}
          borderStroke="#8b7cff"
          borderStrokeWidth={transformerSize(previewScale, 1.5)}
          anchorFill="#ffffff"
          anchorStroke="#6d5dfc"
          anchorStrokeWidth={transformerSize(previewScale, 1.5)}
          anchorSize={transformerSize(previewScale, 11)}
          anchorCornerRadius={transformerSize(previewScale, 2)}
          rotateAnchorOffset={transformerSize(previewScale, 28)}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={4}
        />
      ) : null}
    </>
  );
}

export function EditorCanvas({ onStageReady, timeOverrideMs }: EditorCanvasProps) {
  const project = useEditorStore((state) => state.project);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectElement = useEditorStore((state) => state.selectElement);
  const animationActive =
    project.elements.some((element) => animationNeedsClock(element.animation)) ||
    project.decorations.some(decorationNeedsClock) ||
    frameNeedsClock(project.frame);
  const liveTimeMs = useAnimationClock(animationActive && timeOverrideMs == null);
  const timeMs = timeOverrideMs ?? liveTimeMs;
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [viewport, setViewport] = useState<Viewport>({ width: project.width, height: project.height, scale: 1 });

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
          <Rect name="canvas-background" width={project.width} height={project.height} fill={project.background} />
          {project.elements.map((element) => {
            const isSelected = element.id === selectedElementId;
            if (element.type === 'image') {
              return (
                <CanvasImageElement
                  key={element.id}
                  element={element}
                  isSelected={isSelected}
                  previewScale={viewport.scale}
                  timeMs={timeMs}
                  onSelect={() => selectElement(element.id)}
                />
              );
            }
            return (
              <CanvasTextElement
                key={element.id}
                element={element}
                isSelected={isSelected}
                previewScale={viewport.scale}
                timeMs={timeMs}
                onSelect={() => selectElement(element.id)}
              />
            );
          })}
          <DecorationRenderer layers={project.decorations} width={project.width} height={project.height} timeMs={timeMs} />
          <FrameRenderer frame={project.frame} width={project.width} height={project.height} timeMs={timeMs} />
        </Layer>
      </Stage>

      {project.elements.length === 0 && project.decorations.length === 0 ? (
        <div className="canvas-empty-overlay" aria-hidden="true">
          <div className="empty-icon">＋</div>
          <strong>Tasarımına başla</strong>
          <span>Bir fotoğraf seç veya yazı ekle.</span>
        </div>
      ) : null}
      <span className="visually-hidden" aria-live="polite">
        {selectedElementId ? 'Bir öğe seçildi.' : 'Seçili öğe yok.'}
      </span>
    </div>
  );
}

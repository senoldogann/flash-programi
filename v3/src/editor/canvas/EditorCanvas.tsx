import { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import type { ImageElement, Project, TextElement } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';
import { normalizeTransform } from './transform';

type Viewport = {
  width: number;
  height: number;
  scale: number;
};

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
  onSelect: () => void;
};

function snapshotProject(): Project {
  return structuredClone(useEditorStore.getState().project);
}

function commitNodeGeometry(
  elementId: string,
  node: GeometryNode,
  beforeProject: Project,
): void {
  const state = useEditorStore.getState();
  const element = state.project.elements.find((candidate) => candidate.id === elementId);

  if (!element) {
    return;
  }

  const geometry = normalizeTransform(
    {
      x: node.x(),
      y: node.y(),
      width: node.width(),
      height: node.height(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    },
    element,
  );

  node.scaleX(1);
  node.scaleY(1);

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

type CanvasImageElementProps = TransformableProps & {
  element: ImageElement;
};

function CanvasImageElement({
  element,
  isSelected,
  previewScale,
  onSelect,
}: CanvasImageElementProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const beforeProjectRef = useRef<Project | null>(null);

  useEffect(() => {
    let active = true;
    const nextImage = new window.Image();

    nextImage.onload = () => {
      if (active) {
        setImage(nextImage);
      }
    };
    nextImage.onerror = () => {
      if (active) {
        setImage(null);
      }
    };
    nextImage.src = element.assetUrl;

    return () => {
      active = false;
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [element.assetUrl]);

  useEffect(() => {
    if (!isSelected || !shapeRef.current || !transformerRef.current) {
      return;
    }

    transformerRef.current.nodes([shapeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isSelected]);

  const beginInteraction = () => {
    onSelect();
    beforeProjectRef.current = snapshotProject();
  };

  const finishInteraction = () => {
    if (!shapeRef.current) {
      return;
    }

    const beforeProject = beforeProjectRef.current ?? snapshotProject();
    commitNodeGeometry(element.id, shapeRef.current, beforeProject);
    beforeProjectRef.current = null;
  };

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        id={element.id}
        image={image ?? undefined}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        opacity={element.opacity}
        visible={element.visible}
        draggable={!element.locked}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={beginInteraction}
        onDragEnd={finishInteraction}
        onTransformStart={beginInteraction}
        onTransformEnd={finishInteraction}
      />

      {isSelected ? (
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
          keepRatio
          rotateEnabled={!element.locked}
          resizeEnabled={!element.locked}
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

type CanvasTextElementProps = TransformableProps & {
  element: TextElement;
};

function CanvasTextElement({
  element,
  isSelected,
  previewScale,
  onSelect,
}: CanvasTextElementProps) {
  const shapeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const beforeProjectRef = useRef<Project | null>(null);

  useEffect(() => {
    if (!isSelected || !shapeRef.current || !transformerRef.current) {
      return;
    }

    transformerRef.current.nodes([shapeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isSelected]);

  const beginInteraction = () => {
    onSelect();
    beforeProjectRef.current = snapshotProject();
  };

  const finishInteraction = () => {
    if (!shapeRef.current) {
      return;
    }

    const beforeProject = beforeProjectRef.current ?? snapshotProject();
    commitNodeGeometry(element.id, shapeRef.current, beforeProject);
    beforeProjectRef.current = null;
  };

  return (
    <>
      <Text
        ref={shapeRef}
        id={element.id}
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rotation={element.rotation}
        opacity={element.opacity}
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

      {isSelected ? (
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
          keepRatio={false}
          rotateEnabled={!element.locked}
          resizeEnabled={!element.locked}
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

export function EditorCanvas() {
  const project = useEditorStore((state) => state.project);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectElement = useEditorStore((state) => state.selectElement);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({
    width: project.width,
    height: project.height,
    scale: 1,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const measure = () => {
      const availableWidth = container.clientWidth || project.width;
      const availableHeight = container.clientHeight || project.height;
      const scale = Math.min(
        availableWidth / project.width,
        availableHeight / project.height,
      );

      setViewport({
        width: project.width * scale,
        height: project.height * scale,
        scale,
      });
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
  }, [project.height, project.width]);

  const clearSelection = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = event.target.getStage();
    if (event.target === stage || event.target.name() === 'canvas-background') {
      selectElement(null);
    }
  };

  return (
    <div ref={containerRef} className="editor-canvas" data-testid="editor-canvas">
      <Stage
        width={viewport.width}
        height={viewport.height}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        onMouseDown={clearSelection}
        onTouchStart={clearSelection}
      >
        <Layer>
          <Rect
            name="canvas-background"
            width={project.width}
            height={project.height}
            fill={project.background}
          />

          {project.elements.map((element) => {
            const isSelected = element.id === selectedElementId;

            if (element.type === 'image') {
              return (
                <CanvasImageElement
                  key={element.id}
                  element={element}
                  isSelected={isSelected}
                  previewScale={viewport.scale}
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
                onSelect={() => selectElement(element.id)}
              />
            );
          })}
        </Layer>
      </Stage>

      {project.elements.length === 0 ? (
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

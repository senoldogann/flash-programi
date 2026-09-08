import { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { Image as KonvaImage, Layer, Rect, Stage, Text } from 'react-konva';
import type { ImageElement } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';

type Viewport = {
  width: number;
  height: number;
  scale: number;
};

type CanvasImageElementProps = {
  element: ImageElement;
  onSelect: () => void;
};

function CanvasImageElement({ element, onSelect }: CanvasImageElementProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

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

  return (
    <KonvaImage
      id={element.id}
      image={image ?? undefined}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      visible={element.visible}
      onClick={onSelect}
      onTap={onSelect}
    />
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
            if (element.type === 'image') {
              return (
                <CanvasImageElement
                  key={element.id}
                  element={element}
                  onSelect={() => selectElement(element.id)}
                />
              );
            }

            return (
              <Text
                key={element.id}
                id={element.id}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                rotation={element.rotation}
                opacity={element.opacity}
                visible={element.visible}
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
                onClick={() => selectElement(element.id)}
                onTap={() => selectElement(element.id)}
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

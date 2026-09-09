import { useEffect, useMemo, useRef } from 'react';
import Konva from 'konva';
import { Group, Image as KonvaImage } from 'react-konva';
import type { Text3DLayerV3 } from '../../../model/v3/project-v3';
import { renderText3DToCanvas } from '../../../text3d/rasterizer';
import { buildText3DRenderPlan } from '../../../text3d/render-plan';
import type { ResolvedLayerV3 } from '../../../timeline';
import type { ResolvedLayerInteractionProps } from '../layer-interaction';
import { SelectionTransformer } from '../selection-transformer';

export type ResolvedText3DLayerState = ResolvedLayerV3 & {
  source: Text3DLayerV3;
  type: 'text3d';
};

type ResolvedText3DLayerProps = ResolvedLayerInteractionProps & {
  layer: ResolvedText3DLayerState;
  isSelected: boolean;
  previewScale: number;
  onSelect(): void;
};

export function ResolvedText3DLayer({
  layer,
  isSelected,
  previewScale,
  onSelect,
  onInteractionStart,
  onInteractionFinish,
}: ResolvedText3DLayerProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const frozenLayerRef = useRef<ResolvedText3DLayerState | null>(null);
  const renderLayer = frozenLayerRef.current ?? layer;
  const source = renderLayer.source;
  const { transform } = renderLayer;
  const opacity = renderLayer.opacity * renderLayer.animation.revealProgress;

  const renderPlan = useMemo(
    () => buildText3DRenderPlan(renderLayer),
    [
      source.id,
      source.text,
      source.backText,
      source.writingMode,
      source.fontFamily,
      source.fontSize,
      source.align,
      source.style,
      transform.width,
      transform.height,
      renderLayer.animation.alternateFace,
    ],
  );
  const raster = useMemo(
    () => renderText3DToCanvas(renderPlan),
    [renderPlan],
  );

  useEffect(() => {
    if (!isSelected || renderLayer.locked || !groupRef.current || !transformerRef.current) return;
    transformerRef.current.nodes([groupRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isSelected, renderLayer.locked, raster.canvas]);

  const beginInteraction = () => {
    onSelect();
    frozenLayerRef.current = layer;
    onInteractionStart(layer);
  };

  const finishInteraction = () => {
    const node = groupRef.current;
    const frozenLayer = frozenLayerRef.current ?? layer;
    if (node) onInteractionFinish(frozenLayer, node);
    frozenLayerRef.current = null;
  };

  return (
    <>
      <Group
        ref={groupRef}
        id={source.id}
        name="resolved-text3d-layer"
        x={transform.x}
        y={transform.y}
        width={transform.width}
        height={transform.height}
        scaleX={transform.scaleX}
        scaleY={transform.scaleY}
        rotation={transform.rotation}
        skewX={transform.skewX}
        skewY={transform.skewY}
        opacity={opacity}
        visible={renderLayer.visible}
        draggable={!renderLayer.locked}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={beginInteraction}
        onDragEnd={finishInteraction}
        onTransformStart={beginInteraction}
        onTransformEnd={finishInteraction}
      >
        <KonvaImage
          image={raster.canvas}
          x={-raster.padding}
          y={-raster.padding}
          width={raster.width}
          height={raster.height}
          listening={false}
        />
      </Group>
      {isSelected && !renderLayer.locked ? (
        <SelectionTransformer
          transformerRef={transformerRef}
          previewScale={previewScale}
          keepRatio={false}
        />
      ) : null}
    </>
  );
}

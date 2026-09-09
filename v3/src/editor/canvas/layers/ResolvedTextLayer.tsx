import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Text } from 'react-konva';
import type { TextLayerV3 } from '../../../model/v3/project-v3';
import { getDisplayText } from '../../../text/layout';
import type { ResolvedLayerV3 } from '../../../timeline';
import type { ResolvedLayerInteractionProps } from '../layer-interaction';
import { SelectionTransformer } from '../selection-transformer';

export type ResolvedTextLayerState = ResolvedLayerV3 & {
  source: TextLayerV3;
  type: 'text';
};

type ResolvedTextLayerProps = ResolvedLayerInteractionProps & {
  layer: ResolvedTextLayerState;
  isSelected: boolean;
  previewScale: number;
  onSelect(): void;
};

export function ResolvedTextLayer({
  layer,
  isSelected,
  previewScale,
  onSelect,
  onInteractionStart,
  onInteractionFinish,
}: ResolvedTextLayerProps) {
  const shapeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const frozenLayerRef = useRef<ResolvedTextLayerState | null>(null);
  const renderLayer = frozenLayerRef.current ?? layer;
  const source = renderLayer.source;
  const { transform } = renderLayer;
  const displayText = getDisplayText(source.text, source.writingMode);
  const opacity = renderLayer.opacity * renderLayer.animation.revealProgress;

  useEffect(() => {
    if (!isSelected || renderLayer.locked || !shapeRef.current || !transformerRef.current) return;
    transformerRef.current.nodes([shapeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [isSelected, renderLayer.locked]);

  const beginInteraction = () => {
    onSelect();
    frozenLayerRef.current = layer;
    onInteractionStart(layer);
  };

  const finishInteraction = () => {
    const node = shapeRef.current;
    const frozenLayer = frozenLayerRef.current ?? layer;
    if (node) onInteractionFinish(frozenLayer, node);
    frozenLayerRef.current = null;
  };

  return (
    <>
      <Text
        ref={shapeRef}
        id={source.id}
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
        text={displayText}
        fontFamily={source.fontFamily}
        fontSize={source.fontSize}
        align={source.align}
        verticalAlign="middle"
        draggable={!renderLayer.locked}
        fill={source.fill}
        stroke={source.stroke}
        strokeWidth={source.strokeWidth}
        shadowColor={source.shadowColor}
        shadowBlur={source.shadowBlur}
        shadowOpacity={0.9}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={beginInteraction}
        onDragEnd={finishInteraction}
        onTransformStart={beginInteraction}
        onTransformEnd={finishInteraction}
      />
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

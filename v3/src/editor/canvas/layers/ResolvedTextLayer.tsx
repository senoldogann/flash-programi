import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Text } from 'react-konva';
import type { Text3DLayerV3, TextLayerV3 } from '../../../model/v3/project-v3';
import { getFlashTextMaterial } from '../../../text/flash-materials';
import { getDisplayText } from '../../../text/layout';
import type { ResolvedLayerV3 } from '../../../timeline';
import type { ResolvedLayerInteractionProps } from '../layer-interaction';
import { SelectionTransformer } from '../selection-transformer';

export type ResolvedTextLayerState = ResolvedLayerV3 & {
  source: TextLayerV3 | Text3DLayerV3;
  type: 'text' | 'text3d';
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

  const isText3d = source.type === 'text3d';
  const material = getFlashTextMaterial(isText3d ? source.materialPreset : undefined);
  const depth = isText3d
    ? Math.max(0, Math.min(16, Math.round(source.extrusionDepth ?? material.extrusionDepth)))
    : 0;
  const extrusionColor = isText3d
    ? source.extrusionColor ?? material.extrusionColor
    : source.stroke;
  const rawText = isText3d && renderLayer.animation.alternateFace && source.backText?.trim()
    ? source.backText
    : source.text;
  const displayText = getDisplayText(rawText, source.writingMode);
  const opacity = renderLayer.opacity * renderLayer.animation.revealProgress;
  const usesMaterialGradient = isText3d && source.materialPreset !== undefined && source.materialPreset !== 'flat' && material.gradientStops.length > 0;

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

  const commonTextProps = {
    width: transform.width,
    height: transform.height,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    rotation: transform.rotation,
    skewX: transform.skewX,
    skewY: transform.skewY,
    opacity,
    visible: renderLayer.visible,
    text: displayText,
    fontFamily: source.fontFamily,
    fontSize: source.fontSize,
    align: source.align,
    verticalAlign: 'middle' as const,
  };

  return (
    <>
      {Array.from({ length: depth }, (_, index) => {
        const offset = depth - index;
        return (
          <Text
            key={`${source.id}-extrusion-${offset}`}
            name="flash-text-extrusion"
            {...commonTextProps}
            x={transform.x + offset * 0.72}
            y={transform.y + offset * 0.72}
            fill={extrusionColor}
            stroke={extrusionColor}
            strokeWidth={Math.max(1, source.strokeWidth)}
            listening={false}
          />
        );
      })}
      <Text
        ref={shapeRef}
        id={source.id}
        {...commonTextProps}
        x={transform.x}
        y={transform.y}
        draggable={!renderLayer.locked}
        fill={source.fill}
        fillPriority={usesMaterialGradient ? 'linear-gradient' : 'color'}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: transform.height }}
        fillLinearGradientColorStops={usesMaterialGradient ? material.gradientStops : undefined}
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

import { useEffect, useMemo, useRef, useState } from 'react';
import Konva from 'konva';
import { Image as KonvaImage } from 'react-konva';
import { buildImageEffectRenderPlan } from '../../../effects/image-effects';
import type { ImageLayerV3, SubjectLayerV3 } from '../../../model/v3/project-v3';
import type { ResolvedLayerV3 } from '../../../timeline';
import type { ResolvedLayerInteractionProps } from '../layer-interaction';
import { SelectionTransformer } from '../selection-transformer';

type ResolvedRasterSource = ImageLayerV3 | SubjectLayerV3;

export type ResolvedImageLayerState = ResolvedLayerV3 & {
  source: ResolvedRasterSource;
  type: ResolvedRasterSource['type'];
};

type ResolvedImageLayerProps = ResolvedLayerInteractionProps & {
  layer: ResolvedImageLayerState;
  isSelected: boolean;
  previewScale: number;
  onSelect(): void;
};

export function ResolvedImageLayer({
  layer,
  isSelected,
  previewScale,
  onSelect,
  onInteractionStart,
  onInteractionFinish,
}: ResolvedImageLayerProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const frozenLayerRef = useRef<ResolvedImageLayerState | null>(null);
  const renderLayer = frozenLayerRef.current ?? layer;
  const source = renderLayer.source;

  const effectPlan = useMemo(
    () => buildImageEffectRenderPlan(source.effects, {
      hueShift: renderLayer.animation.hueShift,
      blurAmount: renderLayer.animation.blurAmount,
      pixelateAmount: renderLayer.animation.pixelateAmount,
    }),
    [
      source.effects,
      renderLayer.animation.blurAmount,
      renderLayer.animation.hueShift,
      renderLayer.animation.pixelateAmount,
    ],
  );

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

  const { transform } = renderLayer;
  const opacity = renderLayer.opacity * renderLayer.animation.revealProgress;
  const subjectShadow = source.type === 'subject' && source.cutout.shadow.enabled
    ? source.cutout.shadow
    : null;

  useEffect(() => {
    let active = true;
    const nextImage = new window.Image();
    nextImage.onload = () => active && setImage(nextImage);
    nextImage.onerror = () => active && setImage(null);
    nextImage.src = source.assetUrl;
    return () => {
      active = false;
      nextImage.onload = null;
      nextImage.onerror = null;
    };
  }, [source.assetUrl]);

  useEffect(() => {
    const node = shapeRef.current;
    if (!node || !image) return;

    if (effectPlan.requiresCache) node.cache();
    else node.clearCache();
    node.getLayer()?.batchDraw();
  }, [effectPlan.cacheKey, effectPlan.requiresCache, image]);

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

  const chromaticGhost = (offset: number) => (
    <KonvaImage
      key={`${source.id}-chromatic-${offset}`}
      name="animation-chromatic-ghost"
      image={image ?? undefined}
      x={transform.x + offset}
      y={transform.y}
      width={transform.width}
      height={transform.height}
      scaleX={transform.scaleX}
      scaleY={transform.scaleY}
      rotation={transform.rotation}
      skewX={transform.skewX}
      skewY={transform.skewY}
      opacity={Math.min(0.28, opacity * 0.22)}
      visible={renderLayer.visible}
      listening={false}
      globalCompositeOperation="screen"
    />
  );

  return (
    <>
      {renderLayer.animation.chromaticOffset > 0 ? (
        <>
          {chromaticGhost(-renderLayer.animation.chromaticOffset)}
          {chromaticGhost(renderLayer.animation.chromaticOffset)}
        </>
      ) : null}
      <KonvaImage
        ref={shapeRef}
        id={source.id}
        name={source.type === 'subject' ? 'subject-cutout' : undefined}
        image={image ?? undefined}
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
        shadowColor={subjectShadow?.color}
        shadowBlur={subjectShadow?.blur}
        shadowOffsetX={subjectShadow?.offsetX}
        shadowOffsetY={subjectShadow?.offsetY}
        shadowOpacity={subjectShadow?.opacity}
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
          keepRatio
        />
      ) : null}
    </>
  );
}

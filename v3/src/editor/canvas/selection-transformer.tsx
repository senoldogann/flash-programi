import type { RefObject } from 'react';
import Konva from 'konva';
import { Transformer } from 'react-konva';

function transformerSize(previewScale: number, pixels: number): number {
  return pixels / Math.max(previewScale, 0.1);
}

export type SelectionTransformerProps = {
  transformerRef: RefObject<Konva.Transformer | null>;
  previewScale: number;
  keepRatio: boolean;
};

export function SelectionTransformer({
  transformerRef,
  previewScale,
  keepRatio,
}: SelectionTransformerProps) {
  return (
    <Transformer
      name="selection-transformer"
      ref={transformerRef}
      flipEnabled={false}
      keepRatio={keepRatio}
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
  );
}

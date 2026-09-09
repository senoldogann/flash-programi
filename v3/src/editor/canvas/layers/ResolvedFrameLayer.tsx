import { Group } from 'react-konva';
import { FrameRenderer } from '../../../frames/renderer';
import type { FrameLayerV3 } from '../../../model/v3/project-v3';
import type { ResolvedLayerV3 } from '../../../timeline';

export type ResolvedFrameLayerState = ResolvedLayerV3 & {
  source: FrameLayerV3;
  type: 'frame';
};

type ResolvedFrameLayerProps = {
  layer: ResolvedFrameLayerState;
  canvasWidth: number;
  canvasHeight: number;
  timeMs: number;
};

export function ResolvedFrameLayer({
  layer,
  canvasWidth,
  canvasHeight,
  timeMs,
}: ResolvedFrameLayerProps) {
  const { source, transform } = layer;
  return (
    <Group
      name="resolved-layer"
      x={transform.x}
      y={transform.y}
      scaleX={transform.scaleX}
      scaleY={transform.scaleY}
      rotation={transform.rotation}
      skewX={transform.skewX}
      skewY={transform.skewY}
      opacity={layer.opacity * layer.animation.revealProgress}
      visible={layer.visible}
      listening={false}
    >
      <FrameRenderer
        frame={{ preset: source.preset, width: source.width }}
        width={canvasWidth}
        height={canvasHeight}
        timeMs={timeMs}
      />
    </Group>
  );
}

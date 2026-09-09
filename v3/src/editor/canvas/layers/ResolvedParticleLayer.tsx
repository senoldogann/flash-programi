import { Group } from 'react-konva';
import { DecorationRenderer } from '../../../decorations/renderer';
import type { ParticleLayerV3 } from '../../../model/v3/project-v3';
import type { ResolvedLayerV3 } from '../../../timeline';

export type ResolvedParticleLayerState = ResolvedLayerV3 & {
  source: ParticleLayerV3;
  type: 'particle';
};

type ResolvedParticleLayerProps = {
  layer: ResolvedParticleLayerState;
  canvasWidth: number;
  canvasHeight: number;
  timeMs: number;
};

export function ResolvedParticleLayer({
  layer,
  canvasWidth,
  canvasHeight,
  timeMs,
}: ResolvedParticleLayerProps) {
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
      <DecorationRenderer
        layers={[{
          id: source.id,
          preset: source.preset,
          count: source.count,
          opacity: 1,
          speed: source.speed,
        }]}
        width={canvasWidth}
        height={canvasHeight}
        timeMs={timeMs}
      />
    </Group>
  );
}

import { Text } from 'react-konva';
import type { DecorationLayer } from '../model/project';
import { decorationPoints } from './presets';

type DecorationRendererProps = {
  layers: DecorationLayer[];
  width: number;
  height: number;
  timeMs: number;
};

export function DecorationRenderer({
  layers,
  width,
  height,
  timeMs,
}: DecorationRendererProps) {
  return (
    <>
      {layers.flatMap((layer) =>
        decorationPoints(layer, width, height, timeMs).map((point, index) => (
          <Text
            key={`${layer.id}-${index}`}
            id={`decoration-${layer.id}-${index}`}
            name="decoration"
            listening={false}
            x={point.x}
            y={point.y}
            text={point.symbol}
            fill={point.color}
            fontSize={point.size}
            rotation={point.rotation}
            opacity={point.opacity}
            shadowColor={point.color}
            shadowBlur={layer.preset === 'sparkles' ? point.size * 0.6 : 0}
            offsetX={point.size / 2}
            offsetY={point.size / 2}
          />
        )),
      )}
    </>
  );
}

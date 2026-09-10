import { Circle, Rect, Text } from 'react-konva';
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
        decorationPoints(layer, width, height, timeMs).map((point, index) => {
          const key = `${layer.id}-${index}`;
          const id = `decoration-${layer.id}-${index}`;

          if (point.kind === 'orb' || point.kind === 'dust') {
            return (
              <Circle
                key={key}
                id={id}
                name="decoration"
                listening={false}
                x={point.x}
                y={point.y}
                radius={point.kind === 'orb' ? point.size / 2 : Math.max(1, point.size / 3)}
                fill={point.color}
                opacity={point.opacity}
                shadowColor={point.color}
                shadowBlur={point.kind === 'orb' ? point.size * 0.9 : point.size * 1.2}
              />
            );
          }

          if (point.kind === 'sweep') {
            const sweepWidth = Math.max(width * 0.18, point.size * 4);
            return (
              <Rect
                key={key}
                id={id}
                name="decoration"
                listening={false}
                x={point.x}
                y={point.y - height * 0.7}
                width={sweepWidth}
                height={height * 1.4}
                rotation={point.rotation}
                opacity={point.opacity}
                fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                fillLinearGradientEndPoint={{ x: sweepWidth, y: 0 }}
                fillLinearGradientColorStops={[
                  0,
                  'rgba(255,255,255,0)',
                  0.5,
                  point.color,
                  1,
                  'rgba(255,255,255,0)',
                ]}
                shadowColor={point.color}
                shadowBlur={point.size * 0.7}
              />
            );
          }

          return (
            <Text
              key={key}
              id={id}
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
          );
        }),
      )}
    </>
  );
}

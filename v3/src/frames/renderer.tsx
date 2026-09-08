import { Rect, Text } from 'react-konva';
import type { FrameDefinition } from '../model/project';
import { frameAppearance, getFramePreset } from './presets';

type FrameRendererProps = {
  frame: FrameDefinition;
  width: number;
  height: number;
  timeMs: number;
};

export function FrameRenderer({ frame, width, height, timeMs }: FrameRendererProps) {
  if (frame.preset === 'none') return null;

  const preset = getFramePreset(frame.preset);
  const appearance = frameAppearance(frame, timeMs);
  const inset = frame.width / 2;
  const symbol = preset.id === 'turkish' ? '☾★' : preset.symbol;
  const symbolSize = Math.max(14, frame.width * 2.2);

  return (
    <>
      <Rect
        name="frame"
        listening={false}
        x={inset}
        y={inset}
        width={Math.max(1, width - frame.width)}
        height={Math.max(1, height - frame.width)}
        stroke={appearance.stroke}
        strokeWidth={frame.width}
        shadowColor={appearance.shadowColor}
        shadowBlur={appearance.shadowBlur}
        dash={preset.animated ? [frame.width * 2.4, frame.width * 1.2] : undefined}
        dashOffset={appearance.dashOffset}
      />
      {symbol ? (
        <>
          <Text name="frame-symbol" listening={false} x={frame.width} y={frame.width} text={symbol} fontSize={symbolSize} fill={preset.secondary} />
          <Text name="frame-symbol" listening={false} x={width - frame.width - symbolSize * 1.5} y={frame.width} text={symbol} fontSize={symbolSize} fill={preset.secondary} />
          <Text name="frame-symbol" listening={false} x={frame.width} y={height - frame.width - symbolSize} text={symbol} fontSize={symbolSize} fill={preset.secondary} />
          <Text name="frame-symbol" listening={false} x={width - frame.width - symbolSize * 1.5} y={height - frame.width - symbolSize} text={symbol} fontSize={symbolSize} fill={preset.secondary} />
        </>
      ) : null}
    </>
  );
}

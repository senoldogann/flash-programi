import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DecorationLayer, DecorationPreset } from '../model/project';
import {
  DECORATION_PRESETS,
  decorationNeedsClock,
  decorationPoints,
} from '../decorations/presets';
import { DecorationRenderer } from '../decorations/renderer';

vi.mock('react-konva', async () => {
  const React = await import('react');
  return {
    Text: (props: Record<string, unknown>) => (
      <span data-testid="konva-text" data-name={String(props.name ?? '')} />
    ),
    Circle: (props: Record<string, unknown>) => (
      <span data-testid="konva-circle" data-name={String(props.name ?? '')} />
    ),
    Rect: (props: Record<string, unknown>) => (
      <span data-testid="konva-rect" data-name={String(props.name ?? '')} />
    ),
  };
});

const NEO_PRIMITIVES: DecorationPreset[] = ['ambient-orbs', 'glow-dust', 'light-sweep'];

function layer(preset: DecorationPreset, count = 3): DecorationLayer {
  return {
    id: `neo-${preset}`,
    preset,
    count,
    opacity: 0.72,
    speed: 'normal',
  };
}

describe('Neo ambient/light decoration primitives', () => {
  it('registers all Neo primitives and marks each one as animated', () => {
    const ids = DECORATION_PRESETS.map((preset) => preset.id);
    for (const preset of NEO_PRIMITIVES) {
      expect(ids).toContain(preset);
      expect(decorationNeedsClock(layer(preset))).toBe(true);
    }
  });

  it('generates deterministic but time-varying shape points', () => {
    for (const preset of NEO_PRIMITIVES) {
      const source = layer(preset);
      const at900 = decorationPoints(source, 320, 180, 900);
      const repeat = decorationPoints(source, 320, 180, 900);
      const at1400 = decorationPoints(source, 320, 180, 1400);

      expect(at900).toEqual(repeat);
      expect(at900).not.toEqual(at1400);
      expect(at900).toHaveLength(3);
      expect(at900.every((point) => point.kind !== 'glyph')).toBe(true);
    }
  });

  it('dispatches Neo orbs/dust to circles and light sweep to rectangles', () => {
    render(
      <DecorationRenderer
        layers={[
          layer('ambient-orbs', 1),
          layer('glow-dust', 1),
          layer('light-sweep', 1),
        ]}
        width={320}
        height={180}
        timeMs={1200}
      />,
    );

    expect(screen.getAllByTestId('konva-circle')).toHaveLength(2);
    expect(screen.getAllByTestId('konva-rect')).toHaveLength(1);
    expect(screen.queryByTestId('konva-text')).not.toBeInTheDocument();
  });
});

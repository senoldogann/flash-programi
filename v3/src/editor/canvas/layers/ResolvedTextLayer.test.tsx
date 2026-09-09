import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Text3DLayerV3, TextLayerV3 } from '../../../model/v3/project-v3';
import { createDefaultText3DStyle } from '../../../text3d/material-recipes';
import type { ResolvedLayerV3 } from '../../../timeline';
import { ResolvedTextLayer } from './ResolvedTextLayer';

vi.mock('react-konva', async () => {
  const React = await import('react');
  const { forwardRef, useImperativeHandle } = React;
  const MockText = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    useImperativeHandle(ref, () => ({
      x: () => Number(props.x ?? 0),
      y: () => Number(props.y ?? 0),
      width: () => Number(props.width ?? 0),
      height: () => Number(props.height ?? 0),
      rotation: () => Number(props.rotation ?? 0),
      scaleX: () => Number(props.scaleX ?? 1),
      scaleY: () => Number(props.scaleY ?? 1),
      getLayer: () => ({ batchDraw: () => undefined }),
    }));
    return (
      <div
        data-testid={props.name === 'flash-text-extrusion' ? 'extrusion' : `resolved-text-${String(props.id)}`}
        data-x={String(props.x)}
        data-y={String(props.y)}
        data-scale-x={String(props.scaleX)}
        data-scale-y={String(props.scaleY)}
        data-rotation={String(props.rotation)}
        data-skew-x={String(props.skewX)}
        data-skew-y={String(props.skewY)}
        data-opacity={String(props.opacity)}
        data-fill-priority={String(props.fillPriority ?? '')}
      >
        {String(props.text ?? '')}
      </div>
    );
  });
  const MockTransformer = forwardRef<unknown>((_props, ref) => {
    useImperativeHandle(ref, () => ({ nodes: () => undefined, getLayer: () => ({ batchDraw: () => undefined }) }));
    return <div data-testid="transformer" />;
  });
  return { Text: MockText, Transformer: MockTransformer };
});

const baseTransform = {
  x: 40,
  y: 25,
  width: 180,
  height: 60,
  rotation: 11,
  scaleX: 1.2,
  scaleY: 0.95,
  skewX: 4,
  skewY: -1,
};

function plainLayer(): ResolvedLayerV3 & { source: TextLayerV3; type: 'text' } {
  const source: TextLayerV3 = {
    id: 'text-1',
    name: 'Text',
    type: 'text',
    visible: true,
    locked: false,
    opacity: 0.8,
    transform: { x: 10, y: 10, width: 180, height: 60, rotation: 0, scaleX: 1, scaleY: 1 },
    clips: [],
    text: 'Merhaba',
    writingMode: 'horizontal',
    fontFamily: 'Arial',
    fontSize: 30,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    shadowColor: '#000000',
    shadowBlur: 4,
    align: 'center',
  };
  return {
    source,
    id: source.id,
    name: source.name,
    type: 'text',
    visible: true,
    locked: false,
    opacity: 0.6,
    transform: baseTransform,
    animation: {
      hueShift: 0,
      blurAmount: 0,
      revealProgress: 0.5,
      chromaticOffset: 0,
      pixelateAmount: 0,
      alternateFace: false,
    },
  };
}

function text3dLayer(alternateFace = false): ResolvedLayerV3 & { source: Text3DLayerV3; type: 'text3d' } {
  const source: Text3DLayerV3 = {
    ...plainLayer().source,
    id: 'text3d-1',
    type: 'text3d',
    text: 'FRONT',
    backText: 'BACK',
    materialPreset: 'xara-gold',
    extrusionDepth: 3,
    extrusionColor: '#6b4300',
    style: {
      ...createDefaultText3DStyle(),
      extrusion: { depth: 3, angleDeg: 45 },
      surfaces: {
        ...createDefaultText3DStyle().surfaces,
        side: {
          ...createDefaultText3DStyle().surfaces.side,
          color: '#6b4300',
        },
      },
    },
  };
  return {
    ...plainLayer(),
    source,
    id: source.id,
    name: source.name,
    type: 'text3d',
    animation: { ...plainLayer().animation, alternateFace },
  };
}

const props = {
  isSelected: false,
  previewScale: 1,
  onSelect: () => undefined,
  onInteractionStart: () => undefined,
  onInteractionFinish: () => undefined,
};

describe('ResolvedTextLayer', () => {
  it('renders plain text from resolved geometry and opacity', () => {
    render(<ResolvedTextLayer layer={plainLayer()} {...props} />);
    const text = screen.getByTestId('resolved-text-text-1');
    expect(text).toHaveTextContent('Merhaba');
    expect(text).toHaveAttribute('data-x', '40');
    expect(text).toHaveAttribute('data-y', '25');
    expect(text).toHaveAttribute('data-scale-x', '1.2');
    expect(text).toHaveAttribute('data-scale-y', '0.95');
    expect(text).toHaveAttribute('data-rotation', '11');
    expect(text).toHaveAttribute('data-skew-x', '4');
    expect(text).toHaveAttribute('data-opacity', '0.3');
    expect(screen.queryAllByTestId('extrusion')).toHaveLength(0);
  });

  it('uses the alternate Xara back face from resolved scene state', () => {
    render(<ResolvedTextLayer layer={text3dLayer(true)} {...props} />);
    expect(screen.getByTestId('resolved-text-text3d-1')).toHaveTextContent('BACK');
  });

  it('preserves migrated text3d extrusion and material gradient behavior', () => {
    render(<ResolvedTextLayer layer={text3dLayer(false)} {...props} />);
    expect(screen.getAllByTestId('extrusion')).toHaveLength(3);
    expect(screen.getByTestId('resolved-text-text3d-1')).toHaveTextContent('FRONT');
    expect(screen.getByTestId('resolved-text-text3d-1')).toHaveAttribute('data-fill-priority', 'linear-gradient');
  });
});
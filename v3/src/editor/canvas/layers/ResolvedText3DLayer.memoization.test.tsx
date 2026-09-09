import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Text3DLayerV3 } from '../../../model/v3/project-v3';
import { createDefaultText3DStyle } from '../../../text3d/material-recipes';
import type { Text3DRenderPlan } from '../../../text3d/render-plan';
import type { ResolvedLayerV3 } from '../../../timeline';
import { ResolvedText3DLayer } from './ResolvedText3DLayer';

const rasterSpies = vi.hoisted(() => ({
  render: vi.fn((plan: Text3DRenderPlan) => ({
    canvas: document.createElement('canvas'),
    padding: plan.padding,
    width: Math.ceil(plan.logicalWidth + plan.padding * 2),
    height: Math.ceil(plan.logicalHeight + plan.padding * 2),
  })),
}));

vi.mock('../../../text3d/rasterizer', () => ({
  renderText3DToCanvas: rasterSpies.render,
}));

vi.mock('react-konva', async () => {
  const React = await import('react');
  const { forwardRef, useImperativeHandle } = React;

  const Group = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
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
    return <div>{props.children as ReactNode}</div>;
  });

  const Transformer = forwardRef<unknown>((_props, ref) => {
    useImperativeHandle(ref, () => ({
      nodes: () => undefined,
      getLayer: () => ({ batchDraw: () => undefined }),
    }));
    return null;
  });

  return {
    Group,
    Image: () => <div data-testid="text3d-raster" />,
    Transformer,
  };
});

function sourceFixture(overrides: Partial<Text3DLayerV3> = {}): Text3DLayerV3 {
  return {
    id: 'memo-text3d',
    name: 'Memo Text3D',
    type: 'text3d',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 10, y: 20, width: 180, height: 60, rotation: 0, scaleX: 1, scaleY: 1 },
    clips: [],
    text: 'FRONT',
    backText: 'BACK',
    writingMode: 'horizontal',
    fontFamily: 'Impact',
    fontSize: 30,
    align: 'center',
    style: createDefaultText3DStyle(),
    ...overrides,
  };
}

function resolvedFixture(
  source: Text3DLayerV3,
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    skewX?: number;
    skewY?: number;
    opacity?: number;
    revealProgress?: number;
    alternateFace?: boolean;
  } = {},
): ResolvedLayerV3 & { source: Text3DLayerV3; type: 'text3d' } {
  return {
    source,
    id: source.id,
    name: source.name,
    type: 'text3d',
    visible: true,
    locked: false,
    opacity: options.opacity ?? 1,
    transform: {
      x: options.x ?? 10,
      y: options.y ?? 20,
      width: options.width ?? 180,
      height: options.height ?? 60,
      rotation: options.rotation ?? 0,
      scaleX: options.scaleX ?? 1,
      scaleY: options.scaleY ?? 1,
      skewX: options.skewX ?? 0,
      skewY: options.skewY ?? 0,
    },
    animation: {
      hueShift: 0,
      blurAmount: 0,
      revealProgress: options.revealProgress ?? 1,
      chromaticOffset: 0,
      pixelateAmount: 0,
      alternateFace: options.alternateFace ?? false,
    },
  };
}

const commonProps = {
  isSelected: false,
  previewScale: 1,
  onSelect: () => undefined,
  onInteractionStart: () => undefined,
  onInteractionFinish: () => undefined,
};

beforeEach(() => {
  rasterSpies.render.mockClear();
});

describe('ResolvedText3DLayer raster memoization', () => {
  it('does not rerasterize when only resolved transform, opacity, or reveal animation changes', () => {
    const source = sourceFixture();
    const { rerender } = render(
      <ResolvedText3DLayer layer={resolvedFixture(source)} {...commonProps} />,
    );

    expect(rasterSpies.render).toHaveBeenCalledTimes(1);

    rerender(
      <ResolvedText3DLayer
        layer={resolvedFixture(source, {
          x: 48,
          y: 35,
          rotation: 19,
          scaleX: 1.3,
          scaleY: 0.8,
          skewX: 4,
          skewY: -2,
          opacity: 0.72,
          revealProgress: 0.55,
        })}
        {...commonProps}
      />,
    );

    expect(rasterSpies.render).toHaveBeenCalledTimes(1);
  });

  it('rerasterizes when text, face, font, logical dimensions, or style changes', () => {
    const initialSource = sourceFixture();
    const { rerender } = render(
      <ResolvedText3DLayer layer={resolvedFixture(initialSource)} {...commonProps} />,
    );
    expect(rasterSpies.render).toHaveBeenCalledTimes(1);

    const textSource = sourceFixture({ text: 'UPDATED' });
    rerender(<ResolvedText3DLayer layer={resolvedFixture(textSource)} {...commonProps} />);
    expect(rasterSpies.render).toHaveBeenCalledTimes(2);

    const fontSource = sourceFixture({ text: 'UPDATED', fontFamily: 'Arial' });
    rerender(<ResolvedText3DLayer layer={resolvedFixture(fontSource)} {...commonProps} />);
    expect(rasterSpies.render).toHaveBeenCalledTimes(3);

    const changedStyle = createDefaultText3DStyle();
    changedStyle.gloss = { ...changedStyle.gloss, strength: 0.2 };
    const styleSource = sourceFixture({ text: 'UPDATED', fontFamily: 'Arial', style: changedStyle });
    rerender(<ResolvedText3DLayer layer={resolvedFixture(styleSource)} {...commonProps} />);
    expect(rasterSpies.render).toHaveBeenCalledTimes(4);

    rerender(
      <ResolvedText3DLayer
        layer={resolvedFixture(styleSource, { width: 220, height: 72 })}
        {...commonProps}
      />,
    );
    expect(rasterSpies.render).toHaveBeenCalledTimes(5);

    rerender(
      <ResolvedText3DLayer
        layer={resolvedFixture(styleSource, { width: 220, height: 72, alternateFace: true })}
        {...commonProps}
      />,
    );
    expect(rasterSpies.render).toHaveBeenCalledTimes(6);
    expect(rasterSpies.render.mock.calls.at(-1)?.[0].text).toBe('BACK');
  });
});

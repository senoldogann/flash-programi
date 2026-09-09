import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Text3DLayerV3 } from '../../../model/v3/project-v3';
import { createDefaultText3DStyle } from '../../../text3d/material-recipes';
import type { Text3DRenderPlan } from '../../../text3d/render-plan';
import type { ResolvedLayerV3 } from '../../../timeline';

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

  const MockGroup = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
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
        data-testid="text3d-group"
        data-x={String(props.x)}
        data-y={String(props.y)}
        data-width={String(props.width)}
        data-height={String(props.height)}
        data-scale-x={String(props.scaleX)}
        data-scale-y={String(props.scaleY)}
        data-rotation={String(props.rotation)}
        data-skew-x={String(props.skewX)}
        data-skew-y={String(props.skewY)}
        data-opacity={String(props.opacity)}
        data-visible={String(props.visible)}
        data-draggable={String(props.draggable)}
        onClick={props.onClick as (() => void) | undefined}
        onDragStart={props.onDragStart as (() => void) | undefined}
        onDragEnd={props.onDragEnd as (() => void) | undefined}
      >
        {props.children as React.ReactNode}
      </div>
    );
  });

  const MockImage = (props: Record<string, unknown>) => (
    <div
      data-testid="text3d-raster"
      data-x={String(props.x)}
      data-y={String(props.y)}
      data-width={String(props.width)}
      data-height={String(props.height)}
      data-listening={String(props.listening)}
    />
  );

  const MockTransformer = forwardRef<unknown>((_props, ref) => {
    useImperativeHandle(ref, () => ({
      nodes: () => undefined,
      getLayer: () => ({ batchDraw: () => undefined }),
    }));
    return <div data-testid="transformer" />;
  });

  return { Group: MockGroup, Image: MockImage, Transformer: MockTransformer };
});

type RendererProps = {
  layer: ResolvedLayerV3 & { source: Text3DLayerV3; type: 'text3d' };
  isSelected: boolean;
  previewScale: number;
  onSelect(): void;
  onInteractionStart(layer: ResolvedLayerV3): void;
  onInteractionFinish(layer: ResolvedLayerV3, node: {
    x(): number;
    y(): number;
    width(): number;
    height(): number;
  }): void;
};

type RendererModule = {
  ResolvedText3DLayer: ComponentType<RendererProps>;
};

async function loadRenderer(): Promise<RendererModule | null> {
  const modulePath = ['.', 'ResolvedText3DLayer'].join('/');
  try {
    return await import(/* @vite-ignore */ modulePath) as RendererModule;
  } catch {
    return null;
  }
}

function requireRenderer(module: RendererModule | null): asserts module is RendererModule {
  expect(module, 'ResolvedText3DLayer module must exist').not.toBeNull();
}

const resolvedTransform = {
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

function layerFixture(options: { alternateFace?: boolean; locked?: boolean } = {}) {
  const source = {
    id: 'text3d-1',
    name: 'Flash Nick',
    type: 'text3d',
    visible: true,
    locked: options.locked ?? false,
    opacity: 0.8,
    transform: { x: 10, y: 10, width: 180, height: 60, rotation: 0, scaleX: 1, scaleY: 1 },
    clips: [],
    text: 'FRONT',
    backText: 'BACK',
    writingMode: 'horizontal',
    fontFamily: 'Impact',
    fontSize: 30,
    align: 'center',
    style: createDefaultText3DStyle(),
  } as unknown as Text3DLayerV3;

  return {
    source,
    id: source.id,
    name: source.name,
    type: 'text3d' as const,
    visible: true,
    locked: options.locked ?? false,
    opacity: 0.6,
    transform: resolvedTransform,
    animation: {
      hueShift: 0,
      blurAmount: 0,
      revealProgress: 0.5,
      chromaticOffset: 0,
      pixelateAmount: 0,
      alternateFace: options.alternateFace ?? false,
    },
  } satisfies ResolvedLayerV3 & { source: Text3DLayerV3; type: 'text3d' };
}

beforeEach(() => {
  rasterSpies.render.mockClear();
});

describe('ResolvedText3DLayer', () => {
  it('renders the raster with negative padding inside resolved logical geometry', async () => {
    const module = await loadRenderer();
    requireRenderer(module);
    const layer = layerFixture();

    render(
      <module.ResolvedText3DLayer
        layer={layer}
        isSelected={false}
        previewScale={1}
        onSelect={() => undefined}
        onInteractionStart={() => undefined}
        onInteractionFinish={() => undefined}
      />,
    );

    expect(rasterSpies.render).toHaveBeenCalledTimes(1);
    const plan = rasterSpies.render.mock.calls[0][0];
    const group = screen.getByTestId('text3d-group');
    const raster = screen.getByTestId('text3d-raster');

    expect(group).toHaveAttribute('data-x', '40');
    expect(group).toHaveAttribute('data-y', '25');
    expect(group).toHaveAttribute('data-width', '180');
    expect(group).toHaveAttribute('data-height', '60');
    expect(group).toHaveAttribute('data-scale-x', '1.2');
    expect(group).toHaveAttribute('data-scale-y', '0.95');
    expect(group).toHaveAttribute('data-rotation', '11');
    expect(group).toHaveAttribute('data-skew-x', '4');
    expect(group).toHaveAttribute('data-skew-y', '-1');
    expect(group).toHaveAttribute('data-opacity', '0.3');
    expect(group).toHaveAttribute('data-visible', 'true');
    expect(raster).toHaveAttribute('data-x', String(-plan.padding));
    expect(raster).toHaveAttribute('data-y', String(-plan.padding));
    expect(raster).toHaveAttribute('data-width', String(plan.logicalWidth + plan.padding * 2));
    expect(raster).toHaveAttribute('data-height', String(plan.logicalHeight + plan.padding * 2));
    expect(raster).toHaveAttribute('data-listening', 'false');
  });

  it('uses resolved alternate-face state before rasterization', async () => {
    const module = await loadRenderer();
    requireRenderer(module);
    const props = {
      isSelected: false,
      previewScale: 1,
      onSelect: () => undefined,
      onInteractionStart: () => undefined,
      onInteractionFinish: () => undefined,
    };
    const { rerender } = render(
      <module.ResolvedText3DLayer layer={layerFixture()} {...props} />,
    );

    expect(rasterSpies.render.mock.calls.at(-1)?.[0].text).toBe('FRONT');

    rerender(
      <module.ResolvedText3DLayer layer={layerFixture({ alternateFace: true })} {...props} />,
    );
    expect(rasterSpies.render.mock.calls.at(-1)?.[0].text).toBe('BACK');
  });

  it('keeps logical group interaction geometry and disables dragging when locked', async () => {
    const module = await loadRenderer();
    requireRenderer(module);
    const onInteractionStart = vi.fn();
    const onInteractionFinish = vi.fn();
    const layer = layerFixture();
    const { rerender } = render(
      <module.ResolvedText3DLayer
        layer={layer}
        isSelected={false}
        previewScale={1}
        onSelect={() => undefined}
        onInteractionStart={onInteractionStart}
        onInteractionFinish={onInteractionFinish}
      />,
    );

    const group = screen.getByTestId('text3d-group');
    expect(group).toHaveAttribute('data-draggable', 'true');
    fireEvent.dragStart(group);
    fireEvent.dragEnd(group);
    expect(onInteractionStart).toHaveBeenCalledWith(layer);
    expect(onInteractionFinish).toHaveBeenCalledTimes(1);
    const geometry = onInteractionFinish.mock.calls[0][1];
    expect(geometry.width()).toBe(180);
    expect(geometry.height()).toBe(60);
    expect(geometry.x()).toBe(40);
    expect(geometry.y()).toBe(25);

    rerender(
      <module.ResolvedText3DLayer
        layer={layerFixture({ locked: true })}
        isSelected={false}
        previewScale={1}
        onSelect={() => undefined}
        onInteractionStart={onInteractionStart}
        onInteractionFinish={onInteractionFinish}
      />,
    );
    expect(screen.getByTestId('text3d-group')).toHaveAttribute('data-draggable', 'false');
  });
});

import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Text3DRenderPlan } from '../../text3d/render-plan';
import { useEditorStore } from '../../store/editor-store';
import { EditorCanvas } from './EditorCanvas';

const rasterSpies = vi.hoisted(() => ({
  render: vi.fn((plan: Text3DRenderPlan) => ({
    canvas: document.createElement('canvas'),
    padding: plan.padding,
    width: Math.ceil(plan.logicalWidth + plan.padding * 2),
    height: Math.ceil(plan.logicalHeight + plan.padding * 2),
  })),
}));

vi.mock('../../text3d/rasterizer', () => ({
  renderText3DToCanvas: rasterSpies.render,
}));

vi.mock('../../animations/useAnimationClock', () => ({
  useAnimationClock: () => 0,
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
    return <div data-testid="resolved-text3d-group">{props.children as ReactNode}</div>;
  });

  const Transformer = forwardRef<unknown>((_props, ref) => {
    useImperativeHandle(ref, () => ({
      nodes: () => undefined,
      getLayer: () => ({ batchDraw: () => undefined }),
    }));
    return null;
  });

  return {
    Stage: ({ children }: { children: ReactNode }) => <section>{children}</section>,
    Layer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Rect: () => null,
    Group,
    Image: () => <div data-testid="resolved-text3d-raster" />,
    Text: () => null,
    Transformer,
  };
});

beforeEach(() => {
  useEditorStore.getState().reset();
  rasterSpies.render.mockClear();
});

describe('EditorCanvas Text3D preview/export parity', () => {
  it('selects Xara front and back faces from the exact requested scene timestamp', () => {
    const textId = useEditorStore.getState().addText('FRONT');
    useEditorStore.getState().updateElement(textId, {
      backText: 'BACK',
      materialPreset: 'xara-gold',
      extrusionDepth: 8,
      extrusionColor: '#7c4800',
    });
    useEditorStore.getState().setElementAnimation(textId, {
      preset: 'xara-double-sided',
      speed: 'normal',
      intensity: 'normal',
      delayMs: 0,
      loop: true,
    });

    const { rerender } = render(<EditorCanvas timeOverrideMs={0} />);
    expect(rasterSpies.render.mock.calls.at(-1)?.[0].text).toBe('FRONT');

    rerender(<EditorCanvas timeOverrideMs={800} />);
    expect(rasterSpies.render.mock.calls.at(-1)?.[0].text).toBe('BACK');
    expect(rasterSpies.render).toHaveBeenCalledTimes(2);
  });
});

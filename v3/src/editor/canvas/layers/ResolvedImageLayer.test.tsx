import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultImageEffects } from '../../../model/project';
import type { ImageLayerV3 } from '../../../model/v3/project-v3';
import type { ResolvedLayerV3 } from '../../../timeline';
import { ResolvedImageLayer } from './ResolvedImageLayer';

const nodeSpies = vi.hoisted(() => ({ cache: vi.fn(), clearCache: vi.fn(), batchDraw: vi.fn() }));

vi.mock('react-konva', async () => {
  const React = await import('react');
  const { forwardRef, useImperativeHandle } = React;
  const MockImage = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    useImperativeHandle(ref, () => ({
      x: () => Number(props.x ?? 0),
      y: () => Number(props.y ?? 0),
      width: () => Number(props.width ?? 0),
      height: () => Number(props.height ?? 0),
      rotation: () => Number(props.rotation ?? 0),
      scaleX: () => Number(props.scaleX ?? 1),
      scaleY: () => Number(props.scaleY ?? 1),
      cache: nodeSpies.cache,
      clearCache: nodeSpies.clearCache,
      getLayer: () => ({ batchDraw: nodeSpies.batchDraw }),
    }));
    const ghost = props.name === 'animation-chromatic-ghost';
    return (
      <div
        data-testid={ghost ? 'ghost' : `resolved-image-${String(props.id)}`}
        data-x={String(props.x)}
        data-y={String(props.y)}
        data-scale-x={String(props.scaleX)}
        data-scale-y={String(props.scaleY)}
        data-rotation={String(props.rotation)}
        data-skew-x={String(props.skewX)}
        data-skew-y={String(props.skewY)}
        data-opacity={String(props.opacity)}
        data-visible={String(props.visible)}
        data-hue={String(props.hue ?? '')}
        data-blur={String(props.blurRadius ?? '')}
        data-pixel={String(props.pixelSize ?? '')}
        data-filter-count={String(Array.isArray(props.filters) ? props.filters.length : 0)}
      />
    );
  });
  const MockTransformer = forwardRef<unknown>((_props, ref) => {
    useImperativeHandle(ref, () => ({ nodes: () => undefined, getLayer: () => ({ batchDraw: () => undefined }) }));
    return <div data-testid="transformer" />;
  });
  return { Image: MockImage, Transformer: MockTransformer };
});

function layerFixture(): ResolvedLayerV3 & { source: ImageLayerV3; type: 'image' } {
  const source: ImageLayerV3 = {
    id: 'image-1',
    name: 'Image',
    type: 'image',
    visible: true,
    locked: false,
    opacity: 0.8,
    transform: { x: 10, y: 20, width: 120, height: 80, rotation: 2, scaleX: 1, scaleY: 1 },
    clips: [],
    assetUrl: 'blob:image-1',
    effects: {
      ...createDefaultImageEffects(),
      hue: 20,
      blurRadius: 2,
      pixelate: 3,
    },
  };
  return {
    source,
    id: source.id,
    name: source.name,
    type: 'image',
    visible: true,
    locked: false,
    opacity: 0.6,
    transform: { x: 31, y: 44, width: 120, height: 80, rotation: 17, scaleX: 1.25, scaleY: 0.9, skewX: 3, skewY: -2 },
    animation: {
      hueShift: 15,
      blurAmount: 4,
      revealProgress: 0.5,
      chromaticOffset: 6,
      pixelateAmount: 5,
      alternateFace: false,
    },
  };
}

beforeEach(() => {
  nodeSpies.cache.mockClear();
  nodeSpies.clearCache.mockClear();
  class PassiveImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {}
  }
  Object.defineProperty(window, 'Image', { configurable: true, writable: true, value: PassiveImage });
});

describe('ResolvedImageLayer', () => {
  it('renders geometry and opacity from resolved scene state without re-evaluating animation', () => {
    render(
      <ResolvedImageLayer
        layer={layerFixture()}
        isSelected={false}
        previewScale={1}
        onSelect={() => undefined}
        onInteractionStart={() => undefined}
        onInteractionFinish={() => undefined}
      />,
    );

    const image = screen.getByTestId('resolved-image-image-1');
    expect(image).toHaveAttribute('data-x', '31');
    expect(image).toHaveAttribute('data-y', '44');
    expect(image).toHaveAttribute('data-scale-x', '1.25');
    expect(image).toHaveAttribute('data-scale-y', '0.9');
    expect(image).toHaveAttribute('data-rotation', '17');
    expect(image).toHaveAttribute('data-skew-x', '3');
    expect(image).toHaveAttribute('data-skew-y', '-2');
    expect(image).toHaveAttribute('data-opacity', '0.3');
    expect(screen.getAllByTestId('ghost')).toHaveLength(2);
  });

  it('combines source image effects with resolved animation filter channels', () => {
    render(
      <ResolvedImageLayer
        layer={layerFixture()}
        isSelected={false}
        previewScale={1}
        onSelect={() => undefined}
        onInteractionStart={() => undefined}
        onInteractionFinish={() => undefined}
      />,
    );

    const image = screen.getByTestId('resolved-image-image-1');
    expect(image).toHaveAttribute('data-hue', '35');
    expect(image).toHaveAttribute('data-blur', '6');
    expect(image).toHaveAttribute('data-pixel', '8');
    expect(Number(image.getAttribute('data-filter-count'))).toBeGreaterThan(0);
  });
});

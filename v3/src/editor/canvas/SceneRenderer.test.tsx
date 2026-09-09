import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type {
  ParticleLayerV3,
  FrameLayerV3,
  ProjectV3,
  Text3DLayerV3,
} from '../../model/v3/project-v3';
import { createDefaultText3DStyle } from '../../text3d/material-recipes';
import { evaluateScene } from '../../timeline';
import { SceneRenderer } from './SceneRenderer';

vi.mock('../../text3d/rasterizer', () => ({
  renderText3DToCanvas: (plan: { padding: number; logicalWidth: number; logicalHeight: number }) => ({
    canvas: document.createElement('canvas'),
    padding: plan.padding,
    width: plan.logicalWidth + plan.padding * 2,
    height: plan.logicalHeight + plan.padding * 2,
  }),
}));

vi.mock('react-konva', async () => {
  const React = await import('react');
  const { forwardRef, useImperativeHandle } = React;

  const MockGroup = forwardRef<unknown, { children?: React.ReactNode } & Record<string, unknown>>((props, ref) => {
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
    const isText3D = props.name === 'resolved-text3d-layer';
    return (
      <div
        data-testid={isText3D ? 'text3d-group' : String(props.name ?? 'group')}
        data-visible={String(props.visible ?? true)}
        data-opacity={String(props.opacity ?? 1)}
        data-x={String(props.x ?? 0)}
        data-y={String(props.y ?? 0)}
      >
        {isText3D ? <span data-testid="text3d-render">text3d:{String(props.id)}</span> : null}
        {props.children}
      </div>
    );
  });

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
    return <span data-testid="flat-text">flat:{String(props.id)}</span>;
  });

  const MockTransformer = forwardRef<unknown>((_props, ref) => {
    useImperativeHandle(ref, () => ({ nodes: () => undefined, getLayer: () => ({ batchDraw: () => undefined }) }));
    return null;
  });

  return {
    Rect: (props: Record<string, unknown>) => (
      <div
        data-testid={props.name === 'canvas-background' ? 'scene-background' : String(props.name ?? 'rect')}
        data-fill={String(props.fill ?? '')}
      />
    ),
    Group: MockGroup,
    Text: MockText,
    Image: () => <span data-testid="text3d-image" />,
    Transformer: MockTransformer,
  };
});

vi.mock('../../decorations/renderer', () => ({
  DecorationRenderer: ({ layers, timeMs }: { layers: Array<{ id: string }>; timeMs: number }) => (
    <span data-testid="particle-render">particle:{layers[0]?.id}:t{timeMs}</span>
  ),
}));

vi.mock('../../frames/renderer', () => ({
  FrameRenderer: ({ frame, timeMs }: { frame: { preset: string }; timeMs: number }) => (
    <span data-testid="frame-render">frame:{frame.preset}:t{timeMs}</span>
  ),
}));

function baseLayerFields(id: string) {
  return {
    id,
    name: id,
    visible: true,
    locked: false,
    opacity: 0.8,
    transform: { x: 4, y: 6, width: 300, height: 180, rotation: 0, scaleX: 1, scaleY: 1 },
    clips: [],
  };
}

function text3dFixture(): Text3DLayerV3 {
  return {
    ...baseLayerFields('text3d-1'),
    transform: { x: 20, y: 30, width: 133, height: 33, rotation: 0, scaleX: 1, scaleY: 1 },
    type: 'text3d',
    text: 'SENOL',
    backText: 'DOGAN',
    writingMode: 'horizontal',
    fontFamily: 'Impact',
    fontSize: 28,
    align: 'center',
    style: createDefaultText3DStyle(),
  } as unknown as Text3DLayerV3;
}

function projectFixture(): ProjectV3 {
  const particle: ParticleLayerV3 = {
    ...baseLayerFields('particle-1'),
    type: 'particle',
    preset: 'stars',
    count: 8,
    speed: 'normal',
  };
  const frame: FrameLayerV3 = {
    ...baseLayerFields('frame-1'),
    type: 'frame',
    preset: 'gold',
    width: 8,
  };
  return {
    version: 3,
    id: 'scene-project',
    name: 'Scene',
    mode: 'classic',
    canvas: { width: 300, height: 180, background: '#112233' },
    timeline: { durationMs: 3000, fps: 24 },
    layers: [particle, text3dFixture(), frame],
    exportSettings: { scale: 1, gifProfile: 'balanced' },
  };
}

const noop = () => undefined;

describe('SceneRenderer', () => {
  it('renders particle, dedicated Text3D raster, and frame in exact scene order', () => {
    const scene = evaluateScene(projectFixture(), 640);
    const { container } = render(
      <SceneRenderer
        scene={scene}
        selectedElementId={null}
        previewScale={1}
        onSelectElement={noop}
        onInteractionStart={noop}
        onInteractionFinish={noop}
      />,
    );

    expect(container.textContent).toContain('particle:particle-1:t640text3d:text3d-1frame:gold:t640');
    expect(container.querySelector('[data-testid="text3d-render"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="scene-background"]')).toHaveAttribute('data-fill', '#112233');
  });

  it('passes resolved visibility, opacity and transform to particle/frame groups', () => {
    const project = projectFixture();
    project.layers[0].visible = false;
    project.layers[0].opacity = 0.5;
    project.layers[0].transform.x = 19;
    project.layers[0].transform.y = 23;
    const scene = evaluateScene(project, 800);

    const { container } = render(
      <SceneRenderer
        scene={scene}
        selectedElementId={null}
        previewScale={1}
        onSelectElement={noop}
        onInteractionStart={noop}
        onInteractionFinish={noop}
      />,
    );

    const groups = container.querySelectorAll('[data-testid="resolved-layer"]');
    expect(groups[0]).toHaveAttribute('data-visible', 'false');
    expect(groups[0]).toHaveAttribute('data-opacity', '0.5');
    expect(groups[0]).toHaveAttribute('data-x', '19');
    expect(groups[0]).toHaveAttribute('data-y', '23');
  });
});

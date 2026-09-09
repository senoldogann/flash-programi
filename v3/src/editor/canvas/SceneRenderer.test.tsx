import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ParticleLayerV3, FrameLayerV3, ProjectV3 } from '../../model/v3/project-v3';
import { evaluateScene } from '../../timeline';
import { SceneRenderer } from './SceneRenderer';

vi.mock('react-konva', async () => {
  const React = await import('react');
  return {
    Rect: (props: Record<string, unknown>) => (
      <div
        data-testid={props.name === 'canvas-background' ? 'scene-background' : String(props.name ?? 'rect')}
        data-fill={String(props.fill ?? '')}
      />
    ),
    Group: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div
        data-testid={String(props.name ?? 'group')}
        data-visible={String(props.visible ?? true)}
        data-opacity={String(props.opacity ?? 1)}
        data-x={String(props.x ?? 0)}
        data-y={String(props.y ?? 0)}
      >
        {children}
      </div>
    ),
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
    layers: [particle, frame],
    exportSettings: { scale: 1, gifProfile: 'balanced' },
  };
}

const noop = () => undefined;

describe('SceneRenderer', () => {
  it('renders the background and resolved layers in exact scene order', () => {
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

    expect(container.textContent).toContain('particle:particle-1:t640frame:gold:t640');
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

import { describe, expect, it } from 'vitest';
import {
  createDefaultProjectV3,
  type AnimationClipV3,
  type ProjectV3,
  type TextLayerV3,
} from '../model/v3/project-v3';
import { evaluateScene } from './scene-evaluator';

function clip(
  id: string,
  effect: AnimationClipV3['effect'],
  overrides: Partial<AnimationClipV3> = {},
): AnimationClipV3 {
  return {
    id,
    effect,
    startMs: 0,
    durationMs: 3000,
    loop: true,
    speed: 'normal',
    intensity: 'normal',
    easing: 'linear',
    ...overrides,
  };
}

function textLayer(
  id: string,
  overrides: Partial<TextLayerV3> = {},
): TextLayerV3 {
  return {
    id,
    name: id,
    type: 'text',
    visible: true,
    locked: false,
    opacity: 0.8,
    transform: {
      x: 10,
      y: 20,
      width: 120,
      height: 48,
      rotation: 5,
      scaleX: 1,
      scaleY: 1,
    },
    clips: [],
    text: 'SENOL',
    writingMode: 'horizontal',
    fontFamily: 'Arial',
    fontSize: 32,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    shadowColor: '#000000',
    shadowBlur: 8,
    align: 'center',
    ...overrides,
  };
}

function project(layers: ProjectV3['layers']): ProjectV3 {
  return {
    ...createDefaultProjectV3(),
    id: 'project-v3-timeline',
    name: 'Timeline Test',
    mode: 'neo',
    canvas: {
      width: 300,
      height: 100,
      background: '#12051f',
    },
    timeline: {
      durationMs: 3000,
      fps: 24,
    },
    layers,
  };
}

describe('V3 scene evaluator', () => {
  it('resolves a static layer without changing its visual state', () => {
    const source = textLayer('static');
    const resolved = evaluateScene(project([source]), 1200);

    expect(resolved).toMatchObject({
      projectId: 'project-v3-timeline',
      projectName: 'Timeline Test',
      mode: 'neo',
      timeMs: 1200,
      canvas: {
        width: 300,
        height: 100,
        background: '#12051f',
      },
      timeline: {
        durationMs: 3000,
        fps: 24,
      },
    });

    expect(resolved.layers).toHaveLength(1);
    expect(resolved.layers[0]).toMatchObject({
      id: 'static',
      type: 'text',
      name: 'static',
      visible: true,
      locked: false,
      opacity: 0.8,
      transform: {
        x: 10,
        y: 20,
        width: 120,
        height: 48,
        rotation: 5,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
      },
      animation: {
        hueShift: 0,
        blurAmount: 0,
        revealProgress: 1,
        chromaticOffset: 0,
        pixelateAmount: 0,
        alternateFace: false,
      },
    });
    expect(resolved.layers[0].source).toBe(source);
  });

  it('combines simultaneous clips into the base layer transform', () => {
    const source = textLayer('animated', {
      clips: [
        clip('pulse', 'pulse'),
        clip('float', 'float'),
      ],
    });

    const resolved = evaluateScene(project([source]), 400).layers[0];

    expect(resolved.transform.x).toBeCloseTo(10, 8);
    expect(resolved.transform.y).toBeCloseTo(30, 8);
    expect(resolved.transform.rotation).toBeCloseTo(5, 8);
    expect(resolved.transform.scaleX).toBeCloseTo(1.08, 8);
    expect(resolved.transform.scaleY).toBeCloseTo(1.08, 8);
    expect(resolved.opacity).toBeCloseTo(0.8, 8);
  });

  it('carries non-geometric animation channels separately for renderers', () => {
    const source = textLayer('effects', {
      clips: [
        clip('focus', 'focus-pulse'),
        clip('reveal', 'reveal'),
        clip('xara', 'xara-double-sided'),
      ],
    });

    const resolved = evaluateScene(project([source]), 800).layers[0];

    expect(resolved.animation.blurAmount).toBeCloseTo(1, 8);
    expect(resolved.animation.revealProgress).toBeCloseTo(0.5, 8);
    expect(resolved.animation.alternateFace).toBe(true);
  });

  it('preserves source layer order and invisible layers', () => {
    const first = textLayer('first');
    const hidden = textLayer('hidden', { visible: false });
    const third = textLayer('third');

    const resolved = evaluateScene(project([first, hidden, third]), 500);

    expect(resolved.layers.map((layer) => layer.id)).toEqual(['first', 'hidden', 'third']);
    expect(resolved.layers[1].visible).toBe(false);
  });

  it('clamps requested time to the project timeline bounds', () => {
    const sourceProject = project([textLayer('static')]);

    expect(evaluateScene(sourceProject, -999).timeMs).toBe(0);
    expect(evaluateScene(sourceProject, 99_999).timeMs).toBe(3000);
  });

  it('preserves Classic and Neo mode without changing evaluator behavior', () => {
    const neoProject = project([textLayer('neo')]);
    const classicProject: ProjectV3 = {
      ...neoProject,
      id: 'classic-project',
      mode: 'classic',
    };

    expect(evaluateScene(neoProject, 400).mode).toBe('neo');
    expect(evaluateScene(classicProject, 400).mode).toBe('classic');
    expect(evaluateScene(neoProject, 400).layers[0].transform).toEqual(
      evaluateScene(classicProject, 400).layers[0].transform,
    );
  });

  it('does not mutate the project or any source layer while evaluating', () => {
    const sourceProject = project([
      textLayer('immutable', {
        clips: [clip('spin', 'spin')],
      }),
    ]);
    const before = JSON.stringify(sourceProject);

    evaluateScene(sourceProject, 600);
    evaluateScene(sourceProject, 1800);

    expect(JSON.stringify(sourceProject)).toBe(before);
  });
});

import { describe, expect, it } from 'vitest';
import { evaluateAnimation } from '../../animations/evaluator';
import {
  createDefaultAnimation,
  createDefaultImageEffects,
  createEmptyProject,
  type Project,
} from '../../model/project';
import { resolveEditorScene, resolvedLayerAnimation } from './render-scene';

function projectFixture(): Project {
  const project = createEmptyProject();
  return {
    ...project,
    id: 'project-render-adapter',
    name: 'Renderer Adapter',
    width: 320,
    height: 180,
    background: '#123456',
    durationMs: 3000,
    elements: [
      {
        id: 'image-1',
        name: 'Photo',
        type: 'image',
        x: 20,
        y: 30,
        width: 120,
        height: 90,
        rotation: 7,
        opacity: 0.8,
        visible: true,
        locked: false,
        assetUrl: 'blob:test-image',
        effects: {
          ...createDefaultImageEffects(),
          hue: 18,
          blurRadius: 2,
          pixelate: 3,
        },
        animation: {
          ...createDefaultAnimation(),
          preset: 'slide',
          direction: 'right',
          speed: 'normal',
          intensity: 'strong',
        },
      },
      {
        id: 'text-1',
        name: 'Nick',
        type: 'text',
        x: 40,
        y: 75,
        width: 180,
        height: 55,
        rotation: -4,
        opacity: 0.9,
        visible: true,
        locked: false,
        text: 'FRONT',
        backText: 'BACK',
        writingMode: 'horizontal',
        fontFamily: 'Arial',
        fontSize: 32,
        fill: '#ffffff',
        stroke: '#111111',
        strokeWidth: 2,
        shadowColor: '#000000',
        shadowBlur: 5,
        align: 'center',
        materialPreset: 'xara-gold',
        extrusionDepth: 5,
        extrusionColor: '#7a4d00',
        animation: {
          ...createDefaultAnimation(),
          preset: 'xara-double-sided',
        },
      },
    ],
  };
}

describe('resolved editor scene adapter', () => {
  it('migrates the V2 editor project and resolves the same legacy image motion at a timestamp', () => {
    const project = projectFixture();
    const timeMs = 600;
    const legacy = evaluateAnimation(project.elements[0].animation, timeMs);
    const scene = resolveEditorScene(project, timeMs);
    const image = scene.layers.find((layer) => layer.id === 'image-1');

    expect(image).toBeDefined();
    expect(scene.canvas).toEqual({ width: 320, height: 180, background: '#123456' });
    expect(scene.layers.slice(0, 2).map((layer) => layer.id)).toEqual(['image-1', 'text-1']);
    expect(image?.transform.x).toBeCloseTo(project.elements[0].x + legacy.x, 8);
    expect(image?.transform.y).toBeCloseTo(project.elements[0].y + legacy.y, 8);
    expect(image?.transform.rotation).toBeCloseTo(project.elements[0].rotation + legacy.rotation, 8);
    expect(image?.transform.scaleX).toBeCloseTo(legacy.scaleX, 8);
    expect(image?.transform.scaleY).toBeCloseTo(legacy.scaleY, 8);
  });

  it('exposes legacy-equivalent animation deltas for interaction compensation', () => {
    const project = projectFixture();
    const timeMs = 600;
    const legacy = evaluateAnimation(project.elements[0].animation, timeMs);
    const scene = resolveEditorScene(project, timeMs);
    const image = scene.layers.find((layer) => layer.id === 'image-1');
    if (!image) throw new Error('image layer missing');

    const animation = resolvedLayerAnimation(image);
    expect(animation.x).toBeCloseTo(legacy.x, 8);
    expect(animation.y).toBeCloseTo(legacy.y, 8);
    expect(animation.rotation).toBeCloseTo(legacy.rotation, 8);
    expect(animation.scaleX).toBeCloseTo(legacy.scaleX, 8);
    expect(animation.scaleY).toBeCloseTo(legacy.scaleY, 8);
    expect(animation.opacity).toBeCloseTo(legacy.opacity, 8);
    expect(animation.revealProgress).toBeCloseTo(legacy.revealProgress, 8);
  });

  it('keeps image effect data on the source and resolved animation channels separate', () => {
    const project = projectFixture();
    project.elements[0].animation = {
      ...project.elements[0].animation,
      preset: 'pixel-pulse',
    };

    const scene = resolveEditorScene(project, 400);
    const image = scene.layers.find((layer) => layer.id === 'image-1');
    if (!image || image.source.type !== 'image') throw new Error('image layer missing');

    expect(image.source.effects.hue).toBe(18);
    expect(image.source.effects.blurRadius).toBe(2);
    expect(image.source.effects.pixelate).toBe(3);
    expect(image.animation.pixelateAmount).toBeGreaterThan(0);
  });

  it('resolves Xara alternate face through the V3 scene evaluator', () => {
    const scene = resolveEditorScene(projectFixture(), 800);
    const text = scene.layers.find((layer) => layer.id === 'text-1');

    expect(text?.source.type).toBe('text3d');
    expect(text?.animation.alternateFace).toBe(true);
  });

  it('does not mutate the V2 editor project while resolving', () => {
    const project = projectFixture();
    const before = structuredClone(project);

    resolveEditorScene(project, 913);

    expect(project).toEqual(before);
  });
});

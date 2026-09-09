import { describe, expect, it } from 'vitest';
import { createDefaultImageEffects } from '../project';
import { createDefaultText3DStyle } from '../../text3d/material-recipes';
import {
  createDefaultProjectV3,
  type AnimationClipV3,
  type SceneLayerV3,
} from './project-v3';
import { parseProjectV3 } from './schema-v3';

const baseLayer = {
  visible: true,
  locked: false,
  opacity: 1,
  transform: {
    x: 10,
    y: 12,
    width: 120,
    height: 70,
    rotation: 4,
    scaleX: 1,
    scaleY: 1,
  },
  clips: [] as AnimationClipV3[],
};

function sampleLayers(): SceneLayerV3[] {
  return [
    {
      ...baseLayer,
      id: 'image-1',
      name: 'Fotoğraf',
      type: 'image',
      assetUrl: 'blob:test-image',
      effects: createDefaultImageEffects(),
    },
    {
      ...baseLayer,
      id: 'text-1',
      name: 'Nick',
      type: 'text',
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
    },
    {
      ...baseLayer,
      id: 'text3d-1',
      name: 'Xara Nick',
      type: 'text3d',
      text: 'SENOL',
      backText: 'DOGAN',
      writingMode: 'horizontal',
      fontFamily: 'Impact',
      fontSize: 32,
      align: 'center',
      style: createDefaultText3DStyle(),
    },
    {
      ...baseLayer,
      id: 'particles-1',
      name: 'Decoration: stars',
      type: 'particle',
      preset: 'stars',
      count: 12,
      speed: 'normal',
    },
    {
      ...baseLayer,
      id: 'frame-1',
      name: 'Frame',
      type: 'frame',
      preset: 'neon',
      width: 6,
    },
  ];
}

describe('Project V3 schema', () => {
  it('accepts the default project without changing it', () => {
    const project = createDefaultProjectV3();
    expect(parseProjectV3(project)).toEqual(project);
  });

  it('accepts every Slice 1 layer family', () => {
    const project = {
      ...createDefaultProjectV3(),
      layers: sampleLayers(),
    };

    expect(parseProjectV3(project).layers).toEqual(project.layers);
  });

  it('accepts supported clip easing values and rejects unsupported easing', () => {
    const project = createDefaultProjectV3();
    const [textLayer] = sampleLayers().filter((layer) => layer.type === 'text');

    for (const easing of ['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const) {
      const parsed = parseProjectV3({
        ...project,
        layers: [{
          ...textLayer,
          clips: [{
            id: `clip-${easing}`,
            effect: 'pulse',
            startMs: 0,
            durationMs: 1000,
            loop: true,
            speed: 'normal',
            intensity: 'normal',
            easing,
          }],
        }],
      });

      expect(parsed.layers[0].clips[0].easing).toBe(easing);
    }

    expect(() => parseProjectV3({
      ...project,
      layers: [{
        ...textLayer,
        clips: [{
          id: 'clip-invalid-easing',
          effect: 'pulse',
          startMs: 0,
          durationMs: 1000,
          loop: true,
          speed: 'normal',
          intensity: 'normal',
          easing: 'elastic-chaos',
        }],
      }],
    })).toThrow();
  });

  it('rejects unknown root and canvas fields', () => {
    const project = createDefaultProjectV3();

    expect(() => parseProjectV3({
      ...project,
      unexpectedRootField: true,
    })).toThrow();

    expect(() => parseProjectV3({
      ...project,
      canvas: {
        ...project.canvas,
        unexpectedCanvasField: true,
      },
    })).toThrow();
  });

  it('rejects unknown fields in every Slice 1 layer family', () => {
    const project = createDefaultProjectV3();

    for (const layer of sampleLayers()) {
      expect(() => parseProjectV3({
        ...project,
        layers: [{
          ...layer,
          unexpectedLayerField: true,
        }],
      })).toThrow();
    }
  });

  it('rejects unknown clip fields and unsupported future versions', () => {
    const project = createDefaultProjectV3();
    const [textLayer] = sampleLayers().filter((layer) => layer.type === 'text');

    expect(() => parseProjectV3({
      ...project,
      layers: [{
        ...textLayer,
        clips: [{
          id: 'clip-1',
          effect: 'pulse',
          startMs: 0,
          durationMs: 1000,
          loop: true,
          speed: 'normal',
          intensity: 'normal',
          unexpectedClipField: true,
        }],
      }],
    })).toThrow();

    expect(() => parseProjectV3({ ...project, version: 4 })).toThrow();
  });
});
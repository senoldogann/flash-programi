import { describe, expect, it } from 'vitest';
import {
  createDefaultAnimation,
  createDefaultImageEffects,
  createEmptyProject,
  type ImageElement,
  type Project,
  type TextElement,
} from '../project';
import { createDefaultProjectV3 } from './project-v3';
import { migrateProjectToV3 } from './migrate-to-v3';

function buildV2Project(): Project {
  const base = createEmptyProject();

  const image: ImageElement = {
    id: 'image-1',
    type: 'image',
    name: 'Portrait',
    assetUrl: 'blob:portrait',
    x: 14,
    y: 9,
    width: 126,
    height: 82,
    rotation: 7,
    opacity: 0.85,
    visible: true,
    locked: false,
    animation: {
      preset: 'camera-pan',
      speed: 'fast',
      intensity: 'strong',
      delayMs: 250,
      loop: false,
      direction: 'left',
    },
    effects: {
      ...createDefaultImageEffects(),
      brightness: 0.2,
      contrast: 18,
      saturation: 0.35,
      temperature: 12,
      vignette: 0.3,
    },
  };

  const flatText: TextElement = {
    id: 'text-flat',
    type: 'text',
    name: 'Flat Nick',
    text: 'SENOL',
    writingMode: 'horizontal',
    x: 145,
    y: 15,
    width: 130,
    height: 42,
    rotation: -3,
    opacity: 1,
    visible: true,
    locked: false,
    animation: createDefaultAnimation(),
    fontFamily: 'Arial',
    fontSize: 32,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 2,
    shadowColor: '#000000',
    shadowBlur: 8,
    align: 'center',
  };

  const xaraText: TextElement = {
    id: 'text-xara',
    type: 'text',
    name: 'Xara Nick',
    text: 'SENOL',
    backText: 'DOGAN',
    writingMode: 'horizontal',
    x: 128,
    y: 52,
    width: 152,
    height: 38,
    rotation: 0,
    opacity: 0.95,
    visible: true,
    locked: false,
    animation: {
      ...createDefaultAnimation(),
      preset: 'xara-double-sided',
      speed: 'slow',
      intensity: 'normal',
    },
    fontFamily: 'Impact',
    fontSize: 30,
    fill: '#ffd75a',
    stroke: '#4b2b00',
    strokeWidth: 2,
    shadowColor: '#000000',
    shadowBlur: 8,
    align: 'center',
    materialPreset: 'xara-gold',
    extrusionDepth: 8,
    extrusionColor: '#7c4800',
  };

  return {
    ...base,
    id: 'v2-project',
    name: 'Legacy Flash',
    width: 300,
    height: 100,
    durationMs: 3000,
    fps: 24,
    background: '#12051f',
    elements: [image, flatText, xaraText],
    decorations: [
      {
        id: 'stars-1',
        preset: 'stars',
        count: 12,
        opacity: 0.8,
        speed: 'normal',
      },
      {
        id: 'hearts-1',
        preset: 'hearts',
        count: 7,
        opacity: 0.55,
        speed: 'slow',
      },
    ],
    frame: {
      preset: 'neon',
      width: 6,
    },
    exportSettings: {
      scale: 2,
      gifProfile: 'quality',
    },
  };
}

const legacyV1 = {
  version: 1,
  id: 'v1-project',
  name: 'V1 Flash',
  width: 133,
  height: 33,
  durationMs: 1800,
  fps: 15,
  background: '#000000',
  elements: [],
  decorations: [],
  frame: {
    preset: 'none',
    width: 4,
  },
} as const;

describe('migrateProjectToV3', () => {
  it('maps the V2 project envelope and preserves paint order', () => {
    const source = buildV2Project();
    const migrated = migrateProjectToV3(source);

    expect(migrated).toMatchObject({
      version: 3,
      id: 'v2-project',
      name: 'Legacy Flash',
      mode: 'classic',
      canvas: {
        width: 300,
        height: 100,
        background: '#12051f',
      },
      timeline: {
        durationMs: 3000,
        fps: 24,
      },
      exportSettings: {
        scale: 2,
        gifProfile: 'quality',
      },
    });

    expect(migrated.layers.map((layer) => layer.type)).toEqual([
      'image',
      'text',
      'text3d',
      'particle',
      'particle',
      'frame',
    ]);
  });

  it('preserves image geometry, effects, and animation semantics', () => {
    const source = buildV2Project();
    const migrated = migrateProjectToV3(source);
    const image = migrated.layers.find((layer) => layer.id === 'image-1');

    expect(image).toMatchObject({
      id: 'image-1',
      name: 'Portrait',
      type: 'image',
      visible: true,
      locked: false,
      opacity: 0.85,
      transform: {
        x: 14,
        y: 9,
        width: 126,
        height: 82,
        rotation: 7,
        scaleX: 1,
        scaleY: 1,
      },
      assetUrl: 'blob:portrait',
      effects: source.elements[0].type === 'image' ? source.elements[0].effects : undefined,
      clips: [{
        id: 'image-1-animation',
        effect: 'camera-pan',
        startMs: 250,
        durationMs: 2750,
        loop: false,
        speed: 'fast',
        intensity: 'strong',
        direction: 'left',
        easing: 'linear',
      }],
    });
  });

  it('promotes an opted-in V2 image to a dedicated V3 subject cutout layer', () => {
    const source = buildV2Project();
    const first = source.elements[0];
    if (first.type !== 'image') throw new Error('fixture image missing');
    first.role = 'subject';

    const subject = migrateProjectToV3(source).layers.find((layer) => layer.id === 'image-1');

    expect(subject).toMatchObject({
      type: 'subject',
      assetUrl: 'blob:portrait',
      cutout: { mode: 'alpha' },
    });
  });

  it('keeps flat text flat and promotes Xara/extruded text to explicit text3d style', () => {
    const migrated = migrateProjectToV3(buildV2Project());
    const flat = migrated.layers.find((layer) => layer.id === 'text-flat');
    const xara = migrated.layers.find((layer) => layer.id === 'text-xara');

    expect(flat).toMatchObject({
      type: 'text',
      text: 'SENOL',
      clips: [],
      transform: {
        x: 145,
        y: 15,
        width: 130,
        height: 42,
        rotation: -3,
        scaleX: 1,
        scaleY: 1,
      },
    });

    expect(xara).toMatchObject({
      type: 'text3d',
      text: 'SENOL',
      backText: 'DOGAN',
      style: {
        extrusion: { depth: 8, angleDeg: 45 },
        surfaces: {
          front: {
            color: expect.any(String),
            metallicity: expect.any(Number),
          },
          side: {
            color: '#7c4800',
            metallicity: expect.any(Number),
          },
          back: {
            color: expect.any(String),
            metallicity: expect.any(Number),
          },
        },
        outline: { color: '#4b2b00', width: 2 },
        shadow: {
          color: '#000000',
          blur: 8,
          offsetX: expect.any(Number),
          offsetY: expect.any(Number),
          opacity: expect.any(Number),
        },
      },
      clips: [{
        id: 'text-xara-animation',
        effect: 'xara-double-sided',
        startMs: 0,
        durationMs: 3000,
        loop: true,
        speed: 'slow',
        intensity: 'normal',
        easing: 'linear',
      }],
    });
    expect(xara).not.toHaveProperty('materialPreset');
    expect(xara).not.toHaveProperty('extrusionDepth');
    expect(xara).not.toHaveProperty('extrusionColor');
  });

  it('maps decorations and frame to deterministic full-canvas layers', () => {
    const migrated = migrateProjectToV3(buildV2Project());
    const stars = migrated.layers.find((layer) => layer.id === 'stars-1');
    const hearts = migrated.layers.find((layer) => layer.id === 'hearts-1');
    const frame = migrated.layers.find((layer) => layer.id === 'project-frame');

    expect(stars).toMatchObject({
      type: 'particle',
      name: 'Decoration: stars',
      opacity: 0.8,
      preset: 'stars',
      count: 12,
      speed: 'normal',
      transform: {
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
      clips: [],
    });

    expect(hearts).toMatchObject({
      type: 'particle',
      preset: 'hearts',
      count: 7,
      opacity: 0.55,
      speed: 'slow',
    });

    expect(frame).toMatchObject({
      id: 'project-frame',
      type: 'frame',
      name: 'Frame: neon',
      preset: 'neon',
      width: 6,
      opacity: 1,
      clips: [],
      transform: {
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
    });
  });

  it('omits a none frame and supports the V1 -> V2 -> V3 chain', () => {
    const migrated = migrateProjectToV3(legacyV1);

    expect(migrated.version).toBe(3);
    expect(migrated.id).toBe('v1-project');
    expect(migrated.canvas).toEqual({
      width: 133,
      height: 33,
      background: '#000000',
    });
    expect(migrated.layers).toEqual([]);
    expect(migrated.exportSettings).toEqual({
      scale: 1,
      gifProfile: 'balanced',
    });
  });

  it('validates already-V3 data without rewriting it', () => {
    const source = {
      ...createDefaultProjectV3(),
      id: 'already-v3',
      mode: 'neo' as const,
    };

    expect(migrateProjectToV3(source)).toEqual(source);
  });

  it('rejects unsupported future versions', () => {
    expect(() => migrateProjectToV3({
      ...createDefaultProjectV3(),
      version: 99,
    })).toThrow();
  });
});
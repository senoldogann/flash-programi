import { describe, expect, it } from 'vitest';
import {
  createDefaultAnimation,
  createEmptyProject,
  type Project,
  type TextElement,
} from '../model/project';
import { createDefaultProjectV3 } from '../model/v3/project-v3';
import { migrateProjectToV3 } from '../model/v3/migrate-to-v3';
import { parseProjectV3 } from '../model/v3/schema-v3';

const expectedStyle = {
  bevel: { size: 2, strength: 0.7 },
  extrusion: { depth: 8, angleDeg: 45 },
  surfaces: {
    front: {
      color: '#f6c84e',
      gradient: [
        { offset: 0, color: '#fffbe0' },
        { offset: 1, color: '#6d3f00' },
      ],
      metallicity: 0.8,
    },
    side: {
      color: '#7c4800',
      gradient: [],
      metallicity: 0.45,
    },
    back: {
      color: '#8c5a12',
      gradient: [],
      metallicity: 0.55,
    },
  },
  outline: { color: '#4b2b00', width: 2 },
  shadow: {
    color: '#000000',
    blur: 8,
    offsetX: 2,
    offsetY: 3,
    opacity: 0.8,
  },
  gloss: { strength: 0.7, size: 0.42 },
  texture: { kind: 'none' as const, strength: 0 },
  light: {
    azimuthDeg: -45,
    elevationDeg: 35,
    intensity: 0.9,
    ambient: 0.3,
  },
};

const compatibilityPaintFields = {
  fill: '#ffd75a',
  stroke: '#4b2b00',
  strokeWidth: 2,
  shadowColor: '#000000',
  shadowBlur: 8,
  materialPreset: 'xara-gold' as const,
  extrusionDepth: 8,
  extrusionColor: '#7c4800',
};

function buildLegacyText3DProject(): Project {
  const base = createEmptyProject();
  const text: TextElement = {
    id: 'text3d-1',
    type: 'text',
    name: 'Xara Nick',
    text: 'SENOL',
    backText: 'DOGAN',
    writingMode: 'horizontal',
    x: 10,
    y: 12,
    width: 133,
    height: 33,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    animation: createDefaultAnimation(),
    fontFamily: 'Impact',
    fontSize: 28,
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
    width: 133,
    height: 33,
    elements: [text],
  };
}

describe('FlashText3D Project V3 model contract', () => {
  it('accepts explicit serializable Text3D geometry, surfaces, lighting and texture state', () => {
    const project = {
      ...createDefaultProjectV3(),
      layers: [{
        id: 'text3d-1',
        name: 'Nick 3D',
        type: 'text3d',
        visible: true,
        locked: false,
        opacity: 1,
        transform: {
          x: 10,
          y: 12,
          width: 133,
          height: 33,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        clips: [],
        text: 'SENOL',
        backText: 'DOGAN',
        writingMode: 'horizontal',
        fontFamily: 'Impact',
        fontSize: 28,
        align: 'center',
        ...compatibilityPaintFields,
        style: expectedStyle,
      }],
    };

    const parsed = parseProjectV3(project);
    expect(parsed.layers[0]).toMatchObject({
      type: 'text3d',
      style: expectedStyle,
    });
  });

  it('rejects out-of-range Text3D material and lighting values', () => {
    const project = {
      ...createDefaultProjectV3(),
      layers: [{
        id: 'text3d-invalid-style',
        name: 'Invalid Text3D',
        type: 'text3d',
        visible: true,
        locked: false,
        opacity: 1,
        transform: {
          x: 0,
          y: 0,
          width: 133,
          height: 33,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        clips: [],
        text: 'SENOL',
        writingMode: 'horizontal',
        fontFamily: 'Impact',
        fontSize: 28,
        align: 'center',
        ...compatibilityPaintFields,
        style: {
          ...expectedStyle,
          surfaces: {
            ...expectedStyle.surfaces,
            front: {
              ...expectedStyle.surfaces.front,
              metallicity: 1.25,
            },
          },
        },
      }],
    };

    expect(() => parseProjectV3(project)).toThrow();
  });

  it('migrates legacy Xara text into the explicit Text3D style model', () => {
    const migrated = migrateProjectToV3(buildLegacyText3DProject());
    const layer = migrated.layers.find((candidate) => candidate.id === 'text3d-1');

    expect(layer).toMatchObject({
      type: 'text3d',
      text: 'SENOL',
      backText: 'DOGAN',
      style: {
        bevel: { size: expect.any(Number), strength: expect.any(Number) },
        extrusion: { depth: 8, angleDeg: 45 },
        surfaces: {
          front: {
            color: expect.any(String),
            gradient: expect.arrayContaining([
              expect.objectContaining({ offset: 0, color: expect.any(String) }),
              expect.objectContaining({ offset: 1, color: expect.any(String) }),
            ]),
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
        gloss: { strength: expect.any(Number), size: expect.any(Number) },
        texture: { kind: expect.any(String), strength: expect.any(Number) },
        light: {
          azimuthDeg: expect.any(Number),
          elevationDeg: expect.any(Number),
          intensity: expect.any(Number),
          ambient: expect.any(Number),
        },
      },
    });
  });
});

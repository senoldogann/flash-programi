import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../model/project';
import { migrateProjectToV3 } from '../model/v3/migrate-to-v3';
import type { ParticleLayerV3, Text3DLayerV3 } from '../model/v3/project-v3';
import { evaluateScene } from '../timeline';
import { applyNeoSceneRecipe } from './recipes';

describe('Neo recipe V3 parity', () => {
  it('maps a full Neo composition through the shared V3 model without losing mode, Text3D, particles or frame', () => {
    const neo = applyNeoSceneRecipe(createEmptyProject(), 'neon-night');
    const v3 = migrateProjectToV3(neo);

    expect(v3.mode).toBe('neo');
    expect(v3.exportSettings.gifPalette).toBe('adaptive');
    expect(v3.exportSettings.gifDither).toBe('none');

    const text3d = v3.layers.find((layer): layer is Text3DLayerV3 => layer.type === 'text3d');
    expect(text3d).toBeDefined();
    expect(text3d?.clips.some((clip) => clip.effect === 'chromatic-shake')).toBe(true);
    expect(text3d?.style.gloss.strength).toBeGreaterThan(0.7);

    const particles = v3.layers.filter((layer): layer is ParticleLayerV3 => layer.type === 'particle');
    expect(particles.map((layer) => layer.preset)).toEqual(
      expect.arrayContaining(['ambient-orbs', 'glow-dust']),
    );
    expect(v3.layers.some((layer) => layer.type === 'frame' && layer.preset === 'neon')).toBe(true);
  });

  it('evaluates the same Neo V3 scene deterministically at the same timestamp', () => {
    const v3 = migrateProjectToV3(applyNeoSceneRecipe(createEmptyProject(), 'holographic'));

    const first = evaluateScene(v3, 1375);
    const second = evaluateScene(v3, 1375);

    expect(second).toEqual(first);
    expect(first.mode).toBe('neo');
    expect(first.layers).toHaveLength(v3.layers.length);
  });
});

import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../model/project';
import { migrateProjectToV3 } from '../model/v3/migrate-to-v3';
import { evaluateScene } from '../timeline';
import { applyClassicSceneRecipe } from './recipes';

describe('Classic V2 to V3 render parity', () => {
  it('migrates a Classic recipe into Text3D, particle and frame layers without losing export style', () => {
    const classic = applyClassicSceneRecipe(createEmptyProject(), 'altin-doner-nick');
    const v3 = migrateProjectToV3(classic);
    const types = v3.layers.map((layer) => layer.type);

    expect(v3.mode).toBe('classic');
    expect(v3.canvas).toMatchObject({ width: 133, height: 33, background: classic.background });
    expect(types).toContain('text3d');
    expect(types.filter((type) => type === 'particle')).toHaveLength(classic.decorations.length);
    expect(types).toContain('frame');
    expect(v3.exportSettings).toMatchObject({
      gifPalette: 'classic-64',
      gifDither: 'ordered-4x4',
    });
  });

  it('evaluates the same Classic timestamp deterministically', () => {
    const classic = applyClassicSceneRecipe(createEmptyProject(), 'glitter-princess');
    const v3 = migrateProjectToV3(classic);

    expect(evaluateScene(v3, 875)).toEqual(evaluateScene(v3, 875));
  });
});

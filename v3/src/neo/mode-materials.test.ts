import { describe, expect, it } from 'vitest';
import { createEmptyProject, type TextElement } from '../model/project';
import { parseProject } from '../model/schema';
import { migrateProjectToV3 } from '../model/v3/migrate-to-v3';
import { FLASH_TEXT_MATERIALS, getFlashTextMaterial } from '../text/flash-materials';
import { createText3DStyleFromLegacy } from '../text3d/material-recipes';

const NEO_MATERIAL_IDS = [
  'neo-gold',
  'neo-neon',
  'neo-purple-glass',
  'neo-cyber-blue',
  'neo-royal-red',
  'neo-diamond',
  'neo-fire',
  'neo-frozen',
  'neo-dark-luxury',
  'neo-angel',
  'neo-dream',
  'neo-fashion',
  'neo-cinematic',
  'neo-holographic',
  'neo-chrome-future',
] as const;

function materialText(materialPreset: string): TextElement {
  return {
    id: 'neo-text',
    type: 'text',
    name: 'Neo Text',
    text: 'NEO',
    writingMode: 'horizontal',
    x: 0,
    y: 0,
    width: 180,
    height: 70,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    animation: { preset: 'none', speed: 'normal', intensity: 'normal', delayMs: 0, loop: true },
    fontFamily: 'Arial',
    fontSize: 48,
    fill: '#ffffff',
    stroke: '#111827',
    strokeWidth: 1,
    shadowColor: '#000000',
    shadowBlur: 5,
    align: 'center',
    materialPreset: materialPreset as TextElement['materialPreset'],
    extrusionDepth: 6,
    extrusionColor: '#111827',
  };
}

describe('Neo project mode and materials', () => {
  it('starts new projects in Classic mode but keeps old saves without a mode field shape-stable', () => {
    const fresh = createEmptyProject();
    expect(fresh.mode).toBe('classic');

    const { mode: _mode, ...oldShape } = fresh as typeof fresh & { mode?: string };
    const parsed = parseProject(oldShape);
    expect('mode' in parsed).toBe(false);
  });

  it('accepts Neo mode and migrates it into Project V3', () => {
    const neo = parseProject({ ...createEmptyProject(), mode: 'neo' });
    expect(migrateProjectToV3(neo).mode).toBe('neo');
  });

  it('ships exactly 15 dedicated Neo material presets', () => {
    const ids = FLASH_TEXT_MATERIALS.map((material) => material.id).filter((id) => String(id).startsWith('neo-'));
    expect(ids).toEqual(NEO_MATERIAL_IDS);
  });

  it('maps Neo materials to a glossier modern Text3D style than the closest Classic material', () => {
    const classic = createText3DStyleFromLegacy(materialText('xara-gold'));
    const neo = createText3DStyleFromLegacy(materialText('neo-gold'));

    expect(getFlashTextMaterial('neo-gold' as never).gradientStops.length).toBeGreaterThanOrEqual(8);
    expect(neo.gloss.strength).toBeGreaterThan(classic.gloss.strength);
    expect(neo.shadow.blur).toBeGreaterThan(classic.shadow.blur);
    expect(neo.bevel.size).toBeLessThanOrEqual(classic.bevel.size);
  });
});

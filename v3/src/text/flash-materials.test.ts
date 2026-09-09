import { describe, expect, it } from 'vitest';
import { FLASH_TEXT_MATERIALS, getFlashTextMaterial } from './flash-materials';

describe('classic flash nick text materials', () => {
  it('ships the researched Xara-style material family', () => {
    expect(FLASH_TEXT_MATERIALS.map((material) => material.id)).toEqual([
      'flat',
      'xara-gold',
      'xara-chrome',
      'xara-ruby',
      'xara-ice',
      'xara-purple-glass',
      'xara-emerald',
      'xara-fire',
    ]);
  });

  it('provides real extrusion and metallic gradient data for classic materials', () => {
    const gold = getFlashTextMaterial('xara-gold');

    expect(gold.extrusionDepth).toBeGreaterThanOrEqual(3);
    expect(gold.gradientStops.length).toBeGreaterThanOrEqual(6);
    expect(gold.gradientStops).toContain('#fff6b7');
    expect(gold.stroke).toMatch(/^#/);
    expect(gold.extrusionColor).toMatch(/^#/);
  });
});

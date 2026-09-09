import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../model/project';
import { DESIGN_TEMPLATES, applyDesignTemplate } from './templates';

describe('design templates', () => {
  it('contains exactly 20 unique one-click templates', () => {
    expect(DESIGN_TEMPLATES).toHaveLength(20);
    expect(new Set(DESIGN_TEMPLATES.map((template) => template.id)).size).toBe(20);
    expect(new Set(DESIGN_TEMPLATES.map((template) => template.name)).size).toBe(20);
  });

  it('preserves user text and image assets while changing presentation', () => {
    const project = createEmptyProject();
    project.elements = [
      {
        id: 'text-1', type: 'text', name: 'Yazı', text: 'SevDa', x: 20, y: 20, width: 180, height: 60,
        rotation: 0, opacity: 1, visible: true, locked: false,
        animation: { preset: 'none', speed: 'normal', delayMs: 0, loop: true },
        fontFamily: 'Arial', fontSize: 42, fill: '#ffffff', stroke: '#111827', strokeWidth: 2,
        shadowColor: '#000000', shadowBlur: 8, align: 'center',
      },
      {
        id: 'image-1', type: 'image', name: 'Fotoğraf', assetUrl: 'blob:keep-me', x: 15, y: 15, width: 220, height: 180,
        rotation: 0, opacity: 1, visible: true, locked: false,
        animation: { preset: 'none', speed: 'normal', delayMs: 0, loop: true },
        effects: { brightness: 0, contrast: 0, saturation: 0, blurRadius: 0, grayscale: false, sepia: false },
      },
    ];

    const next = applyDesignTemplate(project, 'neon-gece');
    const text = next.elements.find((element) => element.type === 'text');
    const image = next.elements.find((element) => element.type === 'image');

    expect(text).toMatchObject({ text: 'SevDa', x: 20, y: 20 });
    expect(image).toMatchObject({ assetUrl: 'blob:keep-me', x: 15, y: 15 });
    expect(next.background).not.toBe(project.background);
    expect(next.frame.preset).not.toBe('none');
    expect(next.decorations.length).toBeGreaterThan(0);
  });
});

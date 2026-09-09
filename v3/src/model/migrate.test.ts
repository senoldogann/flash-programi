import { describe, expect, it } from 'vitest';
import { migrateProject } from './migrate';

const legacyProject = {
  version: 1,
  id: 'legacy-project',
  name: 'Legacy Tasarım',
  width: 300,
  height: 100,
  durationMs: 3000,
  fps: 24,
  background: '#101827',
  elements: [
    {
      id: 'text-1',
      type: 'text',
      name: 'Nick',
      x: 30,
      y: 20,
      width: 140,
      height: 44,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      animation: {
        preset: 'pulse',
        speed: 'normal',
        delayMs: 0,
        loop: true,
      },
      text: 'Şenol',
      fontFamily: 'Arial',
      fontSize: 36,
      fill: '#ffffff',
      stroke: '#111827',
      strokeWidth: 2,
      shadowColor: '#000000',
      shadowBlur: 8,
      align: 'center',
    },
    {
      id: 'image-1',
      type: 'image',
      name: 'Fotoğraf',
      assetUrl: 'blob:legacy-image',
      x: 160,
      y: 10,
      width: 120,
      height: 80,
      rotation: 0,
      opacity: 0.9,
      visible: true,
      locked: false,
      animation: {
        preset: 'float',
        speed: 'slow',
        delayMs: 150,
        loop: true,
      },
      effects: {
        brightness: 0.2,
        contrast: 15,
        saturation: 0.4,
        blurRadius: 2,
        grayscale: false,
        sepia: true,
      },
    },
  ],
  decorations: [
    {
      id: 'decoration-1',
      preset: 'stars',
      count: 12,
      opacity: 0.8,
      speed: 'normal',
    },
  ],
  frame: {
    preset: 'neon',
    width: 6,
  },
} as const;

describe('project migration', () => {
  it('migrates version 1 projects without losing visual data', () => {
    const migrated = migrateProject(legacyProject);

    expect(migrated.version).toBe(2);
    expect(migrated.id).toBe('legacy-project');
    expect(migrated.width).toBe(300);
    expect(migrated.height).toBe(100);
    expect(migrated.decorations).toEqual(legacyProject.decorations);
    expect(migrated.frame).toEqual(legacyProject.frame);
    expect(migrated.exportSettings).toEqual({ scale: 1, gifProfile: 'balanced' });

    expect(migrated.elements[0]).toMatchObject({
      id: 'text-1',
      type: 'text',
      text: 'Şenol',
      writingMode: 'horizontal',
      x: 30,
      y: 20,
      width: 140,
      height: 44,
      animation: {
        preset: 'pulse',
        speed: 'normal',
        intensity: 'normal',
        delayMs: 0,
        loop: true,
      },
    });

    expect(migrated.elements[1]).toMatchObject({
      id: 'image-1',
      type: 'image',
      assetUrl: 'blob:legacy-image',
      x: 160,
      y: 10,
      width: 120,
      height: 80,
      animation: {
        preset: 'float',
        speed: 'slow',
        intensity: 'normal',
        delayMs: 150,
        loop: true,
      },
      effects: {
        brightness: 0.2,
        contrast: 15,
        saturation: 0.4,
        blurRadius: 2,
        grayscale: false,
        sepia: true,
        hue: 0,
        temperature: 0,
        tint: 0,
        enhance: 0,
        emboss: 0,
        invert: false,
        noise: 0,
        pixelate: 0,
        posterize: 0,
        solarize: false,
        threshold: 0,
      },
    });
  });

  it('validates version 2 input without changing it', () => {
    const migrated = migrateProject({
      ...migrateProject(legacyProject),
      name: 'Current Tasarım',
    });

    expect(migrated.name).toBe('Current Tasarım');
    expect(migrated.version).toBe(2);
  });

  it('rejects unknown future versions', () => {
    expect(() => migrateProject({ ...legacyProject, version: 99 })).toThrow();
  });
});

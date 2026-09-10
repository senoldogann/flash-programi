import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './project';
import { parseProject } from './schema';

describe('project model', () => {
  it('creates a valid version-2 editor pro project', () => {
    const project = createEmptyProject();

    expect(parseProject(project)).toEqual(project);
    expect(project.version).toBe(2);
    expect(project.width).toBe(300);
    expect(project.height).toBe(300);
    expect(project.elements).toEqual([]);
    expect(project.decorations).toEqual([]);
    expect(project.frame).toEqual({ preset: 'none', width: 8 });
    expect(project.exportSettings).toEqual({
      scale: 1,
      gifProfile: 'balanced',
      gifPalette: 'adaptive',
      gifDither: 'none',
    });
  });

  it('accepts old export settings without injecting new Classic GIF fields', () => {
    const current = createEmptyProject();
    const legacyShape = {
      ...current,
      exportSettings: {
        scale: 1,
        gifProfile: 'balanced',
      },
    };

    const parsed = parseProject(legacyShape);

    expect(parsed.exportSettings).toEqual({ scale: 1, gifProfile: 'balanced' });
    expect('gifPalette' in parsed.exportSettings).toBe(false);
    expect('gifDither' in parsed.exportSettings).toBe(false);
  });

  it('rejects impossible canvas dimensions', () => {
    const project = { ...createEmptyProject(), width: 0 };

    expect(() => parseProject(project)).toThrow();
  });

  it('keeps strict parsing limited to the current schema version', () => {
    const project = { ...createEmptyProject(), version: 1 };

    expect(() => parseProject(project)).toThrow();
  });

  it('rejects unsupported future schema versions', () => {
    const project = { ...createEmptyProject(), version: 3 };

    expect(() => parseProject(project)).toThrow();
  });

  it('rejects invalid rich visual settings', () => {
    const project = {
      ...createEmptyProject(),
      frame: { preset: 'neon', width: 100 },
    };

    expect(() => parseProject(project)).toThrow();
  });
});

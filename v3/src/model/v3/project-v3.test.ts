import { describe, expect, it } from 'vitest';
import { createDefaultProjectV3 } from './project-v3';

describe('Project V3 foundation', () => {
  it('creates a deterministic empty classic composition', () => {
    const project = createDefaultProjectV3();

    expect(project.version).toBe(3);
    expect(project.mode).toBe('classic');
    expect(project.canvas).toEqual({
      width: 300,
      height: 300,
      background: '#101827',
    });
    expect(project.timeline).toEqual({
      durationMs: 3000,
      fps: 24,
    });
    expect(project.layers).toEqual([]);
    expect(project.exportSettings).toEqual({
      scale: 1,
      gifProfile: 'balanced',
    });
  });
});

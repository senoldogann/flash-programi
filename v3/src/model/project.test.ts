import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './project';
import { parseProject } from './schema';

describe('project model', () => {
  it('creates a valid version-1 project', () => {
    const project = createEmptyProject();

    expect(parseProject(project)).toEqual(project);
    expect(project.version).toBe(1);
    expect(project.width).toBe(300);
    expect(project.height).toBe(300);
    expect(project.elements).toEqual([]);
  });

  it('rejects impossible canvas dimensions', () => {
    const project = { ...createEmptyProject(), width: 0 };

    expect(() => parseProject(project)).toThrow();
  });

  it('rejects unsupported schema versions', () => {
    const project = { ...createEmptyProject(), version: 2 };

    expect(() => parseProject(project)).toThrow();
  });
});

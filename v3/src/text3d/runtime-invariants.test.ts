/// <reference types="vite/client" />

import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';

const rawGlobOptions = {
  eager: true,
  query: '?raw',
  import: 'default',
} as const;

const text3dSources = import.meta.glob(
  [
    './**/*.ts',
    './**/*.tsx',
    '!./**/*.test.ts',
    '!./**/*.test.tsx',
  ],
  rawGlobOptions,
) as Record<string, string>;

const resolvedRendererSources = import.meta.glob(
  '../editor/canvas/layers/ResolvedText3DLayer.tsx',
  rawGlobOptions,
) as Record<string, string>;

const exportSources = import.meta.glob(
  [
    '../export/**/*.ts',
    '../export/**/*.tsx',
    '!../export/**/*.test.ts',
    '!../export/**/*.test.tsx',
  ],
  rawGlobOptions,
) as Record<string, string>;

function joinedSource(sources: Record<string, string>): string {
  return Object.entries(sources)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, source]) => `// ${path}\n${source}`)
    .join('\n');
}

describe('FlashText3D runtime invariants', () => {
  it('keeps animation evaluation outside the Text3D engine and resolved renderer', () => {
    const source = joinedSource({ ...text3dSources, ...resolvedRendererSources });

    expect(source).not.toMatch(/\bevaluate(?:Animation|Clip|Scene)\s*\(/);
  });

  it('keeps Text3D deterministic and free of Three.js/WebGL dependencies', () => {
    const source = joinedSource({ ...text3dSources, ...resolvedRendererSources });
    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };

    expect(source).not.toMatch(/\bMath\.random\s*\(/);
    expect(source).not.toMatch(/from\s+['"](?:three|@react-three\/)/);
    expect(source).not.toMatch(/\bWebGL(?:Renderer|RenderingContext|2RenderingContext)?\b/);
    expect(Object.keys(dependencies)).not.toContain('three');
    expect(Object.keys(dependencies).some((name) => name.startsWith('@react-three/'))).toBe(false);
  });

  it('keeps export on the shared Stage instead of adding an export-only Text3D renderer', () => {
    const source = joinedSource(exportSources);

    expect(source).not.toMatch(/text3d\/(?:rasterizer|render-plan)/i);
    expect(source).not.toMatch(/ResolvedText3DLayer/);
  });
});

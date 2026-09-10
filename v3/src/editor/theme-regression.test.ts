// @ts-expect-error Node built-in is used only by this Vitest source-regression test.
import { readFileSync } from 'node:fs';

// @ts-expect-error process is provided by the Node Vitest runner.
const editorCss = readFileSync(`${process.cwd()}/src/editor/editor-2026.css`, 'utf8');

describe('2026 dark editor theme regressions', () => {
  it('keeps search and toolbar actions in a non-overlapping adaptive header layout', () => {
    expect(editorCss).toMatch(/grid-template-columns:\s*max-content\s+auto\s+minmax\(0,\s*1fr\)/);
    expect(editorCss).toMatch(/\.studio-header-tools\s*\{[\s\S]*?display:\s*grid/);
    expect(editorCss).toMatch(/@media\s*\(max-width:\s*1599px\)/);
  });

  it('owns every formerly light editor surface inside the dark studio layer', () => {
    const requiredDarkSelectors = [
      '.studio-app-shell .canvas-size-presets button',
      '.studio-app-shell .segmented-control button',
      '.studio-app-shell .cinematic-motion-section',
      '.studio-app-shell .preset-card',
      '.studio-app-shell .easy-start-panel',
      '.studio-app-shell .template-card',
      '.studio-app-shell .inspector-toggle',
      '.studio-app-shell .canvas-size-custom input',
    ];

    for (const selector of requiredDarkSelectors) {
      expect(editorCss).toContain(selector);
    }
  });
});

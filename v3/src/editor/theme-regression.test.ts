// @ts-expect-error Node built-in is used only by this Vitest source-regression test.
import { readFileSync } from 'node:fs';

const editorCss = readFileSync(new URL('./editor-2026.css', import.meta.url), 'utf8');
const controlsCss = readFileSync(new URL('./editor-controls.css', import.meta.url), 'utf8');
const workflowCss = readFileSync(new URL('./editor-workflow.css', import.meta.url), 'utf8');
const easyCss = readFileSync(new URL('./easy-ui.css', import.meta.url), 'utf8');
const presetLibraryCss = readFileSync(new URL('./chrome/preset-library.css', import.meta.url), 'utf8');

describe('2026 dark editor theme regressions', () => {
  it('keeps search and toolbar actions in a non-overlapping adaptive header layout', () => {
    expect(editorCss).toMatch(/grid-template-columns:\s*max-content\s+auto\s+minmax\(0,\s*1fr\)/);
    expect(presetLibraryCss).toMatch(/\.studio-header-tools\s*\{[\s\S]*?display:\s*grid/);
    expect(editorCss).toMatch(/@media\s*\(max-width:\s*1599px\)/);
  });

  it('does not leak hard-coded light control surfaces into the dark studio', () => {
    for (const css of [controlsCss, workflowCss, easyCss]) {
      expect(css).not.toMatch(/background:\s*#ffffff\b/i);
    }

    expect(workflowCss).not.toMatch(/#faf8ff|#f4f8ff/i);
  });
});

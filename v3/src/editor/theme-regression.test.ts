// @ts-expect-error Node built-in is used only by this Vitest source-regression test.
import { readFileSync } from 'node:fs';

// @ts-expect-error process is provided by the Node Vitest runner.
const editorRoot = `${process.cwd()}/src/editor`;
const readEditorCss = (relativePath: string) => readFileSync(`${editorRoot}/${relativePath}`, 'utf8');

const editorCss = readEditorCss('editor-2026.css');
const controlsCss = readEditorCss('editor-controls.css');
const workflowCss = readEditorCss('editor-workflow.css');
const easyCss = readEditorCss('easy-ui.css');
const richPanelsCss = readEditorCss('panels/rich-panels.css');
const presetLibraryCss = readEditorCss('chrome/preset-library.css');

describe('2026 dark editor theme regressions', () => {
  it('keeps search and toolbar actions in a non-overlapping adaptive header layout', () => {
    expect(editorCss).toMatch(/grid-template-columns:\s*max-content\s+auto\s+minmax\(0,\s*1fr\)/);
    expect(presetLibraryCss).toMatch(/\.studio-header-tools\s*\{[\s\S]*?display:\s*grid/);
    expect(editorCss).toMatch(/@media\s*\(max-width:\s*1599px\)/);
  });

  it('does not leak hard-coded light control surfaces into the dark studio', () => {
    for (const css of [controlsCss, workflowCss, easyCss, richPanelsCss]) {
      expect(css).not.toMatch(/background:\s*#ffffff\b/i);
    }

    expect(workflowCss).not.toMatch(/#faf8ff|#f4f8ff/i);
  });
});

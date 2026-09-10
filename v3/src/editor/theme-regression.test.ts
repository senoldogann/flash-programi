// @ts-expect-error Vite raw imports are test-only and not part of the app tsconfig ambient types.
import editorCss from './editor-2026.css?raw';
// @ts-expect-error Vite raw imports are test-only and not part of the app tsconfig ambient types.
import controlsCss from './editor-controls.css?raw';
// @ts-expect-error Vite raw imports are test-only and not part of the app tsconfig ambient types.
import workflowCss from './editor-workflow.css?raw';
// @ts-expect-error Vite raw imports are test-only and not part of the app tsconfig ambient types.
import easyCss from './easy-ui.css?raw';
// @ts-expect-error Vite raw imports are test-only and not part of the app tsconfig ambient types.
import richPanelsCss from './panels/rich-panels.css?raw';
// @ts-expect-error Vite raw imports are test-only and not part of the app tsconfig ambient types.
import presetLibraryCss from './chrome/preset-library.css?raw';

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

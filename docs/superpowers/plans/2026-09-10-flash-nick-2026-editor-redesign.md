# Flash Nick 2026 Editor Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing V3 editor shell to faithfully match the approved dark neon 2026 concept while preserving the current renderer, persistence, Classic/Neo recipes, undo/redo, and GIF/PNG export contracts.

**Architecture:** Keep `EditorShell` as orchestration and extract visible product chrome into focused components. Replace the current category-heavy left panel with a five-step workflow rail, add a functional studio header, then layer workspace/playback, inspector, presets, export, responsive behavior, and fidelity QA without creating a second render path.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Zustand 5, Konva/react-konva, Vitest 5, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-10-flash-nick-2026-editor-redesign.md`

## Global Constraints

- Work only on `feat/2026-editor-redesign`, based from `398e67c172ee81c2adb6e017a8c055a14e6fb724`.
- Do not change project schema, migration semantics, preview/export scene parity, GIF/PNG safety validation, recipe semantics, object-URL disposal, or keyboard shortcuts.
- Primary user flow is Fotoğraf → Nick → Stil → Hareket → Süsleme → Export.
- All primary controls use plain Turkish labels and minimum 44 px interaction targets.
- The app chrome uses deep navy/charcoal surfaces with restrained violet, magenta, and electric-blue accents.
- No inert navigation, fake search, fake gallery, PDF promise, authentication, cloud upload, or paid AI dependency.
- Use test-first RED → GREEN for behavior changes.
- Full release verification is `cd v3 && npm test && npm run typecheck && npm run build`, then browser fidelity review against the approved concept.

---

### Task 1: Studio Header and Workflow Rail

**Files:**
- Create: `v3/src/editor/chrome/StudioHeader.tsx`
- Create: `v3/src/editor/chrome/WorkflowRail.tsx`
- Create: `v3/src/editor/chrome/chrome.test.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/app/App.tsx`
- Create: `v3/src/editor/editor-2026.css`

**Interfaces:**
- `StudioHeader` consumes `onNewProject`, `onPngExport`, `onGifExport`, `gifExporting`, `gifProgress`, `onShowTemplates`, `onShowHelp`.
- `WorkflowRail` consumes `activeStep`, `onStepChange`, `onChooseImage`, `onAddText`, `onShowExport`.
- Both are presentation/navigation components; editor mutations remain owned by existing store or `EditorShell` callbacks.

- [ ] **Step 1: Write the failing shell contract test**

```tsx
it('renders the approved 2026 header and five-step Turkish workflow', async () => {
  await renderReadyEditorShell();
  expect(screen.getByRole('heading', { name: 'Flash Programı' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Ana menü' })).toBeInTheDocument();
  const workflow = screen.getByRole('navigation', { name: 'Oluşturma adımları' });
  for (const name of ['Fotoğraf', 'Nick', 'Stil', 'Hareket', 'Süsleme']) {
    expect(within(workflow).getByRole('button', { name: new RegExp(name, 'i') })).toBeInTheDocument();
  }
});
```

- [ ] **Step 2: Verify RED**

Run the pull-request CI. Expected: assertion failure because `Ana menü` / `Oluşturma adımları` do not exist in the current shell.

- [ ] **Step 3: Implement `StudioHeader` and `WorkflowRail`**

Use real button callbacks only. Header copy is exactly `Flash Programı` and `Nostalji. Şimdi daha güçlü.`. Workflow labels/subtitles are defined in one typed constant so desktop and mobile representations share the same copy.

- [ ] **Step 4: Wire the new shell**

`EditorShell` owns `activeStep: 'photo' | 'nick' | 'style' | 'motion' | 'decorate'` and maps those steps to the existing functional panels. Preserve hidden file input, exports, persistence, canvas, and inspector.

- [ ] **Step 5: Add semantic dark design tokens**

Create `editor-2026.css` with `--app-bg`, `--surface-1`, `--surface-2`, `--surface-hover`, `--border-subtle`, `--text-primary`, `--text-secondary`, `--accent-violet`, `--accent-magenta`, `--accent-blue`, `--success`, `--warning`, `--danger`; import it last from `App.tsx` so the redesign intentionally supersedes older light-shell rules.

- [ ] **Step 6: Verify GREEN and commit**

CI must pass the new test plus all existing tests before moving on.

---

### Task 2: Workspace Chrome and Playback Strip

**Files:**
- Create: `v3/src/editor/chrome/WorkspaceChrome.tsx`
- Create: `v3/src/editor/chrome/PlaybackStrip.tsx`
- Create: `v3/src/editor/chrome/PlaybackStrip.test.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/editor-2026.css`

**Interfaces:**
- `WorkspaceChrome` receives current width/height and renders existing `CanvasSizePanel` in a progressive-disclosure area.
- `PlaybackStrip` receives `durationMs`, `fps`, optional `disabled`, and controls only local preview time/play state. It does not render frames itself.

- [ ] **Step 1: Write failing playback behavior tests**

```tsx
it('exposes play and a scrubber backed by project duration', () => {
  render(<PlaybackStrip durationMs={2000} fps={20} valueMs={0} onChange={vi.fn()} playing={false} onPlayingChange={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Önizlemeyi Oynat' })).toBeInTheDocument();
  expect(screen.getByRole('slider', { name: 'Önizleme zamanı' })).toHaveAttribute('max', '2000');
});
```

- [ ] **Step 2: Verify RED**

Expected: module/component missing.

- [ ] **Step 3: Implement playback UI without a second renderer**

`EditorShell` provides `previewTimeMs`; while scrubbing, pass it through the existing `timeOverrideMs` path. During normal playback leave the existing animation clock authoritative unless explicit preview override is active.

- [ ] **Step 4: Restyle workspace**

Use one dark framed workspace surface, visible checkerboard canvas, compact undo/redo/zoom/size chrome, and a horizontal playback strip matching the approved concept.

- [ ] **Step 5: Verify GREEN and commit**

Run affected tests and full CI.

---

### Task 3: Inspector Redesign

**Files:**
- Modify: `v3/src/editor/panels/TextInspector.tsx`
- Modify: `v3/src/editor/panels/TextInspector.test.tsx`
- Modify: `v3/src/editor/editor-2026.css`

**Interfaces:**
- Keep current `useEditorStore` mutations and history-batching callbacks unchanged.
- Text inspector prioritizes content, font, color, size, glow, stroke, alignment; image inspector keeps placement controls.

- [ ] **Step 1: Add failing inspector hierarchy test**

```tsx
expect(screen.getByRole('heading', { name: 'Nick Ayarları' })).toBeInTheDocument();
expect(screen.getByLabelText('Yazı')).toBeInTheDocument();
expect(screen.getByLabelText('Yazı Tipi')).toBeInTheDocument();
expect(screen.getByLabelText('Parlama Gücü')).toBeInTheDocument();
```

- [ ] **Step 2: Verify RED**

Expected: current heading is `Yazı Ayarları`.

- [ ] **Step 3: Reorder presentation only**

Preserve all input values, aria labels, mutation calls, and batch start/end behavior. Change visible grouping and CSS hierarchy, not state semantics.

- [ ] **Step 4: Verify GREEN and commit**

Run `TextInspector.test.tsx` plus integration suite, then full CI.

---

### Task 4: Production Preset Library and Search

**Files:**
- Create: `v3/src/editor/chrome/PresetLibrary.tsx`
- Create: `v3/src/editor/chrome/PresetLibrary.test.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/editor-2026.css`

**Interfaces:**
- Read real `CLASSIC_SCENE_RECIPES` and `NEO_SCENE_RECIPES`.
- Apply with existing `applyClassicRecipe(id)` / `applyNeoRecipe(id)` store actions.
- `query: string` is supplied from `StudioHeader`; filtering is case-insensitive over real recipe names only.

- [ ] **Step 1: Write failing tests for real recipes and filtering**

```tsx
it('filters only real recipes and applies the selected recipe', () => {
  render(<PresetLibrary query="neon" />);
  expect(screen.getByRole('button', { name: /Neon Night/i })).toBeInTheDocument();
  expect(screen.queryByText('Altın Döner Nick')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Verify RED**

Expected: component missing.

- [ ] **Step 3: Implement category/filter model**

Expose `Tümü`, `Klasik SesliChat`, and `Modern`; add `Popüler` only as a deterministic curated subset of existing recipes. No empty/fake categories.

- [ ] **Step 4: Integrate header search and templates navigation**

Search field controls `query`. `Hazır Tasarımlar` scrolls/focuses the library through a real ref. Omit `Galeri` until a concrete gallery surface is implemented.

- [ ] **Step 5: Verify GREEN and commit**

Run component tests and full CI.

---

### Task 5: Export Surface and Progressive Advanced Controls

**Files:**
- Create: `v3/src/editor/chrome/ExportActions.tsx`
- Create: `v3/src/editor/chrome/ExportActions.test.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/panels/ExportPanel.tsx`
- Modify: `v3/src/editor/editor-2026.css`

**Interfaces:**
- `ExportActions` receives existing `onGifExport`, `onPngExport`, `gifExporting`, `gifProgress`, `disabled` callbacks/state.
- `ExportPanel` remains the advanced scale/profile/palette/dither settings surface.

- [ ] **Step 1: Write failing progress/CTA tests**

```tsx
render(<ExportActions onGifExport={gif} onPngExport={png} gifExporting gifProgress={0.42} />);
expect(screen.getByRole('button', { name: 'GIF İndir' })).toHaveTextContent('42');
expect(screen.getByRole('button', { name: 'PNG İndir' })).toBeDisabled();
```

- [ ] **Step 2: Verify RED**

Expected: component missing.

- [ ] **Step 3: Implement sticky/obvious export actions**

Primary visible label `GIF Olarak İndir`, secondary `PNG Olarak İndir`; retain stable aria labels `GIF İndir` / `PNG İndir` for existing tests.

- [ ] **Step 4: Move technical export controls under `Gelişmiş Ayarlar`**

Use a native `<details>` or equivalent accessible disclosure. Safety warnings remain immediately visible when triggered.

- [ ] **Step 5: Verify GREEN and commit**

Run export tests and full CI.

---

### Task 6: Responsive and Accessibility Pass

**Files:**
- Modify: `v3/src/editor/editor-2026.css`
- Modify: `v3/src/responsive.css` only where old rules conflict
- Modify: relevant DOM tests

**Interfaces:**
- Same workflow data powers desktop rail and mobile step navigation.
- Inspector may collapse below 1280 px but its controls must remain reachable.

- [ ] **Step 1: Add DOM contract tests for mobile-safe navigation hooks**

Assert the workflow is a real navigation landmark, all primary step buttons remain labeled, export action remains in DOM, and help content is keyboard reachable.

- [ ] **Step 2: Implement breakpoints**

`>=1280`: three-column editor. `800-1279`: narrow rail + collapsible/stacked inspector. `<800`: simplified header, horizontal/bottom workflow navigation, full-width canvas, inspector below/in drawer pattern, no horizontal page overflow.

- [ ] **Step 3: Accessibility audit in CSS/markup**

Ensure `:focus-visible`, 44 px targets, >=13 px important text, readable disabled states, reduced-motion support, semantic nav/aside/section landmarks, and `aria-live` export status.

- [ ] **Step 4: Verify GREEN and commit**

Full CI.

---

### Task 7: Fidelity and Release Verification

**Files:**
- Modify only files with concrete visual/behavior mismatches found during QA.

**Interfaces:**
- Approved concept image from the 2026-09-10 conversation is the visual source of truth.

- [ ] **Step 1: Run full verification**

```bash
cd v3
npm test
npm run typecheck
npm run build
```

Expected: 0 failed tests, typecheck exit 0, build exit 0.

- [ ] **Step 2: Browser QA desktop**

Check at concept-like wide viewport. Compare brand/header, workflow rail, canvas balance, right inspector, preset rail, export CTA, palette, type scale, spacing, panel radius and active states.

- [ ] **Step 3: Browser QA mobile**

Check a sub-800 px viewport for no horizontal overflow, readable controls, reachable workflow and export, and usable canvas.

- [ ] **Step 4: Write fidelity ledger and fix all material drift**

Record at least five concrete comparison points: copy, layout, typography, palette, geometry, preset treatment, responsive behavior. Fix material differences rather than documenting avoidable mismatches.

- [ ] **Step 5: Fresh final verification, PR review, merge, Vercel**

Re-run full CI after the last visual fix. Merge only with green CI. Then verify Vercel commit status is success and inspect the live production DOM/UI.

# Flash Nick V3 Editor Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken photo-effect pipeline, make tool content independently scrollable, add grapheme-safe vertical text, substantially expand deterministic image animations, restore proportional canvas sizing, and give PNG/GIF explicit output-size controls.

**Architecture:** Keep React + react-konva + Zustand. Move effect mapping, migration, text layout, animation math, project sizing, and export sizing into pure focused modules. Preview and GIF must sample the same deterministic renderer; export settings live in `Project.exportSettings` but never alter visual geometry or visual undo history.

**Tech Stack:** React 19, TypeScript 7, Vite 8, react-konva 19, Konva 10, Zustand 5, Zod 4, Vitest 5, IndexedDB, gif.js.

**Spec:** `docs/superpowers/specs/2026-09-09-flash-nick-v3-editor-pro-design.md`

## Global Constraints

- Anything visible in preview must render the same way in PNG/GIF.
- One completed edit gesture equals one undo step.
- Existing V1 IndexedDB projects must migrate to V2.
- Project resize and export resize are separate.
- Approved resize rule: uniformly scale content by `min(newW / oldW, newH / oldH)` and preserve element centers relative to the canvas center.
- Export scale is exactly `1 | 2 | 3 | 4`.
- GIF profile is exactly `small | balanced | quality`.
- `Project.exportSettings` is the single persisted export-settings source of truth.
- Feature branches run GitHub CI only. Only `main` may deploy to Vercel.
- No PixiJS/Three.js/WebGL renderer migration in this phase.

## File Map

**Create**
- `v3/src/model/migrate.ts`
- `v3/src/effects/image-effects.ts`
- `v3/src/text/layout.ts`
- `v3/src/sizing/project-size.ts`
- `v3/src/export/profiles.ts`
- `v3/src/editor/panels/CanvasSizePanel.tsx`
- `v3/src/editor/panels/ExportPanel.tsx`

**Modify**
- `v3/src/model/project.ts`
- `v3/src/model/schema.ts`
- `v3/src/store/editor-store.ts`
- `v3/src/persistence/project-db.ts`
- `v3/src/animations/evaluator.ts`
- `v3/src/editor/canvas/EditorCanvas.tsx`
- `v3/src/editor/panels/EffectsPanel.tsx`
- `v3/src/editor/panels/MotionPanel.tsx`
- `v3/src/editor/panels/TextInspector.tsx`
- `v3/src/editor/panels/ToolPanel.tsx`
- `v3/src/editor/panels/rich-panels.css`
- `v3/src/editor/EditorShell.tsx`
- `v3/src/export/png.ts`
- `v3/src/export/gif.ts`
- `v3/src/export/gif-browser.ts`
- `v3/src/styles.css`

---

### Task 1: V2 Project Model and V1 Migration

**Files:**
- Modify: `v3/src/model/project.ts`
- Modify: `v3/src/model/schema.ts`
- Create: `v3/src/model/migrate.ts`
- Create: `v3/src/model/migrate.test.ts`
- Modify: `v3/src/store/editor-store.ts`
- Modify: `v3/src/store/editor-store.test.ts`
- Modify: `v3/src/persistence/project-db.ts`
- Modify: `v3/src/persistence/project-db.test.ts`

**Interfaces:**

```ts
export type TextWritingMode = 'horizontal' | 'vertical-stacked';
export type AnimationIntensity = 'subtle' | 'normal' | 'strong';
export type AnimationDirection = 'left' | 'right' | 'up' | 'down';
export type ExportScale = 1 | 2 | 3 | 4;
export type GifProfile = 'small' | 'balanced' | 'quality';
export type ExportSettings = { scale: ExportScale; gifProfile: GifProfile };

export function migrateProject(input: unknown): Project;

// EditorStore additions
setExportSettings(patch: Partial<ExportSettings>): void;
resizeProject(width: number, height: number): void; // implementation lands in Task 6
```

- [ ] **Step 1: Write RED migration tests**

Create a literal V1 project fixture and assert:

```ts
const migrated = migrateProject(v1Fixture);
expect(migrated.version).toBe(2);
expect(migrated.exportSettings).toEqual({ scale: 1, gifProfile: 'balanced' });
expect(migrated.elements[0]).toMatchObject({
  writingMode: 'horizontal',
  animation: { intensity: 'normal' },
});
```

For an image, assert every added effect field is neutral and all old IDs/geometry/asset URLs are unchanged.

- [ ] **Step 2: Verify RED**

```bash
npm --prefix v3 test -- src/model/migrate.test.ts src/persistence/project-db.test.ts
```

Expected: FAIL because V2 fields/migration do not exist.

- [ ] **Step 3: Extend `project.ts` and strict V2 Zod schema**

Add `writingMode`, animation `intensity` plus optional `direction`, expanded image effects, and `exportSettings`. Change current version to `2`.

Neutral additions:

```ts
writingMode: 'horizontal'
intensity: 'normal'
exportSettings: { scale: 1, gifProfile: 'balanced' }
hue: 0
temperature: 0
tint: 0
enhance: 0
emboss: 0
invert: false
noise: 0
pixelate: 0
posterize: 0
solarize: false
threshold: 0
```

- [ ] **Step 4: Implement `migrateProject`**

Rules:
1. V1 gets defaults added and version changed to 2.
2. V2 is strictly validated unchanged.
3. Unknown/future versions throw.
4. Migration finishes by calling current `parseProject`.

Update restore/load paths to call `migrateProject` before store hydration.

- [ ] **Step 5: Add export-setting store action**

`setExportSettings` validates allowed scale/profile, updates only `project.exportSettings`, does not append to visual `past`, and remains persisted through autosave.

- [ ] **Step 6: Verify GREEN**

```bash
npm --prefix v3 test -- src/model/migrate.test.ts src/model/project.test.ts src/persistence/project-db.test.ts src/store/editor-store.test.ts
npm --prefix v3 run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add v3/src/model v3/src/store/editor-store.ts v3/src/store/editor-store.test.ts v3/src/persistence
git commit -m "feat: add editor pro project migration"
```

---

### Task 2: Reliable Expanded Photo Effects

**Files:**
- Create: `v3/src/effects/image-effects.ts`
- Create: `v3/src/effects/image-effects.test.ts`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Modify: `v3/src/editor/canvas/EditorCanvas.test.tsx`
- Modify: `v3/src/editor/panels/EffectsPanel.tsx`
- Create/Modify: `v3/src/editor/panels/EffectsPanel.test.tsx`

**Interface:**

```ts
export type ImageEffectRenderPlan = {
  filters: Array<(imageData: ImageData) => void>;
  attrs: Record<string, number | boolean>;
  requiresCache: boolean;
  cacheKey: string;
};

export function buildImageEffectRenderPlan(effects: ImageEffects): ImageEffectRenderPlan;
```

- [ ] **Step 1: Write RED adapter tests**

Assert neutral state returns no filters and no cache requirement. Assert active brightness uses `Konva.Filters.Brightness`, never deprecated `Brighten`. Assert stable ordered combinations for Contrast, HSL, Blur, Grayscale, Sepia, Enhance, Emboss, Invert, Noise, Pixelate, Posterize, Solarize, Threshold.

- [ ] **Step 2: Verify RED**

```bash
npm --prefix v3 test -- src/effects/image-effects.test.ts
```

- [ ] **Step 3: Implement deterministic effect adapter**

Use a fixed filter order. Map normalized editor values to Konva attrs. Implement temperature/tint as deterministic RGB/RGBA channel adjustment inside this adapter. Build `cacheKey` only from effect values that affect cached pixels.

- [ ] **Step 4: Write RED renderer cache test**

Mock the Konva image node and prove:
- image load + active cached effect calls `cache()`;
- effect-value change re-caches and redraws;
- neutral state calls `clearCache()`.

- [ ] **Step 5: Replace `EditorCanvas` in-component filter logic**

Memoize `buildImageEffectRenderPlan(element.effects)`. Apply its filters/attrs. Re-cache on `image` or `plan.cacheKey` changes.

- [ ] **Step 6: Expand EffectsPanel**

Groups:
- **Temel:** Parlaklık, Kontrast, Doygunluk, Bulanıklık
- **Renk:** Ton, Sıcaklık, Tint, Siyah Beyaz, Sepya, Ters Renk
- **Stil:** Enhance, Emboss, Noise, Pixelate, Posterize, Solarize, Threshold

All sliders use `beginHistoryBatch`/`endHistoryBatch`. Toggles remain one history step.

- [ ] **Step 7: Verify GREEN**

```bash
npm --prefix v3 test -- src/effects/image-effects.test.ts src/editor/panels/EffectsPanel.test.tsx src/editor/canvas/EditorCanvas.test.tsx
npm --prefix v3 run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add v3/src/effects v3/src/editor/canvas/EditorCanvas.tsx v3/src/editor/canvas/EditorCanvas.test.tsx v3/src/editor/panels/EffectsPanel.tsx v3/src/editor/panels/EffectsPanel.test.tsx
git commit -m "feat: rebuild photo effect pipeline"
```

---

### Task 3: Fixed Tool Navigation with Independent Content Scroll

**Files:**
- Modify: `v3/src/editor/panels/ToolPanel.tsx`
- Modify: `v3/src/editor/panels/ToolPanel.test.tsx`
- Modify: `v3/src/editor/panels/rich-panels.css`
- Modify: `v3/src/styles.css`

- [ ] **Step 1: Write RED structure test**

```ts
expect(screen.getByTestId('tool-panel-nav')).toBeInTheDocument();
expect(screen.getByTestId('tool-panel-content')).toBeInTheDocument();
```

Open `Hazır Tasarımlar` and assert the templates live inside `tool-panel-content`, while Photo/Text/category buttons remain in `tool-panel-nav`.

- [ ] **Step 2: Verify RED**

```bash
npm --prefix v3 test -- src/editor/panels/ToolPanel.test.tsx
```

- [ ] **Step 3: Split panel shell**

```tsx
<aside className="tool-panel">
  <div className="tool-panel-nav" data-testid="tool-panel-nav">...</div>
  <div className="tool-panel-content" data-testid="tool-panel-content">...</div>
</aside>
```

- [ ] **Step 4: Add bounded scroll CSS**

```css
.tool-panel {
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}
.tool-panel-content {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

On mobile use a bounded `max-height` for active content instead of letting the document grow indefinitely.

- [ ] **Step 5: Verify GREEN**

```bash
npm --prefix v3 test -- src/editor/panels/ToolPanel.test.tsx
npm --prefix v3 run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add v3/src/editor/panels/ToolPanel.tsx v3/src/editor/panels/ToolPanel.test.tsx v3/src/editor/panels/rich-panels.css v3/src/styles.css
git commit -m "fix: isolate tool panel scrolling"
```

---

### Task 4: Grapheme-Safe Vertical Stacked Text

**Files:**
- Create: `v3/src/text/layout.ts`
- Create: `v3/src/text/layout.test.ts`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Modify: `v3/src/editor/panels/TextInspector.tsx`
- Modify: `v3/src/editor/panels/TextInspector.test.tsx`
- Modify: `v3/src/store/editor-store.test.ts`

**Interfaces:**

```ts
export function segmentGraphemes(text: string): string[];
export function getDisplayText(text: string, mode: TextWritingMode): string;
export function getWritingModeBox(
  element: Pick<TextElement, 'x' | 'y' | 'width' | 'height' | 'fontSize'>,
  mode: TextWritingMode,
  graphemeCount: number,
): { x: number; y: number; width: number; height: number };
```

- [ ] **Step 1: Write RED grapheme tests**

```ts
expect(getDisplayText('KRAL', 'vertical-stacked')).toBe('K\nR\nA\nL');
expect(segmentGraphemes('A👨‍👩‍👧‍👦B')).toEqual(['A', '👨‍👩‍👧‍👦', 'B']);
```

Also cover a combining-character example.

- [ ] **Step 2: Verify RED**

```bash
npm --prefix v3 test -- src/text/layout.test.ts
```

- [ ] **Step 3: Implement layout helper**

Use `Intl.Segmenter(undefined, { granularity: 'grapheme' })` when available, with `Array.from(text)` fallback only when Segmenter is unavailable. Stored source text never changes.

- [ ] **Step 4: Write RED inspector/history test**

Switch horizontal → vertical and assert source text stays unchanged, geometry center is preserved, and one `undo()` restores the prior mode/geometry.

- [ ] **Step 5: Add `Yatay / Dikey` inspector control and render derived display text**

Switching mode computes a sensible new box through `getWritingModeBox`. `EditorCanvas` passes `getDisplayText(...)` into Konva Text.

- [ ] **Step 6: Verify GREEN**

```bash
npm --prefix v3 test -- src/text/layout.test.ts src/editor/panels/TextInspector.test.tsx src/editor/canvas/EditorCanvas.test.tsx src/store/editor-store.test.ts
npm --prefix v3 run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add v3/src/text v3/src/editor/canvas/EditorCanvas.tsx v3/src/editor/panels/TextInspector.tsx v3/src/editor/panels/TextInspector.test.tsx v3/src/store/editor-store.test.ts
git commit -m "feat: add vertical stacked text"
```

---

### Task 5: Expanded Deterministic Image Animations

**Files:**
- Modify: `v3/src/animations/evaluator.ts`
- Modify: `v3/src/animations/evaluator.test.ts`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Modify: `v3/src/editor/canvas/EditorCanvas.test.tsx`
- Modify: `v3/src/editor/panels/MotionPanel.tsx`
- Create/Modify: `v3/src/editor/panels/MotionPanel.test.tsx`

**Expanded interface:**

```ts
export type EvaluatedAnimation = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  skewX: number;
  skewY: number;
  hueShift: number;
  blurAmount: number;
  revealProgress: number;
  chromaticOffset: number;
};
```

- [ ] **Step 1: Write RED table-driven tests for every preset**

Keep existing presets and add:
- Ken Burns
- Slow Pan
- Orbit
- Breathing Zoom
- Rubber
- Flip X
- Flip Y
- Pendulum
- Drift
- Parallax
- Jello
- Wobble
- Heartbeat
- Flash
- Reveal
- Scanline
- Glitch RGB
- Chromatic Shake
- Focus Pulse
- Pixel Pulse

For each preset, same definition + timestamp must produce deep-equal output. Test delay and non-loop clamp behavior.

- [ ] **Step 2: Verify RED**

```bash
npm --prefix v3 test -- src/animations/evaluator.test.ts
```

- [ ] **Step 3: Implement pure animation math**

Use speed period + intensity multiplier + optional direction. No `Math.random()`, DOM time reads, or imperative Tween state inside evaluator.

- [ ] **Step 4: Add RED canvas tests for new channels**

With fixed `timeOverrideMs`, assert skew/focus/chromatic/reveal output is stable and project geometry does not mutate.

- [ ] **Step 5: Wire channels into renderer**

Direct props handle x/y/scale/rotation/opacity/skew. Transient hue/blur/pixel values feed the effect adapter as render overrides. RGB/glitch uses render-only helper image layers, never persisted project elements.

- [ ] **Step 6: Expand MotionPanel**

Preset cards plus shared **Hız** and **Yoğunluk**. Show **Yön** only for presets that use direction.

- [ ] **Step 7: Verify GREEN**

```bash
npm --prefix v3 test -- src/animations/evaluator.test.ts src/editor/canvas/EditorCanvas.test.tsx src/editor/panels/MotionPanel.test.tsx
npm --prefix v3 run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add v3/src/animations v3/src/editor/canvas/EditorCanvas.tsx v3/src/editor/canvas/EditorCanvas.test.tsx v3/src/editor/panels/MotionPanel.tsx v3/src/editor/panels/MotionPanel.test.tsx
git commit -m "feat: expand deterministic photo animations"
```

---

### Task 6: Proportional Canvas Resize

**Files:**
- Create: `v3/src/sizing/project-size.ts`
- Create: `v3/src/sizing/project-size.test.ts`
- Modify: `v3/src/store/editor-store.ts`
- Modify: `v3/src/store/editor-store.test.ts`
- Create: `v3/src/editor/panels/CanvasSizePanel.tsx`
- Create: `v3/src/editor/panels/CanvasSizePanel.test.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`

**Interface:**

```ts
export function resizeProjectProportionally(
  project: Project,
  newWidth: number,
  newHeight: number,
): Project;
```

- [ ] **Step 1: Write RED resize tests**

300×100 → 600×200 must double element size/position, text `fontSize`, `strokeWidth`, `shadowBlur`, and frame width.

300×100 → 300×300 must use uniform scale 1 and re-center element centers without distortion:

```ts
const oldCx = element.x + element.width / 2;
const oldCy = element.y + element.height / 2;
const relativeX = oldCx - oldW / 2;
const relativeY = oldCy - oldH / 2;
const newCx = newW / 2 + relativeX * uniformScale;
const newCy = newH / 2 + relativeY * uniformScale;
```

- [ ] **Step 2: Verify RED**

```bash
npm --prefix v3 test -- src/sizing/project-size.test.ts
```

- [ ] **Step 3: Implement pure resize transform**

Validate positive finite integer dimensions inside schema limits. Scale element geometry uniformly; scale text visual dimensions and frame width; decorations remain dimension-relative.

- [ ] **Step 4: Add store RED test for one undo step**

`resizeProject(600, 200)` then one `undo()` must restore the exact prior project.

- [ ] **Step 5: Add CanvasSizePanel**

Presets:
- 300×100
- 350×120
- 450×150
- 600×200
- 150×150
- 200×200
- 300×300
- Custom

Custom width/height commit only after validation. Do not mutate on every number-field keystroke.

- [ ] **Step 6: Wire panel into workspace controls**

Keep current canvas dimensions visible. Resize action calls the store once.

- [ ] **Step 7: Verify GREEN**

```bash
npm --prefix v3 test -- src/sizing/project-size.test.ts src/store/editor-store.test.ts src/editor/panels/CanvasSizePanel.test.tsx
npm --prefix v3 run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add v3/src/sizing v3/src/store/editor-store.ts v3/src/store/editor-store.test.ts v3/src/editor/panels/CanvasSizePanel.tsx v3/src/editor/panels/CanvasSizePanel.test.tsx v3/src/editor/EditorShell.tsx
git commit -m "feat: restore proportional canvas sizing"
```

---

### Task 7: PNG/GIF Scale, GIF Profiles, and Work Budget

**Files:**
- Create: `v3/src/export/profiles.ts`
- Create: `v3/src/export/profiles.test.ts`
- Modify: `v3/src/export/png.ts`
- Modify: `v3/src/export/png.test.ts`
- Modify: `v3/src/export/gif.ts`
- Modify: `v3/src/export/gif.test.ts`
- Modify: `v3/src/export/gif-browser.ts`
- Create: `v3/src/editor/panels/ExportPanel.tsx`
- Create: `v3/src/editor/panels/ExportPanel.test.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`

**Interfaces:**

```ts
export function getExportDimensions(
  projectWidth: number,
  projectHeight: number,
  scale: ExportScale,
): { width: number; height: number };

export function getGifFramePlan(
  durationMs: number,
  profile: GifProfile,
): { frameCount: number; frameTimesMs: number[]; delayMs: number };

export function getGifWorkBudget(width: number, height: number, frameCount: number): number;
export function assertSafeGifWorkBudget(work: number): void;
```

Profiles:

```ts
small:    targetFps = 8,  maxFrames = 16
balanced: targetFps = 12, maxFrames = 36
quality:  targetFps = 20, maxFrames = 60
```

Minimum 2 frames. Evenly sample the full `durationMs`. Hard budget ceiling: `100_000_000` pixel-frames.

- [ ] **Step 1: Write RED profile/dimension tests**

Assert `300×100 @2x => 600×200`, stable profile frame times, max-frame clamps, and >100M work rejection.

- [ ] **Step 2: Verify RED**

```bash
npm --prefix v3 test -- src/export/profiles.test.ts
```

- [ ] **Step 3: Implement pure profile helpers**

No DOM/Konva imports in `profiles.ts`.

- [ ] **Step 4: Write RED PNG output-scale test and implement scaled PNG**

Extend:

```ts
downloadStagePng(stage, filename, scale)
```

Output dimensions must be logical project size × export scale, independent of responsive preview scale. Hide selection transformer during capture.

- [ ] **Step 5: Write RED GIF plan/size test and implement scaled GIF**

Encoder dimensions are project × export scale. `encodeGifFrames` receives the exact deterministic `frameTimesMs`. Check work budget before encoder startup.

- [ ] **Step 6: Add ExportPanel**

Show 1x/2x/3x/4x, Küçük/Dengeli/Kaliteli, final output pixels, and budget warning. Controls call `setExportSettings`; they do not alter element geometry or visual undo history.

- [ ] **Step 7: Wire EditorShell exports**

`handlePngExport` reads `project.exportSettings.scale`. `handleGifExport` reads both scale/profile, computes profile/work budget, uses `exportTimeMs` for each exact sample, then restores live time.

- [ ] **Step 8: Verify GREEN**

```bash
npm --prefix v3 test -- src/export/profiles.test.ts src/export/png.test.ts src/export/gif.test.ts src/editor/panels/ExportPanel.test.tsx src/editor/EditorShell.test.tsx
npm --prefix v3 run typecheck
```

- [ ] **Step 9: Commit**

```bash
git add v3/src/export v3/src/editor/panels/ExportPanel.tsx v3/src/editor/panels/ExportPanel.test.tsx v3/src/editor/EditorShell.tsx
git commit -m "feat: add PNG and GIF output sizing"
```

---

### Task 8: Full Integration and Release Gate

**Files:**
- Modify only files implicated by concrete failing regression tests/review findings.
- Verify: `.github/workflows/v3-ci.yml`
- Verify: `vercel.json`

- [ ] **Step 1: Add one end-to-end editor integration test**

Cover this state flow:
1. image selected;
2. effect changes;
3. rich image animation selected;
4. text added and switched vertical;
5. canvas resized proportionally;
6. export set to 2x + balanced;
7. PNG/GIF handlers receive latest dimensions/settings;
8. export settings did not alter visual element geometry.

- [ ] **Step 2: Run full verification**

```bash
npm --prefix v3 test
npm --prefix v3 run typecheck
npm --prefix v3 run build
```

Expected: all PASS on the exact branch head proposed for PR.

- [ ] **Step 3: Inspect logs for test-quality warnings**

Block on React `act(...)` warnings, unhandled promises, jsdom navigation errors, or worker crashes. Do not hide the existing Vite large-chunk warning by merely raising the warning limit.

- [ ] **Step 4: Verify deployment policy**

Root `vercel.json` must still contain:

```json
{
  "git": {
    "deploymentEnabled": {
      "*": false,
      "main": true
    }
  }
}
```

No feature-branch Vercel preview deployment loop.

- [ ] **Step 5: Review all acceptance criteria**

Every item must have code + automated evidence:
- working image effects;
- independent left-panel scroll;
- vertical stacked text;
- expanded deterministic image animations;
- proportional canvas resize;
- PNG/GIF 1x–4x;
- GIF Small/Balanced/Quality;
- V1 migration;
- meaningful undo/redo;
- preview/export parity.

- [ ] **Step 6: Request final code review**

Compare `main` to current branch head. Fix every Critical/Important finding, then repeat Step 2.

- [ ] **Step 7: Open PR**

Title:

```text
Upgrade V3 editor effects, animation and sizing
```

PR body includes the five user-reported gaps, V1 migration, exact final test count, typecheck/build evidence, and the no-preview deployment policy.

- [ ] **Step 8: Finish branch only after green review gate**

Use `superpowers:finishing-a-development-branch`. Merge to `main` only after the exact final head is green. That main merge triggers one production Vercel deployment.

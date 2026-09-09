# Flash Nick V3 Editor Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Flash Nick Studio V3 with reliable photo effects, independently scrollable tool content, vertical stacked text, richer deterministic image animations, proportional canvas resizing, and controllable PNG/GIF output sizing.

**Architecture:** Keep React + react-konva + Zustand and the existing deterministic preview/export model. Move effect mapping, text layout, project sizing, migration, animation evaluation, and export sizing into focused pure modules so preview, undo/redo, persistence, PNG, and GIF all share the same state and calculations.

**Tech Stack:** React 19, TypeScript 7, Vite 8, react-konva 19, Konva 10, Zustand 5, Zod 4, Vitest 5, IndexedDB persistence, gif.js.

**Spec:** `docs/superpowers/specs/2026-09-09-flash-nick-v3-editor-pro-design.md`

## Global Constraints

- Anything visible in live preview must render the same way in PNG/GIF export.
- Keep direct canvas position/resize/rotation behavior.
- One completed user edit gesture creates one undo history step.
- Existing V1 persisted projects must migrate instead of being discarded.
- Project resize and export resize remain separate concepts.
- Project resize uses the approved proportional rule: uniform element scaling with center-preserving recentering.
- PNG/GIF export scale supports exactly `1 | 2 | 3 | 4`.
- GIF profiles are exactly `small | balanced | quality`.
- Feature branches use GitHub CI only. Only `main` may trigger Vercel deployment.
- Do not replace React/Konva with PixiJS, Three.js, or a WebGL-first renderer in this phase.

---

## File Structure

### New focused modules

- `v3/src/model/migrate.ts` — migrate legacy V1 project JSON into the current schema.
- `v3/src/effects/image-effects.ts` — map editor effect state to ordered Konva filters/attributes/cache key.
- `v3/src/text/layout.ts` — grapheme-safe horizontal/vertical display text and text-box helpers.
- `v3/src/sizing/project-size.ts` — proportional project resize transform and numeric validation.
- `v3/src/export/profiles.ts` — output dimensions, GIF frame plans, and export work-budget validation.
- `v3/src/editor/panels/CanvasSizePanel.tsx` — project width/height presets and custom resize controls.
- `v3/src/editor/panels/ExportPanel.tsx` — PNG/GIF scale/profile controls and final dimensions.

### Existing files to modify

- `v3/src/model/project.ts` — schema version, text writing mode, expanded effects, richer animation definition, export settings.
- `v3/src/model/schema.ts` — validate the current model only.
- `v3/src/store/editor-store.ts` — migration-aware load, proportional resize, export settings actions.
- `v3/src/persistence/project-db.ts` — migrate before validating restored projects.
- `v3/src/animations/evaluator.ts` — deterministic expanded animation channels/presets.
- `v3/src/editor/canvas/EditorCanvas.tsx` — consume effect/text/animation adapters without owning their business rules.
- `v3/src/editor/panels/EffectsPanel.tsx` — working grouped effect controls.
- `v3/src/editor/panels/MotionPanel.tsx` — richer preset grid with speed/intensity/direction.
- `v3/src/editor/panels/TextInspector.tsx` — horizontal/vertical writing control.
- `v3/src/editor/panels/ToolPanel.tsx` — fixed navigation plus independently scrollable active content.
- `v3/src/editor/panels/rich-panels.css` and `v3/src/styles.css` — bounded tool-content scrolling and new controls.
- `v3/src/editor/EditorShell.tsx` — canvas/export panels and scaled export wiring.
- `v3/src/export/png.ts` — explicit pixel ratio/output scale.
- `v3/src/export/gif.ts` and `v3/src/export/gif-browser.ts` — deterministic profile frame plan and scaled output.

---

### Task 1: Current Project Model and V1 Migration

**Files:**
- Modify: `v3/src/model/project.ts`
- Modify: `v3/src/model/schema.ts`
- Create: `v3/src/model/migrate.ts`
- Modify: `v3/src/store/editor-store.ts`
- Modify: `v3/src/persistence/project-db.ts`
- Test: `v3/src/model/project.test.ts`
- Test: `v3/src/model/migrate.test.ts`
- Test: `v3/src/persistence/project-db.test.ts`

**Interfaces:**
- Produces: `TextWritingMode = 'horizontal' | 'vertical-stacked'`
- Produces: `AnimationIntensity = 'subtle' | 'normal' | 'strong'`
- Produces: `AnimationDirection = 'left' | 'right' | 'up' | 'down'`
- Produces: `ExportScale = 1 | 2 | 3 | 4`
- Produces: `GifProfile = 'small' | 'balanced' | 'quality'`
- Produces: `migrateProject(input: unknown): Project`
- Existing `parseProject(input)` remains strict current-schema validation.

- [ ] **Step 1: Write migration and default-model failing tests**

Add tests asserting that a legacy V1 project with old text/effects/animation fields migrates to the new version while preserving IDs, geometry, text, asset URLs, decorations, and frame. Also assert defaults:

```ts
expect(migrated.elements[0]).toMatchObject({
  writingMode: 'horizontal',
  animation: { intensity: 'normal' },
});
expect(migrated.exportSettings).toEqual({ scale: 1, gifProfile: 'balanced' });
```

For an image, assert all new effect fields receive neutral values.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npm --prefix v3 test -- src/model/project.test.ts src/model/migrate.test.ts src/persistence/project-db.test.ts
```

Expected: FAIL because the new model fields and `migrateProject` do not exist.

- [ ] **Step 3: Extend the current data model**

In `project.ts`, add:

```ts
export type TextWritingMode = 'horizontal' | 'vertical-stacked';
export type AnimationIntensity = 'subtle' | 'normal' | 'strong';
export type AnimationDirection = 'left' | 'right' | 'up' | 'down';
export type ExportScale = 1 | 2 | 3 | 4;
export type GifProfile = 'small' | 'balanced' | 'quality';

export type ExportSettings = {
  scale: ExportScale;
  gifProfile: GifProfile;
};
```

Extend `TextElement` with `writingMode`, `AnimationDefinition` with `intensity` and optional `direction`, `ImageEffects` with the spec fields, and `Project` with `exportSettings`. Increment the current project version to `2`.

Use neutral defaults:

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

- [ ] **Step 4: Implement migration before strict validation**

Create `migrateProject(input)` that:

1. Accepts unknown input.
2. Detects `version: 1`.
3. Adds only missing new fields while preserving legacy data.
4. Produces `version: 2`.
5. Calls `parseProject()` on the migrated output.
6. For `version: 2`, simply validates through `parseProject()`.
7. Rejects unknown future versions instead of guessing.

Update persistence restore and `loadProject` to call `migrateProject`, not strict `parseProject` directly.

- [ ] **Step 5: Run tests and typecheck**

```bash
npm --prefix v3 test -- src/model/project.test.ts src/model/migrate.test.ts src/persistence/project-db.test.ts src/store/editor-store.test.ts
npm --prefix v3 run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v3/src/model v3/src/store/editor-store.ts v3/src/persistence/project-db.ts
git commit -m "feat: add editor pro project migration"
```

---

### Task 2: Reliable and Expanded Image Effect Engine

**Files:**
- Create: `v3/src/effects/image-effects.ts`
- Create: `v3/src/effects/image-effects.test.ts`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Modify: `v3/src/editor/panels/EffectsPanel.tsx`
- Test: `v3/src/editor/canvas/EditorCanvas.test.tsx`
- Test: `v3/src/editor/panels/EffectsPanel.test.tsx`

**Interfaces:**
- Consumes: current `ImageEffects` from Task 1.
- Produces:

```ts
export type ImageEffectRenderPlan = {
  filters: Array<(imageData: ImageData) => void>;
  attrs: Record<string, number | boolean>;
  requiresCache: boolean;
  cacheKey: string;
};

export function buildImageEffectRenderPlan(effects: ImageEffects): ImageEffectRenderPlan;
```

- [ ] **Step 1: Write failing pure adapter tests**

Test that neutral effects produce no filters and `requiresCache === false`. Test non-neutral values map to the correct ordered Konva filters. Explicitly assert that `Konva.Filters.Brightness` is used and `Konva.Filters.Brighten` is not.

Also test stable ordering with multiple active effects, for example brightness + HSL + blur + pixelate + invert.

- [ ] **Step 2: Run adapter tests and verify RED**

```bash
npm --prefix v3 test -- src/effects/image-effects.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the effect adapter**

Use a fixed filter order. Map normalized UI state to Konva attributes. Use Konva-native deterministic filters for Brightness, Contrast, HSL, Blur, Grayscale, Sepia, Enhance, Emboss, Invert, Noise, Pixelate, Posterize, Solarize, and Threshold.

Implement temperature/tint through deterministic RGB/RGBA channel adjustments in the adapter rather than a second renderer.

Create `cacheKey` from only effect values that affect cached pixels, for example:

```ts
const cacheKey = JSON.stringify([
  effects.brightness,
  effects.contrast,
  effects.saturation,
  effects.blurRadius,
  effects.hue,
  effects.temperature,
  effects.tint,
  effects.enhance,
  effects.emboss,
  effects.invert,
  effects.noise,
  effects.pixelate,
  effects.posterize,
  effects.solarize,
  effects.threshold,
  effects.grayscale,
  effects.sepia,
]);
```

- [ ] **Step 4: Write RED renderer test for cache refresh**

Mock a Konva Image node and verify that changing an effect value causes `cache()` and layer redraw, while returning to the neutral plan clears the cache.

- [ ] **Step 5: Wire `EditorCanvas` to the adapter**

Delete the in-component `buildImageFilters`. In `CanvasImageElement`, memoize the render plan and use its `filters` and `attrs`. Re-cache when `image` or `plan.cacheKey` changes.

- [ ] **Step 6: Expand the Effects UI**

Group controls under `Temel`, `Renk`, and `Stil`. Keep continuous sliders inside `beginHistoryBatch` / `endHistoryBatch`. Toggle/preset buttons remain one history step each.

- [ ] **Step 7: Run focused and regression tests**

```bash
npm --prefix v3 test -- src/effects/image-effects.test.ts src/editor/panels/EffectsPanel.test.tsx src/editor/canvas/EditorCanvas.test.tsx
npm --prefix v3 run typecheck
```

Expected: PASS and effect state changes are visible in renderer props/cache behavior.

- [ ] **Step 8: Commit**

```bash
git add v3/src/effects v3/src/editor/canvas/EditorCanvas.tsx v3/src/editor/panels/EffectsPanel.tsx v3/src/editor/panels/EffectsPanel.test.tsx
git commit -m "feat: rebuild image effect pipeline"
```

---

### Task 3: Independently Scrollable Tool Content

**Files:**
- Modify: `v3/src/editor/panels/ToolPanel.tsx`
- Modify: `v3/src/editor/panels/ToolPanel.test.tsx`
- Modify: `v3/src/editor/panels/rich-panels.css`
- Modify: `v3/src/styles.css`

**Interfaces:**
- Produces a `.tool-panel-content` region that is the only vertically scrollable desktop category area.

- [ ] **Step 1: Write failing structure test**

Render `ToolPanel`, open `Hazır Tasarımlar`, and assert:

```ts
expect(screen.getByTestId('tool-panel-nav')).toBeInTheDocument();
expect(screen.getByTestId('tool-panel-content')).toContainElement(
  screen.getByLabelText('Hazır Tasarımlar'),
);
```

Also assert `tool-panel-content` exists regardless of active category so layout does not jump.

- [ ] **Step 2: Run and verify RED**

```bash
npm --prefix v3 test -- src/editor/panels/ToolPanel.test.tsx
```

Expected: FAIL because the regions do not exist.

- [ ] **Step 3: Split fixed navigation from active content**

Structure `ToolPanel` as:

```tsx
<aside className="tool-panel">
  <div className="tool-panel-nav" data-testid="tool-panel-nav">...</div>
  <div className="tool-panel-content" data-testid="tool-panel-content">...</div>
</aside>
```

Photo/Text actions and category buttons remain in the nav region. Only active category panels render inside content.

- [ ] **Step 4: Add desktop/mobile bounded scrolling CSS**

Desktop:

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

Mobile uses a bounded max-height for active content instead of allowing the whole page to expand indefinitely.

- [ ] **Step 5: Run test and typecheck**

```bash
npm --prefix v3 test -- src/editor/panels/ToolPanel.test.tsx
npm --prefix v3 run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v3/src/editor/panels/ToolPanel.tsx v3/src/editor/panels/ToolPanel.test.tsx v3/src/editor/panels/rich-panels.css v3/src/styles.css
git commit -m "fix: keep editor tool navigation visible"
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
- Consumes: `TextWritingMode` from Task 1.
- Produces:

```ts
export function segmentGraphemes(text: string): string[];
export function getDisplayText(text: string, mode: TextWritingMode): string;
export function getWritingModeBox(
  element: Pick<TextElement, 'x' | 'y' | 'width' | 'height' | 'fontSize'>,
  mode: TextWritingMode,
  graphemeCount: number,
): { x: number; y: number; width: number; height: number };
```

- [ ] **Step 1: Write failing grapheme tests**

Cover plain Turkish text, emoji, and composed graphemes. Example:

```ts
expect(getDisplayText('KRAL', 'vertical-stacked')).toBe('K\nR\nA\nL');
expect(segmentGraphemes('A👨‍👩‍👧‍👦B')).toEqual(['A', '👨‍👩‍👧‍👦', 'B']);
```

- [ ] **Step 2: Run and verify RED**

```bash
npm --prefix v3 test -- src/text/layout.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement segmentation and display text**

Prefer `Intl.Segmenter(undefined, { granularity: 'grapheme' })`. Provide a deterministic fallback using `Array.from(text)` only when Segmenter is unavailable.

- [ ] **Step 4: Add one-step writing-mode store/UI behavior test**

Select a text element, switch to `vertical-stacked`, assert source `element.text` remains unchanged and only `writingMode`/geometry change. Undo must restore horizontal mode in one step.

- [ ] **Step 5: Implement inspector control and center-preserving box change**

Add a clearly labeled `Yatay / Dikey` segmented control. When switching modes, compute the new text box but preserve the previous box center.

- [ ] **Step 6: Render derived display text in `EditorCanvas`**

Pass `getDisplayText(element.text, element.writingMode)` to Konva Text. Do not mutate stored source text.

- [ ] **Step 7: Run focused tests**

```bash
npm --prefix v3 test -- src/text/layout.test.ts src/editor/panels/TextInspector.test.tsx src/editor/canvas/EditorCanvas.test.tsx src/store/editor-store.test.ts
npm --prefix v3 run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add v3/src/text v3/src/editor/canvas/EditorCanvas.tsx v3/src/editor/panels/TextInspector.tsx v3/src/editor/panels/TextInspector.test.tsx v3/src/store/editor-store.test.ts
git commit -m "feat: add vertical stacked text"
```

---

### Task 5: Expanded Deterministic Image Animation Engine

**Files:**
- Modify: `v3/src/animations/evaluator.ts`
- Modify: `v3/src/animations/evaluator.test.ts`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Modify: `v3/src/editor/panels/MotionPanel.tsx`
- Modify: `v3/src/editor/panels/MotionPanel.test.tsx`

**Interfaces:**
- Consumes: expanded `AnimationDefinition` from Task 1.
- Produces expanded `EvaluatedAnimation`:

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

- [ ] **Step 1: Write table-driven RED tests for all presets**

For every existing and new preset, assert two calls with the same animation definition/time return deep-equal values. Test identity before `delayMs`, and test `loop: false` clamps at the final frame.

Include the new presets from the spec: Ken Burns, Slow Pan, Orbit, Breathing Zoom, Rubber, Flip X, Flip Y, Pendulum, Drift, Parallax, Jello, Wobble, Heartbeat, Flash, Reveal, Scanline, Glitch RGB, Chromatic Shake, Focus Pulse, Pixel Pulse.

- [ ] **Step 2: Run evaluator tests and verify RED**

```bash
npm --prefix v3 test -- src/animations/evaluator.test.ts
```

Expected: FAIL because presets/channels do not exist.

- [ ] **Step 3: Implement pure evaluator math**

Keep all output derived only from definition + timestamp. Use speed period, intensity multiplier, direction sign/vector, and deterministic trig/phase functions. No `Math.random()` and no imperative Konva Tween state.

- [ ] **Step 4: Write RED canvas tests for new render channels**

For a selected image with a fixed `timeOverrideMs`, assert skew/blur/chromatic/reveal-related props/helper output are deterministic and stored geometry remains unchanged.

- [ ] **Step 5: Wire render channels**

Use direct Konva props for x/y/scale/rotation/opacity/skew. Feed `hueShift`, `blurAmount`, and pixel pulse into the effect render plan as transient render overrides. Use render-only helper image layers for RGB/chromatic split where needed. Keep helper layers out of project state.

- [ ] **Step 6: Expand Motion UI**

Show presets as labeled cards. Add shared `Hız` and `Yoğunluk` controls. Show direction controls only for directional presets.

- [ ] **Step 7: Run focused tests and typecheck**

```bash
npm --prefix v3 test -- src/animations/evaluator.test.ts src/editor/canvas/EditorCanvas.test.tsx src/editor/panels/MotionPanel.test.tsx
npm --prefix v3 run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add v3/src/animations v3/src/editor/canvas/EditorCanvas.tsx v3/src/editor/panels/MotionPanel.tsx v3/src/editor/panels/MotionPanel.test.tsx
git commit -m "feat: expand deterministic image animations"
```

---

### Task 6: Proportional Project Canvas Resizing

**Files:**
- Create: `v3/src/sizing/project-size.ts`
- Create: `v3/src/sizing/project-size.test.ts`
- Modify: `v3/src/store/editor-store.ts`
- Modify: `v3/src/store/editor-store.test.ts`
- Create: `v3/src/editor/panels/CanvasSizePanel.tsx`
- Create: `v3/src/editor/panels/CanvasSizePanel.test.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`

**Interfaces:**
- Produces:

```ts
export function resizeProjectProportionally(
  project: Project,
  newWidth: number,
  newHeight: number,
): Project;
```

- Store produces:

```ts
resizeProject(width: number, height: number): void;
```

- [ ] **Step 1: Write pure sizing RED tests**

Same aspect ratio example: 300×100 → 600×200 must double positions, width/height, fontSize, strokeWidth, shadowBlur, and frame width.

Aspect ratio change example: 300×100 → 300×300 uses `uniformScale = 1`; element sizes remain undistorted while their centers are re-centered relative to the new canvas center.

Use element-center math:

```ts
oldElementCenterX = element.x + element.width / 2;
oldElementCenterY = element.y + element.height / 2;
relativeX = oldElementCenterX - oldW / 2;
relativeY = oldElementCenterY - oldH / 2;
newCenterX = newW / 2 + relativeX * uniformScale;
newCenterY = newH / 2 + relativeY * uniformScale;
newX = newCenterX - newElementWidth / 2;
newY = newCenterY - newElementHeight / 2;
```

- [ ] **Step 2: Run and verify RED**

```bash
npm --prefix v3 test -- src/sizing/project-size.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement pure proportional resize**

Validate finite integer dimensions inside project schema limits. Scale each visual element uniformly, text visual dimensions, and frame width. Keep decorations declarative.

- [ ] **Step 4: Write store RED test for one undo step**

Call `resizeProject(600, 200)`, then one `undo()` must restore the exact prior project.

- [ ] **Step 5: Add store action and Canvas Size UI**

Add presets exactly from spec and custom numeric width/height. Preset/custom apply calls the store once, not once per keystroke. Invalid values show inline validation and do not mutate the project.

- [ ] **Step 6: Wire into EditorShell workspace controls**

Make `Tuval Boyutu` an actionable control that opens/displays `CanvasSizePanel`. Ensure current final dimensions remain visible.

- [ ] **Step 7: Run tests and typecheck**

```bash
npm --prefix v3 test -- src/sizing/project-size.test.ts src/store/editor-store.test.ts src/editor/panels/CanvasSizePanel.test.tsx
npm --prefix v3 run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add v3/src/sizing v3/src/store/editor-store.ts v3/src/store/editor-store.test.ts v3/src/editor/panels/CanvasSizePanel.tsx v3/src/editor/panels/CanvasSizePanel.test.tsx v3/src/editor/EditorShell.tsx
git commit -m "feat: add proportional canvas sizing"
```

---

### Task 7: PNG/GIF Output Scale, Profiles, and Memory Guard

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
- Modify: `v3/src/store/editor-store.ts`

**Interfaces:**
- Produces:

```ts
export type ExportDimensions = { width: number; height: number };

export function getExportDimensions(
  projectWidth: number,
  projectHeight: number,
  scale: ExportScale,
): ExportDimensions;

export function getGifFramePlan(
  durationMs: number,
  profile: GifProfile,
): { frameCount: number; frameTimesMs: number[]; delayMs: number };

export function getGifWorkBudget(
  width: number,
  height: number,
  frameCount: number,
): number;

export function assertSafeGifWorkBudget(work: number): void;
```

Use deterministic profile targets:

```ts
small:    targetFps = 8
balanced: targetFps = 12
quality:  targetFps = 20
```

Clamp minimum frames to 2 and maximum frames to 16 / 36 / 60 respectively. Generate evenly spaced frame timestamps over `durationMs`.

Use `100_000_000` pixel-frames as the initial hard work-budget ceiling from the approved spec self-review.

- [ ] **Step 1: Write profile/dimension RED tests**

Assert `300×100 @2x` returns `600×200`. Assert each profile generates stable frame times and respects maximum frame counts. Assert work above 100M throws a useful error.

- [ ] **Step 2: Run and verify RED**

```bash
npm --prefix v3 test -- src/export/profiles.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement pure export profile helpers**

Keep all calculations free of DOM/Konva so tests are cheap and deterministic.

- [ ] **Step 4: Write RED PNG scale test**

Mock a Stage whose logical preview scale differs from output scale. Assert PNG capture requests the correct effective pixel ratio and output dimensions while excluding `.selection-transformer`.

- [ ] **Step 5: Implement scaled PNG export**

Extend `downloadStagePng(stage, filename, scale)` and capture helpers. Output scale is relative to logical project dimensions, not current responsive display dimensions.

- [ ] **Step 6: Write RED GIF frame/profile test**

Pass a profile plan into `encodeGifFrames`. Assert `renderFrame` receives the exact deterministic timestamps and encoder width/height match project × export scale.

- [ ] **Step 7: Implement scaled/profiled GIF export**

Create the encoder at final output dimensions. Render each frame from logical project state at the requested timestamp, then capture/scale to final dimensions. Reject unsafe budgets before loading/starting the encoder.

- [ ] **Step 8: Add ExportPanel**

Show:

- 1x / 2x / 3x / 4x
- Küçük / Dengeli / Kaliteli
- Final dimensions, e.g. `600 × 200 px`
- A warning when the current GIF budget is unsafe

Changing these settings updates only `project.exportSettings` (or the dedicated persisted export settings state decided in Task 1) and does not add a visual undo step.

- [ ] **Step 9: Run tests and typecheck**

```bash
npm --prefix v3 test -- src/export/profiles.test.ts src/export/png.test.ts src/export/gif.test.ts src/editor/panels/ExportPanel.test.tsx
npm --prefix v3 run typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add v3/src/export v3/src/editor/panels/ExportPanel.tsx v3/src/editor/panels/ExportPanel.test.tsx v3/src/store/editor-store.ts
git commit -m "feat: add controllable PNG and GIF sizing"
```

---

### Task 8: EditorShell Integration and Preview/Export Parity

**Files:**
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/EditorShell.test.tsx`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Modify: `v3/src/editor/canvas/EditorCanvas.test.tsx`
- Modify: `v3/src/editor/toolbar/TopToolbar.tsx`
- Modify: `v3/src/styles.css`

**Interfaces:**
- Consumes Tasks 1–7.
- Produces a fully wired editor where project/export size controls and preview/export renderer share the same project/evaluator state.

- [ ] **Step 1: Write failing integration tests**

Cover this user flow in `EditorShell.test.tsx` with render-module mocks only where browser canvas APIs make it unavoidable:

1. Add/select an image.
2. Open Effects and change brightness.
3. Select a new image animation.
4. Add text and switch to vertical.
5. Resize 300×300 → 300×100.
6. Set export scale 2x and GIF profile balanced.
7. Trigger PNG/GIF export.
8. Assert exporters receive the latest state/dimensions and the visual project geometry is unchanged by export settings.

- [ ] **Step 2: Run integration tests and verify RED**

```bash
npm --prefix v3 test -- src/editor/EditorShell.test.tsx src/editor/canvas/EditorCanvas.test.tsx
```

Expected: FAIL on missing final wiring.

- [ ] **Step 3: Wire CanvasSizePanel and ExportPanel into the editor**

Keep controls visible without forcing the user to scroll the long category content. Do not put canvas/export sizing at the bottom of Hazır Tasarımlar.

- [ ] **Step 4: Wire export scale/profile into existing toolbar actions**

`handlePngExport` reads current scale. `handleGifExport` reads scale/profile, computes work budget before encoder startup, sets deterministic `exportTimeMs`, and restores live time afterward.

- [ ] **Step 5: Verify preview/export transient animation channels**

Ensure all transient effect/animation overrides are derived from `timeOverrideMs` during GIF sampling and from live RAF time during preview. No export-only effect implementation is allowed.

- [ ] **Step 6: Run integration tests, full tests, typecheck, build**

```bash
npm --prefix v3 test -- src/editor/EditorShell.test.tsx src/editor/canvas/EditorCanvas.test.tsx
npm --prefix v3 test
npm --prefix v3 run typecheck
npm --prefix v3 run build
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add v3/src/editor v3/src/styles.css
git commit -m "feat: integrate editor pro controls"
```

---

### Task 9: Regression Gate, Documentation, and PR

**Files:**
- Modify where necessary based only on concrete failing tests/review findings.
- Verify: `.github/workflows/v3-ci.yml`
- Verify: `vercel.json`
- Update if necessary: `docs/superpowers/plans/2026-09-09-flash-nick-v3-editor-pro.md` checkboxes only.

**Interfaces:**
- Produces the merge-ready `feat/v3-editor-pro` branch.

- [ ] **Step 1: Run the complete fresh verification gate**

```bash
npm --prefix v3 test
npm --prefix v3 run typecheck
npm --prefix v3 run build
```

Expected: all PASS on the exact branch head proposed for PR.

- [ ] **Step 2: Inspect test logs for warnings**

There must be no React `act(...)` warning, unhandled promise rejection, jsdom navigation warning, or test worker crash. The existing Vite large-chunk warning may remain only if the bundle still builds successfully; do not silence it by merely raising the warning limit.

- [ ] **Step 3: Verify deployment policy before pushing final changes**

Confirm root `vercel.json` still contains:

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

Feature-branch commits must not create preview deployments.

- [ ] **Step 4: Review spec coverage against implementation**

Explicitly verify all acceptance criteria:

- effects visibly mutate selected image
- independent tool-panel content scroll
- vertical stacked text
- expanded deterministic animations
- proportional project resize
- PNG/GIF 1x–4x
- GIF small/balanced/quality
- V1 migration
- meaningful undo/redo
- preview/export parity

Any failed item blocks PR readiness.

- [ ] **Step 5: Request code review on the final diff**

Review base `main` versus the current `feat/v3-editor-pro` head. Fix all Critical and Important findings before proceeding and re-run Step 1 after each fix batch.

- [ ] **Step 6: Open PR against main**

Use title:

```text
Upgrade V3 editor effects, animation and sizing
```

PR body must summarize the five user-requested product gaps, migration behavior, TDD evidence, exact final test count, typecheck/build result, and note that feature branches do not deploy to Vercel.

- [ ] **Step 7: Do not merge until explicitly completing the branch workflow**

After PR verification, follow `superpowers:finishing-a-development-branch`. Merge to `main` only after the final branch gate is green. The resulting `main` merge should trigger exactly one production Vercel deployment.

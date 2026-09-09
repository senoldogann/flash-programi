# Flash Nick V3 Rich Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the V3 foundation into the actual Flash Nick product: rich effects, motion, decorations, animated frames, templates, PNG/GIF export, and local project persistence while keeping the UI simple for nontechnical 40+ users.

**Architecture:** Keep the versioned `Project` model as the single source of truth. Rich visual settings are data, not imperative canvas mutations. A deterministic animation evaluator maps `(project, timeMs)` to render transforms so live preview and GIF export use the same math. Konva remains the scene renderer, Zustand owns editor state/history, and panels only dispatch typed store actions.

**Tech Stack:** React 19.2.x, TypeScript, Vite 8.2.x, Konva 10.x, react-konva 19.2.x, Zustand 5.x, Zod 4.x, Vitest 5.x, gif.js 0.2.0, IndexedDB.

**Spec:** `docs/superpowers/specs/2026-09-08-flash-nick-v3-design.md`

## Global Constraints

- Turkish is the default UI language.
- Controls must be large, labelled, and preset-first; advanced values remain secondary.
- The project model is the single source of truth.
- Preview and GIF export must use the same deterministic animation evaluator.
- Static projects must not run a continuous animation loop.
- Imported images remain local in the browser.
- Undo/redo records meaningful completed mutations.
- Errors must preserve the current project and show actionable Turkish feedback.
- No per-pixel JavaScript image processing in the interactive path.
- Tests, typecheck, and production build must pass before merge.

---

## Planned File Structure

```text
v3/src/
  model/
    project.ts
    schema.ts
  animations/
    evaluator.ts
    evaluator.test.ts
    useAnimationClock.ts
  effects/
    image-effects.ts
  decorations/
    presets.ts
    renderer.tsx
  frames/
    presets.ts
    renderer.tsx
  templates/
    templates.ts
    templates.test.ts
  editor/
    panels/
      EffectsPanel.tsx
      MotionPanel.tsx
      DecorationsPanel.tsx
      FramesPanel.tsx
      TemplatesPanel.tsx
      ToolPanel.tsx
    canvas/
      EditorCanvas.tsx
      TransformableImage.tsx
      TransformableText.tsx
    toolbar/
      TopToolbar.tsx
  export/
    png.ts
    png.test.ts
    gif.ts
    gif.test.ts
  persistence/
    project-db.ts
    project-db.test.ts
```

---

### Task 1: Extend the project model for rich visuals

**Files:**
- Modify: `v3/src/model/project.ts`
- Modify: `v3/src/model/schema.ts`
- Modify: `v3/src/store/editor-store.ts`
- Test: `v3/src/model/project.test.ts`
- Test: `v3/src/store/editor-store.test.ts`

**Interfaces:**
- Produces `AnimationPreset`, `AnimationDefinition`, `ImageEffects`, `DecorationLayer`, `FrameDefinition`.
- Adds `animation` to all editor elements, `effects` to images, and `decorations`/`frame` to `Project`.

- [ ] **Step 1: Write failing tests** that require new projects to contain `decorations: []`, `frame.preset === 'none'`, text/image elements to contain `animation.preset === 'none'`, and image elements to contain neutral effects.
- [ ] **Step 2: Run** `npm test -- src/model/project.test.ts src/store/editor-store.test.ts` and verify RED.
- [ ] **Step 3: Implement exact contracts:**

```ts
export type AnimationPreset = 'none' | 'pulse' | 'float' | 'swing' | 'spin' | 'blink' | 'zoom' | 'shake' | 'slide' | 'bounce' | 'wave';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type AnimationDefinition = { preset: AnimationPreset; speed: AnimationSpeed; delayMs: number; loop: boolean };
export type ImageEffects = { brightness: number; contrast: number; saturation: number; blurRadius: number; grayscale: boolean; sepia: boolean };
export type DecorationPreset = 'stars' | 'hearts' | 'sparkles' | 'snow' | 'bubbles' | 'confetti' | 'flowers' | 'butterflies' | 'fire' | 'lightning' | 'turkish';
export type DecorationLayer = { id: string; preset: DecorationPreset; count: number; opacity: number; speed: AnimationSpeed };
export type FramePreset = 'none' | 'neon' | 'gold' | 'hearts' | 'stars' | 'rainbow' | 'fire' | 'ice' | 'glitter' | 'turkish';
export type FrameDefinition = { preset: FramePreset; width: number };
```

`createDefaultAnimation()` returns `{ preset: 'none', speed: 'normal', delayMs: 0, loop: true }`. `createDefaultImageEffects()` returns neutral values. `createEmptyProject()` includes `decorations: []` and `frame: { preset: 'none', width: 8 }`.

- [ ] **Step 4: Add store actions** `setElementAnimation`, `setImageEffects`, `addDecoration`, `removeDecoration`, `setFrame`, each recording one history step.
- [ ] **Step 5: Run full tests + typecheck and commit.**

---

### Task 2: Build the deterministic animation evaluator

**Files:**
- Create: `v3/src/animations/evaluator.ts`
- Create: `v3/src/animations/evaluator.test.ts`
- Create: `v3/src/animations/useAnimationClock.ts`

**Interfaces:**

```ts
export type EvaluatedAnimation = { x: number; y: number; scaleX: number; scaleY: number; rotation: number; opacity: number };
export function evaluateAnimation(animation: AnimationDefinition, timeMs: number): EvaluatedAnimation;
export function animationNeedsClock(animation: AnimationDefinition): boolean;
```

- [ ] **Step 1: Write failing table tests** for all ten non-none presets and determinism at the same timestamp.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement evaluator** with pure `Math.sin`/`Math.cos` transforms. Speed periods are slow=2800ms, normal=1600ms, fast=850ms. `none` returns identity. `pulse` scales ±8%, `float` offsets Y ±10px, `swing` rotates ±7°, `spin` rotates 0..360°, `blink` opacity 0.2..1, `zoom` scales 0.85..1.15, `shake` offsets X/Y within ±4px, `slide` offsets X ±18px, `bounce` offsets Y 0..-18px, `wave` combines Y ±7px and rotation ±4°.
- [ ] **Step 4: Implement `useAnimationClock(active)`** so RAF runs only when `active === true`; static scenes do not continuously update.
- [ ] **Step 5: Verify and commit.**

---

### Task 3: Make text/image motion and image effects visible on canvas

**Files:**
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Create: `v3/src/editor/canvas/TransformableImage.tsx`
- Create: `v3/src/editor/canvas/TransformableText.tsx`
- Create: `v3/src/effects/image-effects.ts`
- Modify: `v3/src/editor/canvas/EditorCanvas.test.tsx`

**Interfaces:**
- Consumes `evaluateAnimation()` and image effect data.
- Produces canvas nodes that animate without corrupting base project coordinates.

- [ ] **Step 1: Add failing tests** that a `pulse` text receives animated scale at non-zero time and an image with grayscale/brightness effects configures Konva filters.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Split renderable text/image nodes** into focused components. Base geometry remains in project state; evaluated transforms are additive render-only transforms.
- [ ] **Step 4: For image effects**, cache the image node and apply Konva `Brighten`, `Contrast`, `HSL`, `Blur`, `Grayscale`, and `Sepia` filters only when corresponding values are non-neutral.
- [ ] **Step 5: Verify test/typecheck/build and commit.**

---

### Task 4: Replace dead category labels with working preset panels

**Files:**
- Create: `v3/src/editor/panels/ToolPanel.tsx`
- Create: `v3/src/editor/panels/EffectsPanel.tsx`
- Create: `v3/src/editor/panels/MotionPanel.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/styles.css`
- Modify: `v3/src/editor/editor-controls.css`
- Test: `v3/src/editor/EditorShell.test.tsx`

**Interfaces:**
- `ToolPanel` exposes large buttons for `Fotoğraf`, `Yazı`, `Efekt`, `Hareket`, `Süsler`, `Çerçeve`, `Hazır Tasarımlar`.

- [ ] **Step 1: Write failing RTL tests** that clicking `Efekt` exposes `Parlaklık`, `Kontrast`, `Doygunluk`, `Bulanıklık`, `Siyah Beyaz`, `Sepya`; clicking `Hareket` exposes the ten animation presets plus `Yavaş/Normal/Hızlı`.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement panel switching** without routing. Effects controls only enable for a selected image and update the store. Motion presets work for selected text/image.
- [ ] **Step 4: Add visible selected-state cards** and a `Hareket Yok` preset.
- [ ] **Step 5: Verify and commit.**

---

### Task 5: Add deterministic decorations and frames

**Files:**
- Create: `v3/src/decorations/presets.ts`
- Create: `v3/src/decorations/renderer.tsx`
- Create: `v3/src/frames/presets.ts`
- Create: `v3/src/frames/renderer.tsx`
- Create: `v3/src/editor/panels/DecorationsPanel.tsx`
- Create: `v3/src/editor/panels/FramesPanel.tsx`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`

**Interfaces:**
- Decorations render from project `DecorationLayer[]` with deterministic positions derived from `(layer.id, particleIndex)` and time.
- Frames render above content and are not selectable editor elements.

- [ ] **Step 1: Write failing tests** for deterministic decoration points and frame preset lookup.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement decoration presets** `Yıldız`, `Kalp`, `Parıltı`, `Kar`, `Baloncuk`, `Konfeti`, `Çiçek`, `Kelebek`, `Ateş`, `Şimşek`, `Türk Bayrağı`. Default count 18, opacity .8, speed normal.
- [ ] **Step 4: Implement frames** `Neon`, `Altın`, `Kalpler`, `Yıldızlar`, `Gökkuşağı`, `Ateş`, `Buz`, `Simli`, `Türk`. Render with Konva Rect/Text primitives, animated dash/colour phase where appropriate.
- [ ] **Step 5: Verify and commit.**

---

### Task 6: Add 20 one-click templates

**Files:**
- Create: `v3/src/templates/templates.ts`
- Create: `v3/src/templates/templates.test.ts`
- Create: `v3/src/editor/panels/TemplatesPanel.tsx`
- Modify: `v3/src/store/editor-store.ts`

**Interfaces:**

```ts
export type DesignTemplate = { id: string; name: string; emoji: string; description: string; apply(project: Project): Project };
export const DESIGN_TEMPLATES: DesignTemplate[];
```

- [ ] **Step 1: Write failing tests** requiring exactly 20 unique templates and verifying applying one preserves image assets/text content while changing style settings.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement templates:** Neon Gece, Altın Şıklık, Romantik, Ateşli, Buz Mavisi, Türk, Galaksi, Retro, Pembe Neon, Mavi Neon, Kırmızı Kalp, Yıldızlı Gece, Gökkuşağı, Oyuncu, Zarif, Matrix, Elektrik, Çiçek Bahçesi, Kelebek, Parti.
- [ ] **Step 4: Add `applyTemplate(id)` store action** as one undoable mutation and expose template cards.
- [ ] **Step 5: Verify and commit.**

---

### Task 7: Enable production PNG export and keyboard shortcuts

**Files:**
- Create: `v3/src/export/png.ts`
- Create: `v3/src/export/png.test.ts`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/toolbar/TopToolbar.tsx`

**Interfaces:**

```ts
export type EditorCanvasHandle = { exportPng(): string; captureFrame(timeMs: number): Promise<HTMLCanvasElement> };
export function downloadDataUrl(dataUrl: string, filename: string): void;
```

- [ ] **Step 1: Write failing tests** for filename sanitization and that selection Transformer is excluded during export.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement `forwardRef` handle**. Export at logical project resolution independent of viewport scale.
- [ ] **Step 4: Enable `PNG İndir`; bind Cmd/Ctrl+S to PNG, Cmd/Ctrl+Z undo, Cmd/Ctrl+Shift+Z redo.** Prevent browser defaults only when editor action is handled.
- [ ] **Step 5: Verify and commit.**

---

### Task 8: Add animated GIF export using the same evaluator

**Files:**
- Modify: `v3/package.json` to add `gif.js@0.2.0`
- Create: `v3/src/types/gif-js.d.ts`
- Create: `v3/src/export/gif.ts`
- Create: `v3/src/export/gif.test.ts`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/toolbar/TopToolbar.tsx`

**Interfaces:**

```ts
export type GifExportOptions = { durationMs: number; fps: number; width: number; height: number };
export async function exportGif(captureFrame: (timeMs: number) => Promise<HTMLCanvasElement>, options: GifExportOptions, onProgress?: (value: number) => void): Promise<Blob>;
```

- [ ] **Step 1: Write failing tests** for frame timestamps and delay calculation.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Import `GIF` from `gif.js` and worker URL from `gif.js/dist/gif.worker.js?url`; encode at default 12fps for 3000ms.** Each capture uses `EditorCanvasHandle.captureFrame(timeMs)`, therefore the same evaluator powers preview and export.
- [ ] **Step 4: Add `GIF İndir` with progress state and Turkish failure messages.**
- [ ] **Step 5: Verify and commit.**

---

### Task 9: Local autosave and project restore

**Files:**
- Create: `v3/src/persistence/project-db.ts`
- Create: `v3/src/persistence/project-db.test.ts`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/toolbar/TopToolbar.tsx`

**Interfaces:**

```ts
export async function saveProject(project: Project): Promise<void>;
export async function loadLatestProject(): Promise<Project | null>;
export async function clearSavedProject(): Promise<void>;
```

- [ ] **Step 1: Write failing IndexedDB tests** with a fake implementation.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Persist validated project JSON in database `flash-nick-v3`, store `projects`, key `latest`.** Blob URLs are session-only; if the project contains blob image assets, preserve current runtime state but show a Turkish notice that the photo must be reselected after a full browser restart.
- [ ] **Step 4: Add debounced autosave after meaningful project changes and `Yeni Tasarım` action with confirmation.**
- [ ] **Step 5: Verify and commit.**

---

### Task 10: Final rich-editor verification and deployment gate

- [ ] Run `npm test` from `v3/` and require zero failures.
- [ ] Run `npm run typecheck` and require exit 0.
- [ ] Run `npm run build` and require exit 0.
- [ ] Verify Vercel preview build status is success.
- [ ] Verify UI has working Fotoğraf, Yazı, Efekt, Hareket, Süsler, Çerçeve, Hazır Tasarımlar, PNG and GIF actions with no dead primary category buttons.
- [ ] Merge only after the above evidence exists.

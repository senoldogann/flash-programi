# Project V3 Classic SesliChat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Slice 5 of the approved Flash Studio Classic + Neo V3 architecture: historical canvas sizes, deterministic classic GIF palette/dither simulation, richer particle recipes, and the first 15 Classic SesliChat scene recipes through the existing editor.

**Architecture:** Keep the current V2 Zustand store/persistence boundary for this slice, because the approved V3 cutover is incremental. Classic recipes mutate one V2 `Project` atomically, then the existing `migrateProjectToV3 -> evaluateScene -> SceneRenderer` path turns decorations into V3 particle layers and text materials into `text3d` layers. GIF palette/dither is an export post-process applied to captured frames only; scene evaluation/rendering remains identical between preview and export before color quantization.

**Tech Stack:** React 19, TypeScript, Zustand, Zod, Konva/react-konva, Vitest, gif.js, Vite.

**Spec:** `docs/superpowers/specs/2026-09-09-flash-studio-classic-neo-v3-design.md`

## Global Constraints

- Classic and Neo share one project model, evaluator, renderer, preview path, and export path.
- For the same project and timestamp, preview and export resolve and render the same scene state.
- Historical sizes required in this slice: 120x70, 125x75, 130x70, 130x95, 130x100, 133x33, 300x100.
- Classic recipes may use hard bevels, deep extrusion, thick outlines, glossy gradients, glitter, stars, hearts, fire, high-contrast shadows, and optional GIF palette/dither simulation.
- Existing projects remain loadable. New export color fields are optional on old projects and default at use sites.
- Current V2 persistence remains active. No destructive Project V3 persistence cutover in Slice 5.
- GIF palette/dither happens after Stage capture; it must not introduce an export-only scene renderer.
- No cloud AI or paid external service is introduced.
- Existing export dimension/work-budget limits remain authoritative.

---

### Task 1: Historical Classic Size Catalog

**Files:**
- Create: `v3/src/classic/historical-sizes.ts`
- Create: `v3/src/classic/historical-sizes.test.ts`
- Modify: `v3/src/editor/panels/CanvasSizePanel.tsx`
- Modify: `v3/src/editor/panels/CanvasSizePanel.test.tsx`

**Interfaces:**
- Produces: `CLASSIC_HISTORICAL_SIZES: readonly { width: number; height: number; label: string }[]`.
- CanvasSizePanel consumes the catalog before the existing modern/editor sizes and deduplicates dimensions.

- [ ] **Step 1: Write the failing tests** asserting all seven approved historical sizes are present exactly once and are visible as buttons in CanvasSizePanel.
- [ ] **Step 2: Run `npm test -- historical-sizes.test.ts CanvasSizePanel.test.tsx` and verify RED.**
- [ ] **Step 3: Implement the catalog and consume it from CanvasSizePanel.** Keep the custom-size flow unchanged.
- [ ] **Step 4: Re-run the focused tests and verify GREEN.**
- [ ] **Step 5: Commit** with `feat: add historical Classic canvas sizes`.

### Task 2: Classic GIF Palette and Dither Profiles

**Files:**
- Modify: `v3/src/model/project.ts`
- Modify: `v3/src/model/schema.ts`
- Modify: `v3/src/model/migrate.test.ts`
- Create: `v3/src/export/gif-color-profile.ts`
- Create: `v3/src/export/gif-color-profile.test.ts`
- Modify: `v3/src/export/gif.ts`
- Modify: `v3/src/export/gif.test.ts`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/panels/ExportPanel.tsx`
- Modify: `v3/src/editor/panels/ExportPanel.test.tsx`

**Interfaces:**
- Add `GifPaletteProfile = 'adaptive' | 'classic-64' | 'classic-27'`.
- Add `GifDitherProfile = 'none' | 'ordered-4x4'`.
- Extend `ExportSettings` with optional `gifPalette?: GifPaletteProfile` and `gifDither?: GifDitherProfile`; `createEmptyProject()` explicitly sets `adaptive` / `none` while schemas accept missing values for old saves.
- Produce `processGifFramePixels(data, width, height, palette, dither): Uint8ClampedArray` as a pure deterministic quantizer.
- Produce `processGifFrameCanvas(frame, palette, dither): HTMLCanvasElement` that copies the source canvas and never mutates it.
- Extend `encodeGifFrames` with optional `processFrame(frame): HTMLCanvasElement | Promise<HTMLCanvasElement>`; encoder receives the processed frame.

- [ ] **Step 1: Write RED tests** for old-project compatibility, quantization boundaries, ordered dithering determinism, source immutability, and `encodeGifFrames` processor ordering.
- [ ] **Step 2: Run focused tests and verify RED.**
- [ ] **Step 3: Implement model/schema additions without schema-default shape mutation.**
- [ ] **Step 4: Implement RGB-cube quantization.** `classic-64` uses 4 levels per channel, `classic-27` uses 3 levels per channel; alpha is preserved. Ordered 4x4 Bayer offsets are deterministic and bounded before quantization.
- [ ] **Step 5: Wire frame processing into GIF export only.** `adaptive + none` returns the captured frame unchanged; Classic profiles copy/process the canvas.
- [ ] **Step 6: Add ExportPanel controls labelled `GIF Renk Paleti` and `Dither` with `Uyarlanabilir`, `Klasik 64`, `Klasik 27`, `Kapalı`, `Ordered 4×4`.
- [ ] **Step 7: Run focused tests, then full test/typecheck/build.**
- [ ] **Step 8: Commit** with `feat: add Classic GIF palette and dither profiles`.

### Task 3: Classic Scene Recipe Engine and Particle Compositions

**Files:**
- Create: `v3/src/classic/recipes.ts`
- Create: `v3/src/classic/recipes.test.ts`
- Modify: `v3/src/store/editor-store.ts`
- Modify: `v3/src/store/editor-store.test.ts`

**Interfaces:**
- Produce `ClassicRecipeId` and `CLASSIC_SCENE_RECIPES` with exactly these 15 names: `Altın Döner Nick`, `Krom Döner Nick`, `Mor Bayan Flash`, `Kırmızı Kalpli Bayan`, `Mavi Erkek Flash`, `Şapkalı Flash`, `Ateş Nick`, `Türk Bayraklı`, `Gotik Siyah`, `Glitter Princess`, `Çift Nick`, `Resimli Döner Nick`, `Sinevizyon Portre`, `Aşk Flash`, `Kral / Taç Nick`.
- Each recipe defines historical size, background, frame, 1-3 particle decoration layers, Text3D material preset, text motion, optional image effects, and a simple layout family (`nick`, `portrait-left`, `portrait-full`).
- Produce `applyClassicSceneRecipe(project, recipeId): Project` as a pure full-project recipe application that preserves existing element IDs/assets, creates a default `NICK` text only if none exists, and returns a schema-valid project.
- Add store action `applyClassicRecipe(recipeId): void` that records the entire recipe as one undo step.

- [ ] **Step 1: Write RED tests** for exactly 15 unique recipes, exact approved names, required-size usage, 1-3 deterministic particle layers, valid project output, photo preservation, default text creation, and one-step undo.
- [ ] **Step 2: Run focused tests and verify RED.**
- [ ] **Step 3: Implement recipe descriptors and pure application helpers.** Use existing frame/decoration/material/motion primitives only; do not introduce image assets or network dependencies.
- [ ] **Step 4: Implement layouts.** Nick layout centers Text3D; portrait-left fits latest image into the left region and text on the right; portrait-full keeps the image as a contained/cropped visual base with text over the lower/center region.
- [ ] **Step 5: Integrate one atomic Zustand action.**
- [ ] **Step 6: Run focused tests and verify GREEN.**
- [ ] **Step 7: Commit** with `feat: add 15 Classic SesliChat scene recipes`.

### Task 4: Classic Easy-Mode Recipe UI

**Files:**
- Modify: `v3/src/editor/panels/FlashNickPanel.tsx`
- Modify: `v3/src/editor/panels/FlashNickPanel.test.tsx`
- Modify if needed: `v3/src/editor/editor-controls.css`

**Interfaces:**
- FlashNickPanel renders the 15 `CLASSIC_SCENE_RECIPES` as one-click cards and calls `applyClassicRecipe(id)`.
- Existing manual material, back-face, and motion controls remain available below the recipe section.

- [ ] **Step 1: Write RED UI tests** that all 15 recipe names are discoverable and applying `Altın Döner Nick` changes size/material/motion/particles through the store.
- [ ] **Step 2: Run focused test and verify RED.**
- [ ] **Step 3: Implement `Klasik Hazır Tasarımlar` section before manual controls.** Keep copy concise and Turkish.
- [ ] **Step 4: Run focused tests and verify GREEN.**
- [ ] **Step 5: Commit** with `feat: expose Classic scene recipes in easy mode`.

### Task 5: V3 Particle/Recipe and GIF Export Parity Guards

**Files:**
- Create: `v3/src/classic/classic-v3-parity.test.ts`
- Modify: `v3/src/editor/EditorShell.text3d-export-parity.test.tsx`
- Modify if required: `v3/src/model/v3/migrate-to-v3.test.ts`

**Interfaces:**
- A Classic recipe applied in V2 must migrate into V3 with Text3D plus particle/frame layers and evaluate deterministically.
- GIF color processing receives the Stage capture for each explicit export timestamp; it cannot replace `EditorCanvas`, `evaluateScene`, or `SceneRenderer`.

- [ ] **Step 1: Write parity tests** for recipe -> V3 layer mapping and explicit GIF timestamps -> same Stage capture -> color processor -> encoder.
- [ ] **Step 2: Run focused parity tests and verify behavior.**
- [ ] **Step 3: Make only minimal fixes if parity exposes a real gap.**
- [ ] **Step 4: Run all tests, typecheck, and production build.**
- [ ] **Step 5: Commit** with `test: lock Classic V3 and GIF export parity`.

### Task 6: Release Gate and PR

**Files:**
- Update this plan only if verification discovers a documented deviation.

- [ ] **Step 1: Run full `npm test`.** Require zero failures.
- [ ] **Step 2: Run `npm run typecheck`.** Require success.
- [ ] **Step 3: Run `npm run build`.** Require success; bundle-size warnings are recorded separately from blockers.
- [ ] **Step 4: Audit changed files against Slice 5 and verify no independent export renderer, cloud AI path, or random non-deterministic particle source was introduced.
- [ ] **Step 5: Open a draft PR from `feat/project-v3-classic-seslichat` to `main`, record exact-head CI evidence, review-thread count, and known non-blocking warnings.
- [ ] **Step 6: Mark ready and squash-merge only after exact-head CI is green.** Keep the feature branch unless explicitly authorized to delete it.
- [ ] **Step 7: Verify GitHub Pages deployment for the merge commit.**

## Self-Review

- Spec coverage: historical sizes, palette/dither, particles, 15 Classic recipes, easy-mode access, V3 migration/parity, and release verification are all mapped to tasks.
- Scope: Neo Flash, Subject Motion, Advanced Timeline, Puppet V2, and final release-hardening remain outside Slice 5.
- Compatibility: old V2 projects may omit the new GIF color fields; use-site fallbacks prevent parser shape mutation.
- Type consistency: `GifPaletteProfile`, `GifDitherProfile`, `ClassicRecipeId`, `CLASSIC_SCENE_RECIPES`, `applyClassicSceneRecipe`, and `applyClassicRecipe` are the canonical names used throughout this plan.
- No placeholders remain.

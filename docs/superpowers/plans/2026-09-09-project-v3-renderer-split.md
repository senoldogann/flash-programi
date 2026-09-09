# Project V3 Renderer Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut the canvas render path over to Project V3 `evaluateScene(project, timeMs)` and split the monolithic editor canvas into focused layer renderers while preserving current editing behavior and preview/PNG/GIF parity.

**Architecture:** Keep the current V2 Zustand store and persistence active for this slice. `EditorCanvas` converts the current V2 project to an in-memory Project V3 with `migrateProjectToV3`, resolves one `ResolvedSceneV3` per timestamp with `evaluateScene`, and delegates drawing to a new `SceneRenderer`. Layer-specific renderers consume only resolved V3 layers; V2 editing commits remain an adapter at the editor boundary until the later runtime/persistence cutover.

**Tech Stack:** TypeScript, React, react-konva/Konva, Zod migration boundary, Vitest, existing image effects / decoration / frame render helpers.

**Spec:** `docs/superpowers/specs/2026-09-09-flash-studio-classic-neo-v3-design.md`

## Global Constraints

- `Preview(t)` and export rendering at `t` must use the same resolved scene state.
- Existing V1/V2 projects and the current V2 store/persistence remain operational in this slice.
- Renderer input is `ResolvedSceneV3`; renderers do not evaluate animation clips independently.
- Existing export safety checks and GIF encoder contract stay unchanged.
- Existing editor selection, drag, transform, image effects, text materials, decorations, frames and empty-state CTA must remain behavior-compatible.
- Project timeline remains bounded to 30 seconds.
- No cloud or generative AI dependency is introduced.
- `main` must remain shippable after this slice.

---

### Task 1: Add the V2-to-resolved-scene render adapter and parity tests

**Files:**
- Create: `v3/src/editor/canvas/render-scene.ts`
- Create: `v3/src/editor/canvas/render-scene.test.ts`

**Interfaces:**
- Consumes: `migrateProjectToV3(input): ProjectV3`
- Consumes: `evaluateScene(project: ProjectV3, timeMs: number): ResolvedSceneV3`
- Produces: `resolveEditorScene(project: Project, timeMs: number): ResolvedSceneV3`
- Produces: `resolvedLayerAnimation(layer: ResolvedLayerV3): EvaluatedAnimation`

`resolvedLayerAnimation` is the transitional interaction adapter. It derives the animation delta/factors from `layer.source.transform` and `layer.transform`, and carries the resolved filter/reveal channels so existing geometry commit code can subtract animation exactly.

- [ ] **Step 1: Write failing adapter tests**

```ts
const resolved = resolveEditorScene(project, 600);
expect(resolved.layers.map((layer) => layer.id)).toEqual(project.elements.map((element) => element.id));
expect(resolved.layers[0].transform.x).toBeCloseTo(project.elements[0].x + evaluateAnimation(project.elements[0].animation, 600).x);
```

Also cover image filter channels, text Xara alternate face, project background/dimensions, and immutability.

- [ ] **Step 2: Run `npm test -- src/editor/canvas/render-scene.test.ts` and verify RED** because the adapter does not exist.
- [ ] **Step 3: Implement the pure adapter** with one migration + one `evaluateScene` call and no React/Konva dependency.
- [ ] **Step 4: Run focused tests, full tests, typecheck and build; verify GREEN.**
- [ ] **Step 5: Commit the task.**

---

### Task 2: Extract resolved image layer rendering

**Files:**
- Create: `v3/src/editor/canvas/layers/ResolvedImageLayer.tsx`
- Create: `v3/src/editor/canvas/layers/ResolvedImageLayer.test.tsx`
- Create: `v3/src/editor/canvas/selection-transformer.tsx`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`

**Interfaces:**
- Consumes: `ResolvedLayerV3` where `source.type === 'image'`
- Consumes: `resolvedLayerAnimation(layer)` only for editor interaction commit compensation
- Produces: `ResolvedImageLayer`

Render rules:
- geometry comes from `layer.transform`, never `evaluateAnimation`;
- opacity is `layer.opacity * layer.animation.revealProgress`;
- image effects use `source.effects` plus resolved hue/blur/pixelate channels;
- chromatic ghosts use `layer.animation.chromaticOffset`;
- `visible`, `locked`, selection and drag/transform behavior remain unchanged;
- cache lifecycle remains identical to the current image element renderer.

- [ ] **Step 1: Write RED component tests** asserting resolved x/y/scale/rotation/skew/opacity and image-effect channels are used directly.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Extract shared transformer chrome into `selection-transformer.tsx` and implement `ResolvedImageLayer`.**
- [ ] **Step 4: Wire the image path in `EditorCanvas` to the resolved renderer while keeping V2 commit callbacks at the boundary.**
- [ ] **Step 5: Run image/EditorCanvas tests, full tests, typecheck and build; commit.**

---

### Task 3: Extract resolved text and text3d rendering

**Files:**
- Create: `v3/src/editor/canvas/layers/ResolvedTextLayer.tsx`
- Create: `v3/src/editor/canvas/layers/ResolvedTextLayer.test.tsx`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`

**Interfaces:**
- Consumes: resolved `text` and `text3d` layers
- Produces: `ResolvedTextLayer`

Render rules:
- text layout and typography come from `layer.source`;
- resolved transform/opacity are authoritative;
- Xara alternate-face uses `layer.animation.alternateFace` and `backText`;
- flat text remains flat;
- migrated text3d preserves the current material gradient, extrusion depth/color and shadow behavior;
- extrusion children inherit the same resolved transform and do not evaluate time independently.

- [ ] **Step 1: Write RED tests** for front/back text, plain text, material gradient and extrusion rendering from resolved state.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement `ResolvedTextLayer` and remove the old inline text renderer from `EditorCanvas`.**
- [ ] **Step 4: Run text/EditorCanvas tests, full tests, typecheck and build.**
- [ ] **Step 5: Commit.**

---

### Task 4: Add resolved particle/frame layer renderers and the SceneRenderer

**Files:**
- Create: `v3/src/editor/canvas/layers/ResolvedParticleLayer.tsx`
- Create: `v3/src/editor/canvas/layers/ResolvedFrameLayer.tsx`
- Create: `v3/src/editor/canvas/SceneRenderer.tsx`
- Create: `v3/src/editor/canvas/SceneRenderer.test.tsx`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`

**Interfaces:**
- Produces: `SceneRenderer({ scene, selectedElementId, previewScale, onSelectElement, onBeginInteraction, onFinishInteraction })`

Render rules:
- scene layer order is rendered exactly as supplied;
- invisible layers stay in the tree with `visible={false}` where applicable;
- particle/frame preset clocks receive `scene.timeMs`, so preview and export use the same explicit timestamp;
- particle/frame group transform/opacity use resolved layer state, enabling future clips without changing these renderers;
- `SceneRenderer` never calls `evaluateAnimation`, `evaluateClip` or `evaluateScene`.

- [ ] **Step 1: Write RED scene renderer tests** for exact layer order, visibility, particle/frame timestamp and no independent animation evaluation.
- [ ] **Step 2: Verify RED.**
- [ ] **Step 3: Implement particle/frame adapters and `SceneRenderer`.**
- [ ] **Step 4: Reduce `EditorCanvas` to clock + scene resolution + stage/viewport/selection/interaction orchestration.**
- [ ] **Step 5: Run renderer tests, EditorCanvas tests, full tests, typecheck and build; commit.**

---

### Task 5: Lock preview/PNG/GIF parity on the resolved-scene path

**Files:**
- Modify: `v3/src/editor/canvas/EditorCanvas.test.tsx`
- Modify: `v3/src/editor/EditorShell.integration.test.tsx`
- Modify: `v3/src/editor/EditorShell.export-settings.test.tsx` only if needed for explicit timestamp assertions

**Acceptance tests:**
- the visible preview at an explicit `timeOverrideMs` renders the same resolved transform/effect state used immediately before stage capture;
- GIF frame rendering changes only `timeOverrideMs`, then captures that same stage;
- PNG capture does not invoke a second renderer or evaluator;
- selection transformers remain hidden only during capture and restored afterward;
- no direct `evaluateAnimation(` call remains in `EditorCanvas.tsx` or layer renderers;
- no duplicate preview-only/export-only render implementation exists.

- [ ] **Step 1: Add failing parity assertions** around representative animated image and Xara text frames.
- [ ] **Step 2: Verify RED against the pre-cutover path where appropriate.**
- [ ] **Step 3: Finish wiring so the assertions pass without introducing a second capture renderer.**
- [ ] **Step 4: Run `npm test`, `npm run typecheck`, `npm run build`.**
- [ ] **Step 5: Audit changed files and grep-equivalent source search for independent animation evaluation in renderer files.**
- [ ] **Step 6: Update the PR body with exact head/run/test/build evidence and mark ready only after fresh CI is green.**

---

## Final Slice Acceptance

- Full V3 test suite passes.
- TypeScript typecheck passes.
- Production Vite build passes.
- `EditorCanvas` renders an in-memory migrated/resolved Project V3 scene.
- Layer renderers consume resolved state and do not evaluate clips independently.
- Preview/PNG/GIF continue to capture the same Konva stage, with GIF supplying explicit timestamps through `timeOverrideMs`.
- Current V2 editing store and persistence remain active and user edits still commit correctly.
- Existing image effects, text/material rendering, decorations, frames, selection, drag/transform and empty-state behavior remain green.
- No new cloud dependency or alternate export-only renderer is introduced.

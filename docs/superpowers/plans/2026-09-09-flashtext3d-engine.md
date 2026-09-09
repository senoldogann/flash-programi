# FlashText3D Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the provisional repeated-Konva-Text extrusion for Project V3 `text3d` layers with a deterministic supersampled raster engine that renders separate shadow, extrusion/side, bevel, face, outline, gloss and texture passes while preserving the shared preview/PNG/GIF scene path.

**Architecture:** Keep the current V2 Zustand store and persistence as the editing boundary for this slice. V2 text material/extrusion fields are translated by `migrateProjectToV3` into a fully serializable `Text3DStyleV3`; `evaluateScene` remains the only animation evaluator. A pure render-plan builder turns a resolved `text3d` layer into deterministic pass instructions, a browser Canvas2D rasterizer executes those instructions at a bounded supersample factor, and a dedicated `ResolvedText3DLayer` displays the downsampled raster inside the same Konva Stage captured by preview, PNG and GIF.

**Tech Stack:** TypeScript 7, React 19, Konva/react-konva 10/19, browser Canvas2D, Zod 4, Vitest 5, existing Project V3 evaluator/renderer.

**Spec:** `docs/superpowers/specs/2026-09-09-flash-studio-classic-neo-v3-design.md`

## Global Constraints

- `Preview(t)` and export rendering at `t` must use the same resolved scene state.
- Full Three.js/WebGL is not introduced in this slice.
- Text3D uses deterministic high-resolution raster composition and downsampling.
- Existing V1/V2 projects remain loadable; V2 store/persistence remain active during this slice.
- Migration failure must never overwrite source work.
- Canvas/export dimensions remain capped by existing export-safety checks.
- Timeline remains bounded to 30 seconds.
- No cloud, paid AI, or generated-image dependency is introduced.
- Existing Classic/Neo mode semantics remain unchanged; this slice builds the shared engine only.
- `main` must remain independently shippable after merge.

## File Structure

- `v3/src/model/v3/project-v3.ts`: serializable Text3D geometry/material/light types.
- `v3/src/model/v3/schema-v3.ts`: strict Zod validation for the new Text3D style object.
- `v3/src/model/v3/migrate-to-v3.ts`: legacy V2 text -> Text3D recipe translation.
- `v3/src/text3d/material-recipes.ts`: deterministic Classic-compatible defaults and V2 material conversion.
- `v3/src/text3d/render-plan.ts`: pure supersample, padding, lighting and pass planning; no DOM/Konva.
- `v3/src/text3d/rasterizer.ts`: Canvas2D mask/pass execution and final downsampling.
- `v3/src/editor/canvas/layers/ResolvedText3DLayer.tsx`: Konva integration and editor interaction boundary.
- `v3/src/editor/canvas/layers/ResolvedTextLayer.tsx`: flat text only after split.
- `v3/src/editor/canvas/SceneRenderer.tsx`: route `text3d` to the dedicated renderer.

---

### Task 1: Promote Text3D into an explicit V3 style model

**Files:**
- Modify: `v3/src/model/v3/project-v3.ts`
- Modify: `v3/src/model/v3/schema-v3.ts`
- Create: `v3/src/text3d/material-recipes.ts`
- Modify: `v3/src/model/v3/migrate-to-v3.ts`
- Modify: `v3/src/model/v3/schema-v3.test.ts`
- Modify: `v3/src/model/v3/migrate-to-v3.test.ts`
- Create: `v3/src/text3d/material-recipes.test.ts`

**Interfaces:**

`project-v3.ts` produces:

```ts
export type Text3DGradientStopV3 = {
  offset: number;
  color: string;
};

export type Text3DSurfaceV3 = {
  color: string;
  gradient: Text3DGradientStopV3[];
  metallicity: number;
};

export type Text3DStyleV3 = {
  bevel: { size: number; strength: number };
  extrusion: { depth: number; angleDeg: number };
  surfaces: {
    front: Text3DSurfaceV3;
    side: Text3DSurfaceV3;
    back: Text3DSurfaceV3;
  };
  outline: { color: string; width: number };
  shadow: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  gloss: { strength: number; size: number };
  texture: {
    kind: 'none' | 'speckle' | 'brushed';
    strength: number;
  };
  light: {
    azimuthDeg: number;
    elevationDeg: number;
    intensity: number;
    ambient: number;
  };
};
```

`Text3DLayerV3` keeps typography (`text`, `backText`, `writingMode`, `fontFamily`, `fontSize`, `align`) and gains required `style: Text3DStyleV3`. Legacy V3-only `materialPreset`, `extrusionDepth`, `extrusionColor`, `fill`, `stroke`, `strokeWidth`, `shadowColor`, and `shadowBlur` are removed from the V3 `text3d` layer; V2 remains unchanged.

`material-recipes.ts` produces:

```ts
export function createText3DStyleFromLegacy(element: TextElement): Text3DStyleV3;
export function createDefaultText3DStyle(): Text3DStyleV3;
```

Migration precedence is explicit:

1. a non-flat `materialPreset` supplies the front gradient/base material recipe;
2. explicit V2 `extrusionDepth` overrides the recipe depth;
3. explicit V2 `extrusionColor` overrides the side surface color;
4. V2 `stroke` / `strokeWidth` become outline color/width;
5. V2 shadow color/blur become the cast-shadow base;
6. back material is a darker deterministic derivative of the front recipe;
7. no random values are stored.

- [ ] **Step 1: Write RED schema tests** that construct a `text3d` layer with `style`, assert strict parsing succeeds, assert malformed gradient offsets/metallicity/extrusion/light values fail, and assert old provisional V3 `materialPreset` fields are rejected as unknown.

```ts
expect(parseProjectV3({
  ...createDefaultProjectV3(),
  layers: [{
    ...baseLayer,
    id: 'text3d-1',
    name: 'Nick 3D',
    type: 'text3d',
    text: 'SENOL',
    writingMode: 'horizontal',
    fontFamily: 'Impact',
    fontSize: 32,
    align: 'center',
    style: createDefaultText3DStyle(),
  }],
}).layers[0]).toMatchObject({ type: 'text3d' });
```

- [ ] **Step 2: Write RED migration/recipe tests** requiring `xara-gold` to produce front gradient stops, explicit depth `8`, side color `#7c4800`, outline from the source text, nonzero gloss/light values, and a deterministic darker back surface.

- [ ] **Step 3: Run focused tests and verify RED.**

Run:

```bash
cd v3
npm test -- src/model/v3/schema-v3.test.ts src/model/v3/migrate-to-v3.test.ts src/text3d/material-recipes.test.ts
```

Expected: failures because `Text3DStyleV3` and recipe helpers do not exist.

- [ ] **Step 4: Implement the serializable types, strict schemas, material conversion helpers, and V2 -> V3 mapping.**

Schema bounds:

```ts
bevel.size       0..8
bevel.strength   0..1
extrusion.depth  integer 0..16
angleDeg         -360..360
metallicity      0..1
outline.width    0..16
shadow.blur      0..64
shadow.offsetX/Y -64..64
shadow.opacity   0..1
gloss.strength   0..1
gloss.size       0..1
texture.strength 0..1
light.azimuthDeg -360..360
light.elevationDeg -90..90
light.intensity  0..2
light.ambient    0..1
```

Gradient arrays are limited to 16 stops and each offset is `0..1`.

- [ ] **Step 5: Run focused tests, full tests, typecheck and build; verify GREEN.**

```bash
cd v3
npm test
npm run typecheck
npm run build
```

- [ ] **Step 6: Commit Task 1.**

```bash
git add v3/src/model/v3 v3/src/text3d
 git commit -m "feat: define FlashText3D style model"
```

---

### Task 2: Build the pure supersampled Text3D render plan

**Files:**
- Create: `v3/src/text3d/render-plan.ts`
- Create: `v3/src/text3d/render-plan.test.ts`

**Interfaces:**

```ts
export const TEXT3D_MAX_SUPERSAMPLE = 4;
export const TEXT3D_MAX_OFFSCREEN_PIXELS = 16_777_216;

export type Text3DPass =
  | { kind: 'shadow'; color: string; blur: number; offsetX: number; offsetY: number; opacity: number }
  | { kind: 'side'; offsetX: number; offsetY: number; surface: Text3DSurfaceV3; shade: number }
  | { kind: 'bevel'; size: number; highlightOffsetX: number; highlightOffsetY: number; strength: number }
  | { kind: 'face'; surface: Text3DSurfaceV3 }
  | { kind: 'outline'; color: string; width: number }
  | { kind: 'gloss'; strength: number; size: number; angleDeg: number }
  | { kind: 'texture'; texture: Text3DStyleV3['texture']; seed: number };

export type Text3DRenderPlan = {
  text: string;
  fontFamily: string;
  fontSize: number;
  align: TextAlign;
  writingMode: TextWritingMode;
  logicalWidth: number;
  logicalHeight: number;
  padding: number;
  supersample: number;
  passes: Text3DPass[];
};

export function chooseText3DSupersample(width: number, height: number, padding: number): number;
export function buildText3DRenderPlan(layer: ResolvedLayerV3 & { source: Text3DLayerV3 }): Text3DRenderPlan;
```

Rules:

- supersample is the highest integer in `1..4` whose padded high-resolution surface stays at or below `16_777_216` pixels;
- small Flash Nick outputs such as `133x33`, `300x100`, and `300x300` resolve to 4x;
- `alternateFace` selects `backText` and the back material surface when non-empty;
- extrusion produces one deterministic `side` pass per logical depth unit, ordered far-to-near;
- extrusion direction derives from `angleDeg` using cosine/sine;
- side `shade` derives only from light azimuth/elevation/intensity/ambient and stays clamped to `0..1`;
- bevel highlight offset is the normalized inverse light direction multiplied by bevel size;
- padding covers extrusion vector magnitude, outline, bevel, shadow offset/blur, plus 2 logical pixels;
- texture seed is a stable integer hash of the layer ID and selected face text;
- pass order is always: shadow -> side(s) -> bevel -> face -> outline -> gloss -> texture.

- [ ] **Step 1: Write RED tests** for 4x small-output supersampling, budget clamping, deterministic pass order, exact extrusion direction at 0°/90°, light-dependent side shading, back-face material selection, stable texture seed, and no mutation of the layer.

```ts
const plan = buildText3DRenderPlan(resolvedText3D);
expect(plan.passes.map((pass) => pass.kind)).toEqual([
  'shadow',
  ...Array.from({ length: 8 }, () => 'side'),
  'bevel',
  'face',
  'outline',
  'gloss',
  'texture',
]);
expect(plan.supersample).toBe(4);
```

- [ ] **Step 2: Run the focused test and verify RED.**

```bash
cd v3
npm test -- src/text3d/render-plan.test.ts
```

Expected: import failure because `render-plan.ts` does not exist.

- [ ] **Step 3: Implement the pure planner with no DOM, React or Konva imports.** Use a stable FNV-1a-style 32-bit hash for the texture seed; do not use `Math.random()`.

- [ ] **Step 4: Run focused + full tests, typecheck and build; verify GREEN.**

- [ ] **Step 5: Commit Task 2.**

```bash
git add v3/src/text3d/render-plan.ts v3/src/text3d/render-plan.test.ts
 git commit -m "feat: plan supersampled FlashText3D passes"
```

---

### Task 3: Implement the Canvas2D mask/pass rasterizer

**Files:**
- Create: `v3/src/text3d/rasterizer.ts`
- Create: `v3/src/text3d/rasterizer.test.ts`

**Interfaces:**

```ts
export type Text3DRaster = {
  canvas: HTMLCanvasElement;
  padding: number;
  width: number;
  height: number;
};

export type Text3DCanvasFactory = (width: number, height: number) => HTMLCanvasElement;

export function renderText3DToCanvas(
  plan: Text3DRenderPlan,
  createCanvas?: Text3DCanvasFactory,
): Text3DRaster;
```

Production default factory uses `document.createElement('canvas')` and sets exact integer dimensions.

Raster pipeline:

1. create a supersampled alpha mask and render the text layout in white;
2. render the cast shadow from the mask onto the high-resolution composition surface;
3. composite each side/extrusion pass from far to near with its shaded surface;
4. construct a bevel band from a widened text stroke with the front mask subtracted, then light/dark shade it using the plan highlight vector;
5. fill the selected front/back face surface through the front mask;
6. stroke the face outline;
7. render a white-to-transparent gloss gradient and clip it to the face mask;
8. render deterministic `speckle` or `brushed` texture from the stable seed and clip it to the face mask;
9. downsample the high-resolution composition into a logical-size output canvas with `imageSmoothingEnabled = true` and `imageSmoothingQuality = 'high'`.

Text layout rules:

- use `getDisplayText()` before splitting lines;
- use `fontSize` exactly in logical pixels and `fontFamily` verbatim;
- line height is `fontSize * 1.1`;
- vertically center the line block in the logical layer bounds;
- horizontal x anchor is `padding`, `padding + width/2`, or `padding + width` for left/center/right;
- masks and surfaces include padding, but logical geometry does not change.

Surface fill rules:

- if a surface gradient has 2+ stops, use a vertical linear gradient across the logical text height;
- otherwise use `surface.color`;
- metallicity increases highlight/dark-side contrast but never changes pass geometry.

Testing uses an injected fake canvas factory whose contexts record `drawImage`, `fillText`, `strokeText`, gradient stops and smoothing properties. Pixel-perfect browser snapshots are intentionally not introduced in this slice; deterministic plan semantics and raster operation order are the CI contract.

- [ ] **Step 1: Write RED rasterizer tests** asserting: output logical dimensions include `2 * padding`; high-res working surfaces use the exact `supersample`; text mask is rendered; side passes occur before face; gradient stops are applied in sorted offset order; gloss/texture operations happen after the face; final downsample uses high-quality smoothing; and missing 2D context throws a stable `TEXT3D_CANVAS_CONTEXT_UNAVAILABLE` error.

- [ ] **Step 2: Run focused test and verify RED.**

```bash
cd v3
npm test -- src/text3d/rasterizer.test.ts
```

- [ ] **Step 3: Implement the rasterizer and deterministic seeded texture generator.** The PR must contain no `Math.random()` in `v3/src/text3d`.

- [ ] **Step 4: Run focused/full tests, typecheck and build; verify GREEN.**

- [ ] **Step 5: Commit Task 3.**

```bash
git add v3/src/text3d/rasterizer.ts v3/src/text3d/rasterizer.test.ts
 git commit -m "feat: rasterize FlashText3D passes"
```

---

### Task 4: Split resolved flat text and Text3D Konva renderers

**Files:**
- Create: `v3/src/editor/canvas/layers/ResolvedText3DLayer.tsx`
- Create: `v3/src/editor/canvas/layers/ResolvedText3DLayer.test.tsx`
- Modify: `v3/src/editor/canvas/layers/ResolvedTextLayer.tsx`
- Modify: `v3/src/editor/canvas/layers/ResolvedTextLayer.test.tsx`
- Modify: `v3/src/editor/canvas/SceneRenderer.tsx`
- Modify: `v3/src/editor/canvas/SceneRenderer.test.tsx`

**Interfaces:**

`ResolvedTextLayer` accepts only resolved `TextLayerV3`.

`ResolvedText3DLayer` accepts:

```ts
export type ResolvedText3DLayerState = ResolvedLayerV3 & {
  source: Text3DLayerV3;
  type: 'text3d';
};
```

The component:

- calls `buildText3DRenderPlan(renderLayer)` and `renderText3DToCanvas(plan)` only when face text, typography, logical width/height, or `source.style` changes;
- does not rerasterize for animation-only x/y/rotation/scale/reveal changes;
- renders a draggable `Konva.Group` at resolved x/y/rotation/scale/skew/opacity;
- group `width`/`height` remain the logical layer bounds;
- renders the raster image at `x=-padding`, `y=-padding`, `width=raster.width`, `height=raster.height`, `listening=false`;
- uses the group as the selection/transform interaction node so padding does not change project geometry;
- freezes the resolved layer on drag/transform start exactly like current resolved renderers;
- forwards the frozen resolved layer and group geometry to the existing interaction finish callback;
- uses the existing `SelectionTransformer` with `keepRatio={false}`;
- never calls `evaluateAnimation`, `evaluateClip`, or `evaluateScene`.

- [ ] **Step 1: Write RED component tests** with mocked rasterizer requiring: Text3D routes through the raster engine; the raster image includes negative padding inside a logical-size group; resolved transform/opacity/visibility are applied to the group; alternate-face changes select the back plan; locked layers are not draggable; interaction callbacks receive the logical group, not the padded image.

- [ ] **Step 2: Update flat text tests** to assert the flat renderer no longer accepts/implements Text3D extrusion/material behavior.

- [ ] **Step 3: Update SceneRenderer RED test** with a `text3d` layer between another two layers and assert exact dispatch/order.

- [ ] **Step 4: Run focused tests and verify RED.**

```bash
cd v3
npm test -- src/editor/canvas/layers/ResolvedText3DLayer.test.tsx src/editor/canvas/layers/ResolvedTextLayer.test.tsx src/editor/canvas/SceneRenderer.test.tsx
```

- [ ] **Step 5: Implement the dedicated renderer and SceneRenderer dispatch.**

- [ ] **Step 6: Run focused/full tests, typecheck and build; verify GREEN.**

- [ ] **Step 7: Commit Task 4.**

```bash
git add v3/src/editor/canvas/layers/ResolvedText3DLayer.tsx v3/src/editor/canvas/layers/ResolvedText3DLayer.test.tsx v3/src/editor/canvas/layers/ResolvedTextLayer.tsx v3/src/editor/canvas/layers/ResolvedTextLayer.test.tsx v3/src/editor/canvas/SceneRenderer.tsx v3/src/editor/canvas/SceneRenderer.test.tsx
 git commit -m "feat: render resolved FlashText3D rasters"
```

---

### Task 5: Lock Text3D preview/export parity and performance invariants

**Files:**
- Modify: `v3/src/editor/canvas/EditorCanvas.test.tsx`
- Modify: `v3/src/editor/EditorShell.integration.test.tsx`
- Create: `v3/src/text3d/runtime-invariants.test.ts`

**Acceptance contract:**

- `timeOverrideMs` changes only `evaluateScene` input; the Text3D renderer consumes the resulting resolved layer.
- Xara double-sided front/back changes at explicit timestamps without a second animation evaluator in the raster engine.
- preview and PNG/GIF still capture the same Konva Stage.
- GIF frame stepping uses the same Text3D renderer instance path as preview.
- supersampled raster content is memoized across animation-only transform frames.
- changing text, back face, font, logical dimensions, or style invalidates the raster.
- no `evaluateAnimation(`, `evaluateClip(`, or `evaluateScene(` exists in `v3/src/text3d/**` or `ResolvedText3DLayer.tsx`.
- no `Math.random(` exists in `v3/src/text3d/**`.
- no Three.js/WebGL dependency is added to `v3/package.json`.

- [ ] **Step 1: Add RED/guard tests** for explicit front/back timestamps and raster memoization across transform-only rerenders.

- [ ] **Step 2: Add source invariant tests** that read the Text3D source files and reject independent evaluator calls, randomness, Three/WebGL imports, or an export-only Text3D renderer.

- [ ] **Step 3: Run focused tests; fix only parity/performance defects exposed by these assertions.**

- [ ] **Step 4: Run the complete release gate.**

```bash
cd v3
npm test
npm run typecheck
npm run build
```

- [ ] **Step 5: Audit the PR diff and review threads.** Confirm changes are limited to Slice 4 model/migration/Text3D/render integration plus this plan.

- [ ] **Step 6: Update the PR body with exact head SHA, CI run/job IDs, test totals, typecheck/build results, bundle sizes, invariant audit and review-thread count.**

- [ ] **Step 7: Mark ready only after fresh exact-head CI is green, then squash-merge using `expected_head_sha`.**

---

## Final Slice Acceptance

- Project V3 `text3d` has explicit serializable bevel, extrusion, independent front/side/back surfaces, outline, cast shadow, gloss/metallicity, texture and light rig state.
- V2 Xara/extruded text migrates deterministically into that style without changing V2 persistence.
- Small Flash Nick outputs use bounded supersampling and high-quality downsampling.
- Text3D rendering is built from separate deterministic mask/pass operations rather than repeated live Konva text extrusion.
- Flat text stays on the lightweight flat-text renderer.
- Text3D uses one resolved scene timestamp and never evaluates animation independently.
- Preview, PNG and GIF continue to capture the same Konva Stage.
- No random texture behavior, cloud dependency, Three.js/WebGL stack, or alternate export renderer is introduced.
- Full V3 tests, typecheck and production build pass on the exact PR head before merge.

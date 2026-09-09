# Project V3 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a strict Project V3 composition model and loss-preserving V1/V2 -> V3 migration layer without switching the current V2 editor runtime yet.

**Architecture:** V3 lives beside the current V2 runtime in `src/model/v3/`. Existing editor/store code continues to use `Project` V2 during this slice. A new `migrateProjectToV3(input)` canonical converter accepts V1, V2, or already-V3 input and always returns validated V3. Later slices will cut the runtime over to this API after the evaluator/renderer exist.

**Tech Stack:** TypeScript 7, Zod 4, Vitest 5, current React/Konva application unchanged in this slice.

**Spec:** `docs/superpowers/specs/2026-09-09-flash-studio-classic-neo-v3-design.md`

## Global Constraints

- Do not change visible editor behavior in Slice 1.
- Do not change the existing V2 `migrateProject()` return type or current Zustand store contract yet.
- V3 schemas must use `.strict()` and reject unknown fields.
- V1 and V2 source projects must remain loadable through the existing runtime.
- V2 visual geometry, effects, decorations, frame, export settings, and animation semantics must be represented in V3 migration output.
- A V2 `none` animation produces no clip; any other preset produces exactly one migrated clip.
- A V2 non-`none` frame becomes one `frame` layer; `none` produces no frame layer.
- V2 decorations become `particle` layers in the same order.
- V2 text with a non-flat material, an extrusion depth greater than zero, or an extrusion color becomes `text3d`; all other text becomes `text`.
- V3 migration output must validate before it is returned.
- No new runtime dependency.

---

### Task 1: Define Project V3 Types

**Files:**
- Create: `v3/src/model/v3/project-v3.ts`
- Test: `v3/src/model/v3/project-v3.test.ts`

**Interfaces:**
- Produces: `ProjectV3`, `SceneLayerV3`, `LayerTransformV3`, `AnimationClipV3`, `FlashModeV3`, `createDefaultProjectV3()`.
- Reuses current V2 unions for animation speed/intensity/direction, image effects, decoration preset, frame preset, export settings, and text material where lossless reuse is appropriate.

- [ ] **Step 1: Write the failing type/runtime contract test**

Create a test that imports `createDefaultProjectV3()` and asserts:

```ts
expect(project.version).toBe(3);
expect(project.mode).toBe('classic');
expect(project.canvas).toEqual({ width: 300, height: 300, background: '#101827' });
expect(project.timeline).toEqual({ durationMs: 3000, fps: 24 });
expect(project.layers).toEqual([]);
expect(project.exportSettings).toEqual({ scale: 1, gifProfile: 'balanced' });
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/model/v3/project-v3.test.ts`
Expected: FAIL because `./project-v3` does not exist.

- [ ] **Step 3: Implement exact V3 foundations**

Define:

```ts
export type FlashModeV3 = 'classic' | 'neo';

export type LayerTransformV3 = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export type AnimationClipV3 = {
  id: string;
  effect: AnimationPreset;
  startMs: number;
  durationMs: number;
  loop: boolean;
  speed: AnimationSpeed;
  intensity: AnimationIntensity;
  direction?: AnimationDirection;
};
```

Define shared layer base:

```ts
export type SceneLayerBaseV3 = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  transform: LayerTransformV3;
  clips: AnimationClipV3[];
};
```

Define concrete Slice-1 layer types:

- `ImageLayerV3`: `type: 'image'`, `assetUrl`, `effects`.
- `TextLayerV3`: `type: 'text'`, text typography/paint fields equivalent to V2 flat text.
- `Text3DLayerV3`: `type: 'text3d'`, front/back text, typography, V2-compatible material seed (`materialPreset`, `extrusionDepth`, `extrusionColor`) to be upgraded by Slice 4.
- `ParticleLayerV3`: `type: 'particle'`, `preset`, `count`, `speed`.
- `FrameLayerV3`: `type: 'frame'`, `preset`, `width`.

`SceneLayerV3` is the union of these Slice-1 concrete types. Subject/shape/overlay/light are added in the slices that implement their renderer/evaluator behavior rather than shipping unused schema placeholders.

Create `createDefaultProjectV3()` returning a 300x300 classic project with empty layers, 3000ms timeline, 24fps, and `{ scale: 1, gifProfile: 'balanced' }`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/model/v3/project-v3.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: define Project V3 composition types`

---

### Task 2: Add Strict Project V3 Schema

**Files:**
- Create: `v3/src/model/v3/schema-v3.ts`
- Test: `v3/src/model/v3/schema-v3.test.ts`

**Interfaces:**
- Consumes V3 types from `project-v3.ts`.
- Produces `projectV3Schema` and `parseProjectV3(input: unknown): ProjectV3`.

- [ ] **Step 1: Write failing schema tests**

Tests must cover:

```ts
const valid = createDefaultProjectV3();
expect(parseProjectV3(valid)).toEqual(valid);
expect(() => parseProjectV3({ ...valid, extra: true })).toThrow();
expect(() => parseProjectV3({ ...valid, canvas: { ...valid.canvas, extra: true } })).toThrow();
expect(() => parseProjectV3({ ...valid, version: 4 })).toThrow();
```

Add one valid example for each Slice-1 layer type and one invalid unknown nested field per layer-family schema.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/model/v3/schema-v3.test.ts`
Expected: FAIL because parser/schema do not exist.

- [ ] **Step 3: Implement strict Zod schemas**

Use the existing numeric boundaries where applicable:

- canvas width/height: integer 32..4096;
- duration: integer 100..30000ms;
- fps: integer 1..60;
- opacity: 0..1;
- positive layer width/height;
- clip start >= 0, duration >= 1;
- particle count 1..60;
- frame width 1..32;
- all objects `.strict()`.

Reuse/export compatible current schemas where safe, otherwise reproduce their constraints exactly rather than weakening validation.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/model/v3/schema-v3.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: validate Project V3 compositions`

---

### Task 3: Implement V2 -> V3 Mapping

**Files:**
- Create: `v3/src/model/v3/migrate-to-v3.ts`
- Test: `v3/src/model/v3/migrate-to-v3.test.ts`

**Interfaces:**
- Consumes current `migrateProject(input)` to normalize V1 -> V2 and `parseProjectV3` to validate output.
- Produces `migrateProjectToV3(input: unknown): ProjectV3`.

- [ ] **Step 1: Write RED migration fixtures**

Create V2 fixtures covering:

1. empty project;
2. one image with non-default effects and non-identity geometry;
3. one flat text;
4. one Xara/material text with `backText`, material, and extrusion;
5. decorations in a known order;
6. a non-`none` frame;
7. one non-`none` animation with delay/speed/intensity/direction;
8. one `none` animation;
9. already-V3 input;
10. invalid future version.

Assertions:

```ts
expect(result.version).toBe(3);
expect(result.canvas).toEqual({ width: v2.width, height: v2.height, background: v2.background });
expect(result.timeline).toEqual({ durationMs: v2.durationMs, fps: v2.fps });
```

Image/text transforms preserve x/y/width/height/rotation/opacity/visible/locked and set scaleX/scaleY to 1.

Migrated animation:

```ts
{
  id: `${element.id}-animation`,
  effect: element.animation.preset,
  startMs: element.animation.delayMs,
  durationMs: Math.max(1, project.durationMs - element.animation.delayMs),
  loop: element.animation.loop,
  speed: element.animation.speed,
  intensity: element.animation.intensity,
  ...(direction ? { direction } : {})
}
```

`none` -> `clips: []`.

Decoration layer ID is preserved, layer name is a stable Turkish-neutral machine-safe label such as `Decoration: ${preset}`, transform spans the full canvas, and opacity/count/speed/preset are preserved.

Frame migration uses a deterministic ID `project-frame`, spans the full canvas, has no clips, preserves frame preset/width, and is omitted when preset is `none`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/model/v3/migrate-to-v3.test.ts`
Expected: FAIL because migration function does not exist.

- [ ] **Step 3: Implement mapping helpers**

Implement focused pure helpers:

```ts
function migrateTransform(element: EditorElement): LayerTransformV3
function migrateAnimationClip(element: EditorElement, durationMs: number): AnimationClipV3[]
function migrateElementToLayer(element: EditorElement, durationMs: number): ImageLayerV3 | TextLayerV3 | Text3DLayerV3
function migrateDecorationToLayer(layer: DecorationLayer, canvasWidth: number, canvasHeight: number): ParticleLayerV3
function migrateFrameToLayer(frame: FrameDefinition, canvasWidth: number, canvasHeight: number): FrameLayerV3 | null
```

Text classification rule:

```ts
const is3D =
  (element.materialPreset !== undefined && element.materialPreset !== 'flat') ||
  (element.extrusionDepth ?? 0) > 0 ||
  element.extrusionColor !== undefined;
```

`migrateProjectToV3()` behavior:

- if input is an object with `version === 3`, return `parseProjectV3(input)`;
- otherwise call existing `migrateProject(input)` to normalize V1/V2;
- build V3 with `mode: 'classic'` for migrated legacy projects;
- append mapped element layers, then particle layers, then optional frame layer to preserve V2 paint order semantics;
- validate with `parseProjectV3()` before return.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/model/v3/migrate-to-v3.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: migrate legacy projects to V3`

---

### Task 4: Lock Compatibility and Runtime Isolation

**Files:**
- Modify: `v3/src/model/migrate.test.ts`
- Create: `v3/src/model/v3/runtime-isolation.test.ts`

**Interfaces:**
- Existing `migrateProject()` must still return V2 during Slice 1.
- New `migrateProjectToV3()` is opt-in only.

- [ ] **Step 1: Add tests that prove the current runtime stays V2**

Keep existing assertions and add:

```ts
const current = migrateProject(legacyProject);
expect(current.version).toBe(2);
expect('layers' in current).toBe(false);
```

In `runtime-isolation.test.ts`, import `useEditorStore`, call `reset()`, and assert the store project remains `version: 2`. Then independently call `migrateProjectToV3()` and assert it returns `version: 3` without mutating the store.

- [ ] **Step 2: Run focused compatibility tests**

Run: `npm test -- src/model/migrate.test.ts src/model/v3/runtime-isolation.test.ts`
Expected: PASS after Tasks 1-3, with no production code changes needed unless a new import accidentally leaks V3 into the runtime.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: all existing + new tests pass.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 5: Run production build**

Run: `npm run build`
Expected: exit 0; existing bundle warning may remain non-blocking.

- [ ] **Step 6: Commit**

Commit message: `test: lock V3 foundation compatibility`

---

### Task 5: PR Verification Gate

**Files:** none unless CI exposes a defect.

- [ ] **Step 1: Open a draft PR from `feat/project-v3-foundation` to `main`**

PR title: `Build Project V3 foundation`

- [ ] **Step 2: Verify GitHub CI on the exact final head**

Expected: tests, typecheck, build all green.

- [ ] **Step 3: Review the diff for accidental runtime cutover**

Reject the slice if `EditorShell`, `EditorCanvas`, `editor-store`, persistence behavior, or visible UI is changed except where a test import is required. Slice 1 is foundation-only.

- [ ] **Step 4: Mark ready only when the exact head is green**

Do not merge while draft/RED.

## Self-Review

- Spec coverage: Project V3 shape, strict validation, V1/V2 compatibility, element/decor/frame mapping, animation preservation, runtime isolation and no UI cutover are covered.
- No placeholder steps remain.
- Type names are consistent: `ProjectV3`, `SceneLayerV3`, `LayerTransformV3`, `AnimationClipV3`, `parseProjectV3`, `migrateProjectToV3`.
- Timeline evaluation, renderer cutover, true Material3D, SubjectLayer and new UI are intentionally excluded and belong to later approved slices.

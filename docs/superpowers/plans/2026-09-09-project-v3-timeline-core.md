# Project V3 Timeline Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement deterministic multi-clip timeline evaluation and pure `evaluateScene(project, timeMs)` for Project V3 without cutting the current editor runtime over from V2.

**Architecture:** Keep the current V2 animation evaluator as the authoritative effect-shape library, but expose progress-based evaluation so V3 clips can control timing and easing without duplicating effect formulas. V3 clip evaluation resolves active windows, speed periods, loop/non-loop progress and easing; composition combines simultaneous clips with fixed channel rules; `evaluateScene` applies the composed animation to each layer while preserving source order and data.

**Tech Stack:** TypeScript, Zod, Vitest, existing V2 animation evaluator.

**Spec:** `docs/superpowers/specs/2026-09-09-flash-studio-classic-neo-v3-design.md`

## Global Constraints

- `Preview(t)` and export rendering at `t` must use the same resolved scene state.
- Project V3 remains strict and rejects malformed/unknown data.
- Existing V1/V2 -> V3 migration must remain loss-preserving.
- Current V2 editor/store/renderer remains active during Slice 2.
- Project timeline remains bounded to 30 seconds.
- No cloud or generative AI dependency is introduced.
- `main` must remain shippable after this slice.

---

### Task 1: Add explicit easing to AnimationClipV3

**Files:**
- Modify: `v3/src/model/v3/project-v3.ts`
- Modify: `v3/src/model/v3/schema-v3.ts`
- Modify: `v3/src/model/v3/migrate-to-v3.ts`
- Test: `v3/src/model/v3/schema-v3.test.ts`
- Test: `v3/src/model/v3/migrate-to-v3.test.ts`

**Interfaces:**
- Produces: `AnimationEasingV3 = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'`
- Produces: required `AnimationClipV3.easing`
- Migration maps all V1/V2 animations to `easing: 'linear'`.

- [ ] **Step 1: Write failing tests** asserting valid easing parses, invalid easing rejects, and migrated clips contain `easing: 'linear'`.
- [ ] **Step 2: Run CI/test command and verify RED** because the current clip type/schema/migration lacks easing.
- [ ] **Step 3: Add the easing type/property, strict schema enum and migration default.**
- [ ] **Step 4: Run tests, typecheck and build; verify GREEN.**
- [ ] **Step 5: Commit the task.**

---

### Task 2: Extract progress-based effect evaluation without changing V2 behavior

**Files:**
- Modify: `v3/src/animations/evaluator.ts`
- Test: `v3/src/animations/evaluator.test.ts`

**Interfaces:**
- Produces: `animationPeriodMs(speed: AnimationSpeed): number`
- Produces: `evaluateAnimationAtProgress(animation, progress): EvaluatedAnimation`
- Produces: `animationShowsAlternateFaceAtProgress(animation, progress): boolean`
- Existing `evaluateAnimation(animation, timeMs)` and `animationShowsAlternateFace(animation, timeMs)` remain behavior-compatible wrappers.

- [ ] **Step 1: Write failing tests** for progress-based pulse/spin/directional behavior and alternate-face behavior, plus parity between old time-based API and new progress-based API at representative timestamps.
- [ ] **Step 2: Verify RED** because progress-based APIs do not exist.
- [ ] **Step 3: Refactor the existing switch into `evaluateAnimationAtProgress`; keep time-based wrappers using the same progress calculation.**
- [ ] **Step 4: Run full animation tests and full suite; verify no V2 behavior changes.**
- [ ] **Step 5: Commit the task.**

---

### Task 3: Implement easing and clip-window evaluation

**Files:**
- Create: `v3/src/timeline/easing.ts`
- Create: `v3/src/timeline/easing.test.ts`
- Create: `v3/src/timeline/clip-evaluator.ts`
- Create: `v3/src/timeline/clip-evaluator.test.ts`

**Interfaces:**
- Produces: `applyEasing(easing, progress): number`
- Produces: `EvaluatedClipV3 = { active, animation, alternateFace }`
- Produces: `evaluateClip(clip, timeMs): EvaluatedClipV3`

**Rules:**
- A clip is active for `startMs <= timeMs < startMs + durationMs`.
- Inactive clips return animation identity and `alternateFace: false`.
- Effect period remains speed-based (`slow=2800`, `normal=1600`, `fast=850`) for V2 semantic parity.
- Looping clips repeat phase within their active window.
- Non-looping clips clamp phase to `1` after one effect period but remain active until their window ends.
- Easing remaps the 0..1 phase before effect evaluation.

- [ ] **Step 1: Write RED easing tests** for linear, ease-in, ease-out, ease-in-out and input clamping.
- [ ] **Step 2: Implement minimal easing functions and verify GREEN.**
- [ ] **Step 3: Write RED clip tests** for inactive windows, looping repeat, non-loop clamp, easing, direction/intensity and Xara alternate face.
- [ ] **Step 4: Implement `evaluateClip` using the progress-based animation APIs.**
- [ ] **Step 5: Run tests/typecheck and commit.**

---

### Task 4: Implement deterministic multi-clip composition

**Files:**
- Create: `v3/src/timeline/composition.ts`
- Create: `v3/src/timeline/composition.test.ts`

**Interfaces:**
- Produces: `ComposedAnimationV3`
- Produces: `composeClipEvaluations(evaluations): ComposedAnimationV3`

**Composition rules:**
- additive: `x`, `y`, `rotation`, `skewX`, `skewY`, `hueShift`, `blurAmount`, `chromaticOffset`, `pixelateAmount`;
- multiplicative: `scaleX`, `scaleY`, `opacity`, `revealProgress`;
- `alternateFace`: last active clip that explicitly uses `xara-double-sided` wins; otherwise false.

- [ ] **Step 1: Write RED tests** covering additive and multiplicative channels, identity, ordering and alternate-face determinism.
- [ ] **Step 2: Implement the minimal composer.**
- [ ] **Step 3: Run tests/typecheck and commit.**

---

### Task 5: Implement pure `evaluateScene(project, timeMs)`

**Files:**
- Create: `v3/src/timeline/scene-evaluator.ts`
- Create: `v3/src/timeline/scene-evaluator.test.ts`
- Create: `v3/src/timeline/index.ts`

**Interfaces:**
- Produces: `ResolvedLayerV3`
- Produces: `ResolvedSceneV3`
- Produces: `evaluateScene(project: ProjectV3, timeMs: number): ResolvedSceneV3`

**Resolution rules:**
- Clamp project time to `[0, project.timeline.durationMs]`.
- Preserve layer order exactly.
- Keep source layer data available without mutation.
- Apply composed translation/rotation/skew to the base transform.
- Multiply composed scale into base `scaleX/scaleY`.
- Multiply composed opacity into base layer opacity and clamp to `[0,1]`.
- Carry filter/reveal/alternate-face channels separately for later renderers.
- Invisible layers remain in the resolved scene with `visible: false`; renderer cutover decides whether to draw them.

- [ ] **Step 1: Write RED scene tests** for static layers, simultaneous clips, ordering, visibility, time clamping, Classic/Neo mode preservation and input immutability.
- [ ] **Step 2: Implement the pure scene evaluator.**
- [ ] **Step 3: Run full tests, typecheck and production build.**
- [ ] **Step 4: Verify no editor/store/renderer production files changed.**
- [ ] **Step 5: Commit and prepare a draft PR with exact verification evidence.**

---

## Final Slice Acceptance

- Full V3 test suite passes.
- TypeScript typecheck passes.
- Production Vite build passes.
- Existing V2 animation evaluator tests remain green.
- V1/V2 -> V3 migration tests remain green.
- `evaluateScene` is pure and independent of React/Konva/DOM.
- No `EditorShell`, `EditorCanvas`, Zustand store or persistence production cutover occurs in Slice 2.

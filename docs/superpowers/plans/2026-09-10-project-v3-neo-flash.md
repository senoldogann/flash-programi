# Project V3 Neo Flash Implementation Plan

**Goal:** Ship Slice 6 of the approved Flash Studio architecture: a real Neo mode with modern Text3D materials, animated light/ambient decoration primitives, depth/parallax recipes, and 15 one-click Neo scene recipes over the shared V3 evaluator/renderer/export path.

**Architecture:** Keep V2 persistence/editor state incremental for this slice, but add an optional `mode` marker to V2 projects so Neo intent survives migration. Old saves without it remain Classic. Neo recipes still produce ordinary V2 elements/decorations/frame and therefore migrate through the same V3 scene path. New Neo decoration primitives are deterministic and use the existing particle layer path; no network or generative AI.

## Invariants

- Neo is not a renamed Classic palette.
- `mode` survives V2 -> V3 migration and defaults to Classic for old projects.
- Preview/PNG/GIF continue using the same Stage and resolved scene.
- All Neo decoration motion is deterministic; no `Math.random`.
- No feature-branch Vercel preview deploys; only `main` production may deploy.

### Task 1: Neo mode and material family

- Extend V2 project with optional `mode?: 'classic' | 'neo'`; new projects explicitly start Classic.
- Update strict schema while preserving old-project shape when mode is absent.
- Migrate `source.mode ?? 'classic'` into Project V3.
- Add 15 Neo TextMaterialPreset values and material definitions matching the approved recipe names.
- Tune V3 material conversion so Neo metal/glass families receive higher gloss, distinct metallicity, softer bevel/shadow and brushed/speckle texture where appropriate.
- RED/GREEN tests for old compatibility, mode migration, material uniqueness and style differences from Classic.

### Task 2: Neo ambient/light primitives

- Add deterministic decoration presets `ambient-orbs`, `glow-dust`, and `light-sweep`.
- Extend decoration point data with optional visual kind/shape information only as needed.
- Render orbs and light sweep with Konva shapes/gradient-like opacity rather than emoji glyphs; existing presets remain unchanged.
- RED/GREEN tests for deterministic movement, clock requirements and renderer dispatch.

### Task 3: 15 Neo scene recipes

Create exactly these recipes: Golden Queen, Neon Night, Purple Glass, Cyber Blue, Royal Red, Diamond, Fire Goddess, Frozen, Dark Luxury, Angel, Dream, Fashion Walk, Cinematic Portrait, Holographic, Chrome Future.

Each recipe defines canvas size, background, modern material, image motion, text motion, ambient/light layers, frame, optional image look, and layout. Applying a recipe preserves user text/photo IDs/assets and records one undo step. Neo recipes set `mode: 'neo'`, adaptive GIF palette by default, and no Classic dither.

### Task 4: Classic / Neo Easy Mode UI

- Add a visible CLASSIC / NEO switch in the Flash Nick panel.
- Classic shows the existing 15 Classic recipes; Neo shows the new 15 Neo recipes.
- Switching mode is a single non-destructive project state change; it does not automatically restyle existing work until a recipe is chosen.
- One-click Neo card applies the full composition.

### Task 5: Parity and release

- Verify Neo recipe -> V3 mode/text3d/particle/frame mapping and deterministic evaluation.
- Verify shared export Stage invariant remains intact.
- Full tests, typecheck, production build, diff/review audit.
- Mark PR ready and squash-merge only on exact green head.
- Verify GitHub Pages and main-only Vercel production deployment.

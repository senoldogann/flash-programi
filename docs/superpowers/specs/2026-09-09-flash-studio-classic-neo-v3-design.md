# Flash Studio Classic + Neo V3 Design

**Status:** Approved
**Date:** 2026-09-09
**Scope:** Architectural redesign of the Flash Nick editor into one shared composition engine with two production modes: historical `Classic SesliChat` and modern `Neo Flash`.

## 1. Product Direction

Flash Studio is not a generic Canva-style photo editor. Its core job is to make the historical SesliChat / SesliDünya Flash Nick workflow easy again while also providing a modern evolution of the same visual language.

The product exposes two visual modes over one engine:

- **Classic SesliChat** reproduces the dense, glossy, animated Flash Nick / resimli flash / sinevizyon aesthetic associated with Xara3D and Ulead GIF Animator workflows.
- **Neo Flash** uses the same composition concepts with cleaner lighting, richer depth, parallax, modern materials, subject motion, and cinematic animation.

Mode switching changes composition recipes, material behavior, animation styling, palette strategy, and output defaults. It must not be implemented as a mere color-theme toggle.

## 2. Primary UX

The default experience is **Easy Mode**:

1. Pick a finished composition preset.
2. Choose or replace the photo.
3. Enter the nick/text.
4. Optionally choose style and motion.
5. Export GIF or PNG.

A user must not need to understand layers, keyframes, tweening, render pipelines, or GIF optimization to get a good result.

**Advanced Mode** reveals the same project's layer stack and timeline. Easy and Advanced modes are views over the same project, not separate project formats.

Desktop layout:

- sticky top header;
- independently scrolling preset/tools column;
- large sticky canvas/workspace;
- context-sensitive inspector with its own scrolling;
- collapsible timeline at the bottom only in Advanced Mode.

## 3. Historical Reference Requirements

Classic mode must support the small output sizes actually seen in historical Flash Nick galleries, including at minimum:

- 120x70
- 125x75
- 130x70
- 130x95
- 130x100
- 133x33
- 300x100

Classic mode intentionally supports period-appropriate characteristics such as hard bevels, deep extrusion, thick outlines, glossy gradients, glitter, stars, hearts, fire, high-contrast shadows, and optional GIF palette/dither simulation.

The historical inspirations are behavioral and visual references. The new UI must remain modern and easy to use rather than reproducing old desktop-program complexity.

## 4. One Composition Engine

Classic and Neo share one project model, evaluator, renderer, preview path, and export path.

```text
ProjectV3
   -> evaluateScene(project, timeMs)
   -> ResolvedScene
   -> SceneRenderer
      -> preview
      -> PNG
      -> GIF
      -> future video export
```

Core invariant:

> For the same project and timestamp, preview and export must resolve and render the same scene state.

The renderer must never contain a separate approximation used only for preview.

## 5. Project V3 Model

The current V2 `elements + decorations + frame` structure becomes a layer-based composition model.

```ts
type FlashMode = 'classic' | 'neo';

type ProjectV3 = {
  version: 3;
  id: string;
  name: string;
  mode: FlashMode;
  canvas: {
    width: number;
    height: number;
    background: string;
  };
  timeline: {
    durationMs: number;
    fps: number;
  };
  layers: SceneLayer[];
  exportSettings: ExportSettings;
};
```

Layer types are introduced incrementally but the target architecture supports:

- image
- subject
- text
- text3d
- shape
- particle
- overlay
- light
- frame

Every layer has stable identity, visibility, lock state, opacity, transform, and animation clips.

```ts
type LayerTransform = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};
```

## 6. Timeline Model

V2 allows one animation definition per element. V3 allows multiple clips per layer.

Each clip has a stable ID and an explicit time window. Slice 1 stores migrated animation semantics; Slice 2 implements evaluation/easing/composition.

```ts
type AnimationClip = {
  id: string;
  effect: string;
  startMs: number;
  durationMs: number;
  loop: boolean;
  speed: 'slow' | 'normal' | 'fast';
  intensity: 'subtle' | 'normal' | 'strong';
  direction?: 'left' | 'right' | 'up' | 'down';
};
```

Multiple clips can affect one layer simultaneously. The evaluator, not React, resolves clip interactions.

## 7. FlashText3D

3D text becomes its own layer type instead of continuing to accumulate optional Xara-specific fields on normal text.

Target Text3D responsibilities:

- typography;
- front/back text;
- bevel geometry;
- extrusion depth and angle;
- independent front/side/back material surfaces;
- outline;
- cast shadow;
- gloss/metallicity;
- texture;
- light rig.

The render implementation will use high-resolution offscreen rendering and downsampling for small GIF output. Classic and Neo use the same geometry/material engine with different material/light recipes.

## 8. Hybrid Render Engine

Full Three.js/WebGL 3D is not the default architecture. Small Flash Nick output benefits more from deterministic high-resolution raster composition than from a large real-time 3D scene stack.

Text3D rendering uses high-resolution masks and separate front, bevel, side/extrusion, back, outline, shadow, and specular passes. The result is downsampled into the normal scene.

This keeps output deterministic and compatible with GIF frame capture while producing substantially better small-text quality than direct low-resolution canvas drawing.

## 9. Subject Motion

Neo introduces a dedicated `subject` layer rather than treating every photo as one rigid rectangle.

Development levels:

1. **Subject Cutout Motion:** separated person/foreground, independent parallax, breathe, sway, float.
2. **Pose Rig:** body anchors and mesh deformation for stylized walk/dance/breathe motion.
3. **Neo Puppet:** secondary-region motion such as hair, arms, legs, torso and shadow.

Generative image-to-video is explicitly separate. The deterministic editor must remain useful offline and must not depend on a paid AI service.

## 10. Presets Are Scene Recipes

A preset is a complete composition recipe, not a button that changes one color.

Initial target library: at least 15 Classic and 15 Neo recipes.

Classic examples:

- Altın Döner Nick
- Krom Döner Nick
- Mor Bayan Flash
- Kırmızı Kalpli Bayan
- Mavi Erkek Flash
- Şapkalı Flash
- Ateş Nick
- Türk Bayraklı
- Gotik Siyah
- Glitter Princess
- Çift Nick
- Resimli Döner Nick
- Sinevizyon Portre
- Aşk Flash
- Kral / Taç Nick

Neo examples:

- Golden Queen
- Neon Night
- Purple Glass
- Cyber Blue
- Royal Red
- Diamond
- Fire Goddess
- Frozen
- Dark Luxury
- Angel
- Dream
- Fashion Walk
- Cinematic Portrait
- Holographic
- Chrome Future

## 11. Migration

Migration is one-way and must preserve user work.

Target chain:

```text
V1 -> V2 -> V3
```

V2 mapping:

- image element -> image layer;
- flat/normal text -> text layer;
- text with non-flat material or extrusion -> text3d layer;
- decorations -> particle layers;
- global frame -> frame layer when frame preset is not `none`;
- element animation -> migrated animation clip when preset is not `none`.

V2 transforms preserve x/y/width/height/rotation/opacity/visible/locked and use scaleX/scaleY = 1.

Migration errors must never overwrite the stored source project with an empty/default project.

During incremental delivery, the existing V2 runtime remains active until the V3 evaluator/renderer cutover is ready. Slice 1 therefore introduces a standalone, fully tested V3 parser and V1/V2 -> V3 migration without forcing the current editor store to consume V3 immediately. At cutover, the public migration entry point will return the latest version.

## 12. Persistence and Export

Existing IndexedDB projects must remain loadable.

At the final cutover:

```text
stored V1/V2
  -> in-memory V3 migration
  -> validate V3
  -> open editor
  -> next successful autosave persists V3
```

A migration failure blocks overwrite of the original stored value.

The current GIF encoder contract is retained: export asks the scene for frames at explicit timestamps. V3 changes what gets evaluated/rendered, not the basic frame-encoder contract.

## 13. Validation and Limits

V3 schemas remain strict and reject unknown or malformed project data.

Existing safety limits remain authoritative unless a later approved slice explicitly changes them:

- canvas/export dimensions remain capped by current export-safety checks;
- project timeline remains bounded to 30 seconds for current GIF workflows;
- layer counts and particle counts receive explicit upper bounds;
- migration must validate its output before returning it.

## 14. Delivery Slices

1. **Project V3 Foundation:** types, strict schema, V1/V2 -> V3 migration, compatibility fixtures. No UI cutover.
2. **Timeline Core:** animation clips, easing/composition rules, pure `evaluateScene(project, timeMs)`.
3. **Renderer Split:** split current canvas renderer into layer renderers while preserving preview/PNG/GIF parity.
4. **FlashText3D Engine:** supersampled masks, bevel, extrusion shading, materials, shadow, gloss, lighting.
5. **Classic SesliChat:** historical sizes, palette/dither profiles, particles and first 15 Classic scene recipes.
6. **Neo Flash:** modern materials, bloom/light sweep, animated backgrounds, depth/parallax, first 15 Neo recipes.
7. **Subject Motion V1:** cutout infrastructure and deterministic subject parallax/breathe/sway/float.
8. **Advanced Timeline UI:** layers, playhead, clip timeline, drag/resize and keyframe-ready UI architecture.
9. **Subject Puppet V2:** pose anchors, mesh warp and stylized Fashion Walk / Dream Float / Queen Entrance motion.
10. **Release Hardening:** GIF palette optimization, profiling, persistence/migration soak tests, responsive QA and deployment verification.

Every slice ships independently on a feature branch and PR with RED -> GREEN tests, typecheck, production build, and relevant preview/export parity checks before merge.

## 15. Non-Negotiable Invariants

- `Preview(t)` and export rendering at `t` use the same resolved scene state.
- Old projects never silently disappear or get overwritten because migration failed.
- Classic vs Neo is a behavioral/composition distinction, not a CSS theme.
- Easy Mode never requires timeline knowledge.
- Advanced Mode never limits renderer capability.
- No user-provided photo is sent to a cloud AI service as part of the deterministic core.
- New architecture must be introduced incrementally without making `main` unshippable between slices.

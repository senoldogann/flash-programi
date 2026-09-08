# Flash Nick V3 — Editor Architecture Design

Date: 2026-09-08
Status: Approved direction, implementation pending
Branch: `rewrite/v3`

## 1. Purpose

Flash Nick V3 is a clean rewrite of the existing browser-based nick/icon editor for users of Turkish voice-chat communities. The primary audience includes non-technical users aged roughly 40+, so the product must favor direct manipulation, large controls, visual presets, and safe defaults over expert-oriented configuration panels.

The product goal is:

> Make animated profile icons and nick graphics as easy to create as choosing a photo, typing a name, choosing a style, and downloading the result.

The existing application remains available on `main` until V3 reaches feature parity for the critical creation and export flows.

## 2. Why Rewrite

The current application already proves the feature set: multiple text layers, image filters, photo animations, text animations, particles, flags, templates, PNG/GIF/WebM export, PWA support, and project persistence concepts.

However, the implementation has grown into a large monolithic Canvas/DOM application. Rendering, UI state, animation state, export logic, and event handling are tightly coupled. Multiple animation loops and duplicated preview/export behavior make future effects harder to add safely.

V3 keeps the product knowledge and successful presets, but replaces the editor architecture.

## 3. Scope

### V3.0 must include

1. Image upload and replacement.
2. Direct manipulation on canvas: select, drag, resize, rotate.
3. Multiple text elements.
4. Text styling: font, size, fill, outline, shadow/glow, alignment, opacity.
5. At least 10 text animation presets.
6. At least 10 image animation presets.
7. At least 10 decoration/particle presets.
8. Animated frame support.
9. At least 20 ready-made templates.
10. Undo/redo for editor mutations.
11. PNG export.
12. Animated GIF export.
13. Project save/load in the browser.
14. Responsive desktop and mobile UI.
15. Export-profile infrastructure for target voice-chat sites.
16. Turkish UI as the default language.

### Explicitly out of V3.0

- User accounts.
- Cloud project storage.
- Payments/subscriptions.
- Collaboration.
- AI image generation.
- Full video editor timeline/keyframe authoring.
- Arbitrary Photoshop-style layer masks.
- Backend image processing.

These can be considered only after the core editor is stable.

## 4. UX Principles

### 4.1 First-run flow

The landing/editor start state presents three primary actions:

- Fotoğraf Seç
- Hazır Tasarım Seç
- Boş Tasarım Başlat

A user who chooses a photo enters the editor immediately. No setup wizard is required.

### 4.2 Direct manipulation

Canvas objects are edited on the canvas itself:

- click/tap selects;
- drag moves;
- corner handles resize;
- rotation handle rotates;
- double-click/double-tap on text enters text editing;
- Delete/Backspace removes selected removable elements on desktop;
- touch controls remain large enough for phone use.

Numeric position sliders are not part of the primary UX.

### 4.3 Progressive disclosure

The default navigation exposes simple concepts:

- Fotoğraf
- Yazı
- Efekt
- Hareket
- Süsler
- Çerçeve

Advanced layer controls are available under a secondary "Katmanlar" view.

### 4.4 Presets before parameters

Users first choose visual cards such as Romantik, Neon, Ateş, Türk, Kelebek, Gece, Altın, or Buz. Fine-grained values are secondary.

Animation speed defaults to semantic controls:

- Yavaş
- Normal
- Hızlı

Raw easing curves and millisecond timing are not exposed in the standard UI.

## 5. Technology

### Frontend

- React
- TypeScript
- Vite
- `react-konva` / Konva for editor scene graph and transforms
- Zustand for editor state and command history
- Zod for persisted project/template validation

### Persistence

- IndexedDB for projects and locally imported assets
- versioned project schema
- migration functions for future schema versions

### Export

- PNG from the render surface
- GIF encoding in a Web Worker
- frame generation driven by the same deterministic animation evaluator used by live preview
- WebM may be reintroduced after V3.0 if it does not complicate the first release

### Backend

No backend is required for V3.0. User images stay local in the browser.

## 6. Source Layout

```text
src/
  app/
    App.tsx
    routes/
  editor/
    components/
    canvas/
    panels/
    toolbar/
    layers/
  model/
    project.ts
    elements.ts
    schema.ts
    migrations.ts
  store/
    editor-store.ts
    history.ts
  rendering/
    scene.ts
    element-renderers/
    animation-evaluator.ts
  animations/
    text-presets.ts
    image-presets.ts
    frame-presets.ts
    particle-presets.ts
  templates/
    definitions/
    registry.ts
  export/
    png.ts
    gif.ts
    gif.worker.ts
    profiles.ts
  persistence/
    indexed-db.ts
    project-repository.ts
  shared/
    errors/
    ids/
    math/
    ui/
```

The exact file count may evolve, but responsibilities must remain separated.

## 7. Project Model

The project model is the single source of truth. DOM state and Konva nodes are projections of this model, not competing stores.

```ts
type Project = {
  version: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  durationMs: number;
  fps: number;
  background: BackgroundDefinition;
  elements: EditorElement[];
};
```

Common element fields:

```ts
type ElementBase = {
  id: string;
  type: 'text' | 'image' | 'sticker' | 'particle' | 'frame';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  animation?: AnimationDefinition;
};
```

Animation definitions are data, not embedded rendering code:

```ts
type AnimationDefinition = {
  preset: string;
  speed: 'slow' | 'normal' | 'fast';
  delayMs: number;
  loop: boolean;
};
```

Preset implementations translate a timestamp plus element data into deterministic render properties.

## 8. Rendering Architecture

### 8.1 One animation clock

V3 uses one editor clock. No feature owns a separate `requestAnimationFrame` loop.

For each preview frame:

1. obtain current project time;
2. evaluate each element animation;
3. derive render properties;
4. update/render scene nodes;
5. schedule the next frame only when animation is active.

Static projects do not continuously repaint.

### 8.2 Deterministic evaluator

Animation evaluation must be deterministic for a given:

- project data;
- element data;
- timestamp;
- seeded random value when a preset requires randomness.

Particles and glitch effects must use seeded randomness during export so preview and exported animation do not diverge unpredictably.

### 8.3 Preview/export parity

The same animation evaluator is used by:

- live preview;
- GIF frame generation;
- future WebM frame generation.

Export is not allowed to maintain a second implementation of animation behavior.

## 9. State and History

Zustand holds the current project, selection, editor mode, and transient UI state.

Undo/redo uses commands or snapshot patches for meaningful project mutations. Pointer movement during a drag must not create dozens of undo entries; the completed transform is one history action.

History covers:

- add/remove element;
- transform element;
- text edit;
- style change;
- animation change;
- layer reorder;
- template application;
- image replacement/crop/filter mutation.

Selection changes and panel navigation are not history actions.

## 10. Elements

### 10.1 Image element

Supports:

- local image asset;
- crop/fit mode;
- brightness/contrast/saturation/hue where feasible;
- blur/filter presets;
- transform;
- image animation preset.

Initial image animation presets:

- zoom-in
- zoom-out
- pulse
- float
- pan-left
- pan-right
- pan-up
- pan-down
- swing
- gentle-rotate

### 10.2 Text element

Supports:

- text content;
- bundled/approved font registry;
- font size and weight where supported;
- color;
- gradient preset;
- outline;
- shadow/glow;
- opacity;
- rotation;
- alignment;
- animation.

Initial animation presets:

- fade
- slide
- bounce
- zoom
- rotate
- wave
- neon-pulse
- rainbow
- shimmer
- glitch

### 10.3 Decorations and particles

Initial decoration presets:

- stars
- hearts
- snow
- fire
- sparkles
- bubbles
- flowers
- butterflies
- confetti
- lightning

Particle density is exposed as Az / Normal / Çok.

### 10.4 Frames

Frames are first-class elements and may be animated. Initial families:

- neon
- gold
- hearts
- stars
- rainbow
- fire
- ice
- glitter

## 11. Templates

Templates are versioned project fragments, not imperative UI scripts.

Applying a template may set:

- canvas/background;
- text style;
- image animation;
- decorations;
- frame;
- default text placement.

Templates must remain editable after application.

The existing application's successful style ideas should be migrated conceptually, including romantic, neon, gold, fire, Turkish, ice, retro, and galactic themes.

## 12. Export Profiles

Export profiles are separate from the editor model:

```ts
type ExportProfile = {
  id: string;
  label: string;
  width: number;
  height: number;
  format: 'png' | 'gif';
  fps?: number;
  durationMs?: number;
  maxBytes?: number;
};
```

V3.0 ships with a generic icon profile and infrastructure for site-specific profiles.

Target-site dimensions/file-size limits must be verified before named site presets are enabled. Unverified assumptions must not be baked into production presets.

## 13. Persistence

Projects are stored locally with:

- schema version;
- project metadata;
- project JSON;
- referenced local assets;
- updated timestamp.

Project loading validates data with Zod. Invalid or unsupported versions produce a recoverable error message rather than breaking the editor.

Autosave is debounced and local-only.

## 14. Error Handling

Expected failures are surfaced in Turkish with actionable messages.

Examples:

- unsupported/corrupt image;
- image exceeds browser-safe dimensions;
- IndexedDB unavailable/quota exceeded;
- GIF encoding worker failure;
- export exceeds configured target size;
- unsupported persisted project version.

Errors must not silently discard the current project. Export failures leave the editor state untouched.

## 15. Performance Requirements

V3 is optimized for icon-sized compositions but should remain responsive at larger working sizes.

Requirements:

- no per-pixel JavaScript blur loops in the interactive render path;
- one animation clock;
- static scene does not continuously repaint;
- expensive export runs in a Worker when practical;
- imported images are downscaled for working copies when their source dimensions are unnecessarily large;
- drag/resize should remain responsive on current desktop Chrome/Edge/Safari and modern mobile browsers.

## 16. Accessibility and Audience Fit

- primary controls use text plus icons, not icon-only ambiguity;
- minimum practical touch targets are used throughout;
- contrast remains readable in light and dark environments;
- destructive actions require clear affordances and remain undoable where possible;
- advanced controls never block the primary creation flow;
- Turkish labels use familiar wording rather than graphics terminology where possible.

## 17. Testing Strategy

### Unit tests

- project schema validation;
- migrations;
- animation evaluators;
- seeded random behavior;
- history reducer/commands;
- export-profile calculations;
- template application.

### Component tests

- add/select/delete text;
- panel edits update the project model;
- transform completion creates one history action;
- undo/redo restores project data;
- image upload error states.

### End-to-end tests

Critical happy path:

1. open editor;
2. upload an image fixture;
3. add a text element;
4. change style;
5. apply an animation;
6. move/resize text;
7. undo and redo;
8. export PNG;
9. save project;
10. reload and restore project.

GIF export receives a separate smoke test verifying that multiple frames are produced and the encoded file is non-empty.

## 18. Migration Strategy

`main` remains the legacy stable application.

Development occurs on `rewrite/v3` and feature branches derived from it as needed.

No destructive migration of the old files is required during early development. V3 may live under its own Vite structure while the legacy static files remain present until cutover.

Cutover criteria:

- V3 critical happy-path E2E test passes;
- PNG/GIF export works;
- project persistence works;
- mobile layout is usable;
- core preset/template set is present;
- no known data-loss bug;
- production build passes.

Only then should V3 replace the default application entry point.

## 19. First Implementation Slice

The first implementation slice is intentionally narrow:

1. establish React + TypeScript + Vite testable application shell;
2. define the versioned project model and Zod schemas;
3. create Zustand editor store with selection and undo/redo;
4. mount a Konva stage;
5. add one image element via upload;
6. add/select/edit one text element;
7. implement drag/resize/rotate with a Transformer;
8. persist transform results into project state;
9. test history semantics;
10. provide PNG export.

No particles, GIF encoder, template catalog, or advanced animation presets enter this slice. Those are built after the editor state/rendering foundation is verified.

## 20. Acceptance Criteria for the Foundation

The foundation is considered complete when:

- `npm test` passes;
- production build passes;
- an image can be uploaded without leaving the browser;
- a text element can be added and edited;
- image/text can be selected, dragged, resized, and rotated;
- undo/redo correctly restores completed transformations;
- PNG export matches the visible static composition;
- no legacy file must be modified to run the new editor in development;
- project data has a validated versioned schema.

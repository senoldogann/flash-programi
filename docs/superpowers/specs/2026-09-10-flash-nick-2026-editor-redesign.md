# Flash Nick 2026 Editor Redesign

**Status:** Awaiting written-spec review
**Date:** 2026-09-10
**Branch:** `feat/2026-editor-redesign`
**Base:** `398e67c172ee81c2adb6e017a8c055a14e6fb724`
**Scope:** Production UI/UX redesign of the existing React/Vite V3 editor. The renderer, project model, persistence, Classic/Neo recipes, preview parity and GIF/PNG export contracts remain intact.

## 1. Approved Visual Direction

The accepted visual reference is the dark, premium Flash Programı editor concept generated in the active ChatGPT conversation on 2026-09-10.

The product should feel like a 2026 creative tool while preserving the nostalgia and visual character of historical SesliChat Flash nick graphics. The editor chrome is modern, calm, readable and spacious. The artwork itself may remain bright, glossy, neon, glitter-heavy and nostalgic.

The target audience includes users aged 40+ who may have used older SesliChat/Flash tools and should be able to complete the main workflow without understanding modern design-software terminology.

Core visual characteristics:

- deep navy/charcoal application background;
- restrained glass-like panels with subtle borders rather than nested card clutter;
- violet, magenta and electric-blue accent system;
- large, high-contrast typography and controls;
- clear active-state glow used sparingly;
- generous spacing and minimum 44-48 px interaction targets;
- strong visual separation between workflow navigation, canvas, inspector and presets;
- nostalgic Flash artwork contained inside a contemporary editor shell.

## 2. Product Promise

The primary workflow remains:

1. Add a photo.
2. Enter a nick.
3. Choose a style.
4. Add motion.
5. Add decoration if desired.
6. Export as GIF or PNG.

A first-time user should be able to understand this sequence from the screen without reading documentation.

Advanced controls remain available but must not compete visually with the primary flow.

## 3. Desktop Information Architecture

The desktop screen uses four coordinated regions.

### 3.1 Global Header

The header contains:

- brand mark and product name `Flash Programı`;
- supporting line `Nostalji. Şimdi daha güçlü.`;
- navigation: `Oluştur`, `Hazır Tasarımlar`, `Galeri`, `Yardım`;
- search field with placeholder `Tema, efekt veya stil ara...`;
- theme/appearance control when practical;
- primary `İndir` action.

Every visible header control must be functional. No decorative inert controls are allowed.

Behavior mapping:

- `Oluştur` focuses the main editor.
- `Hazır Tasarımlar` focuses/scrolls the preset library.
- `Galeri` exposes the user's current local design/project context or saved-project surface only when backed by existing local persistence. If a useful gallery cannot be implemented without introducing a new persistence subsystem, the control is omitted in the first production slice rather than shipped inert.
- `Yardım` opens concise in-product usage guidance.
- Search filters or focuses relevant preset/style controls. It must not pretend to search unsupported content.
- `İndir` focuses the export area or begins the preferred GIF export when content exists.

### 3.2 Left Workflow Rail

Replace the current category-heavy left panel with a persistent numbered workflow:

1. `Fotoğraf` — `Resmini ekle veya seç`
2. `Nick` — `Nickini yaz ve stilini belirle`
3. `Stil` — `Hazır tasarım seç`
4. `Hareket` — `Animasyon ekle`
5. `Süsleme` — `Efekt, çerçeve, simge`

Below the steps:

- dedicated `PDF/PNG/GIF indir` or equivalent export entry, limited to formats actually supported by production code;
- short privacy reassurance that editing happens locally in the browser;
- optional small callout for free/no-login usage only if factually true.

The workflow rail replaces the duplicated current combination of `Fotoğraf Seç`, `Yazı Ekle`, `Kolay Başlangıç`, and seven category buttons as the primary navigation. Existing advanced panels remain reachable from the most semantically appropriate workflow step.

### 3.3 Center Workspace

The center region is the dominant visual area.

Top canvas toolbar:

- undo/redo;
- zoom display/control;
- current canvas size/preset;
- preview/play mode.

Canvas:

- existing Konva-based renderer remains the only source of truth;
- checkerboard/transparency treatment must remain clearly visible where appropriate;
- the canvas is framed by one purposeful dark surface, not several nested wrappers;
- empty state explains the first action clearly.

Timeline/frame strip:

- a compact visual playback strip appears directly below the canvas;
- it uses the existing project duration/fps and animation clock semantics;
- it may initially be a playback/scrub representation rather than a full keyframe editor;
- no duplicate render path is introduced;
- advanced timeline editing remains governed by the existing V3 timeline roadmap.

### 3.4 Context Inspector

The right inspector becomes visually closer to the accepted `Nick Ayarları` panel.

When a text layer is selected, prioritize:

- text content;
- font;
- fill/color;
- size;
- glow/shadow;
- stroke;
- alignment and secondary controls below.

When an image/subject is selected, show the existing placement and element controls using the same component system.

When nothing is selected, show a compact useful empty state rather than a blank or oversized placeholder.

Inspector controls must retain current undo/history batching behavior.

## 4. Preset Library

A wide preset library sits beneath the main canvas/inspector region on large screens or in a dedicated workspace section when width is constrained.

Categories should map to real recipe data and may include:

- `Popüler`;
- `Yeni` only when there is a deterministic curated list;
- `Klasik SesliChat`;
- `Modern`;
- `Romantik` when recipes support it;
- other categories derived from existing Classic and Neo recipes.

Do not create fake categories that contain no real presets.

Each preset tile contains:

- recognizable preview treatment;
- preset name;
- output size when useful;
- clear selected state.

Applying a preset must continue using the existing recipe/store mutation model and preserve undo behavior.

## 5. Export Surface

The primary export CTA is visually prominent and sticky/obvious on desktop and mobile.

Required actions:

- `GIF Olarak İndir` as primary;
- `PNG Olarak İndir` as secondary.

Current export safety budgets, stage capture, color profile, progress and error contracts remain unchanged.

During GIF export:

- primary CTA becomes a progress state;
- duplicate exports are disabled;
- progress is announced accessibly;
- failure remains visible and dismissible.

PDF must not be promised until a real PDF export pipeline exists.

## 6. Design System

### 6.1 Color Tokens

Use semantic tokens rather than scattered hard-coded values.

Target families:

- `--app-bg`: near-black navy;
- `--surface-1`: primary panel navy;
- `--surface-2`: raised control surface;
- `--surface-hover`;
- `--border-subtle`;
- `--text-primary`: near-white;
- `--text-secondary`: cool gray;
- `--accent-violet`;
- `--accent-magenta`;
- `--accent-blue`;
- `--success`, `--warning`, `--danger`.

Gradient accents are reserved for primary selection/export moments and must not flood every card or button.

### 6.2 Typography

Use a system-first or locally available sans stack to avoid adding a blocking font dependency.

Minimum target sizes:

- body: 15-16 px;
- primary controls: 15-16 px;
- workflow titles: 16-17 px;
- supporting labels: 13-14 px;
- product title: 22-28 px depending on viewport.

No important editor control may rely on browser-default typography.

### 6.3 Geometry

- primary control height: 44-48 px minimum;
- workflow rows: approximately 64-76 px;
- panel radius: 14-18 px;
- input radius: 10-12 px;
- thin one-pixel borders with restrained elevation;
- avoid wrapping every subsection in a separate rounded card.

### 6.4 Motion

Use short 140-220 ms transitions for hover, selection and panel state only.

Respect `prefers-reduced-motion`; no essential state may depend on animation.

## 7. Responsive Model

### Large desktop, >= 1280 px

- left workflow rail;
- center workspace;
- right inspector;
- preset library visible beneath or spanning the center/right region;
- export CTA remains obvious.

### Compact desktop/tablet, 800-1279 px

- workflow rail narrows;
- inspector becomes a drawer or collapsible side panel;
- center canvas retains priority;
- preset library becomes a horizontal rail or stacked section.

### Mobile, < 800 px

- top header is simplified;
- workflow becomes bottom navigation or horizontally scrollable step navigation;
- canvas is first-class and fits viewport width;
- inspector opens as a bottom sheet/drawer;
- export action remains reachable without scrolling through every advanced control;
- no horizontal page overflow.

## 8. Accessibility and 40+ Usability Requirements

- WCAG-oriented contrast for all essential text/actions;
- visible `:focus-visible` state everywhere;
- minimum 44 px touch targets;
- labels use plain Turkish instead of jargon when possible;
- icons never replace labels for primary actions;
- disabled states remain readable;
- keyboard navigation remains possible through primary workflow;
- live regions announce GIF export progress/errors where appropriate;
- destructive reset retains explicit confirmation;
- important text is not below 13 px;
- advanced controls use progressive disclosure rather than overwhelming the default view.

## 9. Component Architecture

Target component ownership:

- `EditorShell` remains composition/orchestration glue and export/persistence owner.
- `StudioHeader` owns brand/navigation/search/export focus actions.
- `WorkflowRail` owns five-step primary navigation and local privacy callout.
- `WorkspaceChrome` owns canvas toolbar and layout chrome, not rendering.
- `EditorCanvas`/`SceneRenderer` remain unchanged render authorities.
- `PlaybackStrip` owns play/scrub/frame visualization over existing time semantics.
- `TextInspector` remains selected-element inspector but adopts shared controls/tokens.
- `PresetLibrary` presents real Classic/Neo recipe data and delegates application to existing recipe actions.
- `ExportActions` exposes GIF/PNG commands already owned by `EditorShell`.

Avoid one monolithic replacement component.

## 10. Data and Behavior Invariants

The redesign must not change these contracts:

1. Project persistence schema and migration semantics.
2. Preview/export scene parity.
3. GIF and PNG safety validation.
4. Existing recipe semantics.
5. Undo/redo behavior and history batching.
6. Subject/image object URL disposal.
7. Keyboard shortcut behavior unless an explicit accessible replacement is added.
8. Vercel production deployment from `main`.

## 11. Testing Strategy

Use test-driven development for behavior changes.

New/updated tests cover at minimum:

- workflow rail renders the five Turkish steps;
- selecting each workflow step reveals the correct existing functional panel;
- header actions focus/open real surfaces rather than being inert;
- GIF and PNG actions remain wired to existing callbacks;
- selected text exposes the redesigned inspector without losing edit behavior;
- preset filtering/category behavior uses real recipe data;
- export progress is represented in the new CTA;
- mobile navigation/control visibility has DOM-level behavioral coverage where practical;
- legacy integration/export tests remain green.

Full verification gate before merge:

```bash
cd v3
npm test
npm run typecheck
npm run build
```

CI must be green before merge.

## 12. Visual Verification Gate

The approved generated concept is the fidelity reference.

Before final handoff:

1. run the production app in a real browser;
2. verify desktop and mobile-sized viewports;
3. capture the implemented primary screen;
4. compare the implementation screenshot against the approved concept;
5. inspect at least copy, layout, typography, palette, panel geometry, controls, preset treatment and responsive behavior;
6. fix material mismatches before merge/handoff.

Functional tests alone do not satisfy this gate.

## 13. Delivery Slices

Implementation is divided so behavior remains reviewable:

### Slice A — Shell and Design System

- semantic tokens;
- StudioHeader;
- new editor grid;
- WorkflowRail;
- responsive shell.

### Slice B — Workspace and Inspector

- canvas chrome;
- playback strip;
- redesigned selected-element inspector;
- empty states.

### Slice C — Presets and Export

- production preset library;
- search/filter behavior;
- prominent GIF/PNG export surface;
- progress and error states.

### Slice D — Fidelity and Release Hardening

- desktop/mobile browser review;
- accessibility pass;
- screenshot-to-concept mismatch fixes;
- full test/typecheck/build;
- PR, CI, merge and Vercel production verification.

## 14. Explicit Non-Goals

This redesign does not introduce:

- a second renderer;
- cloud image uploads;
- authentication;
- paid AI services;
- a new project schema;
- fake gallery/search features;
- PDF export without a real exporter;
- a full advanced keyframe editor beyond the existing timeline roadmap.

## 15. Acceptance Criteria

The redesign is acceptable when:

- a new user can identify the Photo → Nick → Style → Motion → Decoration → Export flow immediately;
- the editor visually matches the approved dark neon concept at agency-signoff quality while using real production controls;
- all visible primary actions work;
- existing project, preview and export behavior remains intact;
- desktop, tablet and mobile layouts are professional and free of overflow/clipping;
- accessibility requirements above are met;
- all automated verification gates pass;
- final visual comparison reports no material unresolved mismatch.

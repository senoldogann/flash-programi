# Flash Nick V3 Editor Pro Design

Date: 2026-09-09
Status: Approved design direction, pending written-spec review
Branch: `feat/v3-editor-pro`

## 1. Purpose

This phase upgrades Flash Nick Studio V3 from a functional rich editor into a more capable production editor while preserving the simple workflow expected by non-technical users.

The phase addresses five concrete product gaps:

1. Photo effect controls must visibly and reliably affect the selected image.
2. Left-side tool categories must scroll inside their own content area instead of scrolling the entire editor column.
3. Text must support stacked vertical writing in addition to horizontal writing.
4. Images must support a much broader and more expressive animation set while remaining export-safe.
5. Canvas sizing and GIF sizing must regain the useful controls from the legacy app, with proportional design scaling and independent export resolution controls.

The guiding rule is: **anything that works in the live preview must render the same way in PNG/GIF export.**

## 2. User Experience Principles

The editor targets users who may not be comfortable with complex design software. Advanced capability must therefore be exposed through large presets and progressive controls rather than a dense professional-tool interface.

Primary UX rules:

- Keep direct manipulation on canvas for position, resize, and rotation.
- Keep large, labeled controls rather than icon-only controls where meaning is not obvious.
- Keep category navigation visible while category content scrolls independently.
- Prefer presets first, then optional fine controls.
- Never require the user to understand canvas scaling, Konva transforms, encoder frame counts, or pixel ratios.
- Preserve undo/redo semantics: one completed edit gesture should create one history step.
- Keep project resize and export resize as separate concepts.

## 3. Architecture Overview

The implementation will retain React + react-konva + Zustand + deterministic animation evaluation. It will not migrate to PixiJS, Three.js, or a WebGL-first editor in this phase.

The renderer will be split conceptually into five small engines:

1. `effects/` — converts image effect settings into Konva filters and filter parameters.
2. `animations/` — converts animation definition + timestamp into deterministic render channels.
3. `text/` — converts text content + writing mode into display text/layout metadata.
4. `sizing/` — performs project resize transforms and validates safe output dimensions.
5. `export/` — samples the same render state used by preview and produces PNG/GIF output.

`EditorCanvas` remains the composition point, but it should no longer contain the business rules for every effect, animation, text-layout decision, and output size calculation.

## 4. Project Data Model

The project schema will move to a new version with backward migration from existing V1 projects.

### 4.1 Text writing mode

`TextElement` gains:

```ts
type TextWritingMode = 'horizontal' | 'vertical-stacked';
```

`vertical-stacked` means upright graphemes arranged from top to bottom. It does not rotate the whole word 90 degrees.

The text model keeps the original source string unchanged. The renderer derives display text from it.

### 4.2 Image effects

The current effect object is expanded. The initial target set is:

- brightness
- contrast
- saturation
- blur
- grayscale
- sepia
- hue
- temperature
- tint
- enhance
- emboss
- invert
- noise
- pixelate
- posterize
- solarize
- threshold

Effects use normalized editor-facing ranges. A filter adapter maps those normalized values to Konva-specific properties.

Filters are applied in a fixed deterministic order so preview and export cannot disagree because of UI interaction order.

### 4.3 Animation definition

The animation model remains preset-based but gains enough parameters to avoid hard-coded one-size-fits-all effects:

```ts
type AnimationDefinition = {
  preset: AnimationPreset;
  speed: AnimationSpeed;
  intensity: AnimationIntensity;
  delayMs: number;
  loop: boolean;
  direction?: AnimationDirection;
};
```

Existing projects migrate with `intensity: 'normal'`.

### 4.4 Export settings

Export configuration is remembered with the project/session separately from visual geometry:

```ts
type ExportSettings = {
  scale: 1 | 2 | 3 | 4;
  gifProfile: 'small' | 'balanced' | 'quality';
};
```

Changing export scale must never mutate project element geometry.

## 5. Effect Engine

### 5.1 Current failure mode

The current renderer builds a dynamic filter array inside `EditorCanvas`, caches the image node in an effect, and passes Konva filter props directly from the element. This makes filter application tightly coupled to the component and makes cache invalidation difficult to reason about.

The implementation will move this behavior into a dedicated image-effect adapter.

### 5.2 Filter application

The effect engine returns:

- ordered Konva filters
- Konva node attributes needed by those filters
- whether caching is required
- a stable cache key derived from image/effect state

The image node will be cached after the image is loaded and re-cached when a filter that depends on cached pixel data changes.

Konva 10 `Brightness` will replace deprecated `Brighten`.

### 5.3 Advanced effects

Konva-native filters should be used where they produce deterministic CPU-canvas output. Custom color temperature/tint behavior may use RGB/RGBA adjustment through a small adapter rather than introducing a second renderer.

Effects that cannot be made consistent between live preview and export are excluded from this phase.

### 5.4 UI

Effects are grouped as:

- **Temel:** Parlaklık, Kontrast, Doygunluk, Bulanıklık
- **Renk:** Ton, Sıcaklık, Tint, Siyah Beyaz, Sepya, Ters Renk
- **Stil:** Enhance, Emboss, Noise, Pixelate, Posterize, Solarize, Threshold

The selected image is required. When no image is selected, the panel explains what must be selected rather than presenting apparently broken controls.

## 6. Left Tool Panel Scrolling

The current `.tool-panel` scrolls as one long column. This causes category navigation and upload/text actions to disappear when the user scrolls through long template lists.

The panel will become a fixed-height flex/grid shell:

- top region: Photo / Text primary actions
- category region: Effects / Motion / Decorations / Frames / Templates
- content region: active category content

Only the content region receives `overflow-y: auto`.

Desktop behavior:

- Primary actions and category buttons remain visible.
- Active content scroll position is independent from the page and canvas.

Mobile behavior:

- Tool sections remain part of the mobile flow.
- The active section receives a bounded scroll area rather than expanding the entire document indefinitely.
- Touch scrolling must not move the canvas unexpectedly.

## 7. Vertical Text

### 7.1 Definition

Vertical mode means each user-perceived character appears below the previous one while staying upright.

Example:

```text
K
R
A
L
```

Emoji and combined characters must stay intact.

### 7.2 Grapheme segmentation

Use `Intl.Segmenter` with grapheme granularity when available. A small fallback segmentation helper is used only when the runtime lacks it.

The renderer converts the original text into newline-separated graphemes for Konva Text rendering.

### 7.3 Geometry

Switching writing mode should preserve the element center point as closely as possible.

The renderer recomputes a sensible text bounding box. The user can still resize and move the text afterward.

Font, outline, glow, opacity, animation, rotation, and alignment remain compatible with vertical text.

## 8. Expanded Animation Engine

### 8.1 Core requirement

Animations remain pure functions of project state and timestamp. The preview clock and GIF exporter sample the exact same evaluator.

No preset may rely solely on an imperative browser tween that the GIF exporter cannot reproduce.

### 8.2 Animation channels

`EvaluatedAnimation` expands beyond x/y/scale/rotation/opacity to support additional deterministic channels such as:

- skewX / skewY
- hue shift
- blur/focus modulation
- reveal progress
- RGB/chromatic offsets
- clip or mask progress where practical

Image rendering may use deterministic helper layers for effects such as RGB split/glitch. Those helper layers are render output only and are not persisted as user elements.

### 8.3 Target image animation presets

Existing presets remain:

- none
- pulse
- float
- swing
- spin
- blink
- zoom
- shake
- slide
- bounce
- wave

New target presets:

- Ken Burns
- Slow Pan
- Orbit
- Breathing Zoom
- Rubber
- Flip X
- Flip Y
- Pendulum
- Drift
- Parallax
- Jello
- Wobble
- Heartbeat
- Flash
- Reveal
- Scanline
- Glitch RGB
- Chromatic Shake
- Focus Pulse
- Pixel Pulse

Not every preset needs every parameter. UI should expose presets first, then shared Speed and Intensity controls. Direction is shown only for presets that use it.

### 8.4 Safety

Animations must not permanently mutate stored x/y/width/height while previewing.

Drag/resize/rotate interactions freeze the animation timestamp during the gesture, as the current editor already does, then commit the actual geometry with animation offsets removed.

## 9. Project Canvas Resizing

### 9.1 Controls

Bring back explicit width/height controls inspired by the legacy app.

Initial presets:

- 300 × 100
- 350 × 120
- 450 × 150
- 600 × 200
- 150 × 150
- 200 × 200
- 300 × 300
- Custom

Custom numeric values are validated before commit.

### 9.2 Proportional resize rule

The user approved proportional design scaling.

For old canvas `(oldW, oldH)` and new canvas `(newW, newH)`:

```ts
sx = newW / oldW
sy = newH / oldH
uniformScale = Math.min(sx, sy)
```

Element sizes scale uniformly by `uniformScale` to avoid distortion.

Element positions are transformed relative to the old canvas center and re-centered in the new canvas:

```ts
newX = newW / 2 + (oldCenterXRelative * uniformScale)
newY = newH / 2 + (oldCenterYRelative * uniformScale)
```

This preserves the composition when aspect ratio is unchanged and keeps content centered without stretching when aspect ratio changes.

For text, also scale:

- fontSize
- strokeWidth
- shadowBlur

For frame, scale frame width and clamp to valid limits.

Decorations use project dimensions at render time and therefore do not require persisted coordinate migration.

The whole resize is one undo step.

### 9.3 Limits

Project dimensions must remain within safe browser/editor limits. The schema continues to reject invalid, zero, negative, NaN, or excessive values.

## 10. PNG and GIF Output Sizing

Canvas size and output size are independent.

Example:

- Project: 300 × 100
- Export scale: 2x
- Output: 600 × 200

### 10.1 PNG

PNG uses Konva high-quality export with a logical export ratio independent of on-screen preview scale.

Selection transformers and editor-only UI never appear in output.

### 10.2 GIF profiles

Reintroduce legacy-style profiles:

**Küçük**
- prioritizes file size
- lower frame count / sampling rate
- suitable for chat avatars and lightweight sharing

**Dengeli**
- default
- balances motion smoothness and file size

**Kaliteli**
- higher frame count and smoother animation
- larger memory/file cost

The exact frame plan is deterministic and generated by the export module rather than scattered across UI code.

### 10.3 Output scale

GIF supports 1x, 2x, 3x, and 4x output scaling.

Frames are rendered from the project at logical resolution and then captured/encoded at the chosen export size without modifying project geometry.

### 10.4 Resource budget

Before GIF encoding, compute a rough work budget from:

```text
outputWidth × outputHeight × frameCount
```

If a requested combination is likely to exhaust browser memory, the UI blocks the export with a useful message and suggests a smaller scale or quality profile instead of crashing the tab.

The panel also shows the final pixel dimensions before export.

## 11. Persistence and Migration

Existing IndexedDB projects must continue loading.

A project migration layer converts V1 projects to the new schema by supplying defaults for:

- text writing mode
- animation intensity/direction
- expanded image effects
- export settings

Migration happens before validation into the current project type.

Saved projects are always written in the newest schema version.

No user project should be silently discarded merely because it was saved by the previous V3 release.

## 12. Undo / Redo

These operations create one history entry each:

- switching text writing mode
- applying one animation preset
- applying one effect preset/toggle
- completing one continuous effect-slider edit
- resizing the project canvas
- applying an export-independent visual change

Changing export scale/profile is not part of visual undo history because it does not alter the design itself.

## 13. Testing Strategy

Implementation remains TDD-first.

Required automated coverage includes:

### Effects
- each control mutates the selected image effect state
- filter adapter chooses the correct Konva filters
- deprecated Brighten is not used
- cache refresh occurs when required effect values change
- no selected image means no mutation

### Tool panel
- category navigation remains accessible while content is scrollable
- active content has its own scroll container

### Text
- horizontal source text remains unchanged
- vertical-stacked output uses grapheme-aware segmentation
- emoji / composed characters are not split incorrectly
- writing mode persists through save/load

### Animation
- every preset is deterministic for a fixed timestamp
- preview and export use the same evaluator
- animation does not mutate persisted geometry each frame
- drag/transform commits geometry correctly while animated

### Sizing
- same-aspect resize scales all visual geometry proportionally
- aspect-ratio change uses uniform scale and re-centering
- text styling dimensions scale appropriately
- canvas resize is one undo step

### Export
- PNG dimensions match project × output scale
- GIF dimensions match project × output scale
- Small/Balanced/Quality produce the defined deterministic frame plans
- unsafe export budgets are rejected
- transformer handles are excluded

### Migration
- V1 projects migrate without losing text/image/decorations/frame data
- existing persisted projects still restore after the release

## 14. Performance

The editor must avoid continuously recalculating expensive image filters when nothing changed.

Rules:

- cache image nodes only when effects need cached pixel processing
- use stable derived effect/filter descriptions
- keep animation evaluation pure and cheap
- do not persist render-only helper layers
- do not start the RAF clock if no animation/decor/frame requires it
- reject obviously unsafe GIF export workloads before encoding

Bundle splitting can be addressed where it materially improves initial editor load, but this phase should not add unrelated architectural churn.

## 15. Deployment Workflow

Feature branches run GitHub CI only.

Vercel automatic deployment remains disabled for non-main branches.

Release flow:

```text
feature branch
→ tests
→ typecheck
→ production build
→ PR review
→ merge to main
→ one production Vercel deployment
```

No per-commit preview deployment loop is required.

## 16. Acceptance Criteria

This phase is complete only when all of the following are true:

1. Effect controls visibly work on the selected photo and survive PNG/GIF export.
2. Left-side active tool content scrolls independently while category controls remain accessible.
3. Text supports both horizontal and upright stacked vertical modes.
4. Image animation selection is substantially richer than the current V3 set and all supported presets export deterministically.
5. Canvas width/height controls proportionally scale the complete design.
6. PNG and GIF support independent 1x–4x output scale.
7. GIF offers Small/Balanced/Quality profiles and displays final output dimensions.
8. Existing saved V3 projects migrate and restore correctly.
9. Undo/redo remains meaningful and gesture-based.
10. Full tests, typecheck, and production build are green before merge.
11. Only the final `main` merge triggers production deployment.

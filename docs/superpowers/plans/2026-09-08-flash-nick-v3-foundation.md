# Flash Nick V3 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-grade Flash Nick V3 editor foundation: a React/TypeScript application with validated project state, undo/redo, direct image/text manipulation on a Konva canvas, local image upload, and PNG export.

**Architecture:** V3 lives alongside the legacy static application on `rewrite/v3`, so no existing production entry point is replaced during this slice. The project model is the single source of truth; React renders controls and `react-konva` renders the scene. Zustand owns editor state and history, while Zod validates the versioned project model. Completed transformations create one history entry, not one entry per pointer movement.

**Tech Stack:** React 19.2.x, TypeScript, Vite 8.2.x, Konva 10.x, react-konva 19.2.x, Zustand 5.0.x, Zod 4.5.x, Vitest 5.x, React Testing Library 16.3.x, jsdom.

**Spec:** `docs/superpowers/specs/2026-09-08-flash-nick-v3-design.md`

## Global Constraints

- Development occurs on `rewrite/v3`; `main` and the legacy static editor remain untouched in this slice.
- No backend, user accounts, cloud storage, payments, AI generation, particles, GIF export, templates, or advanced animation catalog in this foundation slice.
- The project model is the single source of truth; Konva nodes and DOM inputs are projections of it.
- Imported images stay local in the browser.
- Undo/redo records meaningful completed mutations; drag/resize/rotate must create one history entry per completed transform.
- Turkish is the default UI language.
- Static scenes must not introduce continuous animation loops.
- Expected failures must preserve the current project and display actionable Turkish feedback.
- No per-pixel JavaScript image processing in the interactive path.
- Production build and automated tests must pass before the foundation is considered complete.

---

## Planned File Structure

```text
v3/
  index.html
  package.json
  tsconfig.json
  tsconfig.app.json
  vite.config.ts
  src/
    main.tsx
    styles.css
    app/
      App.tsx
    model/
      project.ts
      schema.ts
      project.test.ts
    store/
      editor-store.ts
      editor-store.test.ts
    editor/
      EditorShell.tsx
      toolbar/
        TopToolbar.tsx
      panels/
        AddPanel.tsx
        TextInspector.tsx
      canvas/
        EditorCanvas.tsx
        TransformableText.tsx
        TransformableImage.tsx
        image-loader.ts
        image-loader.test.ts
    export/
      png.ts
      png.test.ts
    test/
      setup.ts
```

`v3/` is intentionally isolated from the legacy root files. Cutover is a separate future task.

---

### Task 1: Establish the isolated V3 application and test harness

**Files:**
- Create: `v3/package.json`
- Create: `v3/index.html`
- Create: `v3/tsconfig.json`
- Create: `v3/tsconfig.app.json`
- Create: `v3/vite.config.ts`
- Create: `v3/src/main.tsx`
- Create: `v3/src/app/App.tsx`
- Create: `v3/src/styles.css`
- Create: `v3/src/test/setup.ts`
- Create: `v3/src/app/App.test.tsx`

**Interfaces:**
- Consumes: none.
- Produces: a runnable Vite application and `npm test`, `npm run build`, `npm run typecheck` commands used by every later task.

- [ ] **Step 1: Write the application-shell test first**

Create `v3/src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the primary creation actions in Turkish', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /fotoğraf seç/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yazı ekle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /png indir/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Add the Vite/Vitest package configuration and run the failing test**

Use a package manifest equivalent to:

```json
{
  "name": "flash-nick-v3",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "konva": "^10.3.3",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-konva": "^19.2.6",
    "zod": "^4.5.4",
    "zustand": "^5.0.15"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.3.3",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.1.1",
    "jsdom": "^27.0.0",
    "typescript": "^6.0.0",
    "vite": "^8.2.2",
    "vitest": "^5.0.0"
  }
}
```

`vite.config.ts` must use React plus jsdom for tests:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Run:

```bash
cd v3
npm install
npm test -- src/app/App.test.tsx
```

Expected: FAIL because `App` and/or its required controls are not implemented yet.

- [ ] **Step 3: Implement the minimal application shell**

`App.tsx` must render an editor-oriented shell with three clearly labelled buttons and no legacy DOM dependencies:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Flash Nick Studio</p>
          <h1>İkonunu kolayca hazırla</h1>
        </div>
        <button type="button" className="primary-action">PNG İndir</button>
      </header>

      <section className="editor-layout">
        <aside className="tool-panel" aria-label="Tasarım araçları">
          <button type="button">Fotoğraf Seç</button>
          <button type="button">Yazı Ekle</button>
        </aside>
        <section className="canvas-card" aria-label="Tasarım alanı">
          <div className="empty-canvas">Fotoğraf veya yazı ekleyerek başla</div>
        </section>
      </section>
    </main>
  );
}
```

Use `main.tsx` to mount `<App />`. Add responsive CSS with large, labelled controls; do not introduce icon-only primary actions.

- [ ] **Step 4: Verify shell, typecheck, and production build**

Run:

```bash
npm test -- src/app/App.test.tsx
npm run typecheck
npm run build
```

Expected: all commands PASS.

- [ ] **Step 5: Commit**

```bash
git add v3
git commit -m "feat(v3): establish React editor foundation"
```

---

### Task 2: Define and validate the versioned project model

**Files:**
- Create: `v3/src/model/project.ts`
- Create: `v3/src/model/schema.ts`
- Create: `v3/src/model/project.test.ts`

**Interfaces:**
- Consumes: Zod from Task 1.
- Produces: `Project`, `EditorElement`, `TextElement`, `ImageElement`, `createEmptyProject()`, `projectSchema`, and `parseProject(input)`.

- [ ] **Step 1: Write failing schema/model tests**

Create tests that enforce versioning and reject malformed dimensions:

```ts
import { describe, expect, it } from 'vitest';
import { createEmptyProject } from './project';
import { parseProject } from './schema';

describe('project model', () => {
  it('creates a valid version-1 project', () => {
    const project = createEmptyProject();
    expect(parseProject(project)).toEqual(project);
    expect(project.version).toBe(1);
    expect(project.width).toBe(300);
    expect(project.height).toBe(300);
  });

  it('rejects impossible canvas dimensions', () => {
    const project = { ...createEmptyProject(), width: 0 };
    expect(() => parseProject(project)).toThrow();
  });
});
```

Run:

```bash
npm test -- src/model/project.test.ts
```

Expected: FAIL because model/schema modules do not exist.

- [ ] **Step 2: Implement strongly typed project and element unions**

Define these public contracts in `project.ts`:

```ts
export type ElementBase = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
};

export type TextElement = ElementBase & {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  align: 'left' | 'center' | 'right';
};

export type ImageElement = ElementBase & {
  type: 'image';
  assetUrl: string;
};

export type EditorElement = TextElement | ImageElement;

export type Project = {
  version: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  durationMs: number;
  fps: number;
  background: string;
  elements: EditorElement[];
};
```

`createEmptyProject()` returns a 300x300, 3000 ms, 24 fps project with an empty element list and a generated `crypto.randomUUID()` id.

- [ ] **Step 3: Implement matching Zod schemas**

`schema.ts` must mirror the discriminated union and constrain dimensions, opacity, rotation-compatible finite numbers, text sizes, and non-empty ids. Expose:

```ts
export const projectSchema = z.object({ /* exact fields matching Project */ });

export function parseProject(input: unknown): Project {
  return projectSchema.parse(input) as Project;
}
```

Canvas width/height must be integers from 32 through 4096. FPS must be an integer from 1 through 60. Duration must be 100 through 30_000 ms. Opacity must be 0 through 1.

- [ ] **Step 4: Verify tests and types**

Run:

```bash
npm test -- src/model/project.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add v3/src/model
git commit -m "feat(v3): add validated project model"
```

---

### Task 3: Build Zustand editor state with transactional undo/redo

**Files:**
- Create: `v3/src/store/editor-store.ts`
- Create: `v3/src/store/editor-store.test.ts`

**Interfaces:**
- Consumes: `Project`, `EditorElement`, `TextElement`, `ImageElement`, `createEmptyProject()`.
- Produces: `useEditorStore`, `EditorStore`, `addText()`, `addImage()`, `updateElement()`, `removeElement()`, `commitTransform()`, `undo()`, `redo()`, `selectElement()`.

- [ ] **Step 1: Write failing history tests**

Cover the semantic behavior explicitly:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './editor-store';

describe('editor store history', () => {
  beforeEach(() => useEditorStore.getState().reset());

  it('undoes and redoes a completed text mutation', () => {
    const id = useEditorStore.getState().addText('SevDa');
    useEditorStore.getState().updateElement(id, { x: 140 }, { recordHistory: true });

    expect(useEditorStore.getState().project.elements[0].x).toBe(140);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().project.elements[0].x).not.toBe(140);
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().project.elements[0].x).toBe(140);
  });

  it('selection changes do not create history entries', () => {
    const id = useEditorStore.getState().addText('Test');
    const before = useEditorStore.getState().past.length;
    useEditorStore.getState().selectElement(id);
    expect(useEditorStore.getState().past).toHaveLength(before);
  });
});
```

Run and verify failure.

- [ ] **Step 2: Implement immutable snapshot history**

For this foundation, use bounded project snapshots rather than a premature command framework. `past` and `future` contain `Project` snapshots. Cap `past` at 50 entries.

Public update signature:

```ts
type ElementPatch = Partial<Omit<EditorElement, 'id' | 'type'>>;

updateElement(
  id: string,
  patch: ElementPatch,
  options?: { recordHistory?: boolean },
): void;
```

`recordHistory` defaults to `true`. Pointer-drag preview updates may use `false`, but the completed transform must call `commitTransform(beforeProject, afterProject)` exactly once.

- [ ] **Step 3: Add element factory actions**

`addText(text)` returns the new element id and creates a centered default text element. `addImage(assetUrl, naturalWidth, naturalHeight)` scales the image to fit inside the project while preserving aspect ratio and returns its id.

Every add/remove operation records history and updates selection safely.

- [ ] **Step 4: Run history tests and full unit suite**

```bash
npm test -- src/store/editor-store.test.ts
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add v3/src/store
git commit -m "feat(v3): add editor state and undo history"
```

---

### Task 4: Add safe local image loading and the first editor controls

**Files:**
- Create: `v3/src/editor/canvas/image-loader.ts`
- Create: `v3/src/editor/canvas/image-loader.test.ts`
- Create: `v3/src/editor/toolbar/TopToolbar.tsx`
- Create: `v3/src/editor/panels/AddPanel.tsx`
- Create: `v3/src/editor/panels/TextInspector.tsx`
- Create: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/app/App.tsx`
- Test: `v3/src/editor/EditorShell.test.tsx`

**Interfaces:**
- Consumes: editor store actions from Task 3.
- Produces: `readImageFile(file): Promise<LoadedImageAsset>`, primary editor commands, image input, text creation/editing UI.

- [ ] **Step 1: Write failing file-validation tests**

Test invalid MIME and oversize input before object URLs are created:

```ts
import { describe, expect, it } from 'vitest';
import { validateImageFile } from './image-loader';

describe('validateImageFile', () => {
  it('rejects non-image files', () => {
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
    expect(() => validateImageFile(file)).toThrow(/resim dosyası/i);
  });

  it('rejects files larger than 20 MB', () => {
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' });
    expect(() => validateImageFile(file)).toThrow(/20 MB/i);
  });
});
```

- [ ] **Step 2: Implement image validation/loading**

`validateImageFile(file)` accepts `image/png`, `image/jpeg`, `image/webp`, and `image/gif` inputs up to 20 MiB for the foundation. `readImageFile()` creates an object URL, loads dimensions via `Image`, rejects dimensions above 8192 on either axis with an actionable Turkish error, and revokes the temporary URL when loading fails.

Return:

```ts
export type LoadedImageAsset = {
  url: string;
  width: number;
  height: number;
  revoke: () => void;
};
```

- [ ] **Step 3: Write failing component tests for add/edit/undo actions**

Test that pressing `Yazı Ekle` creates a text element, selecting it exposes a labelled text input, editing changes the model, and the undo toolbar restores the previous text.

- [ ] **Step 4: Implement large-control editor shell**

`TopToolbar` exposes labelled `Geri Al`, `Yinele`, and `PNG İndir` controls. `AddPanel` exposes a visually large image file button/input and `Yazı Ekle`. `TextInspector` appears only for selected text and edits `text`, `fontSize`, `fill`, `stroke`, and `strokeWidth` through store actions.

Errors from image loading appear in an `role="alert"` region and must not clear the current project.

- [ ] **Step 5: Verify component and unit tests**

```bash
npm test -- src/editor/canvas/image-loader.test.ts src/editor/EditorShell.test.tsx
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v3/src/editor v3/src/app/App.tsx
git commit -m "feat(v3): add image and text editing controls"
```

---

### Task 5: Render selectable, draggable, resizable, rotatable text and images with Konva

**Files:**
- Create: `v3/src/editor/canvas/EditorCanvas.tsx`
- Create: `v3/src/editor/canvas/TransformableText.tsx`
- Create: `v3/src/editor/canvas/TransformableImage.tsx`
- Create: `v3/src/editor/canvas/transform.ts`
- Create: `v3/src/editor/canvas/transform.test.ts`
- Modify: `v3/src/editor/EditorShell.tsx`

**Interfaces:**
- Consumes: project/selection/history store and locally loaded image URLs.
- Produces: deterministic conversion from Konva completed transform data to normalized project element dimensions, plus visible editor canvas.

- [ ] **Step 1: Write failing pure transform-normalization tests**

Keep geometry logic testable without mounting Canvas:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeTransform } from './transform';

describe('normalizeTransform', () => {
  it('folds Konva scale into width and height and resets node scale', () => {
    expect(normalizeTransform({
      x: 20,
      y: 30,
      width: 100,
      height: 50,
      scaleX: 1.5,
      scaleY: 2,
      rotation: 15,
    })).toEqual({
      x: 20,
      y: 30,
      width: 150,
      height: 100,
      rotation: 15,
    });
  });
});
```

- [ ] **Step 2: Implement `normalizeTransform` with minimum dimensions**

Clamp resulting width/height to at least 8 px and reject non-finite geometry by returning the previous persisted geometry rather than storing NaN/Infinity.

- [ ] **Step 3: Implement `EditorCanvas` and transformable elements**

`EditorCanvas` renders:

```tsx
<Stage width={displayWidth} height={displayHeight} scaleX={scale} scaleY={scale}>
  <Layer>{/* project elements */}</Layer>
</Stage>
```

The working project remains in project coordinates. Responsive UI scaling changes only Stage display scale, never persisted element coordinates.

For each selected unlocked text/image element:

- attach one `Transformer`;
- enable drag;
- on pointer-down select the element;
- capture the persisted project snapshot when drag/transform begins;
- allow live movement without history spam;
- on drag/transform end persist normalized values and create exactly one history transition.

Locked elements render but cannot drag/transform.

- [ ] **Step 4: Load image nodes without duplicating project state**

Use a small React hook/internal cache that loads `HTMLImageElement` from `assetUrl`. Loading state does not mutate the project model. Broken asset URLs render a harmless placeholder rectangle and accessible UI error outside the canvas rather than crashing the stage.

- [ ] **Step 5: Verify transform tests, full tests, and build**

```bash
npm test -- src/editor/canvas/transform.test.ts
npm test
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add v3/src/editor/canvas v3/src/editor/EditorShell.tsx
git commit -m "feat(v3): add direct canvas manipulation"
```

---

### Task 6: Add PNG export from the same visible scene and keyboard undo/redo

**Files:**
- Create: `v3/src/export/png.ts`
- Create: `v3/src/export/png.test.ts`
- Modify: `v3/src/editor/canvas/EditorCanvas.tsx`
- Modify: `v3/src/editor/EditorShell.tsx`
- Modify: `v3/src/editor/toolbar/TopToolbar.tsx`
- Create: `v3/src/editor/keyboard-shortcuts.ts`
- Create: `v3/src/editor/keyboard-shortcuts.test.ts`

**Interfaces:**
- Consumes: the actual Konva `Stage` ref and store history actions.
- Produces: `exportStageToPng(stage, project): Promise<void>` and keyboard shortcut registration behavior.

- [ ] **Step 1: Write failing export-helper tests**

Test filename sanitization and ensure the requested export pixel ratio returns the project’s native dimensions even when the on-screen Stage is responsively scaled. Keep browser download plumbing behind injectable helpers so the unit test does not need a real canvas implementation.

Public contract:

```ts
export type PngExportOptions = {
  stage: Konva.Stage;
  projectName: string;
  displayScale: number;
  download?: (dataUrl: string, filename: string) => void;
};

export function exportStageToPng(options: PngExportOptions): void;
```

The helper must temporarily hide Transformer handles before obtaining the data URL and restore them afterward, including if export throws.

- [ ] **Step 2: Implement PNG export**

Use the same live Konva Stage. Do not create a second renderer. Export with `pixelRatio = 1 / displayScale` so responsive display scaling does not reduce output resolution. Filename defaults to sanitized project name plus `.png`.

- [ ] **Step 3: Write failing keyboard shortcut tests**

Cover:

- Cmd/Ctrl+Z → undo
- Cmd/Ctrl+Shift+Z → redo
- Ctrl+Y → redo
- shortcuts do not hijack text inputs/contenteditable elements

- [ ] **Step 4: Implement shortcuts and wire toolbar/export**

Register keyboard handling from `EditorShell` with cleanup on unmount. `TopToolbar` button disabled state reflects whether `past`/`future` history exists. The export button displays a Turkish alert message if a browser export fails without changing project state.

- [ ] **Step 5: Run complete foundation verification**

```bash
npm test
npm run typecheck
npm run build
```

Expected: all PASS.

Then manually verify in the dev server:

1. open V3;
2. upload a PNG/JPEG/WebP;
3. add text;
4. drag, resize, rotate image and text;
5. edit text appearance;
6. undo/redo completed operations;
7. export PNG;
8. confirm Transformer handles are not present in the downloaded image.

- [ ] **Step 6: Commit**

```bash
git add v3/src/export v3/src/editor
git commit -m "feat(v3): complete static editor foundation"
```

---

## Plan Self-Review

### Spec coverage for this foundation slice

Covered in this plan:

- isolated React + TypeScript + Vite application;
- versioned project model and Zod validation;
- Zustand project/selection state;
- bounded undo/redo history;
- image upload with validation;
- text creation/editing;
- direct select/drag/resize/rotate for text and image;
- one history entry per completed transform;
- responsive canvas presentation without corrupting project coordinates;
- PNG export from the same renderer used by the editor;
- Turkish primary UI and recoverable errors;
- automated tests, typecheck, and production build.

Intentionally deferred exactly as required by the approved first slice:

- GIF export;
- animation evaluator/presets;
- particles/decorations;
- templates;
- IndexedDB project persistence;
- site-specific export presets.

Those become separate implementation plans after this foundation is verified.

### Placeholder scan

No TBD/TODO implementation placeholders are part of this plan. Every task identifies concrete files, public interfaces, tests, verification commands, and commit boundaries.

### Type/interface consistency

`Project`/`EditorElement` are introduced in Task 2, consumed by the Zustand store in Task 3, projected into UI in Task 4, rendered by Konva in Task 5, and exported through the live Stage in Task 6. History ownership remains exclusively in the store throughout the slice.
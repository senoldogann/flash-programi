import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGifFramePlan } from '../export/profiles';
import { useEditorStore } from '../store/editor-store';
import { EditorShell } from './EditorShell';

const runtime = vi.hoisted(() => {
  const gifBlob = new Blob(['GIF89a'], { type: 'image/gif' });
  const stage = {
    scaleX: () => 1,
    find: vi.fn(() => []),
    toDataURL: vi.fn(() => 'data:image/png;base64,fixture'),
    toCanvas: vi.fn(() => document.createElement('canvas')),
    draw: vi.fn(),
  };
  const fakeEncoder = { addFrame: vi.fn(), on: vi.fn(), render: vi.fn() };
  const fakeConstructor = vi.fn();
  const loadGifConstructor = vi.fn(async () => fakeConstructor);
  const createBrowserGifEncoder = vi.fn(() => fakeEncoder);
  const downloadBlob = vi.fn();
  const encodeGifFrames = vi.fn(async (options: {
    frameTimesMs?: number[];
    frameDelayMs?: number;
    renderFrame: (timeMs: number) => Promise<HTMLCanvasElement>;
  }) => {
    await options.renderFrame(options.frameTimesMs?.[0] ?? 0);
    return gifBlob;
  });
  const loadCurrentProject = vi.fn(async () => null);
  const saveCurrentProject = vi.fn(async () => undefined);
  const clearCurrentProject = vi.fn(async () => undefined);
  const revokeImage = vi.fn();
  const readImageFile = vi.fn(async () => ({
    url: 'blob:integration-photo',
    width: 200,
    height: 100,
    revoke: revokeImage,
  }));

  return {
    gifBlob,
    stage,
    fakeEncoder,
    fakeConstructor,
    loadGifConstructor,
    createBrowserGifEncoder,
    downloadBlob,
    encodeGifFrames,
    loadCurrentProject,
    saveCurrentProject,
    clearCurrentProject,
    revokeImage,
    readImageFile,
  };
});

vi.mock('./canvas/EditorCanvas', () => ({
  EditorCanvas: ({ onStageReady }: { onStageReady?: (stage: typeof runtime.stage) => void }) => {
    onStageReady?.(runtime.stage);
    return <span data-testid="canvas-placeholder" />;
  },
}));

vi.mock('./canvas/image-loader', () => ({
  readImageFile: runtime.readImageFile,
}));

vi.mock('../export/gif', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../export/gif')>();
  return { ...actual, encodeGifFrames: runtime.encodeGifFrames };
});

vi.mock('../export/gif-browser', () => ({
  loadGifConstructor: runtime.loadGifConstructor,
  createBrowserGifEncoder: runtime.createBrowserGifEncoder,
  downloadBlob: runtime.downloadBlob,
}));

vi.mock('../persistence/project-db', () => ({
  loadCurrentProject: runtime.loadCurrentProject,
  saveCurrentProject: runtime.saveCurrentProject,
  clearCurrentProject: runtime.clearCurrentProject,
}));

async function renderReadyEditorShell() {
  const view = render(<EditorShell />);
  const loadPromise = runtime.loadCurrentProject.mock.results.at(-1)?.value;

  await act(async () => {
    await loadPromise;
  });

  return view;
}

function visualGeometry() {
  return useEditorStore.getState().project.elements.map((element) => ({
    id: element.id,
    type: element.type,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
  }));
}

describe('EditorShell editor-pro integration', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    runtime.stage.find.mockClear();
    runtime.stage.toDataURL.mockClear();
    runtime.stage.toCanvas.mockClear();
    runtime.stage.draw.mockClear();
    runtime.loadGifConstructor.mockClear();
    runtime.createBrowserGifEncoder.mockClear();
    runtime.downloadBlob.mockClear();
    runtime.encodeGifFrames.mockClear();
    runtime.readImageFile.mockClear();
    runtime.revokeImage.mockClear();
    runtime.loadCurrentProject.mockClear();
    runtime.saveCurrentProject.mockClear();
    runtime.clearCurrentProject.mockClear();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the full editor flow coherent from image editing through scaled PNG/GIF export', async () => {
    await renderReadyEditorShell();

    const imageInput = screen.getByLabelText('Fotoğraf seç');
    fireEvent.change(imageInput, {
      target: { files: [new File(['fixture'], 'nick.png', { type: 'image/png' })] },
    });

    await waitFor(() => expect(useEditorStore.getState().project.elements).toHaveLength(1));
    const imageId = useEditorStore.getState().selectedElementId;
    expect(imageId).not.toBeNull();
    expect(useEditorStore.getState().project.elements[0]).toMatchObject({
      id: imageId,
      type: 'image',
      assetUrl: 'blob:integration-photo',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Efekt' }));
    const brightness = screen.getByLabelText('Parlaklık');
    fireEvent.focus(brightness);
    fireEvent.change(brightness, { target: { value: '0.45' } });
    fireEvent.blur(brightness);

    expect(useEditorStore.getState().project.elements[0]).toMatchObject({
      effects: { brightness: 0.45 },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Hareket' }));
    fireEvent.click(screen.getByRole('button', { name: 'Glitch RGB' }));

    expect(useEditorStore.getState().project.elements[0]).toMatchObject({
      animation: { preset: 'glitch-rgb' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Yazı Ekle' }));
    const textId = useEditorStore.getState().selectedElementId;
    expect(textId).not.toBeNull();
    const sourceText = screen.getByLabelText('Yazı').getAttribute('value');

    fireEvent.click(screen.getByRole('button', { name: 'Dikey' }));

    const selectedText = useEditorStore.getState().project.elements.find((element) => element.id === textId);
    expect(selectedText).toMatchObject({
      type: 'text',
      text: sourceText,
      writingMode: 'vertical-stacked',
    });

    fireEvent.click(screen.getByRole('button', { name: '600 × 200' }));
    expect(useEditorStore.getState().project).toMatchObject({ width: 600, height: 200 });

    const geometryBeforeExportSettings = visualGeometry();
    const historyBeforeExportSettings = useEditorStore.getState().past.length;

    fireEvent.click(screen.getByRole('button', { name: '2x' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dengeli' }));

    expect(useEditorStore.getState().project.exportSettings).toEqual({
      scale: 2,
      gifProfile: 'balanced',
      gifPalette: 'adaptive',
      gifDither: 'none',
    });
    expect(visualGeometry()).toEqual(geometryBeforeExportSettings);
    expect(useEditorStore.getState().past).toHaveLength(historyBeforeExportSettings);

    fireEvent.click(screen.getByRole('button', { name: 'PNG İndir' }));
    expect(runtime.stage.toDataURL).toHaveBeenCalledWith({
      mimeType: 'image/png',
      pixelRatio: 2,
    });

    const durationMs = useEditorStore.getState().project.durationMs;
    const expectedPlan = getGifFramePlan(durationMs, 'balanced');
    fireEvent.click(screen.getByRole('button', { name: 'GIF İndir' }));

    await waitFor(() => expect(runtime.encodeGifFrames).toHaveBeenCalledTimes(1));
    expect(runtime.createBrowserGifEncoder).toHaveBeenCalledWith(
      runtime.fakeConstructor,
      1200,
      400,
      'balanced',
    );
    expect(runtime.encodeGifFrames).toHaveBeenCalledWith(expect.objectContaining({
      frameTimesMs: expectedPlan.frameTimesMs,
      frameDelayMs: expectedPlan.delayMs,
    }));
    expect(runtime.stage.toCanvas).toHaveBeenCalledWith({ pixelRatio: 2 });
    expect(visualGeometry()).toEqual(geometryBeforeExportSettings);
  });
});

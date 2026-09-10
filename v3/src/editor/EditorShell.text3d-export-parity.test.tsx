import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  const canvasTimes: Array<number | null | undefined> = [];
  const fakeEncoder = { addFrame: vi.fn(), on: vi.fn(), render: vi.fn() };
  const fakeConstructor = vi.fn();
  const loadGifConstructor = vi.fn(async () => fakeConstructor);
  const createBrowserGifEncoder = vi.fn(() => fakeEncoder);
  const downloadBlob = vi.fn();
  const encodeGifFrames = vi.fn(async (options: {
    renderFrame: (timeMs: number) => Promise<HTMLCanvasElement>;
  }) => {
    await options.renderFrame(0);
    await options.renderFrame(800);
    return gifBlob;
  });
  const loadCurrentProject = vi.fn(async () => null);
  const saveCurrentProject = vi.fn(async () => undefined);
  const clearCurrentProject = vi.fn(async () => undefined);

  return {
    gifBlob,
    stage,
    canvasTimes,
    fakeEncoder,
    fakeConstructor,
    loadGifConstructor,
    createBrowserGifEncoder,
    downloadBlob,
    encodeGifFrames,
    loadCurrentProject,
    saveCurrentProject,
    clearCurrentProject,
  };
});

vi.mock('./canvas/EditorCanvas', () => ({
  EditorCanvas: ({
    onStageReady,
    timeOverrideMs,
  }: {
    onStageReady?: (stage: typeof runtime.stage) => void;
    timeOverrideMs?: number | null;
  }) => {
    runtime.canvasTimes.push(timeOverrideMs);
    onStageReady?.(runtime.stage);
    return <span data-testid="shared-editor-canvas" />;
  },
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

beforeEach(() => {
  useEditorStore.getState().reset();
  runtime.canvasTimes.length = 0;
  runtime.stage.find.mockClear();
  runtime.stage.toCanvas.mockClear();
  runtime.stage.draw.mockClear();
  runtime.loadGifConstructor.mockClear();
  runtime.createBrowserGifEncoder.mockClear();
  runtime.downloadBlob.mockClear();
  runtime.encodeGifFrames.mockClear();
  runtime.loadCurrentProject.mockClear();
  runtime.saveCurrentProject.mockClear();
  runtime.clearCurrentProject.mockClear();
});

describe('EditorShell Text3D GIF parity', () => {
  it('steps export timestamps through the same EditorCanvas and captures the same Stage', async () => {
    const textId = useEditorStore.getState().addText('FRONT');
    useEditorStore.getState().updateElement(textId, {
      backText: 'BACK',
      materialPreset: 'xara-gold',
      extrusionDepth: 8,
      extrusionColor: '#7c4800',
    });
    useEditorStore.getState().setElementAnimation(textId, {
      preset: 'xara-double-sided',
      speed: 'normal',
      intensity: 'normal',
      delayMs: 0,
      loop: true,
    });

    render(<EditorShell />);
    const loadPromise = runtime.loadCurrentProject.mock.results.at(-1)?.value;
    await act(async () => {
      await loadPromise;
    });

    expect(screen.getByTestId('shared-editor-canvas')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'GIF İndir' }));

    await waitFor(() => expect(runtime.downloadBlob).toHaveBeenCalledTimes(1));
    expect(runtime.canvasTimes).toContain(0);
    expect(runtime.canvasTimes).toContain(800);
    expect(runtime.canvasTimes.at(-1)).toBeNull();
    expect(runtime.stage.toCanvas).toHaveBeenCalledTimes(2);
    expect(runtime.stage.toCanvas).toHaveBeenNthCalledWith(1, { pixelRatio: 1 });
    expect(runtime.stage.toCanvas).toHaveBeenNthCalledWith(2, { pixelRatio: 1 });
  });

  it('keeps a full Neo recipe on the same EditorCanvas and Stage during GIF export', async () => {
    useEditorStore.getState().addText('SENOL');
    useEditorStore.getState().applyNeoRecipe('neon-night');
    expect(useEditorStore.getState().project.mode).toBe('neo');

    render(<EditorShell />);
    const loadPromise = runtime.loadCurrentProject.mock.results.at(-1)?.value;
    await act(async () => {
      await loadPromise;
    });

    fireEvent.click(screen.getByRole('button', { name: 'GIF İndir' }));

    await waitFor(() => expect(runtime.downloadBlob).toHaveBeenCalledTimes(1));
    expect(runtime.canvasTimes).toContain(0);
    expect(runtime.canvasTimes).toContain(800);
    expect(runtime.canvasTimes.at(-1)).toBeNull();
    expect(runtime.stage.toCanvas).toHaveBeenCalledTimes(2);
    expect(runtime.stage.toCanvas).toHaveBeenNthCalledWith(1, { pixelRatio: 1 });
    expect(runtime.stage.toCanvas).toHaveBeenNthCalledWith(2, { pixelRatio: 1 });
  });
});

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
  const loadCurrentProject = vi.fn();
  const saveCurrentProject = vi.fn();
  const clearCurrentProject = vi.fn();

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
  };
});

vi.mock('./canvas/EditorCanvas', () => ({
  EditorCanvas: ({ onStageReady }: { onStageReady?: (stage: typeof runtime.stage) => void }) => {
    onStageReady?.(runtime.stage);
    return <span data-testid="canvas-placeholder" />;
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

async function renderReadyEditorShell() {
  const view = render(<EditorShell />);
  const loadPromise = runtime.loadCurrentProject.mock.results.at(-1)?.value;

  await act(async () => {
    await loadPromise;
  });

  return view;
}

async function findOperationErrorAlert(title: string): Promise<HTMLElement> {
  await screen.findByText(title);
  const alerts = screen.getAllByRole('alert');
  const matchingAlert = alerts.find((alert) => alert.textContent?.includes(title));

  if (!matchingAlert) {
    throw new Error(`Expected operation error alert: ${title}`);
  }

  return matchingAlert;
}

describe('EditorShell export settings integration', () => {
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
    runtime.loadCurrentProject.mockReset();
    runtime.loadCurrentProject.mockResolvedValue(null);
    runtime.saveCurrentProject.mockReset();
    runtime.saveCurrentProject.mockResolvedValue(undefined);
    runtime.clearCurrentProject.mockReset();
    runtime.clearCurrentProject.mockResolvedValue(undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mounts export settings in the real editor workspace', async () => {
    await renderReadyEditorShell();

    expect(screen.getByLabelText('Dışa aktarma ayarları')).toBeInTheDocument();
  });

  it('uses the latest export scale for PNG capture', async () => {
    useEditorStore.getState().setExportSettings({ scale: 2 });
    await renderReadyEditorShell();

    fireEvent.click(screen.getByRole('button', { name: 'PNG İndir' }));

    expect(runtime.stage.toDataURL).toHaveBeenCalledWith({
      mimeType: 'image/png',
      pixelRatio: 2,
    });
  });

  it('blocks PNG export when scaled output exceeds the 4096px dimension limit', async () => {
    useEditorStore.getState().resizeProject(1200, 50);
    useEditorStore.getState().setExportSettings({ scale: 4 });
    await renderReadyEditorShell();

    fireEvent.click(screen.getByRole('button', { name: 'PNG İndir' }));

    const errorAlert = await findOperationErrorAlert('PNG oluşturulamadı.');
    expect(errorAlert).toHaveTextContent(/4096/i);
    expect(runtime.stage.toDataURL).not.toHaveBeenCalled();
  });

  it('uses scaled GIF dimensions and the exact selected profile frame plan', async () => {
    useEditorStore.getState().setExportSettings({ scale: 2, gifProfile: 'quality' });
    await renderReadyEditorShell();

    fireEvent.click(screen.getByRole('button', { name: 'GIF İndir' }));

    await waitFor(() => expect(runtime.encodeGifFrames).toHaveBeenCalledTimes(1));

    const expectedPlan = getGifFramePlan(3000, 'quality');
    expect(runtime.createBrowserGifEncoder).toHaveBeenCalledWith(
      runtime.fakeConstructor,
      600,
      600,
      'quality',
    );
    expect(runtime.encodeGifFrames).toHaveBeenCalledWith(expect.objectContaining({
      frameTimesMs: expectedPlan.frameTimesMs,
      frameDelayMs: expectedPlan.delayMs,
    }));
    expect(runtime.stage.toCanvas).toHaveBeenCalledWith({ pixelRatio: 2 });
  });

  it('blocks GIF export on unsafe dimensions even when pixel-frame work is below its ceiling', async () => {
    useEditorStore.getState().resizeProject(1200, 50);
    useEditorStore.getState().setExportSettings({ scale: 4, gifProfile: 'small' });
    await renderReadyEditorShell();

    fireEvent.click(screen.getByRole('button', { name: 'GIF İndir' }));

    const errorAlert = await findOperationErrorAlert('GIF oluşturulamadı.');
    expect(errorAlert).toHaveTextContent(/4096/i);
    expect(runtime.loadGifConstructor).not.toHaveBeenCalled();
    expect(runtime.createBrowserGifEncoder).not.toHaveBeenCalled();
    expect(runtime.encodeGifFrames).not.toHaveBeenCalled();
  });

  it('stops unsafe GIF exports before loading the GIF engine', async () => {
    useEditorStore.getState().resizeProject(4096, 4096);
    useEditorStore.getState().setExportSettings({ scale: 4, gifProfile: 'quality' });
    await renderReadyEditorShell();

    fireEvent.click(screen.getByRole('button', { name: 'GIF İndir' }));

    expect(
      await screen.findByText(/GIF iş yükü 100 milyon pixel-frame güvenlik sınırını aşıyor/i),
    ).toBeInTheDocument();
    expect(runtime.loadGifConstructor).not.toHaveBeenCalled();
    expect(runtime.createBrowserGifEncoder).not.toHaveBeenCalled();
    expect(runtime.encodeGifFrames).not.toHaveBeenCalled();
  });
});

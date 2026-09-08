import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { EditorShell } from './EditorShell';

const runtime = vi.hoisted(() => {
  const gifBlob = new Blob(['GIF89a'], { type: 'image/gif' });
  const exportStage = {
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
    renderFrame: (timeMs: number) => Promise<HTMLCanvasElement>;
    onProgress?: (value: number) => void;
  }) => {
    await options.renderFrame(0);
    await options.renderFrame(500);
    options.onProgress?.(1);
    return gifBlob;
  });

  return {
    gifBlob,
    exportStage,
    fakeEncoder,
    fakeConstructor,
    loadGifConstructor,
    createBrowserGifEncoder,
    downloadBlob,
    encodeGifFrames,
  };
});

vi.mock('./canvas/EditorCanvas', () => ({
  EditorCanvas: ({
    onStageReady,
    timeOverrideMs,
  }: {
    onStageReady?: (stage: typeof runtime.exportStage) => void;
    timeOverrideMs?: number | null;
  }) => {
    onStageReady?.(runtime.exportStage);
    return <span data-testid="export-time">{timeOverrideMs == null ? 'live' : String(timeOverrideMs)}</span>;
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

describe('EditorShell', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    runtime.exportStage.find.mockClear();
    runtime.exportStage.toDataURL.mockClear();
    runtime.exportStage.toCanvas.mockClear();
    runtime.exportStage.draw.mockClear();
    runtime.loadGifConstructor.mockClear();
    runtime.createBrowserGifEncoder.mockClear();
    runtime.downloadBlob.mockClear();
    runtime.encodeGifFrames.mockClear();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds text, edits it, and undoes the edit from the toolbar', () => {
    render(<EditorShell />);

    fireEvent.click(screen.getByRole('button', { name: 'Yazı Ekle' }));

    const selectedId = useEditorStore.getState().selectedElementId;
    expect(selectedId).not.toBeNull();
    expect(useEditorStore.getState().project.elements).toHaveLength(1);

    const textInput = screen.getByLabelText('Yazı');
    fireEvent.change(textInput, { target: { value: 'KraL' } });

    expect(useEditorStore.getState().project.elements[0]).toMatchObject({
      type: 'text',
      text: 'KraL',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Geri Al' }));

    expect(useEditorStore.getState().project.elements[0]).toMatchObject({
      type: 'text',
      text: 'Yeni Yazı',
    });
  });

  it('shows real effect and motion controls instead of dead category labels', () => {
    render(<EditorShell />);

    fireEvent.click(screen.getByRole('button', { name: 'Efekt' }));
    expect(screen.getByLabelText('Parlaklık')).toBeInTheDocument();
    expect(screen.getByLabelText('Kontrast')).toBeInTheDocument();
    expect(screen.getByLabelText('Doygunluk')).toBeInTheDocument();
    expect(screen.getByLabelText('Bulanıklık')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siyah Beyaz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sepya' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hareket' }));
    expect(screen.getByRole('button', { name: 'Nabız' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Süzül' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Titret' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dalga' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yavaş' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Normal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hızlı' })).toBeInTheDocument();
  });

  it('exports the live canvas when PNG İndir is pressed', () => {
    render(<EditorShell />);

    const exportButton = screen.getByRole('button', { name: 'PNG İndir' });
    expect(exportButton).toBeEnabled();

    fireEvent.click(exportButton);

    expect(runtime.exportStage.toDataURL).toHaveBeenCalledTimes(1);
  });

  it('exports deterministic GIF frames and downloads the finished file', async () => {
    render(<EditorShell />);

    const gifButton = screen.getByRole('button', { name: 'GIF İndir' });
    expect(gifButton).toBeEnabled();
    fireEvent.click(gifButton);

    await waitFor(() => expect(runtime.encodeGifFrames).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(runtime.downloadBlob).toHaveBeenCalledWith(runtime.gifBlob, 'flash-nick.gif'));

    expect(runtime.loadGifConstructor).toHaveBeenCalledTimes(1);
    expect(runtime.createBrowserGifEncoder).toHaveBeenCalledWith(
      runtime.fakeConstructor,
      300,
      300,
    );
    expect(runtime.exportStage.toCanvas).toHaveBeenCalledTimes(2);
    expect(runtime.exportStage.draw).toHaveBeenCalled();
    expect(screen.getByTestId('export-time')).toHaveTextContent('live');
  });

  it('shows an actionable image error without discarding the current project', async () => {
    render(<EditorShell />);
    fireEvent.click(screen.getByRole('button', { name: 'Yazı Ekle' }));

    const before = structuredClone(useEditorStore.getState().project);
    const input = screen.getByLabelText('Fotoğraf seç');
    const invalidFile = new File(['not-an-image'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/resim dosyası/i);
    expect(useEditorStore.getState().project).toEqual(before);
  });
});

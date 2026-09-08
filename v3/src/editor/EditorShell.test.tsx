import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { EditorShell } from './EditorShell';

const { exportStage } = vi.hoisted(() => ({
  exportStage: {
    scaleX: () => 1,
    find: vi.fn(() => []),
    toDataURL: vi.fn(() => 'data:image/png;base64,fixture'),
  },
}));

vi.mock('./canvas/EditorCanvas', () => ({
  EditorCanvas: ({ onStageReady }: { onStageReady?: (stage: typeof exportStage) => void }) => {
    onStageReady?.(exportStage);
    return null;
  },
}));

describe('EditorShell', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    exportStage.find.mockClear();
    exportStage.toDataURL.mockClear();
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

    expect(exportStage.toDataURL).toHaveBeenCalledTimes(1);
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

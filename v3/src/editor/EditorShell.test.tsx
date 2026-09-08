import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { EditorShell } from './EditorShell';

vi.mock('./canvas/EditorCanvas', () => ({
  EditorCanvas: () => null,
}));

describe('EditorShell', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
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

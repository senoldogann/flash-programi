import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { EditorShell } from './EditorShell';

const persistence = vi.hoisted(() => ({
  loadCurrentProject: vi.fn(async () => null),
  saveCurrentProject: vi.fn(async () => undefined),
  clearCurrentProject: vi.fn(async () => undefined),
}));

vi.mock('./canvas/EditorCanvas', () => ({
  EditorCanvas: () => null,
}));

vi.mock('../persistence/project-db', () => persistence);

async function renderReadyShell() {
  render(<EditorShell />);
  await act(async () => {
    await persistence.loadCurrentProject.mock.results.at(-1)?.value;
  });
}

describe('EditorShell 2026 redesign', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    persistence.loadCurrentProject.mockClear();
    persistence.saveCurrentProject.mockClear();
    persistence.clearCurrentProject.mockClear();
  });

  it('renders the approved 2026 header and five-step Turkish workflow', async () => {
    await renderReadyShell();

    expect(screen.getByRole('heading', { name: 'Flash Programı' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Ana menü' })).toBeInTheDocument();

    const workflow = screen.getByRole('navigation', { name: 'Oluşturma adımları' });
    for (const name of ['Fotoğraf', 'Nick', 'Stil', 'Hareket', 'Süsleme']) {
      expect(within(workflow).getByRole('button', { name: new RegExp(name, 'i') })).toBeInTheDocument();
    }
  });

  it('shows the real preset library as part of the initial editor surface', async () => {
    await renderReadyShell();

    const library = screen.getByRole('region', { name: 'Hazır tasarımlar' });
    const editor = screen.getByRole('region', { name: 'Ana düzenleyici' });
    expect(library).toBeInTheDocument();
    expect(editor.compareDocumentPosition(library) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(library).getByRole('button', { name: /Neon Night/i })).toBeInTheDocument();
  });

  it('keeps primary workflow, export and help actions reachable in compact layouts', async () => {
    await renderReadyShell();

    const workflow = screen.getByRole('navigation', { name: 'Oluşturma adımları' });
    expect(within(workflow).getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'GIF İndir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PNG İndir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PNG \/ GIF indir/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yardımı Aç' }));
    expect(screen.getByRole('dialog', { name: 'Yardım' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yardımı kapat' })).toBeInTheDocument();
  });
});

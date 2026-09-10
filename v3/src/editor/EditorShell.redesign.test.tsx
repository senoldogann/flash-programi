import { act, render, screen, within } from '@testing-library/react';
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

describe('EditorShell 2026 redesign', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    persistence.loadCurrentProject.mockClear();
    persistence.saveCurrentProject.mockClear();
    persistence.clearCurrentProject.mockClear();
  });

  it('renders the approved 2026 header and five-step Turkish workflow', async () => {
    render(<EditorShell />);

    await act(async () => {
      await persistence.loadCurrentProject.mock.results.at(-1)?.value;
    });

    expect(screen.getByRole('heading', { name: 'Flash Programı' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Ana menü' })).toBeInTheDocument();

    const workflow = screen.getByRole('navigation', { name: 'Oluşturma adımları' });
    for (const name of ['Fotoğraf', 'Nick', 'Stil', 'Hareket', 'Süsleme']) {
      expect(within(workflow).getByRole('button', { name: new RegExp(name, 'i') })).toBeInTheDocument();
    }
  });
});

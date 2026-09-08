import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

const persistence = vi.hoisted(() => ({
  loadCurrentProject: vi.fn(async () => null),
  saveCurrentProject: vi.fn(async () => undefined),
  clearCurrentProject: vi.fn(async () => undefined),
}));

vi.mock('../editor/canvas/EditorCanvas', () => ({
  EditorCanvas: () => null,
}));

vi.mock('../persistence/project-db', () => persistence);

describe('App', () => {
  it('shows the primary creation actions in Turkish', async () => {
    render(<App />);

    await act(async () => {
      await persistence.loadCurrentProject.mock.results.at(-1)?.value;
    });

    expect(screen.getByRole('button', { name: /fotoğraf seç/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yazı ekle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PNG İndir' })).toBeInTheDocument();
  });
});

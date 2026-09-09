import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../store/editor-store';
import { EditorShell } from './EditorShell';

vi.mock('./canvas/EditorCanvas', () => ({
  EditorCanvas: () => <span data-testid="canvas-placeholder" />,
}));

vi.mock('../persistence/project-db', () => ({
  loadCurrentProject: vi.fn(async () => null),
  saveCurrentProject: vi.fn(async () => undefined),
  clearCurrentProject: vi.fn(async () => undefined),
}));

describe('EditorShell canvas sizing', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('wires canvas size controls into the workspace and reflects the resized dimensions', async () => {
    render(<EditorShell />);

    const panel = await waitFor(() => screen.getByLabelText('Tuval boyutu ayarları'));
    expect(panel).toHaveTextContent('300 × 300');

    fireEvent.click(screen.getByRole('button', { name: '600 × 200' }));

    expect(useEditorStore.getState().project).toMatchObject({ width: 600, height: 200 });
    expect(panel).toHaveTextContent('600 × 200');
  });
});

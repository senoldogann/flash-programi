import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { ImagePlacementControls } from './ImagePlacementControls';

describe('ImagePlacementControls', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('lets the user fit the full portrait into the canvas with one click', () => {
    const id = useEditorStore.getState().addImage('blob:portrait', 800, 1200);
    const image = useEditorStore.getState().project.elements.find((item) => item.id === id);
    if (!image || image.type !== 'image') throw new Error('image fixture missing');

    useEditorStore.getState().updateElement(id, { width: 360, height: 540, x: -30, y: -120 });
    render(<ImagePlacementControls element={{ ...image, width: 360, height: 540, x: -30, y: -120 }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fotoğrafı Sığdır' }));

    const fitted = useEditorStore.getState().project.elements.find((item) => item.id === id);
    expect(fitted?.width).toBeLessThanOrEqual(300);
    expect(fitted?.height).toBeLessThanOrEqual(300);
  });

  it('offers fill and center actions without hiding the easy fit action', () => {
    const id = useEditorStore.getState().addImage('blob:portrait', 800, 1200);
    const image = useEditorStore.getState().project.elements.find((item) => item.id === id);
    if (!image || image.type !== 'image') throw new Error('image fixture missing');

    render(<ImagePlacementControls element={image} />);

    expect(screen.getByRole('button', { name: 'Fotoğrafı Sığdır' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tuvali Doldur' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fotoğrafı Ortala' })).toBeInTheDocument();
  });
});

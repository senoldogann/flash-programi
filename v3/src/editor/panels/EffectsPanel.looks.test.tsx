import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { EffectsPanel } from './EffectsPanel';

describe('EffectsPanel quick looks', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('applies a cinematic look without requiring manual slider setup', () => {
    const imageId = useEditorStore.getState().addImage('blob:photo', 640, 480);
    useEditorStore.getState().selectElement(null);

    render(<EffectsPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Sinematik' }));

    const image = useEditorStore.getState().project.elements.find((item) => item.id === imageId);
    expect(image).toMatchObject({
      type: 'image',
      effects: {
        contrast: 22,
        saturation: -0.15,
        temperature: 8,
        vignette: 0.35,
      },
    });
  });

  it('offers a broad set of professional quick looks', () => {
    render(<EffectsPanel />);

    for (const name of ['Doğal', 'Sıcak', 'Soğuk', 'Sinematik', 'Retro', 'Rüya', 'Noir', 'Canlı', 'Soluk', 'Gün Batımı', 'Buz', 'Cyber']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { EffectsPanel } from './EffectsPanel';

describe('EffectsPanel', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('exposes the editor pro effect groups and updates color/style effects', () => {
    const id = useEditorStore.getState().addImage('blob:photo', 640, 480);
    render(<EffectsPanel />);

    expect(screen.getByRole('heading', { name: 'Temel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Renk' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stil' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Ton'), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText('Sıcaklık'), { target: { value: '-30' } });
    fireEvent.change(screen.getByLabelText('Tint'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Enhance'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('Emboss'), { target: { value: '0.6' } });
    fireEvent.change(screen.getByLabelText('Noise'), { target: { value: '0.25' } });
    fireEvent.change(screen.getByLabelText('Pixelate'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Posterize'), { target: { value: '0.5' } });
    fireEvent.change(screen.getByLabelText('Threshold'), { target: { value: '0.7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ters Renk' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solarize' }));

    const image = useEditorStore.getState().project.elements.find((element) => element.id === id);
    expect(image).toMatchObject({
      type: 'image',
      effects: {
        hue: 45,
        temperature: -30,
        tint: 20,
        enhance: 0.4,
        emboss: 0.6,
        invert: true,
        noise: 0.25,
        pixelate: 8,
        posterize: 0.5,
        solarize: true,
        threshold: 0.7,
      },
    });
  });

  it('records one continuous effect slider session as one undoable history step', () => {
    const id = useEditorStore.getState().addImage('blob:photo', 640, 480);
    const historyBefore = useEditorStore.getState().past.length;
    render(<EffectsPanel />);

    const hue = screen.getByLabelText('Ton');
    fireEvent.focus(hue);
    fireEvent.change(hue, { target: { value: '20' } });
    fireEvent.change(hue, { target: { value: '55' } });
    fireEvent.change(hue, { target: { value: '90' } });
    fireEvent.blur(hue);

    expect(useEditorStore.getState().past).toHaveLength(historyBefore + 1);
    expect(useEditorStore.getState().project.elements.find((element) => element.id === id)).toMatchObject({
      type: 'image',
      effects: { hue: 90 },
    });

    act(() => {
      useEditorStore.getState().undo();
    });
    expect(useEditorStore.getState().project.elements.find((element) => element.id === id)).toMatchObject({
      type: 'image',
      effects: { hue: 0 },
    });
  });
});

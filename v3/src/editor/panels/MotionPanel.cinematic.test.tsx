import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { MotionPanel } from './MotionPanel';

describe('MotionPanel cinematic 2.5D group', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('surfaces cinematic motions before the long preset library', () => {
    useEditorStore.getState().addImage('blob:fixture', 640, 480);
    render(<MotionPanel />);

    expect(screen.getByText('3D & Sinematik')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yürü 2.5D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Derinlik Eğimi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dolly Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3D Kamera Orbit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Parallax Yürü' })).toBeInTheDocument();
  });

  it('applies the walk illusion with one click', () => {
    const id = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    render(<MotionPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Yürü 2.5D' }));

    expect(useEditorStore.getState().project.elements.find((item) => item.id === id)).toMatchObject({
      animation: { preset: 'walk-25d' },
    });
  });
});

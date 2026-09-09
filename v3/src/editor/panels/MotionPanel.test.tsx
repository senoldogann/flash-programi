import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { MotionPanel } from './MotionPanel';

describe('MotionPanel', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('exposes expanded presets and shared speed/intensity controls', () => {
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    render(<MotionPanel />);

    expect(screen.getByRole('button', { name: 'Ken Burns' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Glitch RGB' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pixel Pulse' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Orbit' }));
    fireEvent.click(within(screen.getByLabelText('Hareket hızı')).getByRole('button', { name: 'Hızlı' }));
    fireEvent.click(within(screen.getByLabelText('Hareket yoğunluğu')).getByRole('button', { name: 'Güçlü' }));

    expect(useEditorStore.getState().project.elements.find((item) => item.id === imageId)).toMatchObject({
      animation: {
        preset: 'orbit',
        speed: 'fast',
        intensity: 'strong',
      },
    });
  });

  it('keeps motion controls usable when the canvas selection is cleared', () => {
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    useEditorStore.getState().selectElement(null);
    render(<MotionPanel />);

    const pulse = screen.getByRole('button', { name: 'Nabız' });
    expect(pulse).toBeEnabled();
    fireEvent.click(pulse);

    expect(useEditorStore.getState().project.elements.find((item) => item.id === imageId)).toMatchObject({
      animation: { preset: 'pulse' },
    });
  });

  it('shows direction only for directional presets and persists the chosen direction', () => {
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    render(<MotionPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Orbit' }));
    expect(screen.queryByLabelText('Hareket yönü')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Slow Pan' }));
    const direction = screen.getByLabelText('Hareket yönü');
    fireEvent.click(within(direction).getByRole('button', { name: 'Sol' }));

    expect(useEditorStore.getState().project.elements.find((item) => item.id === imageId)).toMatchObject({
      animation: {
        preset: 'slow-pan',
        direction: 'left',
      },
    });
  });
});

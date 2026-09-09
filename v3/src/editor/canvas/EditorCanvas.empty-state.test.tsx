import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { EditorCanvas } from './EditorCanvas';

vi.mock('../../animations/useAnimationClock', () => ({
  useAnimationClock: () => 0,
}));

vi.mock('react-konva', async () => {
  const React = await import('react');
  return {
    Stage: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
    Layer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Rect: () => <div />,
    Text: () => <div />,
    Image: () => <div />,
    Transformer: () => <div />,
  };
});

describe('EditorCanvas empty state', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('opens the photo picker from the central start action', () => {
    const onRequestImage = vi.fn();
    render(<EditorCanvas onRequestImage={onRequestImage} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fotoğraf seç ve başla' }));

    expect(onRequestImage).toHaveBeenCalledTimes(1);
  });
});

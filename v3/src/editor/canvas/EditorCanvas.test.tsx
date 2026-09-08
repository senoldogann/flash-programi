import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { EditorCanvas } from './EditorCanvas';

vi.mock('react-konva', async () => {
  const React = await import('react');
  const { forwardRef, useImperativeHandle } = React;

  const MockText = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    useImperativeHandle(ref, () => ({ }));
    return (
      <button
        type="button"
        data-testid={`text-${String(props.id)}`}
        onClick={props.onClick as (() => void) | undefined}
      >
        {String(props.text ?? '')}
      </button>
    );
  });

  const MockTransformer = forwardRef<unknown>((_props, ref) => {
    useImperativeHandle(ref, () => ({
      nodes: () => undefined,
      getLayer: () => ({ batchDraw: () => undefined }),
    }));
    return <div data-testid="transformer" />;
  });

  return {
    Stage: ({ children }: { children: React.ReactNode }) => (
      <section data-testid="konva-stage">{children}</section>
    ),
    Layer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Rect: () => <div data-testid="canvas-background" />,
    Text: MockText,
    Image: () => <div data-testid="image-element" />,
    Transformer: MockTransformer,
  };
});

describe('EditorCanvas', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('renders text elements from the project and selects them when clicked', () => {
    const textId = useEditorStore.getState().addText('Merhaba');
    useEditorStore.getState().selectElement(null);

    render(<EditorCanvas />);

    expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
    expect(screen.getByText('Merhaba')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Merhaba'));

    expect(useEditorStore.getState().selectedElementId).toBe(textId);
  });
});

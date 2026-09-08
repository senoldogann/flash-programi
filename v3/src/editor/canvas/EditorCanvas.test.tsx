import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { EditorCanvas } from './EditorCanvas';

vi.mock('react-konva', async () => {
  const React = await import('react');
  const { forwardRef, useImperativeHandle } = React;

  const createNode = (props: Record<string, unknown>) => {
    let scaleX = 1;
    let scaleY = 1;

    return {
      x: () => 140,
      y: () => 150,
      width: () => Number(props.width ?? 0),
      height: () => Number(props.height ?? 0),
      rotation: () => Number(props.rotation ?? 0),
      scaleX: (value?: number) => {
        if (value !== undefined) scaleX = value;
        return scaleX;
      },
      scaleY: (value?: number) => {
        if (value !== undefined) scaleY = value;
        return scaleY;
      },
    };
  };

  const MockText = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    const node = createNode(props);
    useImperativeHandle(ref, () => node);

    return (
      <button
        type="button"
        data-testid={`text-${String(props.id)}`}
        onClick={props.onClick as (() => void) | undefined}
        onDoubleClick={() => {
          const event = { target: node };
          (props.onDragStart as ((event: typeof event) => void) | undefined)?.(event);
          (props.onDragEnd as ((event: typeof event) => void) | undefined)?.(event);
        }}
      >
        {String(props.text ?? '')}
      </button>
    );
  });

  const MockImage = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    const node = createNode(props);
    useImperativeHandle(ref, () => node);

    return (
      <button
        type="button"
        data-testid={`image-${String(props.id)}`}
        onClick={props.onClick as (() => void) | undefined}
      >
        Fotoğraf
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
    Image: MockImage,
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

  it('renders image elements from the project and selects them when clicked', () => {
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    useEditorStore.getState().selectElement(null);

    render(<EditorCanvas />);

    const imageNode = screen.getByTestId(`image-${imageId}`);
    expect(imageNode).toBeInTheDocument();

    fireEvent.click(imageNode);

    expect(useEditorStore.getState().selectedElementId).toBe(imageId);
  });

  it('persists a completed drag as one undoable project change', () => {
    const textId = useEditorStore.getState().addText('Taşı');
    const before = structuredClone(useEditorStore.getState().project);
    const historyLength = useEditorStore.getState().past.length;

    render(<EditorCanvas />);
    fireEvent.doubleClick(screen.getByText('Taşı'));

    const moved = useEditorStore
      .getState()
      .project.elements.find((element) => element.id === textId);

    expect(moved).toMatchObject({ x: 140, y: 150 });
    expect(useEditorStore.getState().past).toHaveLength(historyLength + 1);

    useEditorStore.getState().undo();

    expect(useEditorStore.getState().project).toEqual(before);
  });
});

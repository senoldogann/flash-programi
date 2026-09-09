import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { EditorCanvas } from './EditorCanvas';

const konvaNodeSpies = vi.hoisted(() => ({
  cache: vi.fn(),
  clearCache: vi.fn(),
  batchDraw: vi.fn(),
}));

vi.mock('../../animations/useAnimationClock', () => ({
  useAnimationClock: () => 375,
}));

vi.mock('react-konva', async () => {
  const React = await import('react');
  const { forwardRef, useImperativeHandle } = React;

  const createNode = (props: Record<string, unknown>) => {
    let scaleX = Number(props.scaleX ?? 1);
    let scaleY = Number(props.scaleY ?? 1);

    return {
      x: () => Number(props.x ?? 140),
      y: () => Number(props.y ?? 150),
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
      cache: konvaNodeSpies.cache,
      clearCache: konvaNodeSpies.clearCache,
      getLayer: () => ({ batchDraw: konvaNodeSpies.batchDraw }),
    };
  };

  type MockNode = ReturnType<typeof createNode>;
  type MockKonvaEvent = { target: MockNode };

  const MockText = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    const node = createNode(props);
    useImperativeHandle(ref, () => node);

    return (
      <button
        type="button"
        data-testid={`text-${String(props.id)}`}
        data-y={String(props.y ?? 0)}
        data-scale-x={String(props.scaleX ?? 1)}
        data-rotation={String(props.rotation ?? 0)}
        data-skew-x={String(props.skewX ?? 0)}
        data-skew-y={String(props.skewY ?? 0)}
        onClick={props.onClick as (() => void) | undefined}
        onDoubleClick={() => {
          const dragEvent: MockKonvaEvent = { target: node };
          (props.onDragStart as ((event: MockKonvaEvent) => void) | undefined)?.(dragEvent);
          (props.onDragEnd as ((event: MockKonvaEvent) => void) | undefined)?.(dragEvent);
        }}
      >
        {String(props.text ?? '')}
      </button>
    );
  });

  const MockImage = forwardRef<unknown, Record<string, unknown>>((props, ref) => {
    const node = createNode(props);
    useImperativeHandle(ref, () => node);
    const isChromaticGhost = props.name === 'animation-chromatic-ghost';

    return (
      <button
        type="button"
        data-testid={isChromaticGhost ? 'chromatic-ghost' : `image-${String(props.id)}`}
        data-filter-count={String(Array.isArray(props.filters) ? props.filters.length : 0)}
        data-brightness={String(props.brightness ?? '')}
        data-hue={String(props.hue ?? '')}
        data-blur-radius={String(props.blurRadius ?? '')}
        data-pixel-size={String(props.pixelSize ?? '')}
        data-skew-x={String(props.skewX ?? 0)}
        data-skew-y={String(props.skewY ?? 0)}
        data-opacity={String(props.opacity ?? 1)}
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

function installPassiveImageStub() {
  class PassiveImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 640;
    naturalHeight = 480;
    set src(_value: string) {}
  }

  Object.defineProperty(window, 'Image', {
    configurable: true,
    writable: true,
    value: PassiveImage,
  });
}

function installAutoLoadingImageStub() {
  class AutoLoadingImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 640;
    naturalHeight = 480;

    set src(_value: string) {
      this.onload?.();
    }
  }

  Object.defineProperty(window, 'Image', {
    configurable: true,
    writable: true,
    value: AutoLoadingImage,
  });
}

describe('EditorCanvas', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    konvaNodeSpies.cache.mockClear();
    konvaNodeSpies.clearCache.mockClear();
    konvaNodeSpies.batchDraw.mockClear();
    installPassiveImageStub();
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

  it('renders vertical stacked text from graphemes without mutating source text', () => {
    const textId = useEditorStore.getState().addText('A👨‍👩‍👧‍👦B');
    useEditorStore.getState().updateElement(textId, { writingMode: 'vertical-stacked' });

    render(<EditorCanvas />);

    expect(screen.getByTestId(`text-${textId}`).textContent).toBe('A\n👨‍👩‍👧‍👦\nB');
    expect(useEditorStore.getState().project.elements.find((item) => item.id === textId)).toMatchObject({
      type: 'text',
      text: 'A👨‍👩‍👧‍👦B',
      writingMode: 'vertical-stacked',
    });
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

  it('does not expose transform handles for a locked selected element', () => {
    const textId = useEditorStore.getState().addText('Kilitli');
    useEditorStore.getState().updateElement(textId, { locked: true });

    render(<EditorCanvas />);

    expect(useEditorStore.getState().selectedElementId).toBe(textId);
    expect(screen.queryByTestId('transformer')).not.toBeInTheDocument();
  });

  it('applies deterministic animation transforms to rendered text', () => {
    const textId = useEditorStore.getState().addText('Hareketli');
    useEditorStore.getState().setElementAnimation(textId, { preset: 'pulse' });

    render(<EditorCanvas />);

    expect(screen.getByTestId(`text-${textId}`)).not.toHaveAttribute('data-scale-x', '1');
  });

  it('renders the exact requested animation time during export', () => {
    const textId = useEditorStore.getState().addText('GIF');
    useEditorStore.getState().setElementAnimation(textId, { preset: 'float', speed: 'normal' });
    const element = useEditorStore.getState().project.elements.find((item) => item.id === textId);
    if (!element) throw new Error('fixture text missing');

    const { rerender } = render(<EditorCanvas timeOverrideMs={0} />);
    expect(Number(screen.getByTestId(`text-${textId}`).getAttribute('data-y'))).toBeCloseTo(element.y, 5);

    rerender(<EditorCanvas timeOverrideMs={400} />);
    expect(Number(screen.getByTestId(`text-${textId}`).getAttribute('data-y'))).toBeCloseTo(element.y + 10, 5);
  });

  it('maps effect values through Konva 10 and refreshes the image cache', async () => {
    installAutoLoadingImageStub();
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    useEditorStore.getState().setImageEffects(imageId, { brightness: 0.2 });

    render(<EditorCanvas />);

    await waitFor(() => expect(konvaNodeSpies.cache).toHaveBeenCalled());
    expect(screen.getByTestId(`image-${imageId}`)).toHaveAttribute('data-brightness', '1.2');

    konvaNodeSpies.cache.mockClear();
    act(() => {
      useEditorStore.getState().setImageEffects(imageId, { brightness: 0.4 });
    });
    await waitFor(() => expect(konvaNodeSpies.cache).toHaveBeenCalled());
    expect(screen.getByTestId(`image-${imageId}`)).toHaveAttribute('data-brightness', '1.4');

    act(() => {
      useEditorStore.getState().setImageEffects(imageId, { brightness: 0 });
    });
    await waitFor(() => expect(konvaNodeSpies.clearCache).toHaveBeenCalled());
    expect(screen.getByTestId(`image-${imageId}`)).toHaveAttribute('data-filter-count', '0');
  });

  it('passes active image effects to the Konva image filter pipeline', () => {
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    useEditorStore.getState().setImageEffects(imageId, { brightness: 0.2, grayscale: true });

    render(<EditorCanvas />);

    expect(Number(screen.getByTestId(`image-${imageId}`).getAttribute('data-filter-count'))).toBeGreaterThan(0);
  });

  it('applies skew animation channels without mutating persisted geometry', () => {
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    useEditorStore.getState().setElementAnimation(imageId, { preset: 'jello', intensity: 'strong' });
    const before = structuredClone(useEditorStore.getState().project);

    render(<EditorCanvas timeOverrideMs={375} />);

    expect(Math.abs(Number(screen.getByTestId(`image-${imageId}`).getAttribute('data-skew-x')))).toBeGreaterThan(0);
    expect(useEditorStore.getState().project).toEqual(before);
  });

  it('feeds focus and pixel animation channels into transient image effects', async () => {
    installAutoLoadingImageStub();
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    useEditorStore.getState().setElementAnimation(imageId, { preset: 'focus-pulse', intensity: 'strong' });

    const { rerender } = render(<EditorCanvas timeOverrideMs={375} />);
    await waitFor(() => expect(Number(screen.getByTestId(`image-${imageId}`).getAttribute('data-blur-radius'))).toBeGreaterThan(0));

    act(() => {
      useEditorStore.getState().setElementAnimation(imageId, { preset: 'pixel-pulse', intensity: 'strong' });
    });
    rerender(<EditorCanvas timeOverrideMs={375} />);
    await waitFor(() => expect(Number(screen.getByTestId(`image-${imageId}`).getAttribute('data-pixel-size'))).toBeGreaterThan(0));
  });

  it('renders reveal progress without changing stored opacity', () => {
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    useEditorStore.getState().setElementAnimation(imageId, { preset: 'reveal', loop: false });
    const before = structuredClone(useEditorStore.getState().project);

    render(<EditorCanvas timeOverrideMs={400} />);

    expect(Number(screen.getByTestId(`image-${imageId}`).getAttribute('data-opacity'))).toBeLessThan(1);
    expect(useEditorStore.getState().project).toEqual(before);
  });

  it('renders chromatic animation helper layers without persisting extra elements', () => {
    const imageId = useEditorStore.getState().addImage('blob:fixture', 640, 480);
    useEditorStore.getState().setElementAnimation(imageId, { preset: 'glitch-rgb', intensity: 'strong' });
    const elementCount = useEditorStore.getState().project.elements.length;

    render(<EditorCanvas timeOverrideMs={375} />);

    expect(screen.getAllByTestId('chromatic-ghost')).toHaveLength(2);
    expect(useEditorStore.getState().project.elements).toHaveLength(elementCount);
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

    act(() => {
      useEditorStore.getState().undo();
    });

    expect(useEditorStore.getState().project).toEqual(before);
  });
});

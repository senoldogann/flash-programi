import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './editor-store';

describe('editor store history', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('adds a text element with a neutral animation and selects it', () => {
    const id = useEditorStore.getState().addText('SevDa');
    const state = useEditorStore.getState();

    expect(state.selectedElementId).toBe(id);
    expect(state.project.elements).toHaveLength(1);
    expect(state.project.elements[0]).toMatchObject({
      id,
      type: 'text',
      text: 'SevDa',
      animation: { preset: 'none', speed: 'normal', delayMs: 0, loop: true },
    });
  });

  it('adds an image with neutral effects', () => {
    const id = useEditorStore.getState().addImage('blob:test-image', 1200, 600);
    const element = useEditorStore.getState().project.elements.find((item) => item.id === id);

    expect(element).toMatchObject({
      type: 'image',
      animation: { preset: 'none' },
      effects: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blurRadius: 0,
        grayscale: false,
        sepia: false,
      },
    });
    expect(element?.width).toBeLessThanOrEqual(270);
    expect(element?.height).toBeLessThanOrEqual(270);
    expect((element?.width ?? 0) / (element?.height ?? 1)).toBeCloseTo(2);
  });

  it('updates rich settings as undoable mutations', () => {
    const imageId = useEditorStore.getState().addImage('blob:test-image', 300, 300);
    const historyBefore = useEditorStore.getState().past.length;

    useEditorStore.getState().setElementAnimation(imageId, { preset: 'pulse', speed: 'fast' });
    useEditorStore.getState().setImageEffects(imageId, { grayscale: true, brightness: 0.25 });
    const decorationId = useEditorStore.getState().addDecoration('stars');
    useEditorStore.getState().setFrame('neon', 10);

    const state = useEditorStore.getState();
    const image = state.project.elements.find((item) => item.id === imageId);
    expect(image).toMatchObject({
      animation: { preset: 'pulse', speed: 'fast' },
      effects: { grayscale: true, brightness: 0.25 },
    });
    expect(state.project.decorations[0]).toMatchObject({ id: decorationId, preset: 'stars' });
    expect(state.project.frame).toEqual({ preset: 'neon', width: 10 });
    expect(state.past.length).toBe(historyBefore + 4);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().project.frame.preset).toBe('none');
  });

  it('undoes and redoes a completed text mutation', () => {
    const id = useEditorStore.getState().addText('SevDa');
    const originalX = useEditorStore.getState().project.elements[0].x;

    useEditorStore.getState().updateElement(id, { x: 140 });
    expect(useEditorStore.getState().project.elements[0].x).toBe(140);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().project.elements[0].x).toBe(originalX);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().project.elements[0].x).toBe(140);
  });

  it('selection changes do not create history entries', () => {
    const id = useEditorStore.getState().addText('Test');
    const before = useEditorStore.getState().past.length;

    useEditorStore.getState().selectElement(null);
    useEditorStore.getState().selectElement(id);

    expect(useEditorStore.getState().past).toHaveLength(before);
  });

  it('records a live transform as one history action when committed', () => {
    const id = useEditorStore.getState().addText('Hareket');
    const beforeTransform = structuredClone(useEditorStore.getState().project);
    const historyBefore = useEditorStore.getState().past.length;

    useEditorStore.getState().updateElement(id, { x: 120 }, { recordHistory: false });
    useEditorStore.getState().updateElement(id, { x: 160, y: 90 }, { recordHistory: false });
    const afterTransform = structuredClone(useEditorStore.getState().project);
    useEditorStore.getState().commitTransform(beforeTransform, afterTransform);

    expect(useEditorStore.getState().past).toHaveLength(historyBefore + 1);
    expect(useEditorStore.getState().project.elements[0]).toMatchObject({ x: 160, y: 90 });

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().project.elements[0]).toMatchObject({
      x: beforeTransform.elements[0].x,
      y: beforeTransform.elements[0].y,
    });
  });
});

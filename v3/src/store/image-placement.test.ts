import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './editor-store';

describe('image placement actions', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('contains the whole photo inside the canvas when fitted', () => {
    const id = useEditorStore.getState().addImage('blob:portrait', 800, 1200);

    useEditorStore.getState().fitImageToCanvas(id, 'contain');

    const image = useEditorStore.getState().project.elements.find((item) => item.id === id);
    expect(image).toMatchObject({ type: 'image' });
    expect(image?.width).toBeLessThanOrEqual(300);
    expect(image?.height).toBeLessThanOrEqual(300);
    expect((image?.width ?? 0) / (image?.height ?? 1)).toBeCloseTo(2 / 3, 5);
    expect(image?.x).toBeCloseTo((300 - (image?.width ?? 0)) / 2, 5);
    expect(image?.y).toBeCloseTo((300 - (image?.height ?? 0)) / 2, 5);
  });

  it('fills the canvas while preserving image aspect ratio when cover is requested', () => {
    const id = useEditorStore.getState().addImage('blob:portrait', 800, 1200);

    useEditorStore.getState().fitImageToCanvas(id, 'cover');

    const image = useEditorStore.getState().project.elements.find((item) => item.id === id);
    expect(image).toMatchObject({ type: 'image' });
    expect(image?.width).toBeGreaterThanOrEqual(300);
    expect(image?.height).toBeGreaterThanOrEqual(300);
    expect((image?.width ?? 0) / (image?.height ?? 1)).toBeCloseTo(2 / 3, 5);
  });

  it('centers an image without changing its current size', () => {
    const id = useEditorStore.getState().addImage('blob:landscape', 1200, 600);
    useEditorStore.getState().updateElement(id, { x: 12, y: 20, width: 240, height: 120 });

    useEditorStore.getState().fitImageToCanvas(id, 'center');

    const image = useEditorStore.getState().project.elements.find((item) => item.id === id);
    expect(image).toMatchObject({ width: 240, height: 120, x: 30, y: 90 });
  });
});

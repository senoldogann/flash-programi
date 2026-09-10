import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../store/editor-store';

describe('Classic recipe store integration', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('applies one complete recipe as exactly one undoable project mutation', () => {
    useEditorStore.getState().addText('SENOL');
    const before = structuredClone(useEditorStore.getState().project);
    const historyBefore = useEditorStore.getState().past.length;

    useEditorStore.getState().applyClassicRecipe('altin-doner-nick');

    const applied = useEditorStore.getState();
    expect(applied.project).toMatchObject({
      width: 133,
      height: 33,
      frame: { preset: 'gold' },
    });
    expect(applied.project.decorations.length).toBeGreaterThan(0);
    expect(applied.past).toHaveLength(historyBefore + 1);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().project).toEqual(before);
  });
});

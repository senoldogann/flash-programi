import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../store/editor-store';

describe('Neo recipe store integration', () => {
  beforeEach(() => useEditorStore.getState().reset());

  it('applies one Neo recipe as one undoable mutation', () => {
    const before = structuredClone(useEditorStore.getState().project);

    useEditorStore.getState().applyNeoRecipe('neon-night');
    const applied = useEditorStore.getState();

    expect(applied.project.mode).toBe('neo');
    expect(applied.project.elements.some((element) =>
      element.type === 'text' && element.materialPreset === 'neo-neon',
    )).toBe(true);
    expect(applied.past).toHaveLength(1);

    applied.undo();
    expect(useEditorStore.getState().project).toEqual(before);
  });
});

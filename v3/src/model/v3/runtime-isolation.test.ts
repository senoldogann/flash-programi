import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { migrateProjectToV3 } from './migrate-to-v3';

describe('Project V3 runtime isolation', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('keeps the current editor runtime on V2 while V3 conversion stays opt-in', () => {
    const before = structuredClone(useEditorStore.getState().project);

    expect(before.version).toBe(2);
    expect('layers' in before).toBe(false);

    const migrated = migrateProjectToV3(before);

    expect(migrated.version).toBe(3);
    expect(migrated.id).toBe(before.id);

    const after = useEditorStore.getState().project;
    expect(after.version).toBe(2);
    expect('layers' in after).toBe(false);
    expect(after).toEqual(before);
  });
});

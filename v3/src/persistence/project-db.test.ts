// @vitest-environment node
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDefaultAnimation,
  createDefaultImageEffects,
  createEmptyProject,
  type ImageElement,
} from '../model/project';
import {
  clearCurrentProject,
  loadCurrentProject,
  saveCurrentProject,
} from './project-db';

function createImageElement(assetUrl: string): ImageElement {
  return {
    id: 'image-1',
    type: 'image',
    name: 'Fotoğraf',
    assetUrl,
    x: 20,
    y: 30,
    width: 120,
    height: 90,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    animation: createDefaultAnimation(),
    effects: createDefaultImageEffects(),
  };
}

describe('project IndexedDB persistence', () => {
  beforeEach(async () => {
    await clearCurrentProject();
  });

  it('persists and restores a project without images', async () => {
    const project = createEmptyProject();
    project.name = 'Kaydedilen Tasarım';
    project.background = '#220044';

    await saveCurrentProject(project);
    const restored = await loadCurrentProject();

    expect(restored?.project).toEqual(project);
  });

  it('stores image blobs and recreates runtime object URLs on restore', async () => {
    const project = createEmptyProject();
    project.elements = [createImageElement('blob:runtime-image')];
    const imageBlob = new Blob(['image-bytes'], { type: 'image/png' });
    const resolveAsset = vi.fn(async () => imageBlob);
    const createObjectUrl = vi.fn(() => 'blob:restored-image');
    const revokeObjectUrl = vi.fn();

    await saveCurrentProject(project, { resolveAsset });
    const restored = await loadCurrentProject({ createObjectUrl, revokeObjectUrl });

    expect(resolveAsset).toHaveBeenCalledWith('blob:runtime-image');
    expect(restored?.project.elements[0]).toMatchObject({
      id: 'image-1',
      type: 'image',
      assetUrl: 'blob:restored-image',
    });
    expect(createObjectUrl).toHaveBeenCalledWith(imageBlob);

    restored?.dispose();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:restored-image');
  });

  it('does not let an older in-flight save resurrect a project after clear', async () => {
    const project = createEmptyProject();
    project.elements = [createImageElement('blob:slow-image')];
    const imageBlob = new Blob(['slow-image-bytes'], { type: 'image/png' });

    let signalResolveStarted!: () => void;
    let releaseAsset!: (blob: Blob) => void;
    const resolveStarted = new Promise<void>((resolve) => {
      signalResolveStarted = resolve;
    });
    const assetPromise = new Promise<Blob>((resolve) => {
      releaseAsset = resolve;
    });
    const resolveAsset = vi.fn(async () => {
      signalResolveStarted();
      return assetPromise;
    });

    const staleSave = saveCurrentProject(project, { resolveAsset });
    await resolveStarted;

    await clearCurrentProject();
    releaseAsset(imageBlob);
    await staleSave;

    expect(await loadCurrentProject()).toBeNull();
  });

  it('returns null when there is no saved project', async () => {
    expect(await loadCurrentProject()).toBeNull();
  });
});

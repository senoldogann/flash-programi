import { describe, expect, it, vi } from 'vitest';
import { captureStagePng } from './png';

function createStage(scale = 0.5) {
  const transformer = {
    hide: vi.fn(),
    show: vi.fn(),
    getLayer: () => ({ batchDraw: vi.fn() }),
  };

  const stage = {
    scaleX: () => scale,
    find: vi.fn(() => [transformer]),
    toDataURL: vi.fn(() => 'data:image/png;base64,fixture'),
  };

  return { stage, transformer };
}

describe('PNG export', () => {
  it('captures at logical project resolution regardless of preview scale', () => {
    const { stage } = createStage(0.5);

    const dataUrl = captureStagePng(stage);

    expect(dataUrl).toBe('data:image/png;base64,fixture');
    expect(stage.toDataURL).toHaveBeenCalledWith({
      mimeType: 'image/png',
      pixelRatio: 2,
    });
  });

  it('hides selection transformers only while the image is captured', () => {
    const { stage, transformer } = createStage(1);

    captureStagePng(stage);

    expect(stage.find).toHaveBeenCalledWith('.selection-transformer');
    expect(transformer.hide).toHaveBeenCalledTimes(1);
    expect(transformer.show).toHaveBeenCalledTimes(1);
    expect(transformer.hide.mock.invocationCallOrder[0]).toBeLessThan(
      stage.toDataURL.mock.invocationCallOrder[0],
    );
    expect(stage.toDataURL.mock.invocationCallOrder[0]).toBeLessThan(
      transformer.show.mock.invocationCallOrder[0],
    );
  });

  it('restores selection transformers even when capture fails', () => {
    const { stage, transformer } = createStage(1);
    stage.toDataURL.mockImplementation(() => {
      throw new Error('capture failed');
    });

    expect(() => captureStagePng(stage)).toThrow('capture failed');
    expect(transformer.show).toHaveBeenCalledTimes(1);
  });
});

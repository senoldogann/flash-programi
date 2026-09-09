import { describe, expect, it, vi } from 'vitest';
import { captureStageCanvas, captureStagePng } from './png';

function createStage(scale = 0.5) {
  const transformer = {
    hide: vi.fn(),
    show: vi.fn(),
    getLayer: () => ({ batchDraw: vi.fn() }),
  };
  const canvas = document.createElement('canvas');

  const stage = {
    scaleX: () => scale,
    find: vi.fn(() => [transformer]),
    toDataURL: vi.fn(() => 'data:image/png;base64,fixture'),
    toCanvas: vi.fn(() => canvas),
  };

  return { stage, transformer, canvas };
}

describe('PNG and frame capture', () => {
  it('captures PNG at logical project resolution regardless of preview scale', () => {
    const { stage } = createStage(0.5);

    const dataUrl = captureStagePng(stage);

    expect(dataUrl).toBe('data:image/png;base64,fixture');
    expect(stage.toDataURL).toHaveBeenCalledWith({
      mimeType: 'image/png',
      pixelRatio: 2,
    });
  });

  it('captures PNG at the requested export scale independently of preview scale', () => {
    const { stage } = createStage(0.5);

    captureStagePng(stage, 2);

    expect(stage.toDataURL).toHaveBeenCalledWith({
      mimeType: 'image/png',
      pixelRatio: 4,
    });
  });

  it('captures a logical-resolution canvas for animation frames', () => {
    const { stage, canvas } = createStage(0.4);

    expect(captureStageCanvas(stage)).toBe(canvas);
    expect(stage.toCanvas).toHaveBeenCalledWith({ pixelRatio: 2.5 });
  });

  it('captures animation frame canvases at the requested export scale', () => {
    const { stage, canvas } = createStage(0.4);

    expect(captureStageCanvas(stage, 3)).toBe(canvas);
    expect(stage.toCanvas).toHaveBeenCalledWith({ pixelRatio: 7.5 });
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

  it('hides selection transformers while a GIF frame canvas is captured', () => {
    const { stage, transformer } = createStage(1);

    captureStageCanvas(stage);

    expect(transformer.hide).toHaveBeenCalledTimes(1);
    expect(transformer.show).toHaveBeenCalledTimes(1);
    expect(transformer.hide.mock.invocationCallOrder[0]).toBeLessThan(
      stage.toCanvas.mock.invocationCallOrder[0],
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

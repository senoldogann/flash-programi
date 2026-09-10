import { describe, expect, it } from 'vitest';
import { processGifFramePixels } from './gif-color-profile';

describe('Classic GIF color profiles', () => {
  it('keeps adaptive pixels unchanged without mutating the source buffer', () => {
    const source = new Uint8ClampedArray([17, 93, 241, 127]);
    const before = new Uint8ClampedArray(source);

    const result = processGifFramePixels(source, 1, 1, 'adaptive', 'none');

    expect(result).toEqual(before);
    expect(source).toEqual(before);
    expect(result).not.toBe(source);
  });

  it('quantizes Classic 64 to four RGB levels while preserving alpha', () => {
    const source = new Uint8ClampedArray([
      10, 70, 130, 33,
      190, 230, 255, 240,
    ]);

    const result = processGifFramePixels(source, 2, 1, 'classic-64', 'none');

    expect(Array.from(result)).toEqual([
      0, 85, 170, 33,
      170, 255, 255, 240,
    ]);
  });

  it('quantizes Classic 27 to three RGB levels while preserving alpha', () => {
    const result = processGifFramePixels(
      new Uint8ClampedArray([20, 100, 190, 201]),
      1,
      1,
      'classic-27',
      'none',
    );

    expect(Array.from(result)).toEqual([0, 128, 128, 201]);
  });

  it('applies deterministic ordered 4x4 dithering without mutating input pixels', () => {
    const source = new Uint8ClampedArray(4 * 4 * 4);
    for (let index = 0; index < source.length; index += 4) {
      source[index] = 100;
      source[index + 1] = 100;
      source[index + 2] = 100;
      source[index + 3] = 255;
    }
    const before = new Uint8ClampedArray(source);

    const first = processGifFramePixels(source, 4, 4, 'classic-64', 'ordered-4x4');
    const second = processGifFramePixels(source, 4, 4, 'classic-64', 'ordered-4x4');
    const redLevels = new Set(Array.from(first).filter((_, index) => index % 4 === 0));

    expect(first).toEqual(second);
    expect(source).toEqual(before);
    expect(redLevels.size).toBeGreaterThan(1);
  });

  it('rejects pixel buffers whose size does not match the frame dimensions', () => {
    expect(() => processGifFramePixels(
      new Uint8ClampedArray([1, 2, 3, 4]),
      2,
      2,
      'classic-64',
      'none',
    )).toThrow('GIF_FRAME_PIXEL_SIZE_MISMATCH');
  });
});

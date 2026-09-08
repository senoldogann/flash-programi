import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES, validateImageFile } from './image-loader';

describe('validateImageFile', () => {
  it('rejects non-image files', () => {
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });

    expect(() => validateImageFile(file)).toThrow(/resim dosyası/i);
  });

  it('rejects unsupported image formats', () => {
    const file = new File(['<svg />'], 'vector.svg', { type: 'image/svg+xml' });

    expect(() => validateImageFile(file)).toThrow(/PNG, JPG, WebP veya GIF/i);
  });

  it('rejects files larger than 20 MB without allocating a giant fixture', () => {
    const file = new File([], 'huge.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: MAX_IMAGE_BYTES + 1 });

    expect(() => validateImageFile(file)).toThrow(/20 MB/i);
  });

  it('accepts supported image files inside the size limit', () => {
    const file = new File(['png'], 'avatar.png', { type: 'image/png' });

    expect(() => validateImageFile(file)).not.toThrow();
  });
});

import type { GifDitherProfile, GifPaletteProfile } from '../model/project';

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function quantizeChannel(value: number, levels: number): number {
  const steps = levels - 1;
  return Math.round((clampByte(value) / 255) * steps) * (255 / steps);
}

function paletteLevels(profile: GifPaletteProfile): number | null {
  if (profile === 'classic-64') return 4;
  if (profile === 'classic-27') return 3;
  return null;
}

export function processGifFramePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: GifPaletteProfile,
  dither: GifDitherProfile,
): Uint8ClampedArray {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('GIF_FRAME_DIMENSIONS_INVALID');
  }
  if (data.length !== width * height * 4) {
    throw new Error('GIF_FRAME_PIXEL_SIZE_MISMATCH');
  }

  const output = new Uint8ClampedArray(data);
  const levels = paletteLevels(palette);
  if (levels === null) return output;

  const step = 255 / (levels - 1);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = (y * width + x) * 4;
      const ditherOffset = dither === 'ordered-4x4'
        ? ((BAYER_4X4[y % 4][x % 4] + 0.5) / 16 - 0.5) * step
        : 0;

      output[pixel] = quantizeChannel(data[pixel] + ditherOffset, levels);
      output[pixel + 1] = quantizeChannel(data[pixel + 1] + ditherOffset, levels);
      output[pixel + 2] = quantizeChannel(data[pixel + 2] + ditherOffset, levels);
      output[pixel + 3] = data[pixel + 3];
    }
  }

  return output;
}

export function processGifFrameCanvas(
  frame: HTMLCanvasElement,
  palette: GifPaletteProfile,
  dither: GifDitherProfile,
): HTMLCanvasElement {
  if (palette === 'adaptive') return frame;

  const sourceContext = frame.getContext('2d');
  if (!sourceContext) throw new Error('GIF_FRAME_CONTEXT_UNAVAILABLE');

  const output = document.createElement('canvas');
  output.width = frame.width;
  output.height = frame.height;
  const outputContext = output.getContext('2d');
  if (!outputContext) throw new Error('GIF_FRAME_CONTEXT_UNAVAILABLE');

  const imageData = sourceContext.getImageData(0, 0, frame.width, frame.height);
  const processed = processGifFramePixels(imageData.data, frame.width, frame.height, palette, dither);
  imageData.data.set(processed);
  outputContext.putImageData(imageData, 0, 0);
  return output;
}

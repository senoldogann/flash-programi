import { describe, expect, it } from 'vitest';
import { fitPreviewBox } from './preview-fit';

describe('fitPreviewBox', () => {
  it('fits a square canvas into both the available width and height', () => {
    expect(fitPreviewBox(900, 520, 300, 300, 16, 760)).toEqual({
      width: 488,
      height: 488,
      scale: 488 / 300,
    });
  });

  it('fits a wide canvas without overflowing the available width', () => {
    const result = fitPreviewBox(720, 520, 600, 200, 16, 760);

    expect(result.width).toBe(688);
    expect(result.height).toBeCloseTo(688 / 3, 5);
    expect(result.width / result.height).toBeCloseTo(3, 5);
  });

  it('fits a tall canvas without overflowing the available height', () => {
    const result = fitPreviewBox(720, 520, 200, 600, 16, 760);

    expect(result.height).toBe(488);
    expect(result.width).toBeCloseTo(488 / 3, 5);
    expect(result.height / result.width).toBeCloseTo(3, 5);
  });
});

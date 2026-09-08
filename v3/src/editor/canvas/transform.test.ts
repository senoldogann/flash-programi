import { describe, expect, it } from 'vitest';
import { normalizeTransform, type TransformGeometry } from './transform';

const previous: TransformGeometry = {
  x: 10,
  y: 15,
  width: 100,
  height: 50,
  rotation: 0,
};

describe('normalizeTransform', () => {
  it('folds Konva scale into persisted width and height', () => {
    expect(
      normalizeTransform(
        {
          x: 20,
          y: 30,
          width: 100,
          height: 50,
          scaleX: 1.5,
          scaleY: 2,
          rotation: 15,
        },
        previous,
      ),
    ).toEqual({
      x: 20,
      y: 30,
      width: 150,
      height: 100,
      rotation: 15,
    });
  });

  it('clamps transformed dimensions to a usable minimum', () => {
    const result = normalizeTransform(
      {
        x: 0,
        y: 0,
        width: 5,
        height: 5,
        scaleX: 0.1,
        scaleY: 0.1,
        rotation: 0,
      },
      previous,
    );

    expect(result.width).toBe(8);
    expect(result.height).toBe(8);
  });

  it('returns the previous persisted geometry instead of storing non-finite values', () => {
    const result = normalizeTransform(
      {
        x: Number.NaN,
        y: 20,
        width: 100,
        height: 50,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
      previous,
    );

    expect(result).toEqual(previous);
  });
});

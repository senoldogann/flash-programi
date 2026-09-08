export const MIN_ELEMENT_SIZE = 8;

export type TransformGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type RawTransformGeometry = TransformGeometry & {
  scaleX: number;
  scaleY: number;
};

function isFiniteGeometry(input: RawTransformGeometry): boolean {
  return [
    input.x,
    input.y,
    input.width,
    input.height,
    input.rotation,
    input.scaleX,
    input.scaleY,
  ].every(Number.isFinite);
}

export function normalizeTransform(
  input: RawTransformGeometry,
  previous: TransformGeometry,
): TransformGeometry {
  if (!isFiniteGeometry(input)) {
    return { ...previous };
  }

  const width = Math.max(MIN_ELEMENT_SIZE, Math.abs(input.width * input.scaleX));
  const height = Math.max(MIN_ELEMENT_SIZE, Math.abs(input.height * input.scaleY));

  if (![width, height].every(Number.isFinite)) {
    return { ...previous };
  }

  return {
    x: input.x,
    y: input.y,
    width,
    height,
    rotation: input.rotation,
  };
}

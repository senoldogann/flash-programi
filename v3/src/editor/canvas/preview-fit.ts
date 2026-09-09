export type PreviewBox = {
  width: number;
  height: number;
  scale: number;
};

export function fitPreviewBox(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  padding = 16,
  maxEdge = 760,
): PreviewBox {
  const safeCanvasWidth = Math.max(1, canvasWidth);
  const safeCanvasHeight = Math.max(1, canvasHeight);
  const availableWidth = Math.max(1, containerWidth - padding * 2);
  const availableHeight = Math.max(1, containerHeight - padding * 2);
  const maxScale = Math.min(maxEdge / safeCanvasWidth, maxEdge / safeCanvasHeight);
  const scale = Math.max(
    0.01,
    Math.min(
      availableWidth / safeCanvasWidth,
      availableHeight / safeCanvasHeight,
      maxScale,
    ),
  );

  return {
    width: safeCanvasWidth * scale,
    height: safeCanvasHeight * scale,
    scale,
  };
}

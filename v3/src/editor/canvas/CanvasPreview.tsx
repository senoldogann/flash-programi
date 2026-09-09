import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fitPreviewBox, type PreviewBox } from './preview-fit';

type CanvasPreviewProps = {
  canvasWidth: number;
  canvasHeight: number;
  children: ReactNode;
};

function initialPreviewBox(canvasWidth: number, canvasHeight: number): PreviewBox {
  const maxEdge = 560;
  const scale = Math.min(maxEdge / Math.max(1, canvasWidth), maxEdge / Math.max(1, canvasHeight), 1.8);
  return {
    width: canvasWidth * scale,
    height: canvasHeight * scale,
    scale,
  };
}

export function CanvasPreview({ canvasWidth, canvasHeight, children }: CanvasPreviewProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const initial = useMemo(
    () => initialPreviewBox(canvasWidth, canvasHeight),
    [canvasHeight, canvasWidth],
  );
  const [box, setBox] = useState<PreviewBox>(initial);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    const measure = () => {
      const width = zone.clientWidth;
      const height = zone.clientHeight;
      if (width <= 0 || height <= 0) {
        setBox(initialPreviewBox(canvasWidth, canvasHeight));
        return;
      }
      setBox(fitPreviewBox(width, height, canvasWidth, canvasHeight, 18, 760));
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(zone);
    return () => observer.disconnect();
  }, [canvasHeight, canvasWidth]);

  return (
    <div ref={zoneRef} className="canvas-zone" data-testid="canvas-zone">
      <div
        className="canvas-card"
        aria-label="Tasarım alanı"
        data-preview-scale={box.scale.toFixed(4)}
        style={{ width: `${box.width}px`, height: `${box.height}px` }}
      >
        {children}
      </div>
    </div>
  );
}

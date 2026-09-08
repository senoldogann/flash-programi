export type ExportTransformer = {
  hide(): void;
  show(): void;
  getLayer?: () => { batchDraw?: () => void } | null;
};

export type ExportableStage = {
  scaleX(): number;
  find(selector: string): ExportTransformer[];
  toDataURL(options: { mimeType: 'image/png'; pixelRatio: number }): string;
};

function safePreviewScale(stage: ExportableStage): number {
  const scale = stage.scaleX();
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

export function captureStagePng(stage: ExportableStage): string {
  const transformers = stage.find('.selection-transformer');

  for (const transformer of transformers) {
    transformer.hide();
  }

  try {
    return stage.toDataURL({
      mimeType: 'image/png',
      pixelRatio: 1 / safePreviewScale(stage),
    });
  } finally {
    for (const transformer of transformers) {
      transformer.show();
      transformer.getLayer?.()?.batchDraw?.();
    }
  }
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.click();
}

export function downloadStagePng(
  stage: ExportableStage,
  filename = 'flash-nick.png',
): string {
  const dataUrl = captureStagePng(stage);
  downloadDataUrl(dataUrl, filename);
  return dataUrl;
}

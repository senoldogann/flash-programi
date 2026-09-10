import './export-actions.css';

type ExportActionsProps = {
  onGifExport?: () => void;
  onPngExport?: () => void;
  gifExporting?: boolean;
  gifProgress?: number;
  disabled?: boolean;
};

export function ExportActions({
  onGifExport,
  onPngExport,
  gifExporting = false,
  gifProgress = 0,
  disabled = false,
}: ExportActionsProps) {
  const progressPercent = Math.max(0, Math.min(100, Math.round(gifProgress * 100)));
  const actionsDisabled = disabled || gifExporting;

  return (
    <div className="export-actions" aria-label="Dışa aktarma işlemleri">
      <button
        type="button"
        className="export-action-secondary"
        aria-label="PNG İndir"
        disabled={actionsDisabled || !onPngExport}
        onClick={onPngExport}
      >
        <span aria-hidden="true">▧</span>
        <span>PNG Olarak İndir</span>
      </button>

      <button
        type="button"
        className="export-action-primary"
        aria-label="GIF İndir"
        disabled={actionsDisabled || !onGifExport}
        onClick={onGifExport}
      >
        <span aria-hidden="true">↓</span>
        <span>{gifExporting ? `GIF Hazırlanıyor %${progressPercent}` : 'GIF Olarak İndir'}</span>
      </button>

      <span className="export-action-status" role="status" aria-live="polite">
        {gifExporting ? `GIF hazırlanıyor, yüzde ${progressPercent}` : 'GIF ve PNG dışa aktarma hazır'}
      </span>
    </div>
  );
}

type PlaybackStripProps = {
  durationMs: number;
  fps: number;
  valueMs: number;
  onChange: (valueMs: number) => void;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  disabled?: boolean;
};

function clampPreviewTime(valueMs: number, durationMs: number): number {
  if (!Number.isFinite(valueMs)) return 0;
  return Math.min(Math.max(0, valueMs), Math.max(0, durationMs));
}

function formatPreviewTime(valueMs: number): string {
  const totalSeconds = Math.max(0, valueMs) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
}

export function PlaybackStrip({
  durationMs,
  fps,
  valueMs,
  onChange,
  playing,
  onPlayingChange,
  disabled = false,
}: PlaybackStripProps) {
  const safeDuration = Math.max(0, Math.round(durationMs));
  const safeFps = Math.max(1, Math.round(fps));
  const safeValue = clampPreviewTime(valueMs, safeDuration);
  const frameStepMs = Math.max(1, Math.round(1000 / safeFps));

  return (
    <div className="playback-strip" aria-label="Önizleme oynatma">
      <button
        type="button"
        className="playback-toggle"
        aria-label={playing ? 'Önizlemeyi Durdur' : 'Önizlemeyi Oynat'}
        onClick={() => onPlayingChange(!playing)}
        disabled={disabled}
      >
        <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
      </button>

      <span className="playback-time" aria-hidden="true">{formatPreviewTime(safeValue)}</span>
      <input
        type="range"
        min={0}
        max={safeDuration}
        step={frameStepMs}
        value={safeValue}
        aria-label="Önizleme zamanı"
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        disabled={disabled || safeDuration === 0}
      />
      <span className="playback-time playback-duration" aria-hidden="true">{formatPreviewTime(safeDuration)}</span>
      <span className="playback-fps">{safeFps} FPS</span>
    </div>
  );
}

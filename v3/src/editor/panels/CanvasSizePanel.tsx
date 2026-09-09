import { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editor-store';

const SIZE_PRESETS = [
  [300, 100],
  [350, 120],
  [450, 150],
  [600, 200],
  [150, 150],
  [200, 200],
  [300, 300],
] as const;

export function CanvasSizePanel() {
  const width = useEditorStore((state) => state.project.width);
  const height = useEditorStore((state) => state.project.height);
  const resizeProject = useEditorStore((state) => state.resizeProject);
  const [customOpen, setCustomOpen] = useState(false);
  const [draftWidth, setDraftWidth] = useState(String(width));
  const [draftHeight, setDraftHeight] = useState(String(height));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customOpen) return;
    setDraftWidth(String(width));
    setDraftHeight(String(height));
  }, [customOpen, height, width]);

  const applySize = (nextWidth: number, nextHeight: number) => {
    try {
      resizeProject(nextWidth, nextHeight);
      setError(null);
      setDraftWidth(String(nextWidth));
      setDraftHeight(String(nextHeight));
    } catch (resizeError) {
      setError(resizeError instanceof Error ? resizeError.message : 'Tuval boyutu geçersiz.');
    }
  };

  const applyCustom = () => {
    applySize(Number(draftWidth), Number(draftHeight));
  };

  return (
    <section className="canvas-size-panel" aria-label="Tuval boyutu ayarları">
      <div className="canvas-size-heading">
        <span>Tuval Boyutu</span>
        <strong>{width} × {height}</strong>
      </div>

      <div className="canvas-size-presets" aria-label="Tuval boyutu hazır seçenekleri">
        {SIZE_PRESETS.map(([presetWidth, presetHeight]) => (
          <button
            key={`${presetWidth}x${presetHeight}`}
            type="button"
            className={width === presetWidth && height === presetHeight ? 'selected' : ''}
            aria-pressed={width === presetWidth && height === presetHeight}
            onClick={() => {
              setCustomOpen(false);
              applySize(presetWidth, presetHeight);
            }}
          >
            {presetWidth} × {presetHeight}
          </button>
        ))}
        <button
          type="button"
          className={customOpen ? 'selected' : ''}
          aria-pressed={customOpen}
          onClick={() => {
            setCustomOpen(true);
            setDraftWidth(String(width));
            setDraftHeight(String(height));
            setError(null);
          }}
        >
          Özel
        </button>
      </div>

      {customOpen ? (
        <div className="canvas-size-custom">
          <label>
            <span>Genişlik</span>
            <input
              aria-label="Özel genişlik"
              type="number"
              min="32"
              max="4096"
              step="1"
              value={draftWidth}
              onChange={(event) => setDraftWidth(event.target.value)}
            />
          </label>
          <span aria-hidden="true">×</span>
          <label>
            <span>Yükseklik</span>
            <input
              aria-label="Özel yükseklik"
              type="number"
              min="32"
              max="4096"
              step="1"
              value={draftHeight}
              onChange={(event) => setDraftHeight(event.target.value)}
            />
          </label>
          <button type="button" onClick={applyCustom}>Özel Boyutu Uygula</button>
        </div>
      ) : null}

      {error ? <div className="canvas-size-error" role="alert">{error}</div> : null}
    </section>
  );
}

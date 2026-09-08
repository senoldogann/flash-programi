import { createDefaultImageEffects } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';

export function EffectsPanel() {
  const selectedElement = useEditorStore((state) =>
    state.project.elements.find((element) => element.id === state.selectedElementId) ?? null,
  );
  const setImageEffects = useEditorStore((state) => state.setImageEffects);
  const beginHistoryBatch = useEditorStore((state) => state.beginHistoryBatch);
  const endHistoryBatch = useEditorStore((state) => state.endHistoryBatch);
  const image = selectedElement?.type === 'image' ? selectedElement : null;
  const effects = image?.effects ?? createDefaultImageEffects();
  const disabled = image === null;

  const update = (patch: Parameters<typeof setImageEffects>[1]) => {
    if (image) setImageEffects(image.id, patch);
  };

  const continuousEditProps = {
    onFocus: beginHistoryBatch,
    onBlur: endHistoryBatch,
  };

  return (
    <div className="preset-panel" aria-label="Fotoğraf efektleri">
      <div className="panel-title-row">
        <div>
          <strong>Fotoğraf Efektleri</strong>
          <small>{image ? 'Değişiklikler anında tuvalde görünür.' : 'Önce tuvalde bir fotoğraf seç.'}</small>
        </div>
        <button
          type="button"
          className="mini-action"
          disabled={disabled}
          onClick={() => update(createDefaultImageEffects())}
        >
          Sıfırla
        </button>
      </div>

      <label className="compact-control">
        <span>Parlaklık</span>
        <div className="range-row">
          <input
            aria-label="Parlaklık"
            type="range"
            min="-1"
            max="1"
            step="0.05"
            disabled={disabled}
            value={effects.brightness}
            {...continuousEditProps}
            onChange={(event) => update({ brightness: Number(event.currentTarget.value) })}
          />
          <output>{Math.round(effects.brightness * 100)}</output>
        </div>
      </label>

      <label className="compact-control">
        <span>Kontrast</span>
        <div className="range-row">
          <input
            aria-label="Kontrast"
            type="range"
            min="-100"
            max="100"
            step="5"
            disabled={disabled}
            value={effects.contrast}
            {...continuousEditProps}
            onChange={(event) => update({ contrast: Number(event.currentTarget.value) })}
          />
          <output>{effects.contrast}</output>
        </div>
      </label>

      <label className="compact-control">
        <span>Doygunluk</span>
        <div className="range-row">
          <input
            aria-label="Doygunluk"
            type="range"
            min="-2"
            max="2"
            step="0.1"
            disabled={disabled}
            value={effects.saturation}
            {...continuousEditProps}
            onChange={(event) => update({ saturation: Number(event.currentTarget.value) })}
          />
          <output>{effects.saturation.toFixed(1)}</output>
        </div>
      </label>

      <label className="compact-control">
        <span>Bulanıklık</span>
        <div className="range-row">
          <input
            aria-label="Bulanıklık"
            type="range"
            min="0"
            max="30"
            step="1"
            disabled={disabled}
            value={effects.blurRadius}
            {...continuousEditProps}
            onChange={(event) => update({ blurRadius: Number(event.currentTarget.value) })}
          />
          <output>{effects.blurRadius}px</output>
        </div>
      </label>

      <div className="preset-grid preset-grid-2">
        <button
          type="button"
          className={`preset-card ${effects.grayscale ? 'preset-card-active' : ''}`}
          disabled={disabled}
          onClick={() => update({ grayscale: !effects.grayscale })}
        >
          <span aria-hidden="true">◐</span>
          <strong>Siyah Beyaz</strong>
        </button>
        <button
          type="button"
          className={`preset-card ${effects.sepia ? 'preset-card-active' : ''}`}
          disabled={disabled}
          onClick={() => update({ sepia: !effects.sepia })}
        >
          <span aria-hidden="true">◒</span>
          <strong>Sepya</strong>
        </button>
      </div>
    </div>
  );
}

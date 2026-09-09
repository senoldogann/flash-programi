import { FRAME_PRESETS } from '../../frames/presets';
import { useEditorStore } from '../../store/editor-store';

export function FramesPanel() {
  const frame = useEditorStore((state) => state.project.frame);
  const setFrame = useEditorStore((state) => state.setFrame);
  const beginHistoryBatch = useEditorStore((state) => state.beginHistoryBatch);
  const endHistoryBatch = useEditorStore((state) => state.endHistoryBatch);

  return (
    <div className="preset-panel" aria-label="Çerçeve ayarları">
      <div className="panel-title-row">
        <div>
          <strong>Çerçeveler</strong>
          <small>Hazır çerçeveyi seç; hareketli olanlar önizlemede otomatik oynar.</small>
        </div>
      </div>

      <div className="preset-grid preset-grid-2">
        {FRAME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`preset-card ${frame.preset === preset.id ? 'preset-card-active' : ''}`}
            onClick={() => setFrame(preset.id)}
          >
            <span aria-hidden="true">{preset.icon}</span>
            <strong>{preset.label}</strong>
          </button>
        ))}
      </div>

      <label className="compact-control">
        <span>Çerçeve Kalınlığı</span>
        <div className="range-row">
          <input
            aria-label="Çerçeve Kalınlığı"
            type="range"
            min="2"
            max="24"
            step="1"
            disabled={frame.preset === 'none'}
            value={frame.width}
            onFocus={beginHistoryBatch}
            onBlur={endHistoryBatch}
            onChange={(event) => setFrame(frame.preset, Number(event.currentTarget.value))}
          />
          <output>{frame.width}px</output>
        </div>
      </label>
    </div>
  );
}

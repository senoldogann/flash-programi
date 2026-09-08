import { DECORATION_PRESETS } from '../../decorations/presets';
import { useEditorStore } from '../../store/editor-store';

export function DecorationsPanel() {
  const decorations = useEditorStore((state) => state.project.decorations);
  const addDecoration = useEditorStore((state) => state.addDecoration);
  const removeDecoration = useEditorStore((state) => state.removeDecoration);

  return (
    <div className="preset-panel" aria-label="Süs ayarları">
      <div className="panel-title-row">
        <div>
          <strong>Süsler</strong>
          <small>Birden fazla süs ekleyebilirsin. Aynı süse tekrar basmak yeni katman ekler.</small>
        </div>
      </div>

      <div className="preset-grid preset-grid-2">
        {DECORATION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-card"
            onClick={() => addDecoration(preset.id)}
          >
            <span aria-hidden="true">{preset.symbol}</span>
            <strong>{preset.label}</strong>
          </button>
        ))}
      </div>

      {decorations.length > 0 ? (
        <div className="active-layers" aria-label="Eklenen süsler">
          <strong>Eklenenler</strong>
          {decorations.map((layer) => {
            const preset = DECORATION_PRESETS.find((item) => item.id === layer.preset);
            return (
              <div key={layer.id} className="active-layer-row">
                <span>{preset?.symbol} {preset?.label}</span>
                <button type="button" onClick={() => removeDecoration(layer.id)} aria-label={`${preset?.label ?? 'Süs'} kaldır`}>
                  Kaldır
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

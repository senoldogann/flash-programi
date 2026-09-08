import type { AnimationPreset, AnimationSpeed } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';

const MOTION_PRESETS: Array<{ id: AnimationPreset; label: string; icon: string }> = [
  { id: 'none', label: 'Hareket Yok', icon: '■' },
  { id: 'pulse', label: 'Nabız', icon: '◎' },
  { id: 'float', label: 'Süzül', icon: '↟' },
  { id: 'swing', label: 'Sallan', icon: '↔' },
  { id: 'spin', label: 'Dön', icon: '↻' },
  { id: 'blink', label: 'Yanıp Sön', icon: '◉' },
  { id: 'zoom', label: 'Yakınlaş', icon: '⊕' },
  { id: 'shake', label: 'Titret', icon: '≋' },
  { id: 'slide', label: 'Kaydır', icon: '→' },
  { id: 'bounce', label: 'Zıpla', icon: '↥' },
  { id: 'wave', label: 'Dalga', icon: '∿' },
];

const SPEEDS: Array<{ id: AnimationSpeed; label: string }> = [
  { id: 'slow', label: 'Yavaş' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Hızlı' },
];

export function MotionPanel() {
  const selectedElement = useEditorStore((state) =>
    state.project.elements.find((element) => element.id === state.selectedElementId) ?? null,
  );
  const setElementAnimation = useEditorStore((state) => state.setElementAnimation);
  const disabled = selectedElement === null;

  return (
    <div className="preset-panel" aria-label="Hareket ayarları">
      <div className="panel-title-row">
        <div>
          <strong>Hareket</strong>
          <small>{selectedElement ? 'Seçili öğeye tek dokunuşla hareket ver.' : 'Önce fotoğraf veya yazı seç.'}</small>
        </div>
      </div>

      <div className="preset-grid preset-grid-2">
        {MOTION_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`preset-card ${selectedElement?.animation.preset === preset.id ? 'preset-card-active' : ''}`}
            disabled={disabled}
            onClick={() => selectedElement && setElementAnimation(selectedElement.id, { preset: preset.id })}
          >
            <span aria-hidden="true">{preset.icon}</span>
            <strong>{preset.label}</strong>
          </button>
        ))}
      </div>

      <div className="speed-control" aria-label="Hareket hızı">
        <span>Hız</span>
        <div className="segmented-control">
          {SPEEDS.map((speed) => (
            <button
              key={speed.id}
              type="button"
              className={selectedElement?.animation.speed === speed.id ? 'selected' : ''}
              disabled={disabled}
              onClick={() => selectedElement && setElementAnimation(selectedElement.id, { speed: speed.id })}
            >
              {speed.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

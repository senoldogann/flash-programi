import type {
  AnimationDirection,
  AnimationIntensity,
  AnimationPreset,
  AnimationSpeed,
} from '../../model/project';
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
  { id: 'ken-burns', label: 'Ken Burns', icon: '⌕' },
  { id: 'slow-pan', label: 'Slow Pan', icon: '⇢' },
  { id: 'orbit', label: 'Orbit', icon: '◌' },
  { id: 'breathing-zoom', label: 'Breathing Zoom', icon: '◍' },
  { id: 'rubber', label: 'Rubber', icon: '↕' },
  { id: 'flip-x', label: 'Flip X', icon: '⇆' },
  { id: 'flip-y', label: 'Flip Y', icon: '⇅' },
  { id: 'pendulum', label: 'Pendulum', icon: '⌁' },
  { id: 'drift', label: 'Drift', icon: '≈' },
  { id: 'parallax', label: 'Parallax', icon: '≡' },
  { id: 'jello', label: 'Jello', icon: '〰' },
  { id: 'wobble', label: 'Wobble', icon: '⌇' },
  { id: 'heartbeat', label: 'Heartbeat', icon: '♥' },
  { id: 'flash', label: 'Flash', icon: '✦' },
  { id: 'reveal', label: 'Reveal', icon: '◐' },
  { id: 'scanline', label: 'Scanline', icon: '▤' },
  { id: 'glitch-rgb', label: 'Glitch RGB', icon: 'RGB' },
  { id: 'chromatic-shake', label: 'Chromatic Shake', icon: '◈' },
  { id: 'focus-pulse', label: 'Focus Pulse', icon: '◎' },
  { id: 'pixel-pulse', label: 'Pixel Pulse', icon: '▦' },
  { id: 'soft-sway', label: 'Yumuşak Salınım', icon: '⌁' },
  { id: 'tilt', label: 'Eğim', icon: '◩' },
  { id: 'spiral', label: 'Spiral', icon: '◌' },
  { id: 'pop', label: 'Pop', icon: '✹' },
  { id: 'shimmer', label: 'Işıltı', icon: '✧' },
  { id: 'camera-pan', label: 'Kamera Kaydırma', icon: '▣' },
  { id: 'micro-vibrate', label: 'Mikro Titreşim', icon: '≋' },
  { id: 'rise-fade', label: 'Yüksel & Sol', icon: '↥' },
];

const SPEEDS: Array<{ id: AnimationSpeed; label: string }> = [
  { id: 'slow', label: 'Yavaş' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Hızlı' },
];

const INTENSITIES: Array<{ id: AnimationIntensity; label: string }> = [
  { id: 'subtle', label: 'Hafif' },
  { id: 'normal', label: 'Orta' },
  { id: 'strong', label: 'Güçlü' },
];

const DIRECTIONS: Array<{ id: AnimationDirection; label: string }> = [
  { id: 'left', label: 'Sol' },
  { id: 'right', label: 'Sağ' },
  { id: 'up', label: 'Yukarı' },
  { id: 'down', label: 'Aşağı' },
];

const DIRECTIONAL_PRESETS = new Set<AnimationPreset>([
  'slide',
  'ken-burns',
  'slow-pan',
  'parallax',
  'camera-pan',
]);

export function MotionPanel() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectedElement = useEditorStore((state) => {
    const selected = state.project.elements.find((element) => element.id === state.selectedElementId);
    return selected ?? state.project.elements.at(-1) ?? null;
  });
  const setElementAnimation = useEditorStore((state) => state.setElementAnimation);
  const disabled = selectedElement === null;
  const isAutomaticTarget = selectedElement !== null && selectedElement.id !== selectedElementId;
  const showsDirection = selectedElement !== null && DIRECTIONAL_PRESETS.has(selectedElement.animation.preset);

  return (
    <div className="preset-panel" aria-label="Hareket ayarları">
      <div className="panel-title-row">
        <div>
          <strong>Hareket</strong>
          <small>
            {selectedElement
              ? isAutomaticTarget
                ? 'Son öğe otomatik hedefleniyor. Tuvalde seçim yapman gerekmez.'
                : 'Seçili öğeye tek dokunuşla hareket ver.'
              : 'Hareket vermek için fotoğraf veya yazı ekle.'}
          </small>
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

      <div className="speed-control" aria-label="Hareket yoğunluğu">
        <span>Yoğunluk</span>
        <div className="segmented-control">
          {INTENSITIES.map((intensity) => (
            <button
              key={intensity.id}
              type="button"
              className={selectedElement?.animation.intensity === intensity.id ? 'selected' : ''}
              disabled={disabled}
              onClick={() => selectedElement && setElementAnimation(selectedElement.id, { intensity: intensity.id })}
            >
              {intensity.label}
            </button>
          ))}
        </div>
      </div>

      {showsDirection ? (
        <div className="speed-control" aria-label="Hareket yönü">
          <span>Yön</span>
          <div className="segmented-control">
            {DIRECTIONS.map((direction) => (
              <button
                key={direction.id}
                type="button"
                className={selectedElement?.animation.direction === direction.id ? 'selected' : ''}
                onClick={() => selectedElement && setElementAnimation(selectedElement.id, { direction: direction.id })}
              >
                {direction.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { createDefaultImageEffects, type ImageEffects } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';

type NumericEffectKey = {
  [Key in keyof ImageEffects]: ImageEffects[Key] extends number ? Key : never;
}[keyof ImageEffects];

type SliderDefinition = {
  key: NumericEffectKey;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
};

type ToggleDefinition = {
  key: 'grayscale' | 'sepia' | 'invert' | 'solarize';
  label: string;
  icon: string;
};

type QuickLook = {
  id: string;
  label: string;
  icon: string;
  effects: Partial<ImageEffects>;
};

const BASIC_SLIDERS: SliderDefinition[] = [
  { key: 'brightness', label: 'Parlaklık', min: -1, max: 1, step: 0.05, format: (value) => String(Math.round(value * 100)) },
  { key: 'contrast', label: 'Kontrast', min: -100, max: 100, step: 5 },
  { key: 'saturation', label: 'Doygunluk', min: -2, max: 2, step: 0.1, format: (value) => value.toFixed(1) },
  { key: 'blurRadius', label: 'Bulanıklık', min: 0, max: 40, step: 1, format: (value) => `${value}px` },
];

const COLOR_SLIDERS: SliderDefinition[] = [
  { key: 'hue', label: 'Ton', min: -180, max: 180, step: 1, format: (value) => `${value}°` },
  { key: 'temperature', label: 'Sıcaklık', min: -100, max: 100, step: 5 },
  { key: 'tint', label: 'Tint', min: -100, max: 100, step: 5 },
];

const STYLE_SLIDERS: SliderDefinition[] = [
  { key: 'vignette', label: 'Vinyet', min: 0, max: 1, step: 0.05, format: (value) => `${Math.round(value * 100)}%` },
  { key: 'enhance', label: 'Enhance', min: -1, max: 1, step: 0.05, format: (value) => value.toFixed(2) },
  { key: 'emboss', label: 'Emboss', min: 0, max: 1, step: 0.05, format: (value) => value.toFixed(2) },
  { key: 'noise', label: 'Noise', min: 0, max: 1, step: 0.05, format: (value) => value.toFixed(2) },
  { key: 'pixelate', label: 'Pixelate', min: 0, max: 64, step: 1, format: (value) => `${value}px` },
  { key: 'posterize', label: 'Posterize', min: 0, max: 1, step: 0.05, format: (value) => value.toFixed(2) },
  { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.05, format: (value) => value.toFixed(2) },
];

const COLOR_TOGGLES: ToggleDefinition[] = [
  { key: 'grayscale', label: 'Siyah Beyaz', icon: '◐' },
  { key: 'sepia', label: 'Sepya', icon: '◒' },
  { key: 'invert', label: 'Ters Renk', icon: '◑' },
];

const STYLE_TOGGLES: ToggleDefinition[] = [
  { key: 'solarize', label: 'Solarize', icon: '◓' },
];

const QUICK_LOOKS: QuickLook[] = [
  { id: 'natural', label: 'Doğal', icon: '◉', effects: { brightness: 0.08, contrast: 8, saturation: 0.1, enhance: 0.18 } },
  { id: 'warm', label: 'Sıcak', icon: '☀', effects: { temperature: 28, saturation: 0.18, contrast: 8 } },
  { id: 'cool', label: 'Soğuk', icon: '❄', effects: { temperature: -24, tint: -8, saturation: 0.05 } },
  { id: 'cinematic', label: 'Sinematik', icon: '▣', effects: { contrast: 22, saturation: -0.15, temperature: 8, vignette: 0.35 } },
  { id: 'retro', label: 'Retro', icon: '◫', effects: { contrast: -5, saturation: -0.25, temperature: 25, sepia: true, noise: 0.08, vignette: 0.25 } },
  { id: 'dream', label: 'Rüya', icon: '☁', effects: { brightness: 0.1, contrast: -12, saturation: 0.1, blurRadius: 1, vignette: 0.12 } },
  { id: 'noir', label: 'Noir', icon: '◐', effects: { grayscale: true, contrast: 32, vignette: 0.4 } },
  { id: 'vivid', label: 'Canlı', icon: '✦', effects: { contrast: 18, saturation: 0.45, enhance: 0.35 } },
  { id: 'fade', label: 'Soluk', icon: '◌', effects: { brightness: 0.08, contrast: -22, saturation: -0.35, temperature: 8 } },
  { id: 'sunset', label: 'Gün Batımı', icon: '◒', effects: { temperature: 40, tint: 12, saturation: 0.3, contrast: 10, vignette: 0.15 } },
  { id: 'ice', label: 'Buz', icon: '◇', effects: { temperature: -45, tint: -10, saturation: -0.05, contrast: 14 } },
  { id: 'cyber', label: 'Cyber', icon: '◈', effects: { hue: 28, tint: 30, saturation: 0.6, contrast: 25, vignette: 0.3 } },
];

function effectValue(effects: ImageEffects, definition: SliderDefinition): number {
  return effects[definition.key];
}

export function EffectsPanel() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const image = useEditorStore((state) => {
    const selected = state.project.elements.find((element) => element.id === state.selectedElementId);
    if (selected?.type === 'image') return selected;

    for (let index = state.project.elements.length - 1; index >= 0; index -= 1) {
      const element = state.project.elements[index];
      if (element.type === 'image') return element;
    }

    return null;
  });
  const setImageEffects = useEditorStore((state) => state.setImageEffects);
  const beginHistoryBatch = useEditorStore((state) => state.beginHistoryBatch);
  const endHistoryBatch = useEditorStore((state) => state.endHistoryBatch);
  const effects = image?.effects ?? createDefaultImageEffects();
  const disabled = image === null;
  const isAutomaticTarget = image !== null && image.id !== selectedElementId;

  const update = (patch: Partial<ImageEffects>) => {
    if (image) setImageEffects(image.id, patch);
  };

  const applyLook = (look: QuickLook) => {
    update({ ...createDefaultImageEffects(), ...look.effects });
  };

  const renderSlider = (definition: SliderDefinition) => {
    const value = effectValue(effects, definition);
    return (
      <label className="compact-control" key={definition.key}>
        <span>{definition.label}</span>
        <div className="range-row">
          <input
            aria-label={definition.label}
            type="range"
            min={definition.min}
            max={definition.max}
            step={definition.step}
            disabled={disabled}
            value={value}
            onFocus={beginHistoryBatch}
            onBlur={endHistoryBatch}
            onChange={(event) => update({ [definition.key]: Number(event.currentTarget.value) } as Partial<ImageEffects>)}
          />
          <output>{definition.format ? definition.format(value) : value}</output>
        </div>
      </label>
    );
  };

  const renderToggle = (definition: ToggleDefinition) => {
    const active = effects[definition.key];
    return (
      <button
        key={definition.key}
        type="button"
        className={`preset-card ${active ? 'preset-card-active' : ''}`}
        disabled={disabled}
        aria-pressed={active}
        onClick={() => update({ [definition.key]: !active } as Partial<ImageEffects>)}
      >
        <span aria-hidden="true">{definition.icon}</span>
        <strong>{definition.label}</strong>
      </button>
    );
  };

  return (
    <div className="preset-panel" aria-label="Fotoğraf efektleri">
      <div className="panel-title-row">
        <div>
          <strong>Fotoğraf Efektleri</strong>
          <small>
            {image
              ? isAutomaticTarget
                ? 'Son fotoğraf otomatik hedefleniyor. Tuvalde seçim yapman gerekmez.'
                : 'Değişiklikler seçili fotoğrafta anında görünür.'
              : 'Efektleri kullanmak için bir fotoğraf ekle.'}
          </small>
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

      <section className="effect-group" aria-labelledby="effect-looks-title">
        <h3 id="effect-looks-title">Hızlı Görünümler</h3>
        <div className="preset-grid preset-grid-2 quick-look-grid">
          {QUICK_LOOKS.map((look) => (
            <button
              key={look.id}
              type="button"
              className="preset-card quick-look-card"
              disabled={disabled}
              onClick={() => applyLook(look)}
            >
              <span aria-hidden="true">{look.icon}</span>
              <strong>{look.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="effect-group" aria-labelledby="effect-basic-title">
        <h3 id="effect-basic-title">Temel</h3>
        {BASIC_SLIDERS.map(renderSlider)}
      </section>

      <section className="effect-group" aria-labelledby="effect-color-title">
        <h3 id="effect-color-title">Renk</h3>
        {COLOR_SLIDERS.map(renderSlider)}
        <div className="preset-grid preset-grid-2">{COLOR_TOGGLES.map(renderToggle)}</div>
      </section>

      <section className="effect-group" aria-labelledby="effect-style-title">
        <h3 id="effect-style-title">Stil</h3>
        {STYLE_SLIDERS.map(renderSlider)}
        <div className="preset-grid preset-grid-2">{STYLE_TOGGLES.map(renderToggle)}</div>
      </section>
    </div>
  );
}

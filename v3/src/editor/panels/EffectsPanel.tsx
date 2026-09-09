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

import type {
  ExportScale,
  GifDitherProfile,
  GifPaletteProfile,
  GifProfile,
} from '../../model/project';
import {
  getExportDimensions,
  getGifFramePlan,
  getGifWorkBudget,
  isSafeExportDimensions,
} from '../../export/profiles';
import { useEditorStore } from '../../store/editor-store';

const EXPORT_SCALES: ExportScale[] = [1, 2, 3, 4];
const GIF_PROFILES: Array<{ value: GifProfile; label: string }> = [
  { value: 'small', label: 'Küçük' },
  { value: 'balanced', label: 'Dengeli' },
  { value: 'quality', label: 'Kaliteli' },
];
const GIF_PALETTES: Array<{ value: GifPaletteProfile; label: string }> = [
  { value: 'adaptive', label: 'Uyarlanabilir' },
  { value: 'classic-64', label: 'Klasik 64' },
  { value: 'classic-27', label: 'Klasik 27' },
];
const GIF_DITHERS: Array<{ value: GifDitherProfile; label: string }> = [
  { value: 'none', label: 'Kapalı' },
  { value: 'ordered-4x4', label: 'Ordered 4×4' },
];

export function ExportPanel() {
  const project = useEditorStore((state) => state.project);
  const setExportSettings = useEditorStore((state) => state.setExportSettings);
  const { scale, gifProfile } = project.exportSettings;
  const gifPalette = project.exportSettings.gifPalette ?? 'adaptive';
  const gifDither = project.exportSettings.gifDither ?? 'none';
  const dimensions = getExportDimensions(project.width, project.height, scale);
  const gifPlan = getGifFramePlan(project.durationMs, gifProfile);
  const gifWork = getGifWorkBudget(dimensions.width, dimensions.height, gifPlan.frameCount);
  const exceedsDimensionLimit = !isSafeExportDimensions(dimensions.width, dimensions.height);
  const exceedsGifBudget = gifWork > 100_000_000;

  return (
    <section className="export-panel preset-panel" aria-label="Dışa aktarma ayarları">
      <div className="panel-title-row export-panel-summary">
        <div>
          <strong>Çıktı Ayarları</strong>
          <small>Varsayılan ayarlar çoğu kullanım için yeterli. Teknik seçenekleri yalnız gerekirse değiştir.</small>
        </div>
        <strong>{dimensions.width} × {dimensions.height} px</strong>
      </div>

      {exceedsDimensionLimit || exceedsGifBudget ? (
        <div className="export-budget-warning" role="alert">
          {exceedsDimensionLimit ? (
            <span>PNG/GIF çıktı genişliği ve yüksekliği en fazla 4096 px olabilir. Ölçeği düşür.</span>
          ) : null}
          {exceedsGifBudget ? (
            <span>GIF ayarları 100 milyon pixel-frame güvenlik bütçesini aşıyor. Ölçeği veya kalite profilini düşür.</span>
          ) : null}
        </div>
      ) : null}

      <details className="export-advanced">
        <summary>Gelişmiş Ayarlar</summary>
        <div className="export-advanced-grid">
          <div className="export-control-group">
            <span>Çözünürlük</span>
            <div className="export-scale-control" aria-label="Çıktı ölçeği">
              {EXPORT_SCALES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={scale === option ? 'selected' : ''}
                  aria-pressed={scale === option}
                  onClick={() => setExportSettings({ scale: option })}
                >
                  {option}x
                </button>
              ))}
            </div>
          </div>

          <div className="export-control-group">
            <span>GIF Profili</span>
            <div className="segmented-control" aria-label="GIF kalite profili">
              {GIF_PROFILES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={gifProfile === option.value ? 'selected' : ''}
                  aria-pressed={gifProfile === option.value}
                  onClick={() => setExportSettings({ gifProfile: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="export-control-group">
            <span>GIF Renk Paleti</span>
            <div className="segmented-control" aria-label="GIF renk paleti">
              {GIF_PALETTES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={gifPalette === option.value ? 'selected' : ''}
                  aria-pressed={gifPalette === option.value}
                  onClick={() => setExportSettings({ gifPalette: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="export-control-group">
            <span>Dither</span>
            <div className="segmented-control" aria-label="GIF dither profili">
              {GIF_DITHERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={gifDither === option.value ? 'selected' : ''}
                  aria-pressed={gifDither === option.value}
                  onClick={() => setExportSettings({ gifDither: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="export-summary">
            <span>PNG: {dimensions.width} × {dimensions.height} px</span>
            <span>GIF: {gifPlan.frameCount} kare · {Math.round(gifPlan.delayMs)} ms/kare</span>
          </div>
        </div>
      </details>
    </section>
  );
}

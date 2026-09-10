export type WorkflowStep = 'photo' | 'nick' | 'style' | 'motion' | 'decorate';

type WorkflowRailProps = {
  activeStep: WorkflowStep;
  onStepChange: (step: WorkflowStep) => void;
  onChooseImage: () => void;
  onAddText: () => void;
  onShowExport: () => void;
};

type WorkflowItem = {
  id: WorkflowStep;
  title: string;
  description: string;
  glyph: string;
};

const WORKFLOW_ITEMS: WorkflowItem[] = [
  { id: 'photo', title: 'Fotoğraf', description: 'Resmini ekle veya seç', glyph: '▧' },
  { id: 'nick', title: 'Nick', description: 'Nickini yaz ve stilini belirle', glyph: 'T' },
  { id: 'style', title: 'Stil', description: 'Hazır tasarım seç', glyph: '✦' },
  { id: 'motion', title: 'Hareket', description: 'Animasyon ekle', glyph: '▶' },
  { id: 'decorate', title: 'Süsleme', description: 'Efekt, çerçeve, simge', glyph: '✧' },
];

export function WorkflowRail({
  activeStep,
  onStepChange,
  onChooseImage,
  onAddText,
  onShowExport,
}: WorkflowRailProps) {
  return (
    <aside className="workflow-rail" aria-label="Kolay oluşturma akışı">
      <nav className="workflow-navigation" aria-label="Oluşturma adımları">
        {WORKFLOW_ITEMS.map((item, index) => {
          const selected = activeStep === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`workflow-step ${selected ? 'workflow-step-active' : ''}`}
              aria-current={selected ? 'step' : undefined}
              onClick={() => onStepChange(item.id)}
            >
              <span className="workflow-step-number" aria-hidden="true">{index + 1}</span>
              <span className="workflow-step-copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <span className="workflow-step-glyph" aria-hidden="true">{item.glyph}</span>
            </button>
          );
        })}
      </nav>

      <div className="workflow-quick-actions" aria-label="Hızlı ekleme">
        <button type="button" onClick={onChooseImage} aria-label="Fotoğraf Seç">
          <span aria-hidden="true">＋</span>
          Fotoğraf Ekle
        </button>
        <button type="button" onClick={onAddText} aria-label="Yazı Ekle">
          <span aria-hidden="true">＋</span>
          Nick Ekle
        </button>
      </div>

      <button type="button" className="workflow-export-entry" onClick={onShowExport}>
        <span className="workflow-export-icon" aria-hidden="true">↓</span>
        <span>
          <strong>PNG / GIF indir</strong>
          <small>Tasarımını kaydet ve kullan</small>
        </span>
      </button>

      <div className="workflow-privacy-note">
        <span aria-hidden="true">⌾</span>
        <p>Fotoğrafların tarayıcında işlenir. Sunucuya yüklenmez.</p>
      </div>
    </aside>
  );
}

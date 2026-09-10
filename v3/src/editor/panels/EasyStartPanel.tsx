import { useState } from 'react';
import { useEditorStore } from '../../store/editor-store';

type EasyStartPanelProps = {
  onChooseImage: () => void;
  onGifExport?: () => void;
  gifExporting?: boolean;
  gifProgress?: number;
};

const QUICK_STYLES = [
  {
    id: 'classic-photo',
    label: 'Klasik Resimli',
    description: 'Eski sesli sohbet sitelerindeki nostaljik görünüm.',
    kind: 'classic',
    recipeId: 'resimli-doner-nick',
  },
  {
    id: 'classic-gold',
    label: 'Altın Nick',
    description: 'Küçük, parlak ve dönen klasik nick stili.',
    kind: 'classic',
    recipeId: 'altin-doner-nick',
  },
  {
    id: 'modern-neon',
    label: 'Modern Neon',
    description: 'Daha canlı, yeni nesil ışıklı görünüm.',
    kind: 'neo',
    recipeId: 'neon-night',
  },
  {
    id: 'modern-purple',
    label: 'Mor Cam',
    description: 'Fotoğraflı tasarımlar için yumuşak ve şık hareket.',
    kind: 'neo',
    recipeId: 'purple-glass',
  },
] as const;

export function EasyStartPanel({
  onChooseImage,
  onGifExport,
  gifExporting = false,
  gifProgress = 0,
}: EasyStartPanelProps) {
  const project = useEditorStore((state) => state.project);
  const addText = useEditorStore((state) => state.addText);
  const updateElement = useEditorStore((state) => state.updateElement);
  const applyClassicRecipe = useEditorStore((state) => state.applyClassicRecipe);
  const applyNeoRecipe = useEditorStore((state) => state.applyNeoRecipe);
  const [nick, setNick] = useState('');
  const [message, setMessage] = useState('');

  const lastText = [...project.elements].reverse().find((element) => element.type === 'text');
  const hasImage = project.elements.some((element) => element.type === 'image');
  const hasText = Boolean(lastText);
  const canExport = project.elements.length > 0 && Boolean(onGifExport) && !gifExporting;
  const progressPercent = Math.max(0, Math.min(100, Math.round(gifProgress * 100)));

  const saveNick = () => {
    const value = nick.trim();
    if (!value) {
      setMessage('Önce kullanmak istediğin nicki yaz.');
      return;
    }

    if (lastText?.type === 'text') {
      updateElement(lastText.id, { text: value });
    } else {
      addText(value);
    }
    setMessage(`Nick hazır: ${value}`);
  };

  const applyQuickStyle = (style: (typeof QUICK_STYLES)[number]) => {
    const value = nick.trim();
    if (value) {
      if (lastText?.type === 'text') updateElement(lastText.id, { text: value });
      else addText(value);
    }

    if (style.kind === 'classic') applyClassicRecipe(style.recipeId);
    else applyNeoRecipe(style.recipeId);

    setMessage(`${style.label} görünümü uygulandı.`);
  };

  return (
    <section className="easy-start-panel" aria-labelledby="easy-start-title">
      <div className="easy-start-heading">
        <div>
          <h2 id="easy-start-title">4 adımda Flash nick hazırla</h2>
          <p>Karışık ayarlara girmeden temel tasarımını tamamla.</p>
        </div>
        <span className="easy-badge" aria-label="Kolay kullanım modu">Kolay</span>
      </div>

      <div className={`easy-step ${hasImage ? 'easy-step-done' : ''}`}>
        <div className="easy-step-number" aria-hidden="true">1</div>
        <div className="easy-step-body">
          <strong>Fotoğrafını ekle</strong>
          <span>{hasImage ? 'Fotoğraf eklendi. İstersen başka bir fotoğraf seçebilirsin.' : 'PNG, JPG, WebP veya GIF seçebilirsin.'}</span>
          <button type="button" className="easy-action-button" onClick={onChooseImage}>
            {hasImage ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle'}
          </button>
        </div>
      </div>

      <div className={`easy-step ${hasText ? 'easy-step-done' : ''}`}>
        <div className="easy-step-number" aria-hidden="true">2</div>
        <div className="easy-step-body">
          <label htmlFor="easy-nick-input">Nickini yaz</label>
          <span>Sesli sohbet sitesinde kullandığın adı buraya yaz.</span>
          <div className="easy-nick-row">
            <input
              id="easy-nick-input"
              type="text"
              value={nick}
              maxLength={40}
              autoComplete="off"
              placeholder="Örnek: ŞENOL"
              onChange={(event) => setNick(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  saveNick();
                }
              }}
            />
            <button type="button" className="easy-action-button" onClick={saveNick}>Nicki Ekle</button>
          </div>
        </div>
      </div>

      <div className="easy-step">
        <div className="easy-step-number" aria-hidden="true">3</div>
        <div className="easy-step-body">
          <strong>Bir görünüm seç</strong>
          <span>Sonradan istediğin kadar değiştirebilirsin.</span>
          <div className="easy-style-grid" aria-label="Kolay hazır görünümler">
            {QUICK_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                className="easy-style-button"
                onClick={() => applyQuickStyle(style)}
              >
                <strong>{style.label}</strong>
                <small>{style.description}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="easy-step easy-step-export">
        <div className="easy-step-number" aria-hidden="true">4</div>
        <div className="easy-step-body">
          <strong>Hazırsa GIF olarak indir</strong>
          <span>İndirdiğin GIF dosyasını nickinin yanında kullanabilirsin.</span>
          <button
            type="button"
            className="easy-download-button"
            disabled={!canExport}
            onClick={onGifExport}
          >
            {gifExporting ? `GIF Hazırlanıyor %${progressPercent}` : 'GIF Olarak İndir'}
          </button>
        </div>
      </div>

      <p className="easy-status" aria-live="polite">{message}</p>
      <p className="easy-privacy-note">Fotoğrafların tasarım sırasında tarayıcında işlenir. Bu editör fotoğrafını bir sunucuya yüklemez.</p>
    </section>
  );
}

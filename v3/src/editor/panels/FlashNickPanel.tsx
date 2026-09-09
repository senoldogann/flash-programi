import type { AnimationPreset, TextElement, TextMaterialPreset } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';
import { FLASH_TEXT_MATERIALS, getFlashTextMaterial } from '../../text/flash-materials';

const CLASSIC_MOTIONS: Array<{ preset: AnimationPreset; label: string; icon: string }> = [
  { preset: 'xara-double-sided', label: 'Çift Taraflı Döndür', icon: '⇆' },
  { preset: 'flip-x', label: 'Y Ekseni Dönüş', icon: '↔' },
  { preset: 'flip-y', label: 'X Ekseni Dönüş', icon: '↕' },
  { preset: 'pendulum', label: 'Sarkaç', icon: '⌁' },
  { preset: 'spin', label: 'Tam Dönüş', icon: '↻' },
  { preset: 'pulse', label: 'Nabız', icon: '◎' },
  { preset: 'bounce', label: 'Zıpla', icon: '↥' },
  { preset: 'shimmer', label: 'Işıltı', icon: '✦' },
];

function selectedOrLastText(): TextElement | null {
  const state = useEditorStore.getState();
  const selected = state.project.elements.find(
    (element): element is TextElement => element.id === state.selectedElementId && element.type === 'text',
  );
  if (selected) return selected;

  return [...state.project.elements].reverse().find(
    (element): element is TextElement => element.type === 'text',
  ) ?? null;
}

function ensureText(): TextElement {
  const existing = selectedOrLastText();
  if (existing) return existing;

  const state = useEditorStore.getState();
  const id = state.addText('NICK');
  return useEditorStore.getState().project.elements.find(
    (element): element is TextElement => element.id === id && element.type === 'text',
  )!;
}

function classicTextGeometry(projectWidth: number, projectHeight: number) {
  const width = projectWidth * 0.94;
  const height = projectHeight * 0.9;
  return {
    width,
    height,
    x: (projectWidth - width) / 2,
    y: (projectHeight - height) / 2,
    fontSize: Math.max(10, Math.min(92, projectHeight * 0.68)),
  };
}

export function FlashNickPanel() {
  const project = useEditorStore((state) => state.project);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectedText = project.elements.find(
    (element): element is TextElement => element.id === selectedElementId && element.type === 'text',
  ) ?? [...project.elements].reverse().find(
    (element): element is TextElement => element.type === 'text',
  ) ?? null;
  const resizeProject = useEditorStore((state) => state.resizeProject);
  const updateElement = useEditorStore((state) => state.updateElement);
  const setElementAnimation = useEditorStore((state) => state.setElementAnimation);

  const createClassicNick = () => {
    resizeProject(133, 33);
    const text = ensureText();
    const state = useEditorStore.getState();
    state.updateElement(text.id, {
      ...classicTextGeometry(state.project.width, state.project.height),
      fontFamily: 'Impact',
      align: 'center',
    });
  };

  const createImageFlash = () => {
    resizeProject(300, 100);
    const state = useEditorStore.getState();
    const text = ensureText();
    const image = [...state.project.elements].reverse().find((element) => element.type === 'image');

    if (image) {
      const maxImageWidth = 112;
      const maxImageHeight = 94;
      const scale = Math.min(maxImageWidth / image.width, maxImageHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      state.updateElement(image.id, {
        width,
        height,
        x: 3 + (maxImageWidth - width) / 2,
        y: (100 - height) / 2,
      });
      state.updateElement(text.id, {
        x: 118,
        y: 7,
        width: 177,
        height: 86,
        fontSize: 34,
        fontFamily: 'Impact',
        align: 'center',
      });
    } else {
      state.updateElement(text.id, {
        ...classicTextGeometry(300, 100),
        fontFamily: 'Impact',
        align: 'center',
      });
    }
  };

  const applyMaterial = (preset: TextMaterialPreset) => {
    const text = ensureText();
    const state = useEditorStore.getState();
    const material = getFlashTextMaterial(preset);
    state.updateElement(text.id, {
      ...classicTextGeometry(state.project.width, state.project.height),
      materialPreset: material.id,
      extrusionDepth: material.extrusionDepth,
      extrusionColor: material.extrusionColor,
      fill: material.fill,
      stroke: material.stroke,
      strokeWidth: material.strokeWidth,
      shadowColor: material.shadowColor,
      shadowBlur: material.shadowBlur,
      fontFamily: 'Impact',
      align: 'center',
    });
  };

  const applyMotion = (preset: AnimationPreset) => {
    const text = ensureText();
    useEditorStore.getState().setElementAnimation(text.id, {
      preset,
      speed: preset === 'xara-double-sided' ? 'normal' : text.animation.speed,
    });
  };

  return (
    <div className="preset-panel flash-nick-panel" aria-label="SesliChat classic flash nick">
      <div className="panel-title-row">
        <div>
          <strong>Flash Nick Classic</strong>
          <small>Xara3D dönemindeki SesliChat nicklerini modern editörle üret.</small>
        </div>
      </div>

      <section className="cinematic-motion-section" aria-label="Klasik flash boyutları">
        <strong>Hızlı Başlangıç</strong>
        <small>Eski panel ölçüleri ve resimli flash düzenleri tek dokunuşta.</small>
        <div className="preset-grid preset-grid-2">
          <button type="button" className="preset-card" onClick={createClassicNick}>
            <span aria-hidden="true">133×33</span>
            <strong>Klasik Nick 133 × 33</strong>
          </button>
          <button type="button" className="preset-card" onClick={createImageFlash}>
            <span aria-hidden="true">▣T</span>
            <strong>Resimli Flash 300 × 100</strong>
          </button>
        </div>
      </section>

      <section className="cinematic-motion-section" aria-label="Xara yazı malzemeleri">
        <strong>3D Xara Malzemeleri</strong>
        <small>Metal, cam ve neon görünümleri gerçek derinlik katmanlarıyla kullan.</small>
        <div className="preset-grid preset-grid-2">
          {FLASH_TEXT_MATERIALS.map((material) => (
            <button
              key={material.id}
              type="button"
              className={`preset-card ${selectedText?.materialPreset === material.id ? 'preset-card-active' : ''}`}
              onClick={() => applyMaterial(material.id)}
            >
              <span aria-hidden="true">◆</span>
              <strong>{material.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="cinematic-motion-section" aria-label="Çift taraflı nick">
        <strong>Çift Taraflı Nick</strong>
        <small>Ön yüzde bir isim, arka yüzde başka bir isim döner.</small>
        <label>
          <span>Arka yüz yazısı</span>
          <input
            type="text"
            aria-label="Arka yüz yazısı"
            maxLength={80}
            value={selectedText?.backText ?? ''}
            placeholder="Örn. DOGAN"
            onChange={(event) => {
              const text = ensureText();
              updateElement(text.id, { backText: event.currentTarget.value });
            }}
          />
        </label>
      </section>

      <section className="cinematic-motion-section" aria-label="Klasik Xara hareketleri">
        <strong>Klasik Xara Hareketleri</strong>
        <small>Dönen, sallanan ve parlayan nick stilleri.</small>
        <div className="preset-grid preset-grid-2">
          {CLASSIC_MOTIONS.map((motion) => (
            <button
              key={motion.preset}
              type="button"
              className={`preset-card ${selectedText?.animation.preset === motion.preset ? 'preset-card-active' : ''}`}
              onClick={() => applyMotion(motion.preset)}
            >
              <span aria-hidden="true">{motion.icon}</span>
              <strong>{motion.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <p className="panel-note">
        İpucu: Kısa ve kalın nickler 133×33 formatında daha okunaklıdır. Impact benzeri geniş fontlar klasik görünüme daha yakındır.
      </p>
    </div>
  );
}

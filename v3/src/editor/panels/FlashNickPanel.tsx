import { CLASSIC_SCENE_RECIPES } from '../../classic/recipes';
import type { AnimationPreset, FlashMode, ImageElement, TextElement, TextMaterialPreset } from '../../model/project';
import { NEO_SCENE_RECIPES } from '../../neo/recipes';
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

const NEO_SUBJECT_MOTIONS: Array<{ preset: AnimationPreset; label: string; icon: string }> = [
  { preset: 'parallax', label: 'Derinlik Parallax', icon: '◫' },
  { preset: 'breathing-zoom', label: 'Nefes', icon: '◎' },
  { preset: 'soft-sway', label: 'Yumuşak Salınım', icon: '⌁' },
  { preset: 'float', label: 'Süzül', icon: '↟' },
];

const CLASSIC_MATERIALS = FLASH_TEXT_MATERIALS.filter((material) => !String(material.id).startsWith('neo-'));
const NEO_MATERIALS = FLASH_TEXT_MATERIALS.filter((material) => String(material.id).startsWith('neo-'));

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

function selectedOrLastImage(): ImageElement | null {
  const state = useEditorStore.getState();
  const selected = state.project.elements.find(
    (element): element is ImageElement => element.id === state.selectedElementId && element.type === 'image',
  );
  if (selected) return selected;

  return [...state.project.elements].reverse().find(
    (element): element is ImageElement => element.type === 'image',
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

function setProjectMode(mode: FlashMode) {
  useEditorStore.setState((state) => {
    if ((state.project.mode ?? 'classic') === mode) return {};
    return {
      project: {
        ...state.project,
        mode,
      },
    };
  });
}

export function FlashNickPanel() {
  const project = useEditorStore((state) => state.project);
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectedText = project.elements.find(
    (element): element is TextElement => element.id === selectedElementId && element.type === 'text',
  ) ?? [...project.elements].reverse().find(
    (element): element is TextElement => element.type === 'text',
  ) ?? null;
  const selectedImage = project.elements.find(
    (element): element is ImageElement => element.id === selectedElementId && element.type === 'image',
  ) ?? [...project.elements].reverse().find(
    (element): element is ImageElement => element.type === 'image',
  ) ?? null;
  const mode = project.mode ?? 'classic';
  const resizeProject = useEditorStore((state) => state.resizeProject);
  const updateElement = useEditorStore((state) => state.updateElement);
  const applyClassicRecipe = useEditorStore((state) => state.applyClassicRecipe);
  const applyNeoRecipe = useEditorStore((state) => state.applyNeoRecipe);

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
      ...(mode === 'classic'
        ? {
            ...classicTextGeometry(state.project.width, state.project.height),
            fontFamily: 'Impact',
            align: 'center' as const,
          }
        : {}),
      materialPreset: material.id,
      extrusionDepth: material.extrusionDepth,
      extrusionColor: material.extrusionColor,
      fill: material.fill,
      stroke: material.stroke,
      strokeWidth: material.strokeWidth,
      shadowColor: material.shadowColor,
      shadowBlur: material.shadowBlur,
    });
  };

  const applyMotion = (preset: AnimationPreset) => {
    const text = ensureText();
    useEditorStore.getState().setElementAnimation(text.id, {
      preset,
      speed: preset === 'xara-double-sided' ? 'normal' : text.animation.speed,
    });
  };

  const toggleSubjectRole = () => {
    const image = selectedOrLastImage();
    if (!image) return;
    updateElement(image.id, { role: image.role === 'subject' ? 'image' : 'subject' });
  };

  const applySubjectMotion = (preset: AnimationPreset) => {
    const image = selectedOrLastImage();
    if (!image) return;
    updateElement(image.id, {
      role: 'subject',
      animation: {
        ...image.animation,
        preset,
        speed: 'slow',
        intensity: 'subtle',
        delayMs: 0,
        loop: true,
      },
    });
  };

  return (
    <div className="preset-panel flash-nick-panel" aria-label="Flash nick tasarım modu">
      <div className="panel-title-row">
        <div>
          <strong>{mode === 'classic' ? 'Flash Nick Classic' : 'Neo Flash Studio'}</strong>
          <small>
            {mode === 'classic'
              ? 'Xara3D dönemindeki SesliChat nicklerini modern editörle üret.'
              : 'Modern ışık, ambient efekt, sinematik hareket ve parlak 3D yazı presetleri.'}
          </small>
        </div>
      </div>

      <section className="cinematic-motion-section" aria-label="Flash tasarım modu">
        <strong>Tasarım Modu</strong>
        <small>Mod değiştirirken mevcut fotoğraf, nick ve sahne içeriği korunur.</small>
        <div className="preset-grid preset-grid-2">
          <button
            type="button"
            className={`preset-card ${mode === 'classic' ? 'preset-card-active' : ''}`}
            aria-pressed={mode === 'classic'}
            onClick={() => setProjectMode('classic')}
          >
            <span aria-hidden="true">X3D</span>
            <strong>Classic SesliChat</strong>
          </button>
          <button
            type="button"
            className={`preset-card ${mode === 'neo' ? 'preset-card-active' : ''}`}
            aria-pressed={mode === 'neo'}
            onClick={() => setProjectMode('neo')}
          >
            <span aria-hidden="true">✦</span>
            <strong>Neo Flash</strong>
          </button>
        </div>
      </section>

      {mode === 'classic' ? (
        <>
          <section className="cinematic-motion-section" aria-label="Klasik hazır tasarımlar">
            <strong>Klasik Hazır Tasarımlar</strong>
            <small>Nick ve fotoğrafını koruyup ölçü, Xara malzemesi, hareket, süs ve GIF renk stilini tek tıkla uygula.</small>
            <div className="preset-grid preset-grid-2">
              {CLASSIC_SCENE_RECIPES.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  className="preset-card"
                  onClick={() => applyClassicRecipe(recipe.id)}
                >
                  <span aria-hidden="true">
                    {recipe.layout === 'nick' ? '✧' : recipe.layout === 'portrait-left' ? '▣T' : '▣'}
                  </span>
                  <strong>{recipe.name}</strong>
                </button>
              ))}
            </div>
          </section>

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
            <small>Metal, cam ve ateş görünümlerini klasik FlashText3D motoruyla kullan.</small>
            <div className="preset-grid preset-grid-2">
              {CLASSIC_MATERIALS.map((material) => (
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
        </>
      ) : (
        <>
          <section className="cinematic-motion-section" aria-label="Neo hazır tasarımlar">
            <strong>Neo Hazır Tasarımlar</strong>
            <small>Fotoğraf ve nickini koruyup modern 3D malzeme, sinematik hareket ve ambient ışığı tek tıkla uygula.</small>
            <div className="preset-grid preset-grid-2">
              {NEO_SCENE_RECIPES.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  className="preset-card"
                  onClick={() => applyNeoRecipe(recipe.id)}
                >
                  <span aria-hidden="true">
                    {recipe.layout === 'nick' ? '✦' : recipe.layout === 'portrait-left' ? '◐' : '◉'}
                  </span>
                  <strong>{recipe.name}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="cinematic-motion-section" aria-label="Neo kişi hareketleri">
            <strong>Kişi / Cutout Motion</strong>
            <small>Şeffaf PNG/WebP kişi görsellerini ayrı alpha katmanı olarak hareketlendir. Görsel tarayıcıdan dışarı gönderilmez.</small>
            <div className="preset-grid preset-grid-2">
              <button
                type="button"
                className={`preset-card ${selectedImage?.role === 'subject' ? 'preset-card-active' : ''}`}
                aria-pressed={selectedImage?.role === 'subject'}
                disabled={!selectedImage}
                onClick={toggleSubjectRole}
              >
                <span aria-hidden="true">◉</span>
                <strong>Konu Katmanı</strong>
              </button>
              {NEO_SUBJECT_MOTIONS.map((motion) => (
                <button
                  key={motion.preset}
                  type="button"
                  className={`preset-card ${selectedImage?.role === 'subject' && selectedImage.animation.preset === motion.preset ? 'preset-card-active' : ''}`}
                  disabled={!selectedImage}
                  onClick={() => applySubjectMotion(motion.preset)}
                >
                  <span aria-hidden="true">{motion.icon}</span>
                  <strong>{motion.label}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="cinematic-motion-section" aria-label="Neo yazı malzemeleri">
            <strong>Neo 3D Malzemeleri</strong>
            <small>Altın, neon, holografik, cam, buz, sinematik ve gelecek kromu dahil modern yüzeyler.</small>
            <div className="preset-grid preset-grid-2">
              {NEO_MATERIALS.map((material) => (
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

          <p className="panel-note">
            Neo presetleri adaptive GIF renk paleti, modern ambient primitive'ler ve Project V3 sahne motorunu birlikte kullanır.
          </p>
        </>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { DecorationsPanel } from './DecorationsPanel';
import { EasyStartPanel } from './EasyStartPanel';
import { EffectsPanel } from './EffectsPanel';
import { FlashNickPanel } from './FlashNickPanel';
import { FramesPanel } from './FramesPanel';
import { MotionPanel } from './MotionPanel';
import { TemplatesPanel } from './TemplatesPanel';
import './rich-panels.css';

export type ToolSection = 'easy' | 'flashnick' | 'effects' | 'motion' | 'decorations' | 'frames' | 'templates';
type ToolPanelProps = {
  onAddText: () => void;
  onImageFile: (file: File) => void;
  onGifExport?: () => void;
  gifExporting?: boolean;
  gifProgress?: number;
  activeSection?: ToolSection;
  onSectionChange?: (section: ToolSection) => void;
  showNavigation?: boolean;
};

const TOOL_SECTIONS: Array<{ id: ToolSection; label: string; icon: string }> = [
  { id: 'easy', label: 'Kolay Başlangıç', icon: '1–4' },
  { id: 'flashnick', label: 'Flash Nick', icon: '✧' },
  { id: 'effects', label: 'Efekt', icon: '✦' },
  { id: 'motion', label: 'Hareket', icon: '▶' },
  { id: 'decorations', label: 'Süsler', icon: '♥' },
  { id: 'frames', label: 'Çerçeve', icon: '□' },
  { id: 'templates', label: 'Hazır Tasarımlar', icon: '▦' },
];

export function ToolPanel({
  onAddText,
  onImageFile,
  onGifExport,
  gifExporting = false,
  gifProgress = 0,
  activeSection,
  onSectionChange,
  showNavigation = true,
}: ToolPanelProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [internalSection, setInternalSection] = useState<ToolSection>('easy');
  const resolvedSection = activeSection ?? internalSection;

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [resolvedSection]);

  const selectSection = (section: ToolSection) => {
    if (activeSection === undefined) setInternalSection(section);
    onSectionChange?.(section);
  };

  return (
    <aside className={`tool-panel ${showNavigation ? '' : 'tool-panel-contextual'}`} aria-label="Tasarım araçları">
      {showNavigation ? (
        <div className="tool-panel-nav" data-testid="tool-panel-nav">
          <input
            ref={imageInputRef}
            className="visually-hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            aria-label="Fotoğraf seç"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (file) onImageFile(file);
            }}
          />

          <div className="primary-tools" aria-label="Hızlı ekleme araçları">
            <button
              type="button"
              className="tool-button tool-button-primary"
              aria-label="Fotoğraf Seç"
              onClick={() => imageInputRef.current?.click()}
            >
              <span className="tool-icon" aria-hidden="true">▧</span>
              <span><strong>Fotoğraf Seç</strong><small>Bilgisayarından veya telefonundan fotoğraf ekle</small></span>
            </button>
            <button type="button" className="tool-button" aria-label="Yazı Ekle" onClick={onAddText}>
              <span className="tool-icon" aria-hidden="true">T</span>
              <span><strong>Yazı Ekle</strong><small>Nick veya kısa mesaj ekle</small></span>
            </button>
          </div>

          <p className="advanced-tools-heading">Ne yapmak istiyorsun?</p>
          <p className="advanced-tools-help">İlk kez kullanıyorsan “Kolay Başlangıç” bölümünde kal. Diğer araçlar isteğe bağlıdır.</p>

          <div className="tool-section-buttons" aria-label="Tasarım kategorileri">
            {TOOL_SECTIONS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`category-button ${resolvedSection === tool.id ? 'category-button-active' : ''}`}
                aria-pressed={resolvedSection === tool.id}
                onClick={() => selectSection(tool.id)}
              >
                <span aria-hidden="true">{tool.icon}</span>
                <strong>{tool.label}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={contentRef} className="tool-panel-content" data-testid="tool-panel-content">
        {resolvedSection === 'easy' ? (
          <EasyStartPanel
            onChooseImage={() => imageInputRef.current?.click()}
            onGifExport={onGifExport}
            gifExporting={gifExporting}
            gifProgress={gifProgress}
          />
        ) : null}
        {resolvedSection === 'flashnick' ? <FlashNickPanel /> : null}
        {resolvedSection === 'effects' ? <EffectsPanel /> : null}
        {resolvedSection === 'motion' ? <MotionPanel /> : null}
        {resolvedSection === 'decorations' ? <DecorationsPanel /> : null}
        {resolvedSection === 'frames' ? <FramesPanel /> : null}
        {resolvedSection === 'templates' ? <TemplatesPanel /> : null}
      </div>
    </aside>
  );
}

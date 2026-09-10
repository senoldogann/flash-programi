import { useEffect, useRef, useState } from 'react';
import { DecorationsPanel } from './DecorationsPanel';
import { EasyStartPanel } from './EasyStartPanel';
import { EffectsPanel } from './EffectsPanel';
import { FlashNickPanel } from './FlashNickPanel';
import { FramesPanel } from './FramesPanel';
import { MotionPanel } from './MotionPanel';
import { TemplatesPanel } from './TemplatesPanel';
import './rich-panels.css';

type ToolSection = 'easy' | 'flashnick' | 'effects' | 'motion' | 'decorations' | 'frames' | 'templates';
type ToolPanelProps = {
  onAddText: () => void;
  onImageFile: (file: File) => void;
  onGifExport?: () => void;
  gifExporting?: boolean;
  gifProgress?: number;
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
}: ToolPanelProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<ToolSection>('easy');

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeSection]);

  return (
    <aside className="tool-panel" aria-label="Tasarım araçları">
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
              className={`category-button ${activeSection === tool.id ? 'category-button-active' : ''}`}
              aria-pressed={activeSection === tool.id}
              onClick={() => setActiveSection(tool.id)}
            >
              <span aria-hidden="true">{tool.icon}</span>
              <strong>{tool.label}</strong>
            </button>
          ))}
        </div>
      </div>

      <div ref={contentRef} className="tool-panel-content" data-testid="tool-panel-content">
        {activeSection === 'easy' ? (
          <EasyStartPanel
            onChooseImage={() => imageInputRef.current?.click()}
            onGifExport={onGifExport}
            gifExporting={gifExporting}
            gifProgress={gifProgress}
          />
        ) : null}
        {activeSection === 'flashnick' ? <FlashNickPanel /> : null}
        {activeSection === 'effects' ? <EffectsPanel /> : null}
        {activeSection === 'motion' ? <MotionPanel /> : null}
        {activeSection === 'decorations' ? <DecorationsPanel /> : null}
        {activeSection === 'frames' ? <FramesPanel /> : null}
        {activeSection === 'templates' ? <TemplatesPanel /> : null}
      </div>
    </aside>
  );
}

import { useRef, useState } from 'react';
import { DecorationsPanel } from './DecorationsPanel';
import { EffectsPanel } from './EffectsPanel';
import { FramesPanel } from './FramesPanel';
import { MotionPanel } from './MotionPanel';
import { TemplatesPanel } from './TemplatesPanel';
import './rich-panels.css';

type ToolSection = 'effects' | 'motion' | 'decorations' | 'frames' | 'templates' | null;
type ToolPanelProps = { onAddText: () => void; onImageFile: (file: File) => void };

const TOOL_SECTIONS: Array<{ id: Exclude<ToolSection, null>; label: string; icon: string }> = [
  { id: 'effects', label: 'Efekt', icon: '✦' },
  { id: 'motion', label: 'Hareket', icon: '▶' },
  { id: 'decorations', label: 'Süsler', icon: '♥' },
  { id: 'frames', label: 'Çerçeve', icon: '□' },
  { id: 'templates', label: 'Hazır Tasarımlar', icon: '▦' },
];

export function ToolPanel({ onAddText, onImageFile }: ToolPanelProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<ToolSection>(null);

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

        <div className="primary-tools">
          <button
            type="button"
            className="tool-button tool-button-active"
            aria-label="Fotoğraf Seç"
            onClick={() => imageInputRef.current?.click()}
          >
            <span className="tool-icon" aria-hidden="true">▧</span>
            <span><strong>Fotoğraf Seç</strong><small>PNG, JPG, WebP veya GIF</small></span>
          </button>
          <button type="button" className="tool-button" aria-label="Yazı Ekle" onClick={onAddText}>
            <span className="tool-icon" aria-hidden="true">T</span>
            <span><strong>Yazı Ekle</strong><small>Nick veya mesaj ekle</small></span>
          </button>
        </div>

        <div className="tool-section-buttons" aria-label="Tasarım kategorileri">
          {TOOL_SECTIONS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`category-button ${activeSection === tool.id ? 'category-button-active' : ''}`}
              aria-pressed={activeSection === tool.id}
              onClick={() => setActiveSection((current) => current === tool.id ? null : tool.id)}
            >
              <span aria-hidden="true">{tool.icon}</span>
              <strong>{tool.label}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="tool-panel-content" data-testid="tool-panel-content">
        {activeSection === 'effects' ? <EffectsPanel /> : null}
        {activeSection === 'motion' ? <MotionPanel /> : null}
        {activeSection === 'decorations' ? <DecorationsPanel /> : null}
        {activeSection === 'frames' ? <FramesPanel /> : null}
        {activeSection === 'templates' ? <TemplatesPanel /> : null}
      </div>
    </aside>
  );
}

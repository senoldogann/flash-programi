import { DESIGN_TEMPLATES } from '../../templates/templates';
import { useEditorStore } from '../../store/editor-store';

export function TemplatesPanel() {
  const applyTemplate = useEditorStore((state) => state.applyTemplate);

  return (
    <div className="preset-panel" aria-label="Hazır tasarımlar">
      <div className="panel-title-row">
        <div>
          <strong>Hazır Tasarımlar</strong>
          <small>Nickin ve fotoğrafın kalır; görünüm tek dokunuşla değişir.</small>
        </div>
      </div>
      <div className="template-grid">
        {DESIGN_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            className="template-card"
            onClick={() => applyTemplate(template.id)}
          >
            <span className="template-emoji" aria-hidden="true">{template.emoji}</span>
            <span>
              <strong>{template.name}</strong>
              <small>{template.description}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEditorStore } from '../../store/editor-store';

export function TextInspector() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectedElement = useEditorStore((state) =>
    state.project.elements.find((element) => element.id === state.selectedElementId) ?? null,
  );
  const updateElement = useEditorStore((state) => state.updateElement);

  if (!selectedElementId || !selectedElement) {
    return (
      <aside className="inspector" aria-label="Seçili öğe ayarları">
        <div className="inspector-header">
          <h2>Ayarlar</h2>
        </div>
        <div className="inspector-empty">
          <strong>Henüz bir öğe seçilmedi</strong>
          <p>Fotoğraf veya yazı eklediğinde ayarları burada göreceksin.</p>
        </div>
      </aside>
    );
  }

  if (selectedElement.type !== 'text') {
    return (
      <aside className="inspector" aria-label="Seçili öğe ayarları">
        <div className="inspector-header">
          <h2>Fotoğraf Ayarları</h2>
        </div>
        <div className="inspector-empty">
          <strong>Fotoğraf seçili</strong>
          <p>Taşıma, boyutlandırma ve döndürme kontrolleri tuvale eklenecek.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector" aria-label="Yazı ayarları">
      <div className="inspector-header">
        <h2>Yazı Ayarları</h2>
      </div>

      <div className="inspector-form">
        <label>
          <span>Yazı</span>
          <input
            type="text"
            aria-label="Yazı"
            value={selectedElement.text}
            maxLength={500}
            onChange={(event) =>
              updateElement(selectedElement.id, { text: event.currentTarget.value })
            }
          />
        </label>

        <label>
          <span>Yazı Boyutu</span>
          <div className="range-row">
            <input
              type="range"
              aria-label="Yazı Boyutu"
              min="10"
              max="180"
              value={selectedElement.fontSize}
              onChange={(event) =>
                updateElement(selectedElement.id, { fontSize: Number(event.currentTarget.value) })
              }
            />
            <output>{Math.round(selectedElement.fontSize)} px</output>
          </div>
        </label>

        <div className="color-grid">
          <label>
            <span>Yazı Rengi</span>
            <input
              type="color"
              aria-label="Yazı Rengi"
              value={selectedElement.fill}
              onChange={(event) =>
                updateElement(selectedElement.id, { fill: event.currentTarget.value })
              }
            />
          </label>
          <label>
            <span>Kenarlık</span>
            <input
              type="color"
              aria-label="Kenarlık Rengi"
              value={selectedElement.stroke}
              onChange={(event) =>
                updateElement(selectedElement.id, { stroke: event.currentTarget.value })
              }
            />
          </label>
        </div>

        <label>
          <span>Kenarlık Kalınlığı</span>
          <div className="range-row">
            <input
              type="range"
              aria-label="Kenarlık Kalınlığı"
              min="0"
              max="12"
              step="1"
              value={selectedElement.strokeWidth}
              onChange={(event) =>
                updateElement(selectedElement.id, { strokeWidth: Number(event.currentTarget.value) })
              }
            />
            <output>{selectedElement.strokeWidth}px</output>
          </div>
        </label>
      </div>
    </aside>
  );
}

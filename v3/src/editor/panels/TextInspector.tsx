import type { EditorElement, TextAlign, TextElement } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';

const FONT_OPTIONS = [
  'Arial',
  'Verdana',
  'Trebuchet MS',
  'Georgia',
  'Impact',
  'Courier New',
] as const;

const ALIGN_OPTIONS: Array<{ value: TextAlign; label: string; shortLabel: string }> = [
  { value: 'left', label: 'Sola Hizala', shortLabel: 'Sol' },
  { value: 'center', label: 'Ortala', shortLabel: 'Orta' },
  { value: 'right', label: 'Sağa Hizala', shortLabel: 'Sağ' },
];

type HistoryBatchControls = {
  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
};

type CommonControlsProps = HistoryBatchControls & {
  element: EditorElement;
  updateElement: ReturnType<typeof useEditorStore.getState>['updateElement'];
  removeElement: ReturnType<typeof useEditorStore.getState>['removeElement'];
};

function CommonElementControls({
  element,
  updateElement,
  removeElement,
  beginHistoryBatch,
  endHistoryBatch,
}: CommonControlsProps) {
  return (
    <section className="inspector-section" aria-label="Öğe ayarları">
      <div className="inspector-section-title">
        <strong>Öğe</strong>
        <small>Görünüm ve düzenleme</small>
      </div>

      <label>
        <span>Opaklık</span>
        <div className="range-row">
          <input
            type="range"
            aria-label="Opaklık"
            min="0"
            max="1"
            step="0.05"
            value={element.opacity}
            onFocus={beginHistoryBatch}
            onBlur={endHistoryBatch}
            onChange={(event) =>
              updateElement(element.id, { opacity: Number(event.currentTarget.value) })
            }
          />
          <output>{Math.round(element.opacity * 100)}%</output>
        </div>
      </label>

      <div className="inspector-toggle-grid">
        <button
          type="button"
          className={`inspector-toggle ${element.visible ? 'selected' : ''}`}
          aria-label={element.visible ? 'Öğeyi Gizle' : 'Öğeyi Göster'}
          aria-pressed={element.visible}
          onClick={() => updateElement(element.id, { visible: !element.visible })}
        >
          <span aria-hidden="true">{element.visible ? '◉' : '○'}</span>
          {element.visible ? 'Görünür' : 'Gizli'}
        </button>
        <button
          type="button"
          className={`inspector-toggle ${element.locked ? 'selected' : ''}`}
          aria-label={element.locked ? 'Öğe Kilidini Aç' : 'Öğeyi Kilitle'}
          aria-pressed={element.locked}
          onClick={() => updateElement(element.id, { locked: !element.locked })}
        >
          <span aria-hidden="true">{element.locked ? '▣' : '□'}</span>
          {element.locked ? 'Kilitli' : 'Serbest'}
        </button>
      </div>

      <button
        type="button"
        className="inspector-danger"
        aria-label="Öğeyi Sil"
        onClick={() => removeElement(element.id)}
      >
        Öğeyi Sil
      </button>
    </section>
  );
}

function TextStyleControls({
  element,
  updateElement,
  beginHistoryBatch,
  endHistoryBatch,
}: HistoryBatchControls & {
  element: TextElement;
  updateElement: CommonControlsProps['updateElement'];
}) {
  return (
    <>
      <section className="inspector-section inspector-section-first" aria-label="Yazı içeriği">
        <label>
          <span>Yazı</span>
          <input
            type="text"
            aria-label="Yazı"
            value={element.text}
            maxLength={500}
            onFocus={beginHistoryBatch}
            onBlur={endHistoryBatch}
            onChange={(event) => updateElement(element.id, { text: event.currentTarget.value })}
          />
        </label>

        <label>
          <span>Yazı Tipi</span>
          <select
            aria-label="Yazı Tipi"
            value={element.fontFamily}
            onChange={(event) => updateElement(element.id, { fontFamily: event.currentTarget.value })}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Yazı Boyutu</span>
          <div className="range-row">
            <input
              type="range"
              aria-label="Yazı Boyutu"
              min="10"
              max="180"
              value={element.fontSize}
              onFocus={beginHistoryBatch}
              onBlur={endHistoryBatch}
              onChange={(event) =>
                updateElement(element.id, { fontSize: Number(event.currentTarget.value) })
              }
            />
            <output>{Math.round(element.fontSize)} px</output>
          </div>
        </label>

        <div className="inspector-control-group">
          <span>Hizalama</span>
          <div className="segmented-control inspector-align-control">
            {ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={option.label}
                aria-pressed={element.align === option.value}
                className={element.align === option.value ? 'selected' : ''}
                onClick={() => updateElement(element.id, { align: option.value })}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="inspector-section" aria-label="Yazı görünümü">
        <div className="inspector-section-title">
          <strong>Renk ve Kenarlık</strong>
          <small>Nick görünümünü belirle</small>
        </div>

        <div className="color-grid">
          <label>
            <span>Yazı Rengi</span>
            <input
              type="color"
              aria-label="Yazı Rengi"
              value={element.fill}
              onFocus={beginHistoryBatch}
              onBlur={endHistoryBatch}
              onChange={(event) => updateElement(element.id, { fill: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>Kenarlık</span>
            <input
              type="color"
              aria-label="Kenarlık Rengi"
              value={element.stroke}
              onFocus={beginHistoryBatch}
              onBlur={endHistoryBatch}
              onChange={(event) => updateElement(element.id, { stroke: event.currentTarget.value })}
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
              value={element.strokeWidth}
              onFocus={beginHistoryBatch}
              onBlur={endHistoryBatch}
              onChange={(event) =>
                updateElement(element.id, { strokeWidth: Number(event.currentTarget.value) })
              }
            />
            <output>{element.strokeWidth}px</output>
          </div>
        </label>

        <div className="color-grid glow-grid">
          <label>
            <span>Parlama Rengi</span>
            <input
              type="color"
              aria-label="Parlama Rengi"
              value={element.shadowColor}
              onFocus={beginHistoryBatch}
              onBlur={endHistoryBatch}
              onChange={(event) => updateElement(element.id, { shadowColor: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>Parlama Gücü</span>
            <div className="range-row compact-range-row">
              <input
                type="range"
                aria-label="Parlama Gücü"
                min="0"
                max="40"
                step="1"
                value={element.shadowBlur}
                onFocus={beginHistoryBatch}
                onBlur={endHistoryBatch}
                onChange={(event) =>
                  updateElement(element.id, { shadowBlur: Number(event.currentTarget.value) })
                }
              />
              <output>{Math.round(element.shadowBlur)}</output>
            </div>
          </label>
        </div>
      </section>
    </>
  );
}

export function TextInspector() {
  const selectedElementId = useEditorStore((state) => state.selectedElementId);
  const selectedElement = useEditorStore((state) =>
    state.project.elements.find((element) => element.id === state.selectedElementId) ?? null,
  );
  const updateElement = useEditorStore((state) => state.updateElement);
  const removeElement = useEditorStore((state) => state.removeElement);
  const beginHistoryBatch = useEditorStore((state) => state.beginHistoryBatch);
  const endHistoryBatch = useEditorStore((state) => state.endHistoryBatch);

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

  const isText = selectedElement.type === 'text';

  return (
    <aside className="inspector" aria-label={isText ? 'Yazı ayarları' : 'Fotoğraf ayarları'}>
      <div className="inspector-header inspector-header-rich">
        <div>
          <h2>{isText ? 'Yazı Ayarları' : 'Fotoğraf Ayarları'}</h2>
          <small>{selectedElement.name}</small>
        </div>
        <span className="element-type-badge">{isText ? 'T' : '▧'}</span>
      </div>

      <div className="inspector-form">
        {isText ? (
          <TextStyleControls
            element={selectedElement}
            updateElement={updateElement}
            beginHistoryBatch={beginHistoryBatch}
            endHistoryBatch={endHistoryBatch}
          />
        ) : (
          <section className="inspector-section inspector-section-first image-inspector-summary">
            <strong>Fotoğraf düzenleme</strong>
            <p>Efekt ve hareket ayarları soldaki panellerde. Konum, boyut ve dönüşü doğrudan tuvalden değiştirebilirsin.</p>
          </section>
        )}

        <CommonElementControls
          element={selectedElement}
          updateElement={updateElement}
          removeElement={removeElement}
          beginHistoryBatch={beginHistoryBatch}
          endHistoryBatch={endHistoryBatch}
        />
      </div>
    </aside>
  );
}

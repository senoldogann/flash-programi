import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { readImageFile } from './canvas/image-loader';
import { AddPanel } from './panels/AddPanel';
import { TextInspector } from './panels/TextInspector';
import { TopToolbar } from './toolbar/TopToolbar';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
}

export function EditorShell() {
  const project = useEditorStore((state) => state.project);
  const addText = useEditorStore((state) => state.addText);
  const addImage = useEditorStore((state) => state.addImage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const assetRevokers = useRef(new Set<() => void>());

  useEffect(() => {
    const revokers = assetRevokers.current;

    return () => {
      for (const revoke of revokers) {
        revoke();
      }
      revokers.clear();
    };
  }, []);

  const handleAddText = () => {
    setErrorMessage(null);
    addText();
  };

  const handleImageFile = async (file: File) => {
    setErrorMessage(null);

    try {
      const asset = await readImageFile(file);

      try {
        addImage(asset.url, asset.width, asset.height);
        assetRevokers.current.add(asset.revoke);
      } catch (error) {
        asset.revoke();
        throw error;
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">✦</div>
          <div>
            <h1>Flash Nick Studio</h1>
            <p>Fotoğrafını seç, nickini yaz, ikonunu hazırla.</p>
          </div>
        </div>
        <TopToolbar />
      </header>

      {errorMessage ? (
        <div className="error-banner" role="alert">
          <strong>Fotoğraf eklenemedi.</strong>
          <span>{errorMessage}</span>
          <button type="button" aria-label="Hata mesajını kapat" onClick={() => setErrorMessage(null)}>
            Kapat
          </button>
        </div>
      ) : null}

      <section className="editor-layout">
        <AddPanel onAddText={handleAddText} onImageFile={handleImageFile} />

        <section className="workspace" aria-label="Tasarım çalışma alanı">
          <div className="workspace-toolbar">
            <span>Tuval Boyutu</span>
            <strong>{project.width} × {project.height}</strong>
            <span className="workspace-spacer" />
            <span>{project.elements.length} öğe</span>
          </div>

          <div className="canvas-zone">
            <div className="canvas-card" aria-label="Tasarım alanı">
              <div className="empty-canvas">
                <div className="empty-icon" aria-hidden="true">
                  {project.elements.length > 0 ? project.elements.length : '＋'}
                </div>
                <strong>
                  {project.elements.length > 0 ? 'Tasarım hazır' : 'Tasarımına başla'}
                </strong>
                <span>
                  {project.elements.length > 0
                    ? 'Öğeleri tuval üzerinde düzenleme bir sonraki adımda açılacak.'
                    : 'Bir fotoğraf seç veya yazı ekle.'}
                </span>
              </div>
            </div>
          </div>

          <footer className="workspace-footer">
            <span>{project.width} × {project.height} px</span>
            <span>V3 Foundation</span>
          </footer>
        </section>

        <TextInspector />
      </section>
    </main>
  );
}

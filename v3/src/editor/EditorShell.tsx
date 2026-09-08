import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor-store';
import { EditorCanvas } from './canvas/EditorCanvas';
import { readImageFile } from './canvas/image-loader';
import './editor-controls.css';
import { TextInspector } from './panels/TextInspector';
import { ToolPanel } from './panels/ToolPanel';
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
      for (const revoke of revokers) revoke();
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
            <p>Fotoğrafını seç, nickini yaz, hareket ve efekt ekle.</p>
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
        <ToolPanel onAddText={handleAddText} onImageFile={handleImageFile} />

        <section className="workspace" aria-label="Tasarım çalışma alanı">
          <div className="workspace-toolbar">
            <span>Tuval Boyutu</span>
            <strong>{project.width} × {project.height}</strong>
            <span className="workspace-spacer" />
            <span>{project.elements.length} öğe</span>
          </div>

          <div className="canvas-zone">
            <div
              className="canvas-card"
              aria-label="Tasarım alanı"
              style={{ aspectRatio: `${project.width} / ${project.height}` }}
            >
              <EditorCanvas />
            </div>
          </div>

          <footer className="workspace-footer">
            <span>{project.width} × {project.height} px</span>
            <span>V3 Rich Editor</span>
          </footer>
        </section>

        <TextInspector />
      </section>
    </main>
  );
}

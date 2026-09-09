import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type Konva from 'konva';
import { createBrowserGifEncoder, downloadBlob, loadGifConstructor } from '../export/gif-browser';
import { encodeGifFrames } from '../export/gif';
import { captureStageCanvas, downloadStagePng } from '../export/png';
import { clearCurrentProject, loadCurrentProject, saveCurrentProject } from '../persistence/project-db';
import { useEditorStore } from '../store/editor-store';
import { EditorCanvas } from './canvas/EditorCanvas';
import { readImageFile } from './canvas/image-loader';
import './editor-controls.css';
import { handleEditorShortcut } from './keyboard-shortcuts';
import { CanvasSizePanel } from './panels/CanvasSizePanel';
import { TextInspector } from './panels/TextInspector';
import { ToolPanel } from './panels/ToolPanel';
import { TopToolbar } from './toolbar/TopToolbar';

type ErrorNotice = {
  title: string;
  message: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
}

export function EditorShell() {
  const project = useEditorStore((state) => state.project);
  const reset = useEditorStore((state) => state.reset);
  const loadProject = useEditorStore((state) => state.loadProject);
  const addText = useEditorStore((state) => state.addText);
  const addImage = useEditorStore((state) => state.addImage);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const [errorNotice, setErrorNotice] = useState<ErrorNotice | null>(null);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [exportTimeMs, setExportTimeMs] = useState<number | null>(null);
  const [gifExporting, setGifExporting] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const assetRevokers = useRef(new Set<() => void>());
  const stageRef = useRef<Konva.Stage | null>(null);

  useEffect(() => {
    const revokers = assetRevokers.current;
    return () => {
      for (const revoke of revokers) revoke();
      revokers.clear();
    };
  }, []);

  useEffect(() => {
    let active = true;

    void loadCurrentProject()
      .then((restored) => {
        if (!active) {
          restored?.dispose();
          return;
        }

        if (restored) {
          loadProject(restored.project);
          assetRevokers.current.add(restored.dispose);
        }
      })
      .catch((error) => {
        if (!active) return;
        setErrorNotice({
          title: 'Kayıtlı proje açılamadı.',
          message: getErrorMessage(error),
        });
      })
      .finally(() => {
        if (active) setPersistenceReady(true);
      });

    return () => {
      active = false;
    };
  }, [loadProject]);

  useEffect(() => {
    if (!persistenceReady) return;

    const timer = window.setTimeout(() => {
      void saveCurrentProject(project).catch((error) => {
        setErrorNotice({
          title: 'Proje kaydedilemedi.',
          message: getErrorMessage(error),
        });
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [persistenceReady, project]);

  const handleStageReady = useCallback((stage: Konva.Stage | null) => {
    stageRef.current = stage;
  }, []);

  const handlePngExport = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || gifExporting) return;

    try {
      setErrorNotice(null);
      downloadStagePng(stage, 'flash-nick.png');
    } catch (error) {
      setErrorNotice({
        title: 'PNG oluşturulamadı.',
        message: getErrorMessage(error),
      });
    }
  }, [gifExporting]);

  useEffect(() => {
    if (gifExporting) return;

    const onKeyDown = (event: KeyboardEvent) => {
      handleEditorShortcut(event, { undo, redo, exportPng: handlePngExport });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gifExporting, handlePngExport, redo, undo]);

  const handleNewProject = useCallback(async () => {
    if (gifExporting) return;

    const confirmed = window.confirm(
      'Mevcut tasarım silinecek. Yeni bir tasarıma başlamak istiyor musun?',
    );
    if (!confirmed) return;

    try {
      setErrorNotice(null);
      await clearCurrentProject();

      for (const revoke of assetRevokers.current) revoke();
      assetRevokers.current.clear();
      reset();
    } catch (error) {
      setErrorNotice({
        title: 'Yeni tasarım açılamadı.',
        message: `Mevcut tasarım korunuyor. ${getErrorMessage(error)}`,
      });
    }
  }, [gifExporting, reset]);

  const handleGifExport = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage || gifExporting) return;

    setGifExporting(true);
    setGifProgress(0);
    setErrorNotice(null);

    try {
      const Gif = await loadGifConstructor();
      const encoder = createBrowserGifEncoder(Gif, project.width, project.height);
      const blob = await encodeGifFrames({
        durationMs: project.durationMs,
        fps: project.fps,
        encoder,
        renderFrame: async (timeMs) => {
          flushSync(() => setExportTimeMs(timeMs));
          stage.draw();
          return captureStageCanvas(stage);
        },
        onProgress: setGifProgress,
      });

      downloadBlob(blob, 'flash-nick.gif');
    } catch (error) {
      setErrorNotice({
        title: 'GIF oluşturulamadı.',
        message: getErrorMessage(error),
      });
    } finally {
      flushSync(() => setExportTimeMs(null));
      stage.draw();
      setGifExporting(false);
      setGifProgress(0);
    }
  }, [gifExporting, project.durationMs, project.fps, project.height, project.width]);

  const handleAddText = () => {
    setErrorNotice(null);
    addText();
  };

  const handleImageFile = async (file: File) => {
    setErrorNotice(null);

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
      setErrorNotice({
        title: 'Fotoğraf eklenemedi.',
        message: getErrorMessage(error),
      });
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
        <TopToolbar
          onNewProject={handleNewProject}
          onExport={handlePngExport}
          onGifExport={handleGifExport}
          gifExporting={gifExporting}
          gifProgress={gifProgress}
        />
      </header>

      {errorNotice ? (
        <div className="error-banner" role="alert">
          <strong>{errorNotice.title}</strong>
          <span>{errorNotice.message}</span>
          <button type="button" aria-label="Hata mesajını kapat" onClick={() => setErrorNotice(null)}>
            Kapat
          </button>
        </div>
      ) : null}

      <section className="editor-layout" aria-busy={gifExporting}>
        <ToolPanel onAddText={handleAddText} onImageFile={handleImageFile} />

        <section className="workspace" aria-label="Tasarım çalışma alanı">
          <div className="workspace-toolbar">
            <span>Tuval Boyutu</span>
            <strong>{project.width} × {project.height}</strong>
            <span className="workspace-spacer" />
            <span>{project.elements.length} öğe</span>
          </div>

          <CanvasSizePanel />

          <div className="canvas-zone">
            <div
              className="canvas-card"
              aria-label="Tasarım alanı"
              style={{ aspectRatio: `${project.width} / ${project.height}` }}
            >
              <EditorCanvas onStageReady={handleStageReady} timeOverrideMs={exportTimeMs} />
            </div>
          </div>

          <footer className="workspace-footer">
            <span>{project.width} × {project.height} px</span>
            <span>{gifExporting ? `GIF hazırlanıyor %${Math.round(gifProgress * 100)}` : 'V3 Rich Editor'}</span>
          </footer>
        </section>

        <TextInspector />
      </section>
    </main>
  );
}

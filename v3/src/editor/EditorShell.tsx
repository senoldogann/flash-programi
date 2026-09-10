import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type Konva from 'konva';
import { createBrowserGifEncoder, downloadBlob, loadGifConstructor } from '../export/gif-browser';
import { processGifFrameCanvas } from '../export/gif-color-profile';
import { encodeGifFrames } from '../export/gif';
import { captureStageCanvas, downloadStagePng } from '../export/png';
import {
  assertSafeExportDimensions,
  assertSafeGifWorkBudget,
  getExportDimensions,
  getGifFramePlan,
  getGifWorkBudget,
} from '../export/profiles';
import { clearCurrentProject, loadCurrentProject, saveCurrentProject } from '../persistence/project-db';
import { useEditorStore } from '../store/editor-store';
import { CanvasPreview } from './canvas/CanvasPreview';
import { EditorCanvas } from './canvas/EditorCanvas';
import { readImageFile } from './canvas/image-loader';
import { PlaybackStrip } from './chrome/PlaybackStrip';
import { PresetLibrary } from './chrome/PresetLibrary';
import { StudioHeader } from './chrome/StudioHeader';
import { WorkspaceChrome } from './chrome/WorkspaceChrome';
import { WorkflowRail, type WorkflowStep } from './chrome/WorkflowRail';
import './chrome/preset-library.css';
import './chrome/workspace-chrome.css';
import './editor-controls.css';
import { handleEditorShortcut } from './keyboard-shortcuts';
import { ExportPanel } from './panels/ExportPanel';
import { TextInspector } from './panels/TextInspector';
import { ToolPanel, type ToolSection } from './panels/ToolPanel';
import { TopToolbar } from './toolbar/TopToolbar';

type ErrorNotice = { title: string; message: string };

const WORKFLOW_TOOL: Record<WorkflowStep, ToolSection> = {
  photo: 'effects',
  nick: 'flashnick',
  style: 'templates',
  motion: 'motion',
  decorate: 'decorations',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
}

function scrollIntoViewSafely(element: HTMLElement | null) {
  if (element && typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
  const [activeStep, setActiveStep] = useState<WorkflowStep>('photo');
  const [activeToolSection, setActiveToolSection] = useState<ToolSection>('effects');
  const [helpOpen, setHelpOpen] = useState(false);
  const [previewTimeMs, setPreviewTimeMs] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [presetQuery, setPresetQuery] = useState('');
  const [presetLibraryOpen, setPresetLibraryOpen] = useState(false);
  const assetRevokers = useRef(new Set<() => void>());
  const stageRef = useRef<Konva.Stage | null>(null);
  const startImageInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const toolDetailRef = useRef<HTMLDivElement>(null);
  const exportSettingsRef = useRef<HTMLDivElement>(null);
  const presetLibraryRef = useRef<HTMLElement>(null);

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
        setErrorNotice({ title: 'Kayıtlı tasarım açılamadı.', message: getErrorMessage(error) });
      })
      .finally(() => {
        if (active) setPersistenceReady(true);
      });
    return () => { active = false; };
  }, [loadProject]);

  useEffect(() => {
    if (!persistenceReady) return;
    const timer = window.setTimeout(() => {
      void saveCurrentProject(project).catch((error) => {
        setErrorNotice({ title: 'Tasarım kaydedilemedi.', message: getErrorMessage(error) });
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [persistenceReady, project]);

  const handleStageReady = useCallback((stage: Konva.Stage | null) => { stageRef.current = stage; }, []);

  const handlePngExport = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || gifExporting) return;
    try {
      setErrorNotice(null);
      const dimensions = getExportDimensions(project.width, project.height, project.exportSettings.scale);
      assertSafeExportDimensions(dimensions.width, dimensions.height);
      downloadStagePng(stage, 'flash-nick.png', project.exportSettings.scale);
    } catch (error) {
      setErrorNotice({ title: 'PNG oluşturulamadı.', message: getErrorMessage(error) });
    }
  }, [gifExporting, project.exportSettings.scale, project.height, project.width]);

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
    const confirmed = window.confirm('Mevcut tasarım silinecek. Baştan başlamak istiyor musun?');
    if (!confirmed) return;
    try {
      setErrorNotice(null);
      await clearCurrentProject();
      for (const revoke of assetRevokers.current) revoke();
      assetRevokers.current.clear();
      reset();
      setActiveStep('photo');
      setActiveToolSection('effects');
      setPreviewTimeMs(0);
      setPreviewPlaying(true);
      setPresetQuery('');
      setPresetLibraryOpen(false);
    } catch (error) {
      setErrorNotice({ title: 'Yeni tasarım açılamadı.', message: `Mevcut tasarım korunuyor. ${getErrorMessage(error)}` });
    }
  }, [gifExporting, reset]);

  const handleGifExport = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage || gifExporting) return;
    setGifExporting(true);
    setGifProgress(0);
    setErrorNotice(null);
    try {
      const { scale, gifProfile } = project.exportSettings;
      const gifPalette = project.exportSettings.gifPalette ?? 'adaptive';
      const gifDither = project.exportSettings.gifDither ?? 'none';
      const dimensions = getExportDimensions(project.width, project.height, scale);
      const framePlan = getGifFramePlan(project.durationMs, gifProfile);
      const work = getGifWorkBudget(dimensions.width, dimensions.height, framePlan.frameCount);
      assertSafeGifWorkBudget(work);
      assertSafeExportDimensions(dimensions.width, dimensions.height);
      const Gif = await loadGifConstructor();
      const encoder = createBrowserGifEncoder(Gif, dimensions.width, dimensions.height, gifProfile);
      const blob = await encodeGifFrames({
        durationMs: project.durationMs,
        fps: project.fps,
        frameTimesMs: framePlan.frameTimesMs,
        frameDelayMs: framePlan.delayMs,
        encoder,
        renderFrame: async (timeMs) => {
          flushSync(() => setExportTimeMs(timeMs));
          stage.draw();
          return captureStageCanvas(stage, scale);
        },
        processFrame: (frame) => processGifFrameCanvas(frame, gifPalette, gifDither),
        onProgress: setGifProgress,
      });
      downloadBlob(blob, 'flash-nick.gif');
    } catch (error) {
      setErrorNotice({ title: 'GIF oluşturulamadı.', message: getErrorMessage(error) });
    } finally {
      flushSync(() => setExportTimeMs(null));
      stage.draw();
      setGifExporting(false);
      setGifProgress(0);
    }
  }, [gifExporting, project.durationMs, project.exportSettings.gifDither, project.exportSettings.gifPalette, project.exportSettings.gifProfile, project.exportSettings.scale, project.fps, project.height, project.width]);

  const handleAddText = () => {
    setErrorNotice(null);
    addText();
    setActiveStep('nick');
    setActiveToolSection('flashnick');
  };

  const handleImageFile = async (file: File) => {
    setErrorNotice(null);
    try {
      const asset = await readImageFile(file);
      try {
        addImage(asset.url, asset.width, asset.height);
        assetRevokers.current.add(asset.revoke);
        setActiveStep('photo');
        setActiveToolSection('effects');
      } catch (error) {
        asset.revoke();
        throw error;
      }
    } catch (error) {
      setErrorNotice({ title: 'Fotoğraf eklenemedi.', message: getErrorMessage(error) });
    }
  };

  const handleStepChange = (step: WorkflowStep) => {
    setActiveStep(step);
    setActiveToolSection(WORKFLOW_TOOL[step]);
  };

  const revealPresetLibrary = () => {
    setPresetLibraryOpen(true);
    window.requestAnimationFrame(() => {
      presetLibraryRef.current?.focus();
      scrollIntoViewSafely(presetLibraryRef.current);
    });
  };

  const handleShowTemplates = () => {
    handleStepChange('style');
    revealPresetLibrary();
  };

  const handlePresetQueryChange = (query: string) => {
    setPresetQuery(query);
    if (query.trim()) setPresetLibraryOpen(true);
  };

  const handlePreviewTimeChange = (valueMs: number) => {
    setPreviewTimeMs(valueMs);
    setPreviewPlaying(false);
  };

  const handlePreviewPlayingChange = (playing: boolean) => {
    if (playing) setPreviewTimeMs(0);
    setPreviewPlaying(playing);
  };

  const previewOverrideMs = exportTimeMs ?? (previewPlaying ? null : previewTimeMs);
  const showPresetLibrary = presetLibraryOpen || presetQuery.trim().length > 0;

  return (
    <main className="app-shell studio-app-shell">
      <input
        ref={startImageInputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        aria-label="Fotoğraf seç"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void handleImageFile(file);
        }}
      />

      <StudioHeader
        onCreate={() => {
          setPresetLibraryOpen(false);
          workspaceRef.current?.focus();
        }}
        onShowTemplates={handleShowTemplates}
        onShowHelp={() => setHelpOpen((open) => !open)}
        searchQuery={presetQuery}
        onSearchQueryChange={handlePresetQueryChange}
        actions={<TopToolbar onNewProject={handleNewProject} onExport={handlePngExport} onGifExport={handleGifExport} gifExporting={gifExporting} gifProgress={gifProgress} />}
      />

      {helpOpen ? (
        <section className="studio-help-panel" role="dialog" aria-label="Yardım">
          <div>
            <strong>Flash nick hazırlamak çok basit</strong>
            <p>Fotoğrafını ekle, nickini yaz, bir stil seç, hareket veya süsleme ekle ve GIF olarak indir.</p>
          </div>
          <button type="button" onClick={() => setHelpOpen(false)} aria-label="Yardımı kapat">Kapat</button>
        </section>
      ) : null}

      {errorNotice ? (
        <div className="error-banner" role="alert">
          <strong>{errorNotice.title}</strong>
          <span>{errorNotice.message}</span>
          <button type="button" aria-label="Hata mesajını kapat" onClick={() => setErrorNotice(null)}>Kapat</button>
        </div>
      ) : null}

      {showPresetLibrary ? (
        <section ref={presetLibraryRef} className="studio-library-shell" aria-label="Hazır tasarımlar" tabIndex={-1}>
          <div className="studio-library-close-row">
            <button type="button" className="studio-library-close" onClick={() => setPresetLibraryOpen(false)}>
              Tasarımları Kapat
            </button>
          </div>
          <PresetLibrary query={presetQuery} />
        </section>
      ) : null}

      <section className="editor-layout studio-editor-layout" aria-busy={gifExporting}>
        <div className="studio-left-column">
          <WorkflowRail
            activeStep={activeStep}
            onStepChange={handleStepChange}
            onChooseImage={() => startImageInputRef.current?.click()}
            onAddText={handleAddText}
            onShowExport={() => scrollIntoViewSafely(exportSettingsRef.current)}
          />
          <div ref={toolDetailRef} className="workflow-detail-panel">
            <ToolPanel
              onAddText={handleAddText}
              onImageFile={handleImageFile}
              onGifExport={handleGifExport}
              gifExporting={gifExporting}
              gifProgress={gifProgress}
              activeSection={activeToolSection}
              onSectionChange={setActiveToolSection}
              showNavigation={false}
            />
          </div>
        </div>

        <section ref={workspaceRef} className="workspace studio-workspace" aria-label="Tasarım çalışma alanı" tabIndex={-1}>
          <WorkspaceChrome width={project.width} height={project.height} itemCount={project.elements.length} />
          <div ref={exportSettingsRef} className="studio-export-settings"><ExportPanel /></div>
          <CanvasPreview canvasWidth={project.width} canvasHeight={project.height}>
            <EditorCanvas onStageReady={handleStageReady} timeOverrideMs={previewOverrideMs} onRequestImage={() => startImageInputRef.current?.click()} />
          </CanvasPreview>
          <PlaybackStrip
            durationMs={project.durationMs}
            fps={project.fps}
            valueMs={previewTimeMs}
            onChange={handlePreviewTimeChange}
            playing={previewPlaying}
            onPlayingChange={handlePreviewPlayingChange}
            disabled={gifExporting}
          />
          <footer className="workspace-footer">
            <span>{project.width} × {project.height} px</span>
            <span>{gifExporting ? `GIF hazırlanıyor %${Math.round(gifProgress * 100)}` : 'Tasarım otomatik kaydedilir'}</span>
          </footer>
        </section>
        <TextInspector />
      </section>
    </main>
  );
}

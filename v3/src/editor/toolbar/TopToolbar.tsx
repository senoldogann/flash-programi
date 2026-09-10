import { useEditorStore } from '../../store/editor-store';

type TopToolbarProps = {
  onNewProject?: () => void;
  onExport?: () => void;
  onGifExport?: () => void;
  gifExporting?: boolean;
  gifProgress?: number;
};

export function TopToolbar({
  onNewProject,
  onExport,
  onGifExport,
  gifExporting = false,
  gifProgress = 0,
}: TopToolbarProps) {
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const progressPercent = Math.max(0, Math.min(100, Math.round(gifProgress * 100)));

  return (
    <div className="header-actions" aria-label="Tasarım işlemleri">
      <button
        type="button"
        className="secondary-action"
        disabled={!onNewProject || gifExporting}
        onClick={onNewProject}
        aria-label="Yeni Tasarım"
      >
        Baştan Başla
      </button>
      <button
        type="button"
        className="secondary-action"
        disabled={!canUndo || gifExporting}
        onClick={undo}
        aria-label="Geri Al"
      >
        Geri Al
      </button>
      <button
        type="button"
        className="secondary-action"
        disabled={!canRedo || gifExporting}
        onClick={redo}
        aria-label="Yinele"
      >
        Yeniden Yap
      </button>
      <button
        type="button"
        className="secondary-action"
        disabled={!onExport || gifExporting}
        onClick={onExport}
        aria-label="PNG İndir"
      >
        Resim İndir
      </button>
      <button
        type="button"
        className="primary-action"
        disabled={!onGifExport || gifExporting}
        onClick={onGifExport}
        aria-label="GIF İndir"
      >
        {gifExporting ? `GIF Hazırlanıyor %${progressPercent}` : 'GIF Olarak İndir'}
      </button>
    </div>
  );
}

import { useEditorStore } from '../../store/editor-store';

type TopToolbarProps = {
  onExport?: () => void;
};

export function TopToolbar({ onExport }: TopToolbarProps) {
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  return (
    <div className="header-actions" aria-label="Tasarım işlemleri">
      <button
        type="button"
        className="secondary-action"
        disabled={!canUndo}
        onClick={undo}
        aria-label="Geri Al"
      >
        Geri Al
      </button>
      <button
        type="button"
        className="secondary-action"
        disabled={!canRedo}
        onClick={redo}
        aria-label="Yinele"
      >
        Yinele
      </button>
      <button
        type="button"
        className="primary-action"
        disabled={!onExport}
        onClick={onExport}
        aria-label="PNG İndir"
      >
        PNG İndir
      </button>
    </div>
  );
}

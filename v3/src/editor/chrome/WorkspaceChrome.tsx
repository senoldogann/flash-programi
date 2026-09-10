import { CanvasSizePanel } from '../panels/CanvasSizePanel';

type WorkspaceChromeProps = {
  width: number;
  height: number;
  itemCount: number;
};

export function WorkspaceChrome({ width, height, itemCount }: WorkspaceChromeProps) {
  return (
    <div className="workspace-chrome">
      <div className="workspace-toolbar workspace-toolbar-2026">
        <div className="workspace-title-group">
          <span>Önizleme</span>
          <strong>{width} × {height}</strong>
        </div>
        <span className="workspace-spacer" />
        <span className="workspace-help">Değişiklikleri ortadaki ön izlemede görebilirsin.</span>
        <span>{itemCount} öğe</span>
      </div>

      <details className="workspace-size-disclosure" open>
        <summary>Tasarım boyutu</summary>
        <CanvasSizePanel />
      </details>
    </div>
  );
}

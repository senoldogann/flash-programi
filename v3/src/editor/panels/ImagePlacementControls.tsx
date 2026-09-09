import type { ImageElement } from '../../model/project';
import { useEditorStore } from '../../store/editor-store';

type ImagePlacementControlsProps = {
  element: ImageElement;
};

export function ImagePlacementControls({ element }: ImagePlacementControlsProps) {
  const fitImageToCanvas = useEditorStore((state) => state.fitImageToCanvas);

  return (
    <section className="inspector-section image-placement-section" aria-label="Fotoğraf kadrajı">
      <div className="section-title-row">
        <strong>Fotoğraf Kadrajı</strong>
        <span>Tek tık</span>
      </div>
      <p className="inspector-note">
        Tam fotoğrafı göster, tuvali doldur veya mevcut boyutu bozmadan ortala.
      </p>
      <div className="image-placement-grid">
        <button
          type="button"
          className="inspector-action"
          aria-label="Fotoğrafı Sığdır"
          onClick={() => fitImageToCanvas(element.id, 'contain')}
        >
          <span aria-hidden="true">⊡</span>
          <strong>Sığdır</strong>
        </button>
        <button
          type="button"
          className="inspector-action"
          aria-label="Tuvali Doldur"
          onClick={() => fitImageToCanvas(element.id, 'cover')}
        >
          <span aria-hidden="true">▣</span>
          <strong>Doldur</strong>
        </button>
        <button
          type="button"
          className="inspector-action"
          aria-label="Fotoğrafı Ortala"
          onClick={() => fitImageToCanvas(element.id, 'center')}
        >
          <span aria-hidden="true">◎</span>
          <strong>Ortala</strong>
        </button>
      </div>
    </section>
  );
}

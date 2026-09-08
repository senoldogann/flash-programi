import { useRef } from 'react';

type AddPanelProps = {
  onAddText: () => void;
  onImageFile: (file: File) => void;
};

export function AddPanel({ onAddText, onImageFile }: AddPanelProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="tool-panel" aria-label="Tasarım araçları">
      <input
        ref={imageInputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        aria-label="Fotoğraf seç"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) {
            onImageFile(file);
          }
        }}
      />

      <button
        type="button"
        className="tool-button tool-button-active"
        aria-label="Fotoğraf Seç"
        onClick={() => imageInputRef.current?.click()}
      >
        <span className="tool-icon" aria-hidden="true">▧</span>
        <span>
          <strong>Fotoğraf Seç</strong>
          <small>PNG, JPG, WebP veya GIF</small>
        </span>
      </button>

      <button
        type="button"
        className="tool-button"
        aria-label="Yazı Ekle"
        onClick={onAddText}
      >
        <span className="tool-icon" aria-hidden="true">T</span>
        <span>
          <strong>Yazı Ekle</strong>
          <small>Nick veya mesaj ekle</small>
        </span>
      </button>

      <div className="coming-tools" aria-label="Sonraki araçlar">
        <div><span>✦</span><span>Efekt</span></div>
        <div><span>▶</span><span>Hareket</span></div>
        <div><span>♥</span><span>Süsler</span></div>
        <div><span>□</span><span>Çerçeve</span></div>
      </div>
    </aside>
  );
}

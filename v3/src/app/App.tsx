import '../styles.css';

export function App() {
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

        <div className="header-actions" aria-label="Tasarım işlemleri">
          <button type="button" className="secondary-action" disabled>
            Geri Al
          </button>
          <button type="button" className="secondary-action" disabled>
            Yinele
          </button>
          <button type="button" className="primary-action">
            PNG İndir
          </button>
        </div>
      </header>

      <section className="editor-layout">
        <aside className="tool-panel" aria-label="Tasarım araçları">
          <button type="button" className="tool-button tool-button-active">
            <span className="tool-icon" aria-hidden="true">▧</span>
            <span>
              <strong>Fotoğraf Seç</strong>
              <small>Fotoğraf ekle veya değiştir</small>
            </span>
          </button>

          <button type="button" className="tool-button">
            <span className="tool-icon" aria-hidden="true">T</span>
            <span>
              <strong>Yazı Ekle</strong>
              <small>Nick veya mesaj ekle</small>
            </span>
          </button>

          <div className="coming-tools" aria-label="Yakında gelecek araçlar">
            <div><span>✦</span><span>Efekt</span></div>
            <div><span>▶</span><span>Hareket</span></div>
            <div><span>♥</span><span>Süsler</span></div>
            <div><span>□</span><span>Çerçeve</span></div>
          </div>
        </aside>

        <section className="workspace" aria-label="Tasarım çalışma alanı">
          <div className="workspace-toolbar">
            <span>Tuval Boyutu</span>
            <strong>300 × 300</strong>
            <span className="workspace-spacer" />
            <span>%100</span>
          </div>

          <div className="canvas-zone">
            <div className="canvas-card" aria-label="Tasarım alanı">
              <div className="empty-canvas">
                <div className="empty-icon" aria-hidden="true">＋</div>
                <strong>Tasarımına başla</strong>
                <span>Bir fotoğraf seç veya yazı ekle.</span>
              </div>
            </div>
          </div>

          <footer className="workspace-footer">
            <span>300 × 300 px</span>
            <span>V3 Foundation</span>
          </footer>
        </section>

        <aside className="inspector" aria-label="Seçili öğe ayarları">
          <div className="inspector-header">
            <h2>Ayarlar</h2>
          </div>
          <div className="inspector-empty">
            <strong>Henüz bir öğe seçilmedi</strong>
            <p>Fotoğraf veya yazı eklediğinde ayarları burada göreceksin.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

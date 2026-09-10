import type { ReactNode } from 'react';

type StudioHeaderProps = {
  onCreate: () => void;
  onShowTemplates: () => void;
  onShowHelp: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  actions: ReactNode;
};

function SparkleMark() {
  return (
    <svg className="studio-brand-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M22.5 3.5c1.1 7.2 4.8 10.9 12 12-7.2 1.1-10.9 4.8-12 12-1.1-7.2-4.8-10.9-12-12 7.2-1.1 10.9-4.8 12-12Z" fill="currentColor" />
      <path d="M37.5 23.5c.7 4.5 3 6.8 7.5 7.5-4.5.7-6.8 3-7.5 7.5-.7-4.5-3-6.8-7.5-7.5 4.5-.7 6.8-3 7.5-7.5Z" fill="currentColor" opacity=".78" />
      <path d="M10.5 31.5c.5 3.2 2.1 4.8 5.3 5.3-3.2.5-4.8 2.1-5.3 5.3-.5-3.2-2.1-4.8-5.3-5.3 3.2-.5 4.8-2.1 5.3-5.3Z" fill="currentColor" opacity=".58" />
    </svg>
  );
}

export function StudioHeader({
  onCreate,
  onShowTemplates,
  onShowHelp,
  searchQuery,
  onSearchQueryChange,
  actions,
}: StudioHeaderProps) {
  return (
    <header className="studio-header">
      <div className="studio-brand">
        <div className="studio-brand-mark"><SparkleMark /></div>
        <div className="studio-brand-copy">
          <h1>Flash Programı</h1>
          <p>Nostalji. Şimdi daha güçlü.</p>
        </div>
      </div>

      <nav className="studio-nav" aria-label="Ana menü">
        <button type="button" className="studio-nav-item studio-nav-item-active" onClick={onCreate}>
          Oluştur
        </button>
        <button type="button" className="studio-nav-item" onClick={onShowTemplates}>
          Hazır Tasarımlar
        </button>
        <button type="button" className="studio-nav-item" onClick={onShowHelp}>
          Yardım
        </button>
      </nav>

      <div className="studio-header-tools">
        <label className="studio-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Hazır tasarım ara"
            placeholder="Hazır tasarım ara..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
          />
        </label>
        <button type="button" className="studio-compact-help" aria-label="Yardımı Aç" onClick={onShowHelp}>
          <span aria-hidden="true">?</span>
          <span>Yardım</span>
        </button>
        <div className="studio-header-actions">{actions}</div>
      </div>
    </header>
  );
}

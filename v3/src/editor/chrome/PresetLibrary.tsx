import { useMemo, useState } from 'react';
import { CLASSIC_SCENE_RECIPES, type ClassicSceneRecipe } from '../../classic/recipes';
import { NEO_SCENE_RECIPES, type NeoSceneRecipe } from '../../neo/recipes';
import { useEditorStore } from '../../store/editor-store';

type PresetLibraryProps = {
  query: string;
};

type PresetCategory = 'all' | 'popular' | 'classic' | 'modern';

type PresetEntry =
  | { family: 'classic'; recipe: ClassicSceneRecipe }
  | { family: 'modern'; recipe: NeoSceneRecipe };

const POPULAR_IDS = new Set([
  'altin-doner-nick',
  'resimli-doner-nick',
  'kral-tac-nick',
  'neon-night',
  'golden-queen',
  'purple-glass',
  'cinematic-portrait',
]);

const CATEGORY_OPTIONS: Array<{ id: PresetCategory; label: string }> = [
  { id: 'all', label: 'Tümü' },
  { id: 'popular', label: 'Popüler' },
  { id: 'classic', label: 'Klasik SesliChat' },
  { id: 'modern', label: 'Modern' },
];

function layoutLabel(layout: ClassicSceneRecipe['layout'] | NeoSceneRecipe['layout']): string {
  if (layout === 'nick') return 'Nick';
  if (layout === 'portrait-left') return 'Fotoğraflı';
  return 'Portre';
}

export function PresetLibrary({ query }: PresetLibraryProps) {
  const applyClassicRecipe = useEditorStore((state) => state.applyClassicRecipe);
  const applyNeoRecipe = useEditorStore((state) => state.applyNeoRecipe);
  const [category, setCategory] = useState<PresetCategory>('all');

  const entries = useMemo<PresetEntry[]>(() => [
    ...CLASSIC_SCENE_RECIPES.map((recipe) => ({ family: 'classic' as const, recipe })),
    ...NEO_SCENE_RECIPES.map((recipe) => ({ family: 'modern' as const, recipe })),
  ], []);

  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
  const visibleEntries = entries.filter((entry) => {
    const matchesQuery = normalizedQuery.length === 0
      || entry.recipe.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery);
    if (!matchesQuery) return false;
    if (category === 'classic') return entry.family === 'classic';
    if (category === 'modern') return entry.family === 'modern';
    if (category === 'popular') return POPULAR_IDS.has(entry.recipe.id);
    return true;
  });

  return (
    <section className="preset-library" aria-label="Hazır tasarım kütüphanesi">
      <div className="preset-library-heading">
        <div>
          <span className="preset-library-kicker">Hazır Tasarımlar</span>
          <h2>Bir görünüm seç, ayrıntıları sonra değiştir.</h2>
        </div>
        <span className="preset-library-count" aria-live="polite">{visibleEntries.length} tasarım</span>
      </div>

      <div className="preset-library-filters" aria-label="Tasarım türü">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={category === option.id ? 'selected' : ''}
            aria-pressed={category === option.id}
            onClick={() => setCategory(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visibleEntries.length > 0 ? (
        <div className="preset-library-grid">
          {visibleEntries.map((entry) => (
            <button
              key={`${entry.family}-${entry.recipe.id}`}
              type="button"
              className="preset-library-card"
              aria-label={`${entry.recipe.name} uygula`}
              onClick={() => {
                if (entry.family === 'classic') applyClassicRecipe(entry.recipe.id);
                else applyNeoRecipe(entry.recipe.id);
              }}
            >
              <span
                className="preset-library-preview"
                style={{ background: `radial-gradient(circle at 25% 20%, rgba(255,255,255,.16), transparent 38%), ${entry.recipe.background}` }}
                aria-hidden="true"
              >
                <span>{entry.family === 'classic' ? 'FLASH' : 'NEO'}</span>
              </span>
              <span className="preset-library-copy">
                <strong>{entry.recipe.name}</strong>
                <small>{layoutLabel(entry.recipe.layout)} · {entry.recipe.width} × {entry.recipe.height}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="preset-library-empty" role="status">
          <strong>Bu aramayla eşleşen tasarım yok.</strong>
          <span>Başka bir isim dene veya “Tümü” seçeneğine dön.</span>
        </div>
      )}
    </section>
  );
}

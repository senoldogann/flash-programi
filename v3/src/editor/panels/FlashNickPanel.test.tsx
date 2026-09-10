import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { FlashNickPanel } from './FlashNickPanel';

const CLASSIC_RECIPE_NAMES = [
  'Altın Döner Nick',
  'Krom Döner Nick',
  'Mor Bayan Flash',
  'Kırmızı Kalpli Bayan',
  'Mavi Erkek Flash',
  'Şapkalı Flash',
  'Ateş Nick',
  'Türk Bayraklı',
  'Gotik Siyah',
  'Glitter Princess',
  'Çift Nick',
  'Resimli Döner Nick',
  'Sinevizyon Portre',
  'Aşk Flash',
  'Kral / Taç Nick',
] as const;

describe('FlashNickPanel', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('exposes all 15 Classic scene recipes in easy mode', () => {
    render(<FlashNickPanel />);

    expect(screen.getByText('Klasik Hazır Tasarımlar')).toBeInTheDocument();
    for (const name of CLASSIC_RECIPE_NAMES) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('applies a complete Classic recipe from one easy-mode card', () => {
    render(<FlashNickPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Altın Döner Nick' }));

    const state = useEditorStore.getState();
    const text = state.project.elements.find((element) => element.type === 'text');
    expect(state.project).toMatchObject({
      width: 133,
      height: 33,
      frame: { preset: 'gold' },
      exportSettings: { gifPalette: 'classic-64', gifDither: 'ordered-4x4' },
    });
    expect(state.project.decorations.length).toBeGreaterThan(0);
    expect(text).toMatchObject({
      materialPreset: 'xara-gold',
      animation: { preset: 'xara-double-sided' },
    });
  });

  it('creates a classic 133x33 Xara-style nick without requiring an existing text element', () => {
    render(<FlashNickPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Klasik Nick 133 × 33' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xara Altın' }));

    const state = useEditorStore.getState();
    const text = state.project.elements.find((element) => element.type === 'text');

    expect(state.project).toMatchObject({ width: 133, height: 33 });
    expect(text).toMatchObject({
      type: 'text',
      materialPreset: 'xara-gold',
      extrusionDepth: 5,
      align: 'center',
    });
  });

  it('promotes a photo to a subject and applies Neo cutout motion in one edit', () => {
    const id = useEditorStore.getState().addImage('blob:transparent-person', 120, 180);
    const historyBefore = useEditorStore.getState().past.length;
    render(<FlashNickPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Neo Flash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nefes' }));

    const state = useEditorStore.getState();
    const image = state.project.elements.find((element) => element.id === id);
    expect(image).toMatchObject({
      type: 'image',
      role: 'subject',
      animation: {
        preset: 'breathing-zoom',
        speed: 'slow',
        intensity: 'subtle',
      },
    });
    expect(state.past).toHaveLength(historyBefore + 1);
  });

  it('supports different front and back nick text for the classic double-sided rotation', () => {
    const id = useEditorStore.getState().addText('SENOL');
    useEditorStore.getState().selectElement(id);
    render(<FlashNickPanel />);

    fireEvent.change(screen.getByLabelText('Arka yüz yazısı'), { target: { value: 'DOGAN' } });
    fireEvent.click(screen.getByRole('button', { name: 'Çift Taraflı Döndür' }));

    const text = useEditorStore.getState().project.elements.find((element) => element.id === id);
    expect(text).toMatchObject({
      type: 'text',
      backText: 'DOGAN',
      animation: { preset: 'xara-double-sided' },
    });
  });
});

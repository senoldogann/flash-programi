import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { FlashNickPanel } from './FlashNickPanel';

describe('FlashNickPanel', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
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

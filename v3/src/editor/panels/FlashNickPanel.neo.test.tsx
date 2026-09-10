import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { FlashNickPanel } from './FlashNickPanel';

const NEO_NAMES = [
  'Golden Queen',
  'Neon Night',
  'Purple Glass',
  'Cyber Blue',
  'Royal Red',
  'Diamond',
  'Fire Goddess',
  'Frozen',
  'Dark Luxury',
  'Angel',
  'Dream',
  'Fashion Walk',
  'Cinematic Portrait',
  'Holographic',
  'Chrome Future',
] as const;

describe('FlashNickPanel Classic / Neo modes', () => {
  beforeEach(() => useEditorStore.getState().reset());

  it('switches to Neo without restyling or deleting the current design', () => {
    const textId = useEditorStore.getState().addText('SENOL');
    const before = structuredClone(useEditorStore.getState().project);
    render(<FlashNickPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Neo Flash' }));

    const after = useEditorStore.getState().project;
    expect(after.mode).toBe('neo');
    expect(after.elements).toEqual(before.elements);
    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
    expect(after.elements.find((element) => element.id === textId)).toBeTruthy();
    expect(screen.getByText('Neo Hazır Tasarımlar')).toBeInTheDocument();
    expect(screen.queryByText('Klasik Hazır Tasarımlar')).not.toBeInTheDocument();
  });

  it('exposes all 15 Neo scene recipes and applies one from a single card', () => {
    render(<FlashNickPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Neo Flash' }));

    for (const name of NEO_NAMES) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole('button', { name: 'Neon Night' }));
    const state = useEditorStore.getState();
    const text = state.project.elements.find((element) => element.type === 'text');

    expect(state.project.mode).toBe('neo');
    expect(state.project.exportSettings).toMatchObject({ gifPalette: 'adaptive', gifDither: 'none' });
    expect(state.project.decorations.some((layer) =>
      ['ambient-orbs', 'glow-dust', 'light-sweep'].includes(layer.preset),
    )).toBe(true);
    expect(text).toMatchObject({ materialPreset: 'neo-neon' });
  });

  it('can return to Classic without mutating scene content', () => {
    render(<FlashNickPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Neo Flash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Neon Night' }));
    const neo = structuredClone(useEditorStore.getState().project);

    fireEvent.click(screen.getByRole('button', { name: 'Classic SesliChat' }));
    const classicView = useEditorStore.getState().project;

    expect(classicView.mode).toBe('classic');
    expect(classicView.elements).toEqual(neo.elements);
    expect(classicView.decorations).toEqual(neo.decorations);
    expect(screen.getByText('Klasik Hazır Tasarımlar')).toBeInTheDocument();
  });
});

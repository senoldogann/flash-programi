import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { PresetLibrary } from './PresetLibrary';

describe('PresetLibrary', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('filters only real recipes and applies the selected recipe', () => {
    render(<PresetLibrary query="neon" />);

    expect(screen.getByRole('button', { name: /Neon Night/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Altın Döner Nick/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Neon Night/i }));
    expect(useEditorStore.getState().project.background).toBe('#050718');
  });

  it('switches between real classic and modern recipe groups', () => {
    render(<PresetLibrary query="" />);

    fireEvent.click(screen.getByRole('button', { name: 'Klasik SesliChat' }));
    expect(screen.getByRole('button', { name: /Altın Döner Nick/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Neon Night/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Modern' }));
    expect(screen.getByRole('button', { name: /Neon Night/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Altın Döner Nick/i })).not.toBeInTheDocument();
  });
});

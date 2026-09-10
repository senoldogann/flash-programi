import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { EasyStartPanel } from './EasyStartPanel';

describe('EasyStartPanel', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('shows the four-step Turkish beginner flow', () => {
    render(<EasyStartPanel onChooseImage={vi.fn()} onGifExport={vi.fn()} />);

    expect(screen.getByRole('heading', { name: '4 adımda Flash nick hazırla' })).toBeInTheDocument();
    expect(screen.getByText('Fotoğrafını ekle')).toBeInTheDocument();
    expect(screen.getByLabelText('Nickini yaz')).toBeInTheDocument();
    expect(screen.getByText('Bir görünüm seç')).toBeInTheDocument();
    expect(screen.getByText('Hazırsa GIF olarak indir')).toBeInTheDocument();
  });

  it('creates the typed nick and enables one-click prepared styles', () => {
    render(<EasyStartPanel onChooseImage={vi.fn()} onGifExport={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nickini yaz'), { target: { value: 'LEIJONA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nicki Ekle' }));

    expect(useEditorStore.getState().project.elements).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'text', text: 'LEIJONA' })]),
    );

    const modernNeon = screen.getByRole('button', { name: /Modern Neon/i });
    expect(modernNeon).toBeEnabled();
    fireEvent.click(modernNeon);

    expect(useEditorStore.getState().project.mode).toBe('neo');
  });

  it('keeps GIF export disabled until there is design content', () => {
    const onGifExport = vi.fn();
    render(<EasyStartPanel onChooseImage={vi.fn()} onGifExport={onGifExport} />);

    const exportButton = screen.getByRole('button', { name: 'GIF Olarak İndir' });
    expect(exportButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nickini yaz'), { target: { value: 'SENOL' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nicki Ekle' }));

    expect(exportButton).toBeEnabled();
    fireEvent.click(exportButton);
    expect(onGifExport).toHaveBeenCalledTimes(1);
  });
});

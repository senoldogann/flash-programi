import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { ToolPanel } from './ToolPanel';

describe('ToolPanel', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('opens every primary design category from its visible button', () => {
    render(<ToolPanel onAddText={vi.fn()} onImageFile={vi.fn()} />);

    const categories = [
      ['Efekt', 'Fotoğraf efektleri'],
      ['Hareket', 'Hareket ayarları'],
      ['Süsler', 'Süs ayarları'],
      ['Çerçeve', 'Çerçeve ayarları'],
      ['Hazır Tasarımlar', 'Hazır tasarımlar'],
    ] as const;

    for (const [buttonName, panelName] of categories) {
      fireEvent.click(screen.getByRole('button', { name: buttonName }));
      expect(screen.getByLabelText(panelName)).toBeInTheDocument();
    }
  });

  it('keeps tool navigation outside the independently scrollable content area', () => {
    render(<ToolPanel onAddText={vi.fn()} onImageFile={vi.fn()} />);

    const nav = screen.getByTestId('tool-panel-nav');
    const content = screen.getByTestId('tool-panel-content');

    expect(within(nav).getByRole('button', { name: 'Fotoğraf Seç' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Yazı Ekle' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Efekt' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Hazır Tasarımlar' })).toBeInTheDocument();

    fireEvent.click(within(nav).getByRole('button', { name: 'Hazır Tasarımlar' }));

    expect(within(content).getByLabelText('Hazır tasarımlar')).toBeInTheDocument();
    expect(within(nav).queryByLabelText('Hazır tasarımlar')).not.toBeInTheDocument();
  });

  it('resets the independently scrollable content when switching categories', () => {
    render(<ToolPanel onAddText={vi.fn()} onImageFile={vi.fn()} />);

    const nav = screen.getByTestId('tool-panel-nav');
    const content = screen.getByTestId('tool-panel-content');

    fireEvent.click(within(nav).getByRole('button', { name: 'Hazır Tasarımlar' }));
    content.scrollTop = 180;
    expect(content.scrollTop).toBe(180);

    fireEvent.click(within(nav).getByRole('button', { name: 'Efekt' }));

    expect(content.scrollTop).toBe(0);
    expect(within(content).getByLabelText('Fotoğraf efektleri')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
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
});

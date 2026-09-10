import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportActions } from './ExportActions';

describe('ExportActions', () => {
  it('makes GIF the primary action and shows live export progress', () => {
    const gif = vi.fn();
    const png = vi.fn();

    render(
      <ExportActions
        onGifExport={gif}
        onPngExport={png}
        gifExporting
        gifProgress={0.42}
      />,
    );

    expect(screen.getByRole('button', { name: 'GIF İndir' })).toHaveTextContent('42');
    expect(screen.getByRole('button', { name: 'PNG İndir' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(/GIF hazırlanıyor/i);
  });

  it('calls existing PNG and GIF export callbacks when idle', () => {
    const gif = vi.fn();
    const png = vi.fn();

    render(
      <ExportActions
        onGifExport={gif}
        onPngExport={png}
        gifExporting={false}
        gifProgress={0}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'PNG İndir' }));
    fireEvent.click(screen.getByRole('button', { name: 'GIF İndir' }));

    expect(png).toHaveBeenCalledTimes(1);
    expect(gif).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlaybackStrip } from './PlaybackStrip';

describe('PlaybackStrip', () => {
  it('exposes play and a scrubber backed by project duration', () => {
    render(
      <PlaybackStrip
        durationMs={2000}
        fps={20}
        valueMs={0}
        onChange={vi.fn()}
        playing={false}
        onPlayingChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Önizlemeyi Oynat' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Önizleme zamanı' })).toHaveAttribute('max', '2000');
    expect(screen.getByText('20 FPS')).toBeInTheDocument();
  });

  it('reports play state and scrubber changes through callbacks', () => {
    const onChange = vi.fn();
    const onPlayingChange = vi.fn();

    render(
      <PlaybackStrip
        durationMs={3000}
        fps={24}
        valueMs={750}
        onChange={onChange}
        playing={false}
        onPlayingChange={onPlayingChange}
      />,
    );

    fireEvent.change(screen.getByRole('slider', { name: 'Önizleme zamanı' }), { target: { value: '1250' } });
    expect(onChange).toHaveBeenCalledWith(1250);

    fireEvent.click(screen.getByRole('button', { name: 'Önizlemeyi Oynat' }));
    expect(onPlayingChange).toHaveBeenCalledWith(true);
  });
});

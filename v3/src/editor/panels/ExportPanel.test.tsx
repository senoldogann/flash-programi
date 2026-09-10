import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { ExportPanel } from './ExportPanel';

describe('ExportPanel', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('updates export quality/color settings without changing visual geometry or history', () => {
    useEditorStore.getState().addText('Export');
    const geometryBefore = structuredClone(useEditorStore.getState().project.elements);
    const historyBefore = useEditorStore.getState().past.length;

    render(<ExportPanel />);

    expect(screen.getByLabelText('Dışa aktarma ayarları')).toHaveTextContent('300 × 300 px');
    fireEvent.click(screen.getByText('Gelişmiş Ayarlar'));

    expect(screen.getByRole('button', { name: '1x' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4x' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Küçük' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dengeli' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kaliteli' })).toBeInTheDocument();
    expect(screen.getByText('GIF Renk Paleti')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Uyarlanabilir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Klasik 64' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Klasik 27' })).toBeInTheDocument();
    expect(screen.getByText('Dither')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kapalı' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ordered 4×4' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2x' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kaliteli' }));
    fireEvent.click(screen.getByRole('button', { name: 'Klasik 64' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ordered 4×4' }));

    const state = useEditorStore.getState();
    expect(state.project.exportSettings).toEqual({
      scale: 2,
      gifProfile: 'quality',
      gifPalette: 'classic-64',
      gifDither: 'ordered-4x4',
    });
    expect(state.project.elements).toEqual(geometryBefore);
    expect(state.past).toHaveLength(historyBefore);
    expect(screen.getByLabelText('Dışa aktarma ayarları')).toHaveTextContent('600 × 600 px');
  });

  it('shows an output-dimension warning when a selected scale exceeds 4096px', () => {
    useEditorStore.getState().resizeProject(1200, 50);
    useEditorStore.getState().setExportSettings({ scale: 4, gifProfile: 'small' });

    render(<ExportPanel />);

    expect(screen.getByRole('alert')).toHaveTextContent(/4096/i);
  });

  it('shows a GIF work-budget warning when selected output settings exceed the safe ceiling', () => {
    useEditorStore.getState().resizeProject(4096, 4096);
    useEditorStore.getState().setExportSettings({ scale: 4, gifProfile: 'quality' });

    render(<ExportPanel />);

    expect(screen.getByRole('alert')).toHaveTextContent(/GIF/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/100/i);
  });
});

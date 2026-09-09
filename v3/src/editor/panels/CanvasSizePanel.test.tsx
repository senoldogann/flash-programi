import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { CanvasSizePanel } from './CanvasSizePanel';

describe('CanvasSizePanel', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('shows current dimensions and applies a preset resize once', () => {
    render(<CanvasSizePanel />);

    expect(screen.getByLabelText('Tuval boyutu ayarları')).toHaveTextContent('300 × 300');

    fireEvent.click(screen.getByRole('button', { name: '600 × 200' }));

    expect(useEditorStore.getState().project).toMatchObject({ width: 600, height: 200 });
  });

  it('keeps custom dimensions as drafts until a valid apply action', () => {
    const before = structuredClone(useEditorStore.getState().project);
    render(<CanvasSizePanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Özel' }));
    fireEvent.change(screen.getByLabelText('Özel genişlik'), { target: { value: '450' } });
    fireEvent.change(screen.getByLabelText('Özel yükseklik'), { target: { value: '150' } });

    expect(useEditorStore.getState().project).toEqual(before);

    fireEvent.click(screen.getByRole('button', { name: 'Özel Boyutu Uygula' }));
    expect(useEditorStore.getState().project).toMatchObject({ width: 450, height: 150 });
  });

  it('rejects invalid custom dimensions without mutating the project', () => {
    const before = structuredClone(useEditorStore.getState().project);
    render(<CanvasSizePanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Özel' }));
    fireEvent.change(screen.getByLabelText('Özel genişlik'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Özel yükseklik'), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: 'Özel Boyutu Uygula' }));

    expect(screen.getByRole('alert')).toHaveTextContent('32');
    expect(useEditorStore.getState().project).toEqual(before);
  });
});

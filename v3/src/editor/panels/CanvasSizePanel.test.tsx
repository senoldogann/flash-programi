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

  it('exposes all approved historical Classic sizes as presets', () => {
    render(<CanvasSizePanel />);

    for (const label of [
      '120 × 70',
      '125 × 75',
      '130 × 70',
      '130 × 95',
      '130 × 100',
      '133 × 33',
      '300 × 100',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
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

  it('exposes the approved custom width and height limits', () => {
    render(<CanvasSizePanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Özel' }));

    expect(screen.getByLabelText('Özel genişlik')).toHaveAttribute('min', '50');
    expect(screen.getByLabelText('Özel genişlik')).toHaveAttribute('max', '1200');
    expect(screen.getByLabelText('Özel yükseklik')).toHaveAttribute('min', '30');
    expect(screen.getByLabelText('Özel yükseklik')).toHaveAttribute('max', '1200');
  });

  it('rejects custom dimensions outside the approved range without mutating the project', () => {
    const before = structuredClone(useEditorStore.getState().project);
    render(<CanvasSizePanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Özel' }));
    fireEvent.change(screen.getByLabelText('Özel genişlik'), { target: { value: '49' } });
    fireEvent.change(screen.getByLabelText('Özel yükseklik'), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: 'Özel Boyutu Uygula' }));

    expect(screen.getByRole('alert')).toHaveTextContent('50-1200');
    expect(useEditorStore.getState().project).toEqual(before);

    fireEvent.change(screen.getByLabelText('Özel genişlik'), { target: { value: '450' } });
    fireEvent.change(screen.getByLabelText('Özel yükseklik'), { target: { value: '29' } });
    fireEvent.click(screen.getByRole('button', { name: 'Özel Boyutu Uygula' }));

    expect(screen.getByRole('alert')).toHaveTextContent('30-1200');
    expect(useEditorStore.getState().project).toEqual(before);
  });
});

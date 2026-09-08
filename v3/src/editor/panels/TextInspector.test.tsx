import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../../store/editor-store';
import { TextInspector } from './TextInspector';

describe('TextInspector', () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it('edits rich text styling and common element controls', () => {
    const id = useEditorStore.getState().addText('KraL');
    render(<TextInspector />);

    fireEvent.change(screen.getByLabelText('Yazı Tipi'), { target: { value: 'Impact' } });
    fireEvent.change(screen.getByLabelText('Opaklık'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('Parlama Rengi'), { target: { value: '#ff00aa' } });
    fireEvent.change(screen.getByLabelText('Parlama Gücü'), { target: { value: '18' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sağa Hizala' }));
    fireEvent.click(screen.getByRole('button', { name: 'Öğeyi Kilitle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Öğeyi Gizle' }));

    const element = useEditorStore.getState().project.elements.find((item) => item.id === id);
    expect(element).toMatchObject({
      type: 'text',
      fontFamily: 'Impact',
      opacity: 0.4,
      shadowColor: '#ff00aa',
      shadowBlur: 18,
      align: 'right',
      locked: true,
      visible: false,
    });
  });

  it('shows useful common controls for selected images', () => {
    const id = useEditorStore.getState().addImage('blob:photo', 640, 480);
    render(<TextInspector />);

    expect(screen.getByRole('heading', { name: 'Fotoğraf Ayarları' })).toBeInTheDocument();
    expect(screen.getByLabelText('Opaklık')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Öğeyi Kilitle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Öğeyi Gizle' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Opaklık'), { target: { value: '0.65' } });
    const element = useEditorStore.getState().project.elements.find((item) => item.id === id);
    expect(element).toMatchObject({ type: 'image', opacity: 0.65 });
  });

  it('deletes the selected element and clears selection', () => {
    useEditorStore.getState().addText('Sil Beni');
    render(<TextInspector />);

    fireEvent.click(screen.getByRole('button', { name: 'Öğeyi Sil' }));

    expect(useEditorStore.getState().project.elements).toHaveLength(0);
    expect(useEditorStore.getState().selectedElementId).toBeNull();
  });
});

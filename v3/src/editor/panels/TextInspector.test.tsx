import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('records a typing session as one undoable history step', () => {
    const id = useEditorStore.getState().addText('Kral');
    const historyBefore = useEditorStore.getState().past.length;
    render(<TextInspector />);

    const input = screen.getByLabelText('Yazı');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'K' } });
    fireEvent.change(input, { target: { value: 'Kr' } });
    fireEvent.change(input, { target: { value: 'Kra' } });
    fireEvent.change(input, { target: { value: 'Kraliçe' } });
    fireEvent.blur(input);

    expect(useEditorStore.getState().past).toHaveLength(historyBefore + 1);
    expect(useEditorStore.getState().project.elements.find((item) => item.id === id)).toMatchObject({
      type: 'text',
      text: 'Kraliçe',
    });

    act(() => {
      useEditorStore.getState().undo();
    });
    expect(useEditorStore.getState().project.elements.find((item) => item.id === id)).toMatchObject({
      type: 'text',
      text: 'Kral',
    });
  });

  it('records a continuous slider session as one undoable history step', () => {
    const id = useEditorStore.getState().addText('Kral');
    const historyBefore = useEditorStore.getState().past.length;
    render(<TextInspector />);

    const opacity = screen.getByLabelText('Opaklık');
    fireEvent.focus(opacity);
    fireEvent.change(opacity, { target: { value: '0.85' } });
    fireEvent.change(opacity, { target: { value: '0.6' } });
    fireEvent.change(opacity, { target: { value: '0.35' } });
    fireEvent.blur(opacity);

    expect(useEditorStore.getState().past).toHaveLength(historyBefore + 1);
    expect(useEditorStore.getState().project.elements.find((item) => item.id === id)).toMatchObject({
      opacity: 0.35,
    });

    act(() => {
      useEditorStore.getState().undo();
    });
    expect(useEditorStore.getState().project.elements.find((item) => item.id === id)).toMatchObject({
      opacity: 1,
    });
  });

  it('switches writing mode without mutating source text and keeps the box center in one undo step', () => {
    const id = useEditorStore.getState().addText('A👨‍👩‍👧‍👦B');
    const before = structuredClone(
      useEditorStore.getState().project.elements.find((item) => item.id === id),
    );
    if (!before || before.type !== 'text') throw new Error('text fixture missing');
    const historyBefore = useEditorStore.getState().past.length;

    render(<TextInspector />);
    fireEvent.click(screen.getByRole('button', { name: 'Dikey' }));

    const vertical = useEditorStore.getState().project.elements.find((item) => item.id === id);
    if (!vertical || vertical.type !== 'text') throw new Error('vertical text missing');

    expect(vertical.writingMode).toBe('vertical-stacked');
    expect(vertical.text).toBe('A👨‍👩‍👧‍👦B');
    expect(vertical.x + vertical.width / 2).toBeCloseTo(before.x + before.width / 2, 5);
    expect(vertical.y + vertical.height / 2).toBeCloseTo(before.y + before.height / 2, 5);
    expect(useEditorStore.getState().past).toHaveLength(historyBefore + 1);

    act(() => {
      useEditorStore.getState().undo();
    });

    expect(useEditorStore.getState().project.elements.find((item) => item.id === id)).toMatchObject({
      type: 'text',
      text: before.text,
      writingMode: before.writingMode,
      x: before.x,
      y: before.y,
      width: before.width,
      height: before.height,
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

import { describe, expect, it, vi } from 'vitest';
import { handleEditorShortcut } from './keyboard-shortcuts';

function keyboardEvent(
  key: string,
  options: KeyboardEventInit = {},
  target?: EventTarget,
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, ...options });
  if (target) Object.defineProperty(event, 'target', { value: target });
  return event;
}

describe('editor keyboard shortcuts', () => {
  it('uses Cmd/Ctrl+Z for undo', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const macEvent = keyboardEvent('z', { metaKey: true });
    const windowsEvent = keyboardEvent('z', { ctrlKey: true });

    expect(handleEditorShortcut(macEvent, { undo, redo })).toBe(true);
    expect(handleEditorShortcut(windowsEvent, { undo, redo })).toBe(true);

    expect(undo).toHaveBeenCalledTimes(2);
    expect(redo).not.toHaveBeenCalled();
    expect(macEvent.defaultPrevented).toBe(true);
    expect(windowsEvent.defaultPrevented).toBe(true);
  });

  it('uses Cmd/Ctrl+Shift+Z and Ctrl+Y for redo', () => {
    const undo = vi.fn();
    const redo = vi.fn();

    handleEditorShortcut(keyboardEvent('z', { metaKey: true, shiftKey: true }), { undo, redo });
    handleEditorShortcut(keyboardEvent('z', { ctrlKey: true, shiftKey: true }), { undo, redo });
    handleEditorShortcut(keyboardEvent('y', { ctrlKey: true }), { undo, redo });

    expect(redo).toHaveBeenCalledTimes(3);
    expect(undo).not.toHaveBeenCalled();
  });

  it('ignores undo and redo shortcuts while typing in editable controls', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const editable = document.createElement('div');
    editable.contentEditable = 'true';

    const targets: Array<[string, HTMLElement]> = [
      ['input', input],
      ['textarea', textarea],
      ['select', select],
      ['contenteditable', editable],
    ];

    for (const [label, target] of targets) {
      const event = keyboardEvent('z', { ctrlKey: true }, target);
      expect(handleEditorShortcut(event, { undo, redo }), label).toBe(false);
      expect(event.defaultPrevented, `${label} defaultPrevented`).toBe(false);
    }

    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });

  it('ignores unrelated shortcuts', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const event = keyboardEvent('s', { ctrlKey: true });

    expect(handleEditorShortcut(event, { undo, redo })).toBe(false);
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});

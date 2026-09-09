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
    const exportPng = vi.fn();
    const macEvent = keyboardEvent('z', { metaKey: true });
    const windowsEvent = keyboardEvent('z', { ctrlKey: true });

    expect(handleEditorShortcut(macEvent, { undo, redo, exportPng })).toBe(true);
    expect(handleEditorShortcut(windowsEvent, { undo, redo, exportPng })).toBe(true);

    expect(undo).toHaveBeenCalledTimes(2);
    expect(redo).not.toHaveBeenCalled();
    expect(exportPng).not.toHaveBeenCalled();
    expect(macEvent.defaultPrevented).toBe(true);
    expect(windowsEvent.defaultPrevented).toBe(true);
  });

  it('uses Cmd/Ctrl+Shift+Z and Ctrl+Y for redo', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const exportPng = vi.fn();

    handleEditorShortcut(keyboardEvent('z', { metaKey: true, shiftKey: true }), { undo, redo, exportPng });
    handleEditorShortcut(keyboardEvent('z', { ctrlKey: true, shiftKey: true }), { undo, redo, exportPng });
    handleEditorShortcut(keyboardEvent('y', { ctrlKey: true }), { undo, redo, exportPng });

    expect(redo).toHaveBeenCalledTimes(3);
    expect(undo).not.toHaveBeenCalled();
    expect(exportPng).not.toHaveBeenCalled();
  });

  it('uses Cmd/Ctrl+S for PNG export and prevents the browser save dialog', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const exportPng = vi.fn();
    const macEvent = keyboardEvent('s', { metaKey: true });
    const windowsEvent = keyboardEvent('s', { ctrlKey: true });

    expect(handleEditorShortcut(macEvent, { undo, redo, exportPng })).toBe(true);
    expect(handleEditorShortcut(windowsEvent, { undo, redo, exportPng })).toBe(true);

    expect(exportPng).toHaveBeenCalledTimes(2);
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
    expect(macEvent.defaultPrevented).toBe(true);
    expect(windowsEvent.defaultPrevented).toBe(true);
  });

  it('ignores undo and redo shortcuts while typing in editable controls', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const exportPng = vi.fn();
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
      expect(handleEditorShortcut(event, { undo, redo, exportPng }), label).toBe(false);
      expect(event.defaultPrevented, `${label} defaultPrevented`).toBe(false);
    }

    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
    expect(exportPng).not.toHaveBeenCalled();
  });

  it('ignores unrelated shortcuts', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const exportPng = vi.fn();
    const event = keyboardEvent('p', { ctrlKey: true });

    expect(handleEditorShortcut(event, { undo, redo, exportPng })).toBe(false);
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
    expect(exportPng).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});

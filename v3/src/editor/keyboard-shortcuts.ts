export type EditorShortcutActions = {
  undo: () => void;
  redo: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;

  return target.closest('[contenteditable="true"]') !== null;
}

export function handleEditorShortcut(
  event: KeyboardEvent,
  actions: EditorShortcutActions,
): boolean {
  if (event.defaultPrevented || event.altKey || isEditableTarget(event.target)) return false;

  const key = event.key.toLowerCase();
  const commandKey = event.metaKey || event.ctrlKey;

  if (commandKey && key === 'z') {
    event.preventDefault();
    if (event.shiftKey) actions.redo(); else actions.undo();
    return true;
  }

  if (event.ctrlKey && !event.metaKey && !event.shiftKey && key === 'y') {
    event.preventDefault();
    actions.redo();
    return true;
  }

  return false;
}

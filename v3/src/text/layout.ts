import type { TextElement, TextWritingMode } from '../model/project';

const MAX_ELEMENT_DIMENSION = 8192;

function clampDimension(value: number): number {
  return Math.min(MAX_ELEMENT_DIMENSION, Math.max(1, value));
}

export function segmentGraphemes(text: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }

  return Array.from(text);
}

export function getDisplayText(text: string, mode: TextWritingMode): string {
  if (mode === 'horizontal') return text;
  return segmentGraphemes(text).join('\n');
}

export function getWritingModeBox(
  element: Pick<TextElement, 'x' | 'y' | 'width' | 'height' | 'fontSize'>,
  mode: TextWritingMode,
  graphemeCount: number,
): { x: number; y: number; width: number; height: number } {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const count = Math.max(1, graphemeCount);
  const lineHeight = element.fontSize * 1.2;

  const width = mode === 'vertical-stacked'
    ? clampDimension(Math.max(element.fontSize * 1.5, Math.min(element.width, element.fontSize * 2)))
    : clampDimension(Math.max(element.fontSize * 2, element.fontSize * 0.72 * count));
  const height = mode === 'vertical-stacked'
    ? clampDimension(Math.max(element.fontSize * 1.5, lineHeight * count))
    : clampDimension(Math.max(element.fontSize * 1.6, Math.min(element.height, element.fontSize * 2)));

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

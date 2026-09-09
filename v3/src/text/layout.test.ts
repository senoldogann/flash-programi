import { describe, expect, it } from 'vitest';
import { getDisplayText, getWritingModeBox, segmentGraphemes } from './layout';

describe('vertical text layout', () => {
  it('segments user-perceived graphemes without splitting emoji or combining characters', () => {
    expect(segmentGraphemes('A👨‍👩‍👧‍👦B')).toEqual(['A', '👨‍👩‍👧‍👦', 'B']);
    expect(segmentGraphemes('e\u0301x')).toEqual(['e\u0301', 'x']);
  });

  it('derives stacked display text without mutating the stored source string', () => {
    const source = 'KRAL';

    expect(getDisplayText(source, 'horizontal')).toBe('KRAL');
    expect(getDisplayText(source, 'vertical-stacked')).toBe('K\nR\nA\nL');
    expect(source).toBe('KRAL');
  });

  it('preserves the element center while deriving a sensible vertical box', () => {
    const element = { x: 20, y: 30, width: 180, height: 60, fontSize: 40 };
    const oldCenter = { x: element.x + element.width / 2, y: element.y + element.height / 2 };

    const box = getWritingModeBox(element, 'vertical-stacked', 4);

    expect(box.x + box.width / 2).toBeCloseTo(oldCenter.x, 5);
    expect(box.y + box.height / 2).toBeCloseTo(oldCenter.y, 5);
    expect(box.height).toBeGreaterThan(box.width);
  });
});

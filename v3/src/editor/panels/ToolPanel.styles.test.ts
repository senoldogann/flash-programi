import { describe, expect, it } from 'vitest';
import appStyles from '../../styles.css?raw';

describe('ToolPanel responsive scrolling', () => {
  it('bounds active tool content on mobile instead of growing the whole document', () => {
    const normalized = appStyles.replace(/\s+/g, '');

    expect(normalized).toContain('@media(max-width:720px)');
    expect(normalized).toContain(
      '.tool-panel-content{max-height:min(60vh,520px);overflow-y:auto;overscroll-behavior:contain;',
    );
  });
});

import { describe, expect, it } from 'vitest';
import appStyles from '../../styles.css?raw';

describe('ToolPanel responsive scrolling', () => {
  it('bounds active tool content on mobile instead of growing the whole document', () => {
    const mobileStyles = appStyles.slice(appStyles.lastIndexOf('@media (max-width: 720px)'));
    const contentRule = mobileStyles.match(/\.tool-panel-content\s*\{([^}]*)\}/s)?.[1] ?? '';

    expect(contentRule).toContain('max-height:');
    expect(contentRule).toContain('overflow-y: auto');
    expect(contentRule).toContain('overscroll-behavior: contain');
  });
});

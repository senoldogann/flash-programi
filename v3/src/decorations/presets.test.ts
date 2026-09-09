import { describe, expect, it } from 'vitest';
import type { DecorationLayer } from '../model/project';
import { DECORATION_PRESETS, decorationPoints } from './presets';

const layer: DecorationLayer = {
  id: 'stable-layer',
  preset: 'stars',
  count: 8,
  opacity: 0.8,
  speed: 'normal',
};

describe('decoration presets', () => {
  it('contains all approved decoration categories', () => {
    expect(DECORATION_PRESETS.map((preset) => preset.id)).toEqual([
      'stars',
      'hearts',
      'sparkles',
      'snow',
      'bubbles',
      'confetti',
      'flowers',
      'butterflies',
      'fire',
      'lightning',
      'turkish',
      'diamonds',
      'music',
      'crowns',
      'roses',
      'moon-stars',
      'cherry-blossom',
      'money',
      'smoke',
      'rain',
    ]);
  });

  it('generates deterministic points for the same layer and timestamp', () => {
    expect(decorationPoints(layer, 300, 300, 1250)).toEqual(
      decorationPoints(layer, 300, 300, 1250),
    );
    expect(decorationPoints(layer, 300, 300, 1250)).toHaveLength(8);
  });

  it('keeps animated decorative layers deterministic at a fixed timestamp', () => {
    const smoke: DecorationLayer = {
      ...layer,
      preset: 'smoke',
    };
    const rain: DecorationLayer = {
      ...layer,
      preset: 'rain',
    };

    expect(decorationPoints(smoke, 300, 300, 850)).toEqual(decorationPoints(smoke, 300, 300, 850));
    expect(decorationPoints(rain, 300, 300, 850)).toEqual(decorationPoints(rain, 300, 300, 850));
  });
});

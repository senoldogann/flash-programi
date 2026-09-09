import type { FrameDefinition, FramePreset } from '../model/project';

export type FramePresetDefinition = {
  id: FramePreset;
  label: string;
  icon: string;
  primary: string;
  secondary: string;
  symbol?: string;
  animated: boolean;
};

export type FrameAppearance = {
  stroke: string;
  shadowColor: string;
  shadowBlur: number;
  dashOffset: number;
};

export const FRAME_PRESETS: FramePresetDefinition[] = [
  { id: 'none', label: 'Çerçeve Yok', icon: '∅', primary: '#000000', secondary: '#000000', animated: false },
  { id: 'neon', label: 'Neon', icon: '✦', primary: '#7c5cff', secondary: '#30dfff', animated: true },
  { id: 'gold', label: 'Altın', icon: '◆', primary: '#ffd66b', secondary: '#8c5a12', animated: false },
  { id: 'hearts', label: 'Kalpler', icon: '♥', primary: '#ff5689', secondary: '#ffc1d6', symbol: '♥', animated: false },
  { id: 'stars', label: 'Yıldızlar', icon: '★', primary: '#ffe26a', secondary: '#fff4b5', symbol: '★', animated: false },
  { id: 'rainbow', label: 'Gökkuşağı', icon: '◒', primary: '#ff5a76', secondary: '#42d4ff', animated: true },
  { id: 'fire', label: 'Ateş', icon: '🔥', primary: '#ff6438', secondary: '#ffc94d', symbol: '🔥', animated: true },
  { id: 'ice', label: 'Buz', icon: '❄', primary: '#bcefff', secondary: '#4fb4ff', symbol: '❄', animated: false },
  { id: 'glitter', label: 'Simli', icon: '✧', primary: '#f8e7ff', secondary: '#c88cff', symbol: '✦', animated: true },
  { id: 'turkish', label: 'Türk', icon: '🇹🇷', primary: '#e30a17', secondary: '#ffffff', symbol: '★', animated: false },
  { id: 'rose-gold', label: 'Rose Gold', icon: '◇', primary: '#e9aaa4', secondary: '#fff1eb', animated: false },
  { id: 'electric', label: 'Elektrik', icon: 'ϟ', primary: '#4bdcff', secondary: '#7c5cff', animated: true },
  { id: 'cosmic', label: 'Kozmik', icon: '✺', primary: '#9f6cff', secondary: '#ff69c6', symbol: '✦', animated: true },
  { id: 'ocean', label: 'Okyanus', icon: '≈', primary: '#45d7e8', secondary: '#3578ff', animated: true },
  { id: 'matrix', label: 'Matrix', icon: '▦', primary: '#55ff78', secondary: '#0b7f32', animated: true },
  { id: 'pearls', label: 'İnci', icon: '●', primary: '#f8f4ff', secondary: '#d8cdea', symbol: '●', animated: false },
  { id: 'love-neon', label: 'Love Neon', icon: '♡', primary: '#ff4fa3', secondary: '#ffb4dc', symbol: '♥', animated: true },
  { id: 'minimal-white', label: 'Minimal Beyaz', icon: '□', primary: '#ffffff', secondary: '#cbd5e1', animated: false },
];

export function getFramePreset(id: FramePreset): FramePresetDefinition {
  return FRAME_PRESETS.find((preset) => preset.id === id) ?? FRAME_PRESETS[0];
}

export function frameNeedsClock(frame: FrameDefinition): boolean {
  return getFramePreset(frame.preset).animated;
}

export function frameAppearance(frame: FrameDefinition, timeMs: number): FrameAppearance {
  const preset = getFramePreset(frame.preset);
  const phase = (timeMs % 2400) / 2400;
  const wave = Math.sin(phase * Math.PI * 2);

  if (preset.id === 'rainbow') {
    const hue = Math.round(phase * 360);
    return {
      stroke: `hsl(${hue} 90% 62%)`,
      shadowColor: `hsl(${(hue + 80) % 360} 90% 58%)`,
      shadowBlur: frame.width * 1.6,
      dashOffset: -phase * 36,
    };
  }

  if (preset.id === 'neon') {
    const hue = Math.round(220 + wave * 45);
    return {
      stroke: `hsl(${hue} 92% 68%)`,
      shadowColor: preset.secondary,
      shadowBlur: frame.width * 2.1,
      dashOffset: -phase * 24,
    };
  }

  if (preset.id === 'fire') {
    return {
      stroke: phase < 0.5 ? preset.primary : preset.secondary,
      shadowColor: '#ff3b16',
      shadowBlur: frame.width * (1.2 + Math.abs(wave)),
      dashOffset: -phase * 30,
    };
  }

  if (preset.id === 'glitter') {
    return {
      stroke: phase < 0.5 ? preset.primary : preset.secondary,
      shadowColor: '#ffffff',
      shadowBlur: frame.width * 1.3,
      dashOffset: -phase * 44,
    };
  }

  if (preset.id === 'electric') {
    const hue = Math.round(195 + wave * 24);
    return {
      stroke: `hsl(${hue} 100% 66%)`,
      shadowColor: '#6d5cff',
      shadowBlur: frame.width * (1.7 + Math.abs(wave) * 0.8),
      dashOffset: -phase * 58,
    };
  }

  if (preset.id === 'cosmic') {
    const hue = Math.round(285 + wave * 42);
    return {
      stroke: `hsl(${hue} 92% 68%)`,
      shadowColor: '#ff5fc7',
      shadowBlur: frame.width * (1.5 + Math.abs(wave) * 0.6),
      dashOffset: -phase * 46,
    };
  }

  if (preset.id === 'ocean') {
    const hue = Math.round(190 + wave * 18);
    return {
      stroke: `hsl(${hue} 82% 58%)`,
      shadowColor: '#3182ff',
      shadowBlur: frame.width * 1.6,
      dashOffset: -phase * 34,
    };
  }

  if (preset.id === 'matrix') {
    const lightness = Math.round(48 + (wave + 1) * 8);
    return {
      stroke: `hsl(134 92% ${lightness}%)`,
      shadowColor: '#00ff55',
      shadowBlur: frame.width * (1.2 + Math.abs(wave)),
      dashOffset: -phase * 64,
    };
  }

  if (preset.id === 'love-neon') {
    const hue = Math.round(326 + wave * 14);
    return {
      stroke: `hsl(${hue} 96% 66%)`,
      shadowColor: '#ff5cac',
      shadowBlur: frame.width * (1.7 + Math.abs(wave) * 0.7),
      dashOffset: -phase * 38,
    };
  }

  return {
    stroke: preset.primary,
    shadowColor: preset.secondary,
    shadowBlur: preset.id === 'none' ? 0 : frame.width * 0.7,
    dashOffset: 0,
  };
}

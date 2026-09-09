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
    const hue = Math.round(220 + Math.sin(phase * Math.PI * 2) * 45);
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
      shadowBlur: frame.width * (1.2 + Math.abs(Math.sin(phase * Math.PI * 2))),
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

  return {
    stroke: preset.primary,
    shadowColor: preset.secondary,
    shadowBlur: preset.id === 'none' ? 0 : frame.width * 0.7,
    dashOffset: 0,
  };
}

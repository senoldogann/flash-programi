import type { TextMaterialPreset } from '../model/project';

export type FlashTextMaterial = {
  id: TextMaterialPreset;
  label: string;
  gradientStops: Array<string | number>;
  fill: string;
  stroke: string;
  strokeWidth: number;
  extrusionColor: string;
  extrusionDepth: number;
  shadowColor: string;
  shadowBlur: number;
};

export const FLASH_TEXT_MATERIALS: FlashTextMaterial[] = [
  {
    id: 'flat',
    label: 'Düz',
    gradientStops: [],
    fill: '#ffffff',
    stroke: '#111827',
    strokeWidth: 2,
    extrusionColor: '#111827',
    extrusionDepth: 0,
    shadowColor: '#000000',
    shadowBlur: 8,
  },
  {
    id: 'xara-gold',
    label: 'Xara Altın',
    gradientStops: [0, '#fffbe0', 0.16, '#fff6b7', 0.38, '#f4c84a', 0.58, '#a96a05', 0.76, '#ffe899', 1, '#6d3f00'],
    fill: '#f6c84e',
    stroke: '#6f4300',
    strokeWidth: 2,
    extrusionColor: '#5a3200',
    extrusionDepth: 5,
    shadowColor: '#ffcb47',
    shadowBlur: 8,
  },
  {
    id: 'xara-chrome',
    label: 'Xara Krom',
    gradientStops: [0, '#ffffff', 0.18, '#d9e2ec', 0.38, '#576574', 0.52, '#f8fbff', 0.72, '#7c8b99', 1, '#1f2937'],
    fill: '#dce5ec',
    stroke: '#263441',
    strokeWidth: 2,
    extrusionColor: '#17212b',
    extrusionDepth: 5,
    shadowColor: '#a9d7ff',
    shadowBlur: 7,
  },
  {
    id: 'xara-ruby',
    label: 'Xara Yakut',
    gradientStops: [0, '#fff0f4', 0.18, '#ff9ab4', 0.38, '#ea174b', 0.58, '#7d001d', 0.76, '#ff5d84', 1, '#42000e'],
    fill: '#e82352',
    stroke: '#6f0019',
    strokeWidth: 2,
    extrusionColor: '#42000e',
    extrusionDepth: 5,
    shadowColor: '#ff375f',
    shadowBlur: 9,
  },
  {
    id: 'xara-ice',
    label: 'Xara Buz',
    gradientStops: [0, '#ffffff', 0.18, '#dffaff', 0.4, '#63d8ff', 0.58, '#147cc7', 0.78, '#c8f5ff', 1, '#084a7b'],
    fill: '#74ddff',
    stroke: '#0f649c',
    strokeWidth: 2,
    extrusionColor: '#073e68',
    extrusionDepth: 5,
    shadowColor: '#65e8ff',
    shadowBlur: 9,
  },
  {
    id: 'xara-purple-glass',
    label: 'Xara Mor Cam',
    gradientStops: [0, '#fff4ff', 0.17, '#e7b6ff', 0.39, '#9d49e8', 0.58, '#4b0a82', 0.77, '#d587ff', 1, '#24003f'],
    fill: '#a85ce8',
    stroke: '#4c0d75',
    strokeWidth: 2,
    extrusionColor: '#2d0548',
    extrusionDepth: 5,
    shadowColor: '#cf72ff',
    shadowBlur: 10,
  },
  {
    id: 'xara-emerald',
    label: 'Xara Zümrüt',
    gradientStops: [0, '#effff7', 0.17, '#91f0bc', 0.38, '#20b86a', 0.58, '#056438', 0.77, '#64eaa0', 1, '#02351d'],
    fill: '#2acb78',
    stroke: '#075b35',
    strokeWidth: 2,
    extrusionColor: '#043b24',
    extrusionDepth: 5,
    shadowColor: '#4effa3',
    shadowBlur: 9,
  },
  {
    id: 'xara-fire',
    label: 'Xara Ateş',
    gradientStops: [0, '#fff8c7', 0.16, '#ffd34f', 0.38, '#ff7a16', 0.58, '#d72b0b', 0.78, '#ffb12b', 1, '#591100'],
    fill: '#ff7b17',
    stroke: '#871d05',
    strokeWidth: 2,
    extrusionColor: '#4c1000',
    extrusionDepth: 5,
    shadowColor: '#ff5a00',
    shadowBlur: 11,
  },
];

export function getFlashTextMaterial(preset: TextMaterialPreset | undefined): FlashTextMaterial {
  return FLASH_TEXT_MATERIALS.find((material) => material.id === preset) ?? FLASH_TEXT_MATERIALS[0];
}

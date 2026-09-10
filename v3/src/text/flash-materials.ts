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
  {
    id: 'neo-gold', label: 'Neo Altın',
    gradientStops: [0, '#ffffff', 0.14, '#fff8ce', 0.34, '#ffd86b', 0.52, '#b77910', 0.7, '#fff0a6', 1, '#684008'],
    fill: '#ffd76a', stroke: '#7b5312', strokeWidth: 1, extrusionColor: '#513207', extrusionDepth: 7, shadowColor: '#ffd36a', shadowBlur: 18,
  },
  {
    id: 'neo-neon', label: 'Neo Neon',
    gradientStops: [0, '#f7ffff', 0.18, '#9ffff8', 0.38, '#27f0ff', 0.58, '#5a53ff', 0.78, '#cf4dff', 1, '#30106b'],
    fill: '#48e8ff', stroke: '#20266f', strokeWidth: 1, extrusionColor: '#12183e', extrusionDepth: 6, shadowColor: '#50eaff', shadowBlur: 22,
  },
  {
    id: 'neo-purple-glass', label: 'Neo Mor Cam',
    gradientStops: [0, '#ffffff', 0.14, '#f3dcff', 0.34, '#c17cff', 0.54, '#6930c3', 0.74, '#e8b8ff', 1, '#29104d'],
    fill: '#b674f4', stroke: '#5b2c91', strokeWidth: 1, extrusionColor: '#2a153f', extrusionDepth: 6, shadowColor: '#c979ff', shadowBlur: 20,
  },
  {
    id: 'neo-cyber-blue', label: 'Neo Cyber Mavi',
    gradientStops: [0, '#f4ffff', 0.16, '#a9f4ff', 0.36, '#2eb8ff', 0.54, '#1653d8', 0.76, '#64e0ff', 1, '#092052'],
    fill: '#31b7ff', stroke: '#143d84', strokeWidth: 1, extrusionColor: '#0a1c46', extrusionDepth: 7, shadowColor: '#27c9ff', shadowBlur: 21,
  },
  {
    id: 'neo-royal-red', label: 'Neo Royal Kırmızı',
    gradientStops: [0, '#fff8fa', 0.15, '#ffc5d0', 0.35, '#ff4f70', 0.55, '#a70f32', 0.76, '#ff8298', 1, '#4f0818'],
    fill: '#ed3155', stroke: '#74142b', strokeWidth: 1, extrusionColor: '#390913', extrusionDepth: 7, shadowColor: '#ff4164', shadowBlur: 19,
  },
  {
    id: 'neo-diamond', label: 'Neo Elmas',
    gradientStops: [0, '#ffffff', 0.13, '#eefdff', 0.3, '#bcefff', 0.48, '#7797c8', 0.66, '#f9ffff', 0.82, '#9fd8f2', 1, '#40506d'],
    fill: '#d8f6ff', stroke: '#60758f', strokeWidth: 1, extrusionColor: '#344255', extrusionDepth: 6, shadowColor: '#c9f4ff', shadowBlur: 20,
  },
  {
    id: 'neo-fire', label: 'Neo Ateş',
    gradientStops: [0, '#fffdf1', 0.14, '#fff09c', 0.32, '#ffbc36', 0.5, '#ff5d1f', 0.72, '#e11919', 1, '#5d0811'],
    fill: '#ff7b2d', stroke: '#8a1b16', strokeWidth: 1, extrusionColor: '#470b0b', extrusionDepth: 7, shadowColor: '#ff5a24', shadowBlur: 22,
  },
  {
    id: 'neo-frozen', label: 'Neo Frozen',
    gradientStops: [0, '#ffffff', 0.15, '#e3fdff', 0.34, '#8deaff', 0.54, '#498fda', 0.76, '#d5fbff', 1, '#173c70'],
    fill: '#9beaff', stroke: '#356d9f', strokeWidth: 1, extrusionColor: '#153553', extrusionDepth: 6, shadowColor: '#8df1ff', shadowBlur: 20,
  },
  {
    id: 'neo-dark-luxury', label: 'Neo Dark Luxury',
    gradientStops: [0, '#fff8d7', 0.15, '#d4b35a', 0.34, '#58535f', 0.54, '#17171d', 0.75, '#b99036', 1, '#050508'],
    fill: '#292830', stroke: '#8e742d', strokeWidth: 1, extrusionColor: '#08080d', extrusionDepth: 8, shadowColor: '#d6ae46', shadowBlur: 18,
  },
  {
    id: 'neo-angel', label: 'Neo Angel',
    gradientStops: [0, '#ffffff', 0.16, '#fffdf5', 0.36, '#cfefff', 0.56, '#a4bfe0', 0.76, '#f7e9ff', 1, '#6d7896'],
    fill: '#edf8ff', stroke: '#8698b7', strokeWidth: 1, extrusionColor: '#53627c', extrusionDepth: 5, shadowColor: '#e5f7ff', shadowBlur: 22,
  },
  {
    id: 'neo-dream', label: 'Neo Dream',
    gradientStops: [0, '#ffffff', 0.16, '#ffdfff', 0.35, '#c9a7ff', 0.54, '#7a77d9', 0.75, '#a7efff', 1, '#34326b'],
    fill: '#bba6ef', stroke: '#615d9b', strokeWidth: 1, extrusionColor: '#35345c', extrusionDepth: 5, shadowColor: '#c9aaff', shadowBlur: 23,
  },
  {
    id: 'neo-fashion', label: 'Neo Fashion',
    gradientStops: [0, '#ffffff', 0.15, '#f4ede8', 0.34, '#d6b8a8', 0.54, '#80635a', 0.74, '#efe0d5', 1, '#392b2a'],
    fill: '#d6b9aa', stroke: '#67504b', strokeWidth: 1, extrusionColor: '#322625', extrusionDepth: 6, shadowColor: '#f0d6ca', shadowBlur: 18,
  },
  {
    id: 'neo-cinematic', label: 'Neo Sinematik',
    gradientStops: [0, '#ffffff', 0.14, '#d8e4ef', 0.34, '#8097ab', 0.52, '#2d3947', 0.73, '#b8c8d6', 1, '#111923'],
    fill: '#889cab', stroke: '#31414d', strokeWidth: 1, extrusionColor: '#151e26', extrusionDepth: 8, shadowColor: '#7898b5', shadowBlur: 20,
  },
  {
    id: 'neo-holographic', label: 'Neo Holografik',
    gradientStops: [0, '#ffffff', 0.13, '#b9fbff', 0.29, '#8be6ff', 0.45, '#b49bff', 0.62, '#ff9bd8', 0.8, '#9fffd8', 1, '#46528e'],
    fill: '#a8dff4', stroke: '#6266a7', strokeWidth: 1, extrusionColor: '#34365d', extrusionDepth: 6, shadowColor: '#8fefff', shadowBlur: 24,
  },
  {
    id: 'neo-chrome-future', label: 'Neo Future Krom',
    gradientStops: [0, '#ffffff', 0.12, '#edf6ff', 0.28, '#a8b7c7', 0.45, '#384756', 0.62, '#f9ffff', 0.8, '#758a9c', 1, '#151e27'],
    fill: '#bdcbd7', stroke: '#384755', strokeWidth: 1, extrusionColor: '#111a22', extrusionDepth: 8, shadowColor: '#9bdcff', shadowBlur: 21,
  },
];

export function getFlashTextMaterial(preset: TextMaterialPreset | undefined): FlashTextMaterial {
  return FLASH_TEXT_MATERIALS.find((material) => material.id === preset) ?? FLASH_TEXT_MATERIALS[0];
}

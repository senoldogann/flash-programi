export type ClassicHistoricalSize = {
  width: number;
  height: number;
  label: string;
};

export const CLASSIC_HISTORICAL_SIZES: readonly ClassicHistoricalSize[] = [
  { width: 120, height: 70, label: '120 × 70' },
  { width: 125, height: 75, label: '125 × 75' },
  { width: 130, height: 70, label: '130 × 70' },
  { width: 130, height: 95, label: '130 × 95' },
  { width: 130, height: 100, label: '130 × 100' },
  { width: 133, height: 33, label: '133 × 33' },
  { width: 300, height: 100, label: '300 × 100' },
] as const;

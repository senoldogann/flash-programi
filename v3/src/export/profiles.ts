import type { ExportScale, GifProfile } from '../model/project';

export const MAX_EXPORT_DIMENSION = 4096;
const GIF_WORK_BUDGET_LIMIT = 100_000_000;

const GIF_PROFILES: Record<
  GifProfile,
  { targetFps: number; maxFrames: number; encoderQuality: number }
> = {
  small: { targetFps: 10, maxFrames: 20, encoderQuality: 15 },
  balanced: { targetFps: 15, maxFrames: 36, encoderQuality: 10 },
  quality: { targetFps: 20, maxFrames: 60, encoderQuality: 8 },
};

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} pozitif ve sonlu bir sayı olmalı.`);
  }
}

export function getExportDimensions(
  projectWidth: number,
  projectHeight: number,
  scale: ExportScale,
): { width: number; height: number } {
  assertPositiveFinite(projectWidth, 'Proje genişliği');
  assertPositiveFinite(projectHeight, 'Proje yüksekliği');

  return {
    width: projectWidth * scale,
    height: projectHeight * scale,
  };
}

export function isSafeExportDimensions(width: number, height: number): boolean {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0 &&
    width <= MAX_EXPORT_DIMENSION &&
    height <= MAX_EXPORT_DIMENSION
  );
}

export function assertSafeExportDimensions(width: number, height: number): void {
  assertPositiveFinite(width, 'Çıktı genişliği');
  assertPositiveFinite(height, 'Çıktı yüksekliği');

  if (!isSafeExportDimensions(width, height)) {
    throw new Error(`Çıktı genişliği ve yüksekliği en fazla ${MAX_EXPORT_DIMENSION} px olabilir.`);
  }
}

export function getGifEncoderQuality(profile: GifProfile): number {
  return GIF_PROFILES[profile].encoderQuality;
}

export function getGifFramePlan(
  durationMs: number,
  profile: GifProfile,
): { frameCount: number; frameTimesMs: number[]; delayMs: number } {
  assertPositiveFinite(durationMs, 'GIF süresi');

  const { targetFps, maxFrames } = GIF_PROFILES[profile];
  const frameCount = Math.min(
    maxFrames,
    Math.max(2, Math.ceil((durationMs / 1000) * targetFps)),
  );
  const delayMs = durationMs / frameCount;
  const frameTimesMs = Array.from({ length: frameCount }, (_, index) => index * delayMs);

  return { frameCount, frameTimesMs, delayMs };
}

export function getGifWorkBudget(width: number, height: number, frameCount: number): number {
  assertPositiveFinite(width, 'GIF genişliği');
  assertPositiveFinite(height, 'GIF yüksekliği');
  assertPositiveFinite(frameCount, 'GIF kare sayısı');
  return width * height * frameCount;
}

export function assertSafeGifWorkBudget(work: number): void {
  assertPositiveFinite(work, 'GIF iş yükü');
  if (work > GIF_WORK_BUDGET_LIMIT) {
    throw new Error('GIF iş yükü 100 milyon pixel-frame güvenlik sınırını aşıyor.');
  }
}

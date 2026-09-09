import type { ExportScale, GifProfile } from '../model/project';

const GIF_WORK_BUDGET_LIMIT = 100_000_000;

const GIF_PROFILES: Record<GifProfile, { targetFps: number; maxFrames: number }> = {
  small: { targetFps: 8, maxFrames: 16 },
  balanced: { targetFps: 12, maxFrames: 36 },
  quality: { targetFps: 20, maxFrames: 60 },
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

export function getGifFramePlan(
  durationMs: number,
  profile: GifProfile,
): { frameCount: number; frameTimesMs: number[]; delayMs: number } {
  assertPositiveFinite(durationMs, 'GIF süresi');

  const { targetFps, maxFrames } = GIF_PROFILES[profile];
  const frameCount = Math.min(
    maxFrames,
    Math.max(2, Math.round((durationMs / 1000) * targetFps)),
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

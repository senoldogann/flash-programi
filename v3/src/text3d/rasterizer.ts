import type { Text3DSurfaceV3 } from '../model/v3/project-v3';
import { getDisplayText } from '../text/layout';
import type {
  Text3DPass,
  Text3DRenderPlan,
} from './render-plan';

type CanvasFactory = (width: number, height: number) => HTMLCanvasElement;

export type Text3DRasterResult = {
  canvas: HTMLCanvasElement;
  padding: number;
  width: number;
  height: number;
};

function defaultCanvasFactory(width: number, height: number): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new Error('TEXT3D_CANVAS_UNAVAILABLE');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function requireContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('TEXT3D_CANVAS_CONTEXT_UNAVAILABLE');
  return context;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function textOrigin(plan: Text3DRenderPlan, scale: number): { x: number; y: number } {
  const left = plan.padding * scale;
  const top = plan.padding * scale;
  const width = plan.logicalWidth * scale;
  const height = plan.logicalHeight * scale;
  const x = plan.align === 'left'
    ? left
    : plan.align === 'right'
      ? left + width
      : left + width / 2;
  return { x, y: top + height / 2 };
}

function configureTextContext(
  context: CanvasRenderingContext2D,
  plan: Text3DRenderPlan,
  scale: number,
): void {
  context.font = `${Math.max(1, plan.fontSize * scale)}px ${plan.fontFamily}`;
  context.textAlign = plan.align;
  context.textBaseline = 'middle';
}

function drawTextShape(
  context: CanvasRenderingContext2D,
  plan: Text3DRenderPlan,
  scale: number,
  mode: 'fill' | 'stroke',
  offsetX = 0,
  offsetY = 0,
): void {
  const origin = textOrigin(plan, scale);
  const draw = mode === 'fill'
    ? context.fillText.bind(context)
    : context.strokeText.bind(context);
  const displayText = getDisplayText(plan.text, plan.writingMode);

  if (plan.writingMode !== 'vertical-stacked') {
    draw(displayText, origin.x + offsetX * scale, origin.y + offsetY * scale);
    return;
  }

  if (!displayText) return;
  const lines = displayText.split('\n');
  const lineHeight = plan.fontSize * 1.1 * scale;
  const blockHeight = lineHeight * lines.length;
  const logicalTop = plan.padding * scale;
  const startY = logicalTop
    + (plan.logicalHeight * scale - blockHeight) / 2
    + lineHeight / 2;

  for (let index = 0; index < lines.length; index += 1) {
    draw(
      lines[index],
      origin.x + offsetX * scale,
      startY + index * lineHeight + offsetY * scale,
    );
  }
}

function surfacePaint(
  context: CanvasRenderingContext2D,
  surface: Text3DSurfaceV3,
  plan: Text3DRenderPlan,
  scale: number,
): string | CanvasGradient {
  if (surface.gradient.length < 2) return surface.color;

  const top = plan.padding * scale;
  const bottom = (plan.padding + plan.logicalHeight) * scale;
  const gradient = context.createLinearGradient(0, top, 0, bottom);
  const sortedStops = [...surface.gradient].sort((left, right) => left.offset - right.offset);
  for (const stop of sortedStops) {
    gradient.addColorStop(clamp01(stop.offset), stop.color);
  }
  return gradient;
}

function metallicShade(shade: number, metallicity: number): number {
  const normalizedShade = clamp01(shade);
  const contrast = 1 + clamp01(metallicity) * 0.75;
  return clamp01(0.5 + (normalizedShade - 0.5) * contrast);
}

function paintMask(
  scratch: HTMLCanvasElement,
  scratchContext: CanvasRenderingContext2D,
  workContext: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  paint: string | CanvasGradient,
  alpha: number,
  offsetX: number,
  offsetY: number,
  scale: number,
): void {
  scratchContext.clearRect(0, 0, scratch.width, scratch.height);
  scratchContext.save();
  scratchContext.globalCompositeOperation = 'source-over';
  scratchContext.globalAlpha = clamp01(alpha);
  scratchContext.drawImage(mask, offsetX * scale, offsetY * scale);
  scratchContext.globalCompositeOperation = 'source-in';
  scratchContext.fillStyle = paint;
  scratchContext.fillRect(0, 0, scratch.width, scratch.height);
  scratchContext.restore();
  workContext.drawImage(scratch, 0, 0);
}

function renderShadow(
  pass: Extract<Text3DPass, { kind: 'shadow' }>,
  context: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  scale: number,
): void {
  context.save();
  context.globalAlpha = clamp01(pass.opacity);
  context.shadowColor = pass.color;
  context.shadowBlur = pass.blur * scale;
  context.shadowOffsetX = pass.offsetX * scale;
  context.shadowOffsetY = pass.offsetY * scale;
  context.drawImage(mask, 0, 0);
  context.restore();
}

function renderBevel(
  pass: Extract<Text3DPass, { kind: 'bevel' }>,
  workContext: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  scratchContext: CanvasRenderingContext2D,
  faceMask: HTMLCanvasElement,
  plan: Text3DRenderPlan,
  scale: number,
  createCanvas: CanvasFactory,
  workWidth: number,
  workHeight: number,
): void {
  if (pass.size <= 0 || pass.strength <= 0) return;

  const bevelMask = createCanvas(workWidth, workHeight);
  const bevelContext = requireContext(bevelMask);
  configureTextContext(bevelContext, plan, scale);
  bevelContext.clearRect(0, 0, workWidth, workHeight);
  bevelContext.strokeStyle = '#ffffff';
  bevelContext.lineWidth = Math.max(1, pass.size * 2 * scale);
  drawTextShape(bevelContext, plan, scale, 'stroke');
  bevelContext.globalCompositeOperation = 'destination-out';
  bevelContext.drawImage(faceMask, 0, 0);

  paintMask(
    scratch,
    scratchContext,
    workContext,
    bevelMask,
    '#000000',
    pass.strength * 0.32,
    -pass.highlightOffsetX * 0.35,
    -pass.highlightOffsetY * 0.35,
    scale,
  );
  paintMask(
    scratch,
    scratchContext,
    workContext,
    bevelMask,
    '#ffffff',
    pass.strength * 0.58,
    pass.highlightOffsetX * 0.35,
    pass.highlightOffsetY * 0.35,
    scale,
  );
}

function renderOutline(
  pass: Extract<Text3DPass, { kind: 'outline' }>,
  context: CanvasRenderingContext2D,
  plan: Text3DRenderPlan,
  scale: number,
): void {
  if (pass.width <= 0) return;
  context.save();
  context.strokeStyle = pass.color;
  context.lineWidth = pass.width * 2 * scale;
  drawTextShape(context, plan, scale, 'stroke');
  context.restore();
}

function compositeFaceOverlay(
  scratch: HTMLCanvasElement,
  scratchContext: CanvasRenderingContext2D,
  workContext: CanvasRenderingContext2D,
  faceMask: HTMLCanvasElement,
  paintOverlay: () => void,
): void {
  scratchContext.clearRect(0, 0, scratch.width, scratch.height);
  scratchContext.save();
  scratchContext.globalCompositeOperation = 'source-over';
  paintOverlay();
  scratchContext.globalCompositeOperation = 'destination-in';
  scratchContext.drawImage(faceMask, 0, 0);
  scratchContext.restore();
  workContext.drawImage(scratch, 0, 0);
}

function renderGloss(
  pass: Extract<Text3DPass, { kind: 'gloss' }>,
  workContext: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  scratchContext: CanvasRenderingContext2D,
  faceMask: HTMLCanvasElement,
  plan: Text3DRenderPlan,
  scale: number,
): void {
  if (pass.strength <= 0 || pass.size <= 0) return;

  const left = plan.padding * scale;
  const top = plan.padding * scale;
  const width = plan.logicalWidth * scale;
  const glossHeight = Math.max(1, plan.logicalHeight * scale * clamp01(pass.size));

  compositeFaceOverlay(scratch, scratchContext, workContext, faceMask, () => {
    scratchContext.globalAlpha = clamp01(pass.strength * 0.55);
    const gradient = scratchContext.createLinearGradient(left, top, left + width, top + glossHeight);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    scratchContext.fillStyle = gradient;
    scratchContext.fillRect(left, top, width, glossHeight);
  });
}

function nextRandom(state: number): { state: number; value: number } {
  const nextState = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
  return { state: nextState, value: nextState / 0x1_0000_0000 };
}

function renderTexture(
  pass: Extract<Text3DPass, { kind: 'texture' }>,
  workContext: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  scratchContext: CanvasRenderingContext2D,
  faceMask: HTMLCanvasElement,
  plan: Text3DRenderPlan,
  scale: number,
): void {
  if (pass.texture.kind === 'none' || pass.texture.strength <= 0) return;

  const left = plan.padding * scale;
  const top = plan.padding * scale;
  const width = plan.logicalWidth * scale;
  const height = plan.logicalHeight * scale;

  compositeFaceOverlay(scratch, scratchContext, workContext, faceMask, () => {
    scratchContext.globalAlpha = clamp01(pass.texture.strength * 0.5);
    scratchContext.fillStyle = 'rgba(255,255,255,0.72)';

    if (pass.texture.kind === 'brushed') {
      const spacing = Math.max(2, Math.round(height / 18));
      for (let y = top; y < top + height; y += spacing) {
        scratchContext.fillRect(left, y, width, 1);
      }
      return;
    }

    let state = pass.seed >>> 0;
    const count = Math.max(12, Math.min(96, Math.round((width * height) / 12_000)));
    for (let index = 0; index < count; index += 1) {
      const randomX = nextRandom(state);
      state = randomX.state;
      const randomY = nextRandom(state);
      state = randomY.state;
      const x = left + Math.floor(randomX.value * width);
      const y = top + Math.floor(randomY.value * height);
      scratchContext.fillRect(x, y, 1, 1);
    }
  });
}

export function renderText3DToCanvas(
  plan: Text3DRenderPlan,
  createCanvas: CanvasFactory = defaultCanvasFactory,
): Text3DRasterResult {
  const width = Math.max(1, Math.ceil(plan.logicalWidth + plan.padding * 2));
  const height = Math.max(1, Math.ceil(plan.logicalHeight + plan.padding * 2));
  const scale = Math.max(1, Math.min(4, Math.floor(plan.supersample)));
  const workWidth = width * scale;
  const workHeight = height * scale;

  const mask = createCanvas(workWidth, workHeight);
  const maskContext = requireContext(mask);
  configureTextContext(maskContext, plan, scale);
  maskContext.clearRect(0, 0, workWidth, workHeight);
  maskContext.fillStyle = '#ffffff';
  drawTextShape(maskContext, plan, scale, 'fill');

  const work = createCanvas(workWidth, workHeight);
  const workContext = requireContext(work);
  configureTextContext(workContext, plan, scale);
  workContext.clearRect(0, 0, workWidth, workHeight);

  const scratch = createCanvas(workWidth, workHeight);
  const scratchContext = requireContext(scratch);

  for (const pass of plan.passes) {
    switch (pass.kind) {
      case 'shadow':
        renderShadow(pass, workContext, mask, scale);
        break;
      case 'side': {
        const paint = surfacePaint(scratchContext, pass.surface, plan, scale);
        paintMask(
          scratch,
          scratchContext,
          workContext,
          mask,
          paint,
          metallicShade(pass.shade, pass.surface.metallicity),
          pass.offsetX,
          pass.offsetY,
          scale,
        );
        break;
      }
      case 'bevel':
        renderBevel(
          pass,
          workContext,
          scratch,
          scratchContext,
          mask,
          plan,
          scale,
          createCanvas,
          workWidth,
          workHeight,
        );
        break;
      case 'face': {
        const paint = surfacePaint(scratchContext, pass.surface, plan, scale);
        paintMask(scratch, scratchContext, workContext, mask, paint, 1, 0, 0, scale);
        break;
      }
      case 'outline':
        renderOutline(pass, workContext, plan, scale);
        break;
      case 'gloss':
        renderGloss(pass, workContext, scratch, scratchContext, mask, plan, scale);
        break;
      case 'texture':
        renderTexture(pass, workContext, scratch, scratchContext, mask, plan, scale);
        break;
    }
  }

  const output = createCanvas(width, height);
  const outputContext = requireContext(output);
  outputContext.imageSmoothingEnabled = true;
  outputContext.imageSmoothingQuality = 'high';
  outputContext.drawImage(work, 0, 0, workWidth, workHeight, 0, 0, width, height);

  return {
    canvas: output,
    padding: plan.padding,
    width,
    height,
  };
}

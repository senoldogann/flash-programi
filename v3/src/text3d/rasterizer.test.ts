import { describe, expect, it } from 'vitest';
import type { Text3DRenderPlan } from './render-plan';

type RasterizerModule = {
  renderText3DToCanvas(
    plan: Text3DRenderPlan,
    createCanvas?: (width: number, height: number) => HTMLCanvasElement,
  ): {
    canvas: HTMLCanvasElement;
    padding: number;
    width: number;
    height: number;
  };
};

type FakeCanvas = HTMLCanvasElement & { label: string };

type RecordingGradient = CanvasGradient & { stops: Array<[number, string]> };

async function loadRasterizerModule(): Promise<RasterizerModule | null> {
  const modulePath = ['.', 'rasterizer'].join('/');
  try {
    return await import(/* @vite-ignore */ modulePath) as RasterizerModule;
  } catch {
    return null;
  }
}

function requireModule(module: RasterizerModule | null): asserts module is RasterizerModule {
  expect(module, 'rasterizer module must exist').not.toBeNull();
}

function planFixture(): Text3DRenderPlan {
  return {
    text: 'SENOL',
    fontFamily: 'Impact',
    fontSize: 28,
    align: 'center',
    writingMode: 'horizontal',
    logicalWidth: 133,
    logicalHeight: 33,
    padding: 12,
    supersample: 4,
    passes: [
      { kind: 'shadow', color: '#010101', blur: 4, offsetX: 2, offsetY: 3, opacity: 0.7 },
      {
        kind: 'side',
        offsetX: 3,
        offsetY: 3,
        shade: 0.55,
        surface: { color: '#111111', gradient: [], metallicity: 0.4 },
      },
      { kind: 'bevel', size: 2, highlightOffsetX: -1.4, highlightOffsetY: 1.4, strength: 0.7 },
      {
        kind: 'face',
        surface: {
          color: '#222222',
          gradient: [
            { offset: 1, color: '#444444' },
            { offset: 0, color: '#eeeeee' },
          ],
          metallicity: 0.8,
        },
      },
      { kind: 'outline', color: '#333333', width: 2 },
      { kind: 'gloss', strength: 0.6, size: 0.4, angleDeg: -45 },
      { kind: 'texture', texture: { kind: 'speckle', strength: 0.25 }, seed: 123456 },
    ],
  };
}

function createRecordingFactory(options: { nullContext?: boolean } = {}) {
  const events: string[] = [];
  const canvases: FakeCanvas[] = [];
  let sequence = 0;

  const createCanvas = (width: number, height: number): HTMLCanvasElement => {
    const label = `canvas-${sequence++}`;
    const gradients: RecordingGradient[] = [];
    let fillStyleValue: string | CanvasGradient | CanvasPattern = '#000000';
    let strokeStyleValue: string | CanvasGradient | CanvasPattern = '#000000';
    const context = {
      canvas: null,
      save: () => events.push(`${label}:save`),
      restore: () => events.push(`${label}:restore`),
      clearRect: () => events.push(`${label}:clearRect`),
      fillRect: () => events.push(`${label}:fillRect`),
      fillText: (text: string) => events.push(`${label}:fillText:${text}`),
      strokeText: (text: string) => events.push(`${label}:strokeText:${text}`),
      drawImage: () => events.push(`${label}:drawImage`),
      beginPath: () => events.push(`${label}:beginPath`),
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => events.push(`${label}:stroke`),
      translate: () => undefined,
      createLinearGradient: () => {
        events.push(`${label}:createLinearGradient`);
        const stops: Array<[number, string]> = [];
        const gradient = {
          stops,
          addColorStop(offset: number, color: string) {
            stops.push([offset, color]);
            events.push(`${label}:gradientStop:${offset}:${color}`);
          },
        } as unknown as RecordingGradient;
        gradients.push(gradient);
        return gradient;
      },
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      lineWidth: 1,
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
      get fillStyle() {
        return fillStyleValue;
      },
      set fillStyle(value: string | CanvasGradient | CanvasPattern) {
        fillStyleValue = value;
        events.push(`${label}:fillStyle:${typeof value === 'string' ? value : 'gradient'}`);
      },
      get strokeStyle() {
        return strokeStyleValue;
      },
      set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
        strokeStyleValue = value;
        events.push(`${label}:strokeStyle:${typeof value === 'string' ? value : 'gradient'}`);
      },
    } as unknown as CanvasRenderingContext2D;

    const canvas = {
      width,
      height,
      label,
      getContext: () => options.nullContext ? null : context,
    } as unknown as FakeCanvas;
    (context as unknown as { canvas: FakeCanvas }).canvas = canvas;
    canvases.push(canvas);
    events.push(`${label}:create:${width}x${height}`);
    return canvas;
  };

  return { createCanvas, events, canvases };
}

describe('FlashText3D Canvas2D rasterizer', () => {
  it('creates bounded supersampled working surfaces and a logical padded output canvas', async () => {
    const module = await loadRasterizerModule();
    requireModule(module);
    const recording = createRecordingFactory();
    const plan = planFixture();

    const raster = module.renderText3DToCanvas(plan, recording.createCanvas);
    const logicalWidth = plan.logicalWidth + plan.padding * 2;
    const logicalHeight = plan.logicalHeight + plan.padding * 2;

    expect(raster.width).toBe(logicalWidth);
    expect(raster.height).toBe(logicalHeight);
    expect(raster.padding).toBe(plan.padding);
    expect(recording.canvases.some((canvas) =>
      canvas.width === logicalWidth * 4 && canvas.height === logicalHeight * 4)).toBe(true);
    expect(raster.canvas.width).toBe(logicalWidth);
    expect(raster.canvas.height).toBe(logicalHeight);
  });

  it('renders the text mask before side/front composition and applies sorted face gradient stops', async () => {
    const module = await loadRasterizerModule();
    requireModule(module);
    const recording = createRecordingFactory();

    module.renderText3DToCanvas(planFixture(), recording.createCanvas);

    const maskIndex = recording.events.findIndex((event) => event.includes(':fillText:SENOL'));
    const sideIndex = recording.events.findIndex((event) => event.includes(':fillStyle:#111111'));
    const frontGradientIndex = recording.events.findIndex((event) => event.includes(':gradientStop:0:#eeeeee'));
    const frontGradientEndIndex = recording.events.findIndex((event) => event.includes(':gradientStop:1:#444444'));
    const outlineIndex = recording.events.findIndex((event) => event.includes(':strokeStyle:#333333'));

    expect(maskIndex).toBeGreaterThanOrEqual(0);
    expect(sideIndex).toBeGreaterThan(maskIndex);
    expect(frontGradientIndex).toBeGreaterThan(sideIndex);
    expect(frontGradientEndIndex).toBeGreaterThan(frontGradientIndex);
    expect(outlineIndex).toBeGreaterThan(frontGradientEndIndex);
  });

  it('runs gloss/texture after the face and downsamples with high-quality smoothing', async () => {
    const module = await loadRasterizerModule();
    requireModule(module);
    const recording = createRecordingFactory();

    const raster = module.renderText3DToCanvas(planFixture(), recording.createCanvas);
    const output = raster.canvas as FakeCanvas;
    const outputEvents = recording.events.filter((event) => event.startsWith(`${output.label}:`));
    const outputContext = output.getContext('2d');

    expect(recording.events.filter((event) => event.includes(':fillRect')).length).toBeGreaterThan(1);
    expect(outputContext?.imageSmoothingEnabled).toBe(true);
    expect(outputContext?.imageSmoothingQuality).toBe('high');
    expect(outputEvents.at(-1)).toBe(`${output.label}:drawImage`);
  });

  it('throws a stable error when a 2D canvas context is unavailable', async () => {
    const module = await loadRasterizerModule();
    requireModule(module);
    const recording = createRecordingFactory({ nullContext: true });

    expect(() => module.renderText3DToCanvas(planFixture(), recording.createCanvas))
      .toThrow('TEXT3D_CANVAS_CONTEXT_UNAVAILABLE');
  });
});

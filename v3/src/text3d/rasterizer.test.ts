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
    let globalAlphaValue = 1;
    let compositeValue: GlobalCompositeOperation = 'source-over';
    let lineWidthValue = 1;
    const context = {
      canvas: null,
      save: () => events.push(`${label}:save`),
      restore: () => events.push(`${label}:restore`),
      clearRect: () => events.push(`${label}:clearRect`),
      fillRect: () => events.push(`${label}:fillRect`),
      fillText: (text: string, x: number, y: number) => events.push(`${label}:fillText:${text}:${x}:${y}`),
      strokeText: (text: string, x: number, y: number) => events.push(`${label}:strokeText:${text}:${x}:${y}`),
      drawImage: () => events.push(`${label}:drawImage`),
      beginPath: () => events.push(`${label}:beginPath`),
      moveTo: () => undefined,
      lineTo: () => undefined,
      stroke: () => events.push(`${label}:stroke`),
      translate: () => undefined,
      createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => {
        events.push(`${label}:createLinearGradient:${x0}:${y0}:${x1}:${y1}`);
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
      shadowColor: 'transparent',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
      get globalAlpha() {
        return globalAlphaValue;
      },
      set globalAlpha(value: number) {
        globalAlphaValue = value;
        events.push(`${label}:globalAlpha:${value}`);
      },
      get globalCompositeOperation() {
        return compositeValue;
      },
      set globalCompositeOperation(value: GlobalCompositeOperation) {
        compositeValue = value;
        events.push(`${label}:composite:${value}`);
      },
      get lineWidth() {
        return lineWidthValue;
      },
      set lineWidth(value: number) {
        lineWidthValue = value;
        events.push(`${label}:lineWidth:${value}`);
      },
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

function firstGlobalAlpha(events: string[]): number {
  const event = events.find((candidate) => candidate.includes(':globalAlpha:'));
  if (!event) throw new Error('global alpha event missing');
  return Number(event.split(':').at(-1));
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

  it('keeps vertical-stacked graphemes intact and uses font-based centered line spacing', async () => {
    const module = await loadRasterizerModule();
    requireModule(module);
    const recording = createRecordingFactory();
    const plan: Text3DRenderPlan = {
      ...planFixture(),
      text: 'A👨‍👩‍👧‍👦B',
      fontSize: 20,
      writingMode: 'vertical-stacked',
      logicalHeight: 100,
      passes: [{
        kind: 'face',
        surface: { color: '#ffffff', gradient: [], metallicity: 0 },
      }],
    };

    module.renderText3DToCanvas(plan, recording.createCanvas);

    const maskEvents = recording.events.filter((event) => event.startsWith('canvas-0:fillText:'));
    expect(maskEvents).toHaveLength(3);
    expect(maskEvents[0]).toContain(':fillText:A:');
    expect(maskEvents[1]).toContain(':fillText:👨‍👩‍👧‍👦:');
    expect(maskEvents[2]).toContain(':fillText:B:');

    const yPositions = maskEvents.map((event) => Number(event.split(':').at(-1)));
    const expectedGap = plan.fontSize * 1.1 * plan.supersample;
    expect(yPositions[1] - yPositions[0]).toBeCloseTo(expectedGap, 5);
    expect(yPositions[2] - yPositions[1]).toBeCloseTo(expectedGap, 5);

    const expectedFirstY = (
      plan.padding
      + (plan.logicalHeight - plan.fontSize * 1.1 * 3) / 2
      + (plan.fontSize * 1.1) / 2
    ) * plan.supersample;
    expect(yPositions[0]).toBeCloseTo(expectedFirstY, 5);
  });

  it('builds a bevel band, clips face overlays, and keeps face gradients inside logical text bounds', async () => {
    const module = await loadRasterizerModule();
    requireModule(module);
    const recording = createRecordingFactory();
    const plan = planFixture();

    module.renderText3DToCanvas(plan, recording.createCanvas);

    expect(recording.events.some((event) => event.includes(':composite:destination-out'))).toBe(true);
    expect(recording.events.filter((event) => event.includes(':composite:destination-in')).length).toBeGreaterThanOrEqual(2);

    const expectedTop = plan.padding * plan.supersample;
    const expectedBottom = (plan.padding + plan.logicalHeight) * plan.supersample;
    expect(recording.events.some((event) =>
      event.includes(`:createLinearGradient:0:${expectedTop}:0:${expectedBottom}`))).toBe(true);
  });

  it('uses surface metallicity to increase side light/dark contrast without changing geometry', async () => {
    const module = await loadRasterizerModule();
    requireModule(module);

    const renderSide = (metallicity: number) => {
      const recording = createRecordingFactory();
      const plan: Text3DRenderPlan = {
        ...planFixture(),
        passes: [{
          kind: 'side',
          offsetX: 3,
          offsetY: 3,
          shade: 0.25,
          surface: { color: '#111111', gradient: [], metallicity },
        }],
      };
      module.renderText3DToCanvas(plan, recording.createCanvas);
      return firstGlobalAlpha(recording.events);
    };

    const matteAlpha = renderSide(0);
    const metallicAlpha = renderSide(1);
    expect(Math.abs(metallicAlpha - 0.5)).toBeGreaterThan(Math.abs(matteAlpha - 0.5));
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

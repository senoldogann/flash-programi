import { describe, expect, it } from 'vitest';
import type { Text3DLayerV3 } from '../model/v3/project-v3';
import type { ResolvedLayerV3 } from '../timeline';
import { createDefaultText3DStyle } from './material-recipes';

type SidePass = { kind: 'side'; offsetX: number; offsetY: number; shade: number };
type BevelPass = { kind: 'bevel'; size: number };
type FacePass = { kind: 'face'; surface: Text3DLayerV3['style']['surfaces']['front'] };
type TexturePass = { kind: 'texture'; seed: number };
type RenderPlan = {
  text: string;
  logicalWidth: number;
  logicalHeight: number;
  padding: number;
  supersample: number;
  passes: Array<SidePass | BevelPass | FacePass | TexturePass | { kind: string; [key: string]: unknown }>;
};
type RenderPlanModule = {
  TEXT3D_MAX_SUPERSAMPLE: number;
  TEXT3D_MAX_OFFSCREEN_PIXELS: number;
  chooseText3DSupersample(width: number, height: number, padding: number): number;
  buildText3DRenderPlan(layer: ResolvedLayerV3 & { source: Text3DLayerV3 }): RenderPlan;
};

async function loadRenderPlanModule(): Promise<RenderPlanModule | null> {
  const modulePath = ['.', 'render-plan'].join('/');
  try {
    return await import(/* @vite-ignore */ modulePath) as RenderPlanModule;
  } catch {
    return null;
  }
}

function layerFixture(overrides: Partial<Text3DLayerV3> = {}): ResolvedLayerV3 & { source: Text3DLayerV3 } {
  const source: Text3DLayerV3 = {
    id: 'text3d-plan',
    name: 'Flash Nick',
    type: 'text3d',
    visible: true,
    locked: false,
    opacity: 1,
    transform: { x: 10, y: 12, width: 133, height: 33, rotation: 0, scaleX: 1, scaleY: 1 },
    clips: [],
    text: 'SENOL',
    backText: 'DOGAN',
    writingMode: 'horizontal',
    fontFamily: 'Impact',
    fontSize: 28,
    fill: '#f6c84e',
    stroke: '#6f4300',
    strokeWidth: 2,
    shadowColor: '#000000',
    shadowBlur: 8,
    align: 'center',
    materialPreset: 'xara-gold',
    extrusionDepth: 5,
    extrusionColor: '#5a3200',
    style: createDefaultText3DStyle(),
    ...overrides,
  };

  return {
    source,
    id: source.id,
    name: source.name,
    type: 'text3d',
    visible: source.visible,
    locked: source.locked,
    opacity: source.opacity,
    transform: {
      ...source.transform,
      skewX: 0,
      skewY: 0,
    },
    animation: {
      hueShift: 0,
      blurAmount: 0,
      revealProgress: 1,
      chromaticOffset: 0,
      pixelateAmount: 0,
      alternateFace: false,
    },
  };
}

function requireModule(module: RenderPlanModule | null): asserts module is RenderPlanModule {
  expect(module, 'render-plan module must exist').not.toBeNull();
}

describe('FlashText3D render plan', () => {
  it('uses 4x supersampling for small Flash outputs while respecting the offscreen budget', async () => {
    const module = await loadRenderPlanModule();
    requireModule(module);

    expect(module.TEXT3D_MAX_SUPERSAMPLE).toBe(4);
    expect(module.TEXT3D_MAX_OFFSCREEN_PIXELS).toBe(16_777_216);
    expect(module.chooseText3DSupersample(133, 33, 24)).toBe(4);
    expect(module.chooseText3DSupersample(300, 100, 24)).toBe(4);
    expect(module.chooseText3DSupersample(4096, 4096, 64)).toBe(1);
  });

  it('builds deterministic passes in shadow-side-bevel-face-outline-gloss-texture order', async () => {
    const module = await loadRenderPlanModule();
    requireModule(module);

    const layer = layerFixture({
      style: {
        ...createDefaultText3DStyle(),
        extrusion: { depth: 3, angleDeg: 45 },
      },
    });
    const plan = module.buildText3DRenderPlan(layer);

    expect(plan.passes.map((pass) => pass.kind)).toEqual([
      'shadow',
      'side',
      'side',
      'side',
      'bevel',
      'face',
      'outline',
      'gloss',
      'texture',
    ]);
    expect(plan.text).toBe('SENOL');
    expect(plan.logicalWidth).toBe(133);
    expect(plan.logicalHeight).toBe(33);
  });

  it('derives extrusion offsets from the configured angle and orders them far-to-near', async () => {
    const module = await loadRenderPlanModule();
    requireModule(module);

    const horizontal = module.buildText3DRenderPlan(layerFixture({
      style: {
        ...createDefaultText3DStyle(),
        extrusion: { depth: 2, angleDeg: 0 },
      },
    }));
    const vertical = module.buildText3DRenderPlan(layerFixture({
      style: {
        ...createDefaultText3DStyle(),
        extrusion: { depth: 2, angleDeg: 90 },
      },
    }));

    const horizontalSides = horizontal.passes.filter((pass): pass is SidePass => pass.kind === 'side');
    const verticalSides = vertical.passes.filter((pass): pass is SidePass => pass.kind === 'side');
    expect(horizontalSides).toMatchObject([
      { offsetX: 2, offsetY: 0 },
      { offsetX: 1, offsetY: 0 },
    ]);
    expect(verticalSides).toMatchObject([
      { offsetX: 0, offsetY: 2 },
      { offsetX: 0, offsetY: 1 },
    ]);
  });

  it('uses the resolved alternate face and back surface without evaluating animation itself', async () => {
    const module = await loadRenderPlanModule();
    requireModule(module);

    const layer = layerFixture();
    layer.animation.alternateFace = true;
    const plan = module.buildText3DRenderPlan(layer);
    const face = plan.passes.find((pass): pass is FacePass => pass.kind === 'face');

    expect(plan.text).toBe('DOGAN');
    expect(face).toMatchObject({
      kind: 'face',
      surface: layer.source.style.surfaces.back,
    });
  });

  it('derives bounded lighting/shading and padding from style geometry', async () => {
    const module = await loadRenderPlanModule();
    requireModule(module);

    const style = createDefaultText3DStyle();
    style.extrusion = { depth: 8, angleDeg: 45 };
    style.outline.width = 4;
    style.bevel.size = 3;
    style.shadow = { ...style.shadow, blur: 12, offsetX: -5, offsetY: 7 };
    style.light = { azimuthDeg: 25, elevationDeg: 40, intensity: 1.4, ambient: 0.2 };
    const plan = module.buildText3DRenderPlan(layerFixture({ style }));
    const sides = plan.passes.filter((pass): pass is SidePass => pass.kind === 'side');
    const bevel = plan.passes.find((pass): pass is BevelPass => pass.kind === 'bevel');

    expect(plan.padding).toBeGreaterThanOrEqual(21);
    expect(sides.every((pass) => pass.shade >= 0 && pass.shade <= 1)).toBe(true);
    expect(bevel).toMatchObject({ kind: 'bevel', size: 3 });
  });

  it('uses a stable texture seed and never mutates the resolved layer', async () => {
    const module = await loadRenderPlanModule();
    requireModule(module);

    const layer = layerFixture();
    const before = structuredClone(layer);
    const first = module.buildText3DRenderPlan(layer);
    const second = module.buildText3DRenderPlan(layer);
    const firstTexture = first.passes.find((pass): pass is TexturePass => pass.kind === 'texture');
    const secondTexture = second.passes.find((pass): pass is TexturePass => pass.kind === 'texture');

    expect(firstTexture).toEqual(secondTexture);
    expect(firstTexture).toMatchObject({ kind: 'texture', seed: expect.any(Number) });
    expect(layer).toEqual(before);
  });
});
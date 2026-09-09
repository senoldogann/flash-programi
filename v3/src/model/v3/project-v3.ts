import {
  createId,
  type AnimationDirection,
  type AnimationIntensity,
  type AnimationPreset,
  type AnimationSpeed,
  type DecorationPreset,
  type ExportSettings,
  type FramePreset,
  type ImageEffects,
  type TextAlign,
  type TextMaterialPreset,
  type TextWritingMode,
} from '../project';

export type FlashModeV3 = 'classic' | 'neo';

export type LayerTransformV3 = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export type AnimationClipV3 = {
  id: string;
  effect: AnimationPreset;
  startMs: number;
  durationMs: number;
  loop: boolean;
  speed: AnimationSpeed;
  intensity: AnimationIntensity;
  direction?: AnimationDirection;
};

export type SceneLayerBaseV3 = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  transform: LayerTransformV3;
  clips: AnimationClipV3[];
};

export type ImageLayerV3 = SceneLayerBaseV3 & {
  type: 'image';
  assetUrl: string;
  effects: ImageEffects;
};

export type TextLayerV3 = SceneLayerBaseV3 & {
  type: 'text';
  text: string;
  writingMode: TextWritingMode;
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  align: TextAlign;
};

export type Text3DLayerV3 = SceneLayerBaseV3 & {
  type: 'text3d';
  text: string;
  backText?: string;
  writingMode: TextWritingMode;
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  align: TextAlign;
  materialPreset?: TextMaterialPreset;
  extrusionDepth?: number;
  extrusionColor?: string;
};

export type ParticleLayerV3 = SceneLayerBaseV3 & {
  type: 'particle';
  preset: DecorationPreset;
  count: number;
  speed: AnimationSpeed;
};

export type FrameLayerV3 = SceneLayerBaseV3 & {
  type: 'frame';
  preset: FramePreset;
  width: number;
};

export type SceneLayerV3 =
  | ImageLayerV3
  | TextLayerV3
  | Text3DLayerV3
  | ParticleLayerV3
  | FrameLayerV3;

export type ProjectV3 = {
  version: 3;
  id: string;
  name: string;
  mode: FlashModeV3;
  canvas: {
    width: number;
    height: number;
    background: string;
  };
  timeline: {
    durationMs: number;
    fps: number;
  };
  layers: SceneLayerV3[];
  exportSettings: ExportSettings;
};

export function createDefaultProjectV3(): ProjectV3 {
  return {
    version: 3,
    id: createId(),
    name: 'Yeni Tasarım',
    mode: 'classic',
    canvas: {
      width: 300,
      height: 300,
      background: '#101827',
    },
    timeline: {
      durationMs: 3000,
      fps: 24,
    },
    layers: [],
    exportSettings: {
      scale: 1,
      gifProfile: 'balanced',
    },
  };
}

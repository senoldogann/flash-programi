export type TextAlign = 'left' | 'center' | 'right';

export type ElementBase = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
};

export type TextElement = ElementBase & {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  align: TextAlign;
};

export type ImageElement = ElementBase & {
  type: 'image';
  assetUrl: string;
};

export type EditorElement = TextElement | ImageElement;

export type Project = {
  version: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  durationMs: number;
  fps: number;
  background: string;
  elements: EditorElement[];
};

export function createId(): string {
  return crypto.randomUUID();
}

export function createEmptyProject(): Project {
  return {
    version: 1,
    id: createId(),
    name: 'Yeni Tasarım',
    width: 300,
    height: 300,
    durationMs: 3000,
    fps: 24,
    background: '#101827',
    elements: [],
  };
}

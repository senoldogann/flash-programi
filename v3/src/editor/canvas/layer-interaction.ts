import type { ResolvedLayerV3 } from '../../timeline';

export type GeometryNode = {
  x(): number;
  y(): number;
  width(): number;
  height(): number;
  rotation(): number;
  scaleX(): number;
  scaleX(value: number): unknown;
  scaleY(): number;
  scaleY(value: number): unknown;
};

export type ResolvedLayerInteractionProps = {
  onInteractionStart(layer: ResolvedLayerV3): void;
  onInteractionFinish(layer: ResolvedLayerV3, node: GeometryNode): void;
};

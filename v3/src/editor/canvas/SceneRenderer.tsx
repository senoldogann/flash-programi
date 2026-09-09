import { Rect } from 'react-konva';
import type { ResolvedLayerV3, ResolvedSceneV3 } from '../../timeline';
import type { GeometryNode, ResolvedLayerInteractionProps } from './layer-interaction';
import { ResolvedFrameLayer, type ResolvedFrameLayerState } from './layers/ResolvedFrameLayer';
import { ResolvedImageLayer, type ResolvedImageLayerState } from './layers/ResolvedImageLayer';
import { ResolvedParticleLayer, type ResolvedParticleLayerState } from './layers/ResolvedParticleLayer';
import { ResolvedText3DLayer, type ResolvedText3DLayerState } from './layers/ResolvedText3DLayer';
import { ResolvedTextLayer, type ResolvedTextLayerState } from './layers/ResolvedTextLayer';

type SceneRendererProps = ResolvedLayerInteractionProps & {
  scene: ResolvedSceneV3;
  selectedElementId: string | null;
  previewScale: number;
  onSelectElement(elementId: string): void;
};

function resolvedLayerKey(layer: ResolvedLayerV3): string {
  return `${layer.type}:${layer.id}`;
}

export function SceneRenderer({
  scene,
  selectedElementId,
  previewScale,
  onSelectElement,
  onInteractionStart,
  onInteractionFinish,
}: SceneRendererProps) {
  const interactionProps = (layer: ResolvedLayerV3) => ({
    isSelected: layer.id === selectedElementId,
    previewScale,
    onSelect: () => onSelectElement(layer.id),
    onInteractionStart,
    onInteractionFinish: (resolved: ResolvedLayerV3, node: GeometryNode) =>
      onInteractionFinish(resolved, node),
  });

  return (
    <>
      <Rect
        name="canvas-background"
        width={scene.canvas.width}
        height={scene.canvas.height}
        fill={scene.canvas.background}
      />
      {scene.layers.map((layer) => {
        const key = resolvedLayerKey(layer);
        switch (layer.source.type) {
          case 'image':
            return (
              <ResolvedImageLayer
                key={key}
                {...interactionProps(layer)}
                layer={layer as ResolvedImageLayerState}
              />
            );
          case 'text':
            return (
              <ResolvedTextLayer
                key={key}
                {...interactionProps(layer)}
                layer={layer as ResolvedTextLayerState}
              />
            );
          case 'text3d':
            return (
              <ResolvedText3DLayer
                key={key}
                {...interactionProps(layer)}
                layer={layer as ResolvedText3DLayerState}
              />
            );
          case 'particle':
            return (
              <ResolvedParticleLayer
                key={key}
                layer={layer as ResolvedParticleLayerState}
                canvasWidth={scene.canvas.width}
                canvasHeight={scene.canvas.height}
                timeMs={scene.timeMs}
              />
            );
          case 'frame':
            return (
              <ResolvedFrameLayer
                key={key}
                layer={layer as ResolvedFrameLayerState}
                canvasWidth={scene.canvas.width}
                canvasHeight={scene.canvas.height}
                timeMs={scene.timeMs}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

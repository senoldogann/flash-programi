import { Rect } from 'react-konva';
import type { ResolvedLayerV3, ResolvedSceneV3 } from '../../timeline';
import type { GeometryNode, ResolvedLayerInteractionProps } from './layer-interaction';
import { ResolvedFrameLayer, type ResolvedFrameLayerState } from './layers/ResolvedFrameLayer';
import { ResolvedImageLayer, type ResolvedImageLayerState } from './layers/ResolvedImageLayer';
import { ResolvedParticleLayer, type ResolvedParticleLayerState } from './layers/ResolvedParticleLayer';
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
  const renderInteractiveLayer = (
    layer: ResolvedImageLayerState | ResolvedTextLayerState,
  ) => {
    const common = {
      key: resolvedLayerKey(layer),
      isSelected: layer.id === selectedElementId,
      previewScale,
      onSelect: () => onSelectElement(layer.id),
      onInteractionStart,
      onInteractionFinish: (resolved: ResolvedLayerV3, node: GeometryNode) =>
        onInteractionFinish(resolved, node),
    };

    return layer.source.type === 'image'
      ? <ResolvedImageLayer {...common} layer={layer as ResolvedImageLayerState} />
      : <ResolvedTextLayer {...common} layer={layer as ResolvedTextLayerState} />;
  };

  return (
    <>
      <Rect
        name="canvas-background"
        width={scene.canvas.width}
        height={scene.canvas.height}
        fill={scene.canvas.background}
      />
      {scene.layers.map((layer) => {
        switch (layer.source.type) {
          case 'image':
          case 'text':
          case 'text3d':
            return renderInteractiveLayer(layer as ResolvedImageLayerState | ResolvedTextLayerState);
          case 'particle':
            return (
              <ResolvedParticleLayer
                key={resolvedLayerKey(layer)}
                layer={layer as ResolvedParticleLayerState}
                canvasWidth={scene.canvas.width}
                canvasHeight={scene.canvas.height}
                timeMs={scene.timeMs}
              />
            );
          case 'frame':
            return (
              <ResolvedFrameLayer
                key={resolvedLayerKey(layer)}
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

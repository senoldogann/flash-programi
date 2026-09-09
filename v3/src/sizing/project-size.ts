import type { EditorElement, Project, TextElement } from '../model/project';

const MIN_CANVAS_SIZE = 32;
const MAX_CANVAS_SIZE = 4096;

function assertCanvasDimension(value: number, label: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < MIN_CANVAS_SIZE || value > MAX_CANVAS_SIZE) {
    throw new Error(`${label} ${MIN_CANVAS_SIZE}-${MAX_CANVAS_SIZE} arasında tam sayı olmalı.`);
  }
}

function resizeElement(
  element: EditorElement,
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
  scale: number,
): EditorElement {
  const oldCenterX = element.x + element.width / 2;
  const oldCenterY = element.y + element.height / 2;
  const relativeX = oldCenterX - oldWidth / 2;
  const relativeY = oldCenterY - oldHeight / 2;
  const width = element.width * scale;
  const height = element.height * scale;
  const centerX = newWidth / 2 + relativeX * scale;
  const centerY = newHeight / 2 + relativeY * scale;

  const geometry = {
    ...element,
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };

  if (geometry.type !== 'text') return geometry;

  return {
    ...geometry,
    fontSize: geometry.fontSize * scale,
    strokeWidth: geometry.strokeWidth * scale,
    shadowBlur: geometry.shadowBlur * scale,
  } satisfies TextElement;
}

export function resizeProjectProportionally(
  project: Project,
  newWidth: number,
  newHeight: number,
): Project {
  assertCanvasDimension(newWidth, 'Genişlik');
  assertCanvasDimension(newHeight, 'Yükseklik');

  if (!Number.isFinite(project.width) || !Number.isFinite(project.height) || project.width <= 0 || project.height <= 0) {
    throw new Error('Mevcut tuval boyutları geçersiz.');
  }

  const scale = Math.min(newWidth / project.width, newHeight / project.height);

  return {
    ...project,
    width: newWidth,
    height: newHeight,
    elements: project.elements.map((element) =>
      resizeElement(element, project.width, project.height, newWidth, newHeight, scale),
    ),
    frame: {
      ...project.frame,
      width: project.frame.width * scale,
    },
  };
}

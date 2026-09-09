import { describe, expect, it } from 'vitest';
import {
  createDefaultAnimation,
  createEmptyProject,
  type Project,
  type TextElement,
} from '../model/project';
import { parseProject } from '../model/schema';
import { resizeProjectProportionally } from './project-size';

function createFixture(): Project {
  const project = createEmptyProject();
  const text: TextElement = {
    id: 'text-1',
    type: 'text',
    name: 'Yazı',
    text: 'KRAL',
    writingMode: 'horizontal',
    x: 50,
    y: 20,
    width: 100,
    height: 40,
    rotation: 12,
    opacity: 0.8,
    visible: true,
    locked: false,
    animation: createDefaultAnimation(),
    fontFamily: 'Arial',
    fontSize: 20,
    fill: '#ffffff',
    stroke: '#111827',
    strokeWidth: 2,
    shadowColor: '#000000',
    shadowBlur: 5,
    align: 'center',
  };

  return {
    ...project,
    width: 300,
    height: 100,
    frame: { preset: 'neon', width: 4 },
    decorations: [
      { id: 'stars-1', preset: 'stars', count: 12, opacity: 0.7, speed: 'normal' },
    ],
    elements: [text],
  };
}

describe('resizeProjectProportionally', () => {
  it('uniformly doubles geometry and text visual dimensions for 300x100 to 600x200', () => {
    const resized = resizeProjectProportionally(createFixture(), 600, 200);
    const text = resized.elements[0];

    expect(resized).toMatchObject({
      width: 600,
      height: 200,
      frame: { preset: 'neon', width: 8 },
      decorations: [{ id: 'stars-1', preset: 'stars', count: 12, opacity: 0.7, speed: 'normal' }],
    });
    expect(text).toMatchObject({
      x: 100,
      y: 40,
      width: 200,
      height: 80,
      rotation: 12,
      opacity: 0.8,
    });
    expect(text.type === 'text' ? text : null).toMatchObject({
      fontSize: 40,
      strokeWidth: 4,
      shadowBlur: 10,
    });
  });

  it('keeps uniform scale at one and re-centers element centers for 300x100 to 300x300', () => {
    const resized = resizeProjectProportionally(createFixture(), 300, 300);
    const text = resized.elements[0];

    expect(resized).toMatchObject({ width: 300, height: 300, frame: { width: 4 } });
    expect(text).toMatchObject({
      x: 50,
      y: 120,
      width: 100,
      height: 40,
    });
    expect(text.type === 'text' ? text : null).toMatchObject({
      fontSize: 20,
      strokeWidth: 2,
      shadowBlur: 5,
    });
  });

  it('keeps extreme growth inside project schema limits', () => {
    const project = createFixture();
    const text = project.elements[0];
    if (text.type !== 'text') throw new Error('text fixture expected');
    text.width = 800;
    text.height = 800;
    text.fontSize = 512;
    text.strokeWidth = 64;
    text.shadowBlur = 128;
    project.width = 300;
    project.height = 300;
    project.frame.width = 32;

    const resized = resizeProjectProportionally(project, 4096, 4096);
    const resizedText = resized.elements[0];

    expect(() => parseProject(resized)).not.toThrow();
    expect(resized.frame.width).toBe(32);
    expect(resizedText).toMatchObject({ width: 8192, height: 8192 });
    expect(resizedText.type === 'text' ? resizedText : null).toMatchObject({
      fontSize: 512,
      strokeWidth: 64,
      shadowBlur: 128,
    });
  });

  it('keeps extreme shrink inside project schema minimums', () => {
    const project = createFixture();
    const text = project.elements[0];
    if (text.type !== 'text') throw new Error('text fixture expected');
    text.fontSize = 6;
    project.width = 4096;
    project.height = 4096;
    project.frame.width = 1;

    const resized = resizeProjectProportionally(project, 32, 32);
    const resizedText = resized.elements[0];

    expect(() => parseProject(resized)).not.toThrow();
    expect(resized.frame.width).toBe(1);
    expect(resizedText.type === 'text' ? resizedText.fontSize : null).toBe(6);
  });

  it.each([
    [0, 100],
    [300.5, 100],
    [Number.POSITIVE_INFINITY, 100],
    [9000, 100],
  ])('rejects invalid target dimensions %s x %s', (width, height) => {
    expect(() => resizeProjectProportionally(createFixture(), width, height)).toThrow();
  });
});

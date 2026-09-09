import { createDefaultImageEffects, type Project } from './project';
import { parseProject } from './schema';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrateAnimation(animation: unknown): unknown {
  if (!isRecord(animation)) return animation;
  return {
    ...animation,
    intensity: animation.intensity ?? 'normal',
  };
}

function migrateImageEffects(effects: unknown): unknown {
  if (!isRecord(effects)) return effects;
  return {
    ...createDefaultImageEffects(),
    ...effects,
  };
}

function migrateElement(element: unknown): unknown {
  if (!isRecord(element)) return element;

  const migratedBase = {
    ...element,
    animation: migrateAnimation(element.animation),
  };

  if (element.type === 'text') {
    return {
      ...migratedBase,
      writingMode: element.writingMode ?? 'horizontal',
    };
  }

  if (element.type === 'image') {
    return {
      ...migratedBase,
      effects: migrateImageEffects(element.effects),
    };
  }

  return migratedBase;
}

export function migrateProject(input: unknown): Project {
  if (!isRecord(input)) {
    throw new Error('Proje verisi geçersiz.');
  }

  if (input.version === 2) {
    return parseProject(input);
  }

  if (input.version !== 1) {
    throw new Error('Desteklenmeyen proje sürümü.');
  }

  const migrated = {
    ...input,
    version: 2,
    elements: Array.isArray(input.elements)
      ? input.elements.map(migrateElement)
      : input.elements,
    exportSettings: isRecord(input.exportSettings)
      ? input.exportSettings
      : { scale: 1, gifProfile: 'balanced' },
  };

  return parseProject(migrated);
}

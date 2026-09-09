import { create } from 'zustand';
import {
  createDefaultAnimation,
  createDefaultImageEffects,
  createEmptyProject,
  createId,
  type AnimationDefinition,
  type DecorationPreset,
  type EditorElement,
  type ExportSettings,
  type FramePreset,
  type ImageEffects,
  type ImageElement,
  type Project,
  type TextElement,
} from '../model/project';
import { migrateProject } from '../model/migrate';
import { parseProject } from '../model/schema';
import { resizeProjectProportionally } from '../sizing/project-size';
import { applyDesignTemplate } from '../templates/templates';

const HISTORY_LIMIT = 50;

export type ElementPatch =
  | Partial<Omit<TextElement, 'id' | 'type'>>
  | Partial<Omit<ImageElement, 'id' | 'type'>>;

export type UpdateElementOptions = { recordHistory?: boolean };

export type EditorStore = {
  project: Project;
  selectedElementId: string | null;
  past: Project[];
  future: Project[];
  historyBatchStart: Project | null;
  reset: () => void;
  loadProject: (project: unknown) => void;
  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
  selectElement: (id: string | null) => void;
  addText: (text?: string) => string;
  addImage: (assetUrl: string, naturalWidth: number, naturalHeight: number) => string;
  updateElement: (id: string, patch: ElementPatch, options?: UpdateElementOptions) => void;
  setElementAnimation: (id: string, patch: Partial<AnimationDefinition>) => void;
  setImageEffects: (id: string, patch: Partial<ImageEffects>) => void;
  addDecoration: (preset: DecorationPreset) => string;
  removeDecoration: (id: string) => void;
  setFrame: (preset: FramePreset, width?: number) => void;
  setExportSettings: (patch: Partial<ExportSettings>) => void;
  resizeProject: (width: number, height: number) => void;
  applyTemplate: (templateId: string) => void;
  removeElement: (id: string) => void;
  commitTransform: (beforeProject: Project, afterProject: Project) => void;
  undo: () => void;
  redo: () => void;
};

function cloneProject(project: Project): Project {
  return structuredClone(project);
}

function appendHistory(history: Project[], project: Project): Project[] {
  return [...history, cloneProject(project)].slice(-HISTORY_LIMIT);
}

function containsElement(project: Project, id: string | null): boolean {
  return id !== null && project.elements.some((element) => element.id === id);
}

function projectsEqual(left: Project, right: Project): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function patchElement(element: EditorElement, patch: ElementPatch): EditorElement {
  return { ...element, ...patch } as EditorElement;
}

function mutationWithHistory(state: EditorStore, nextProject: Project) {
  if (state.historyBatchStart) {
    return { project: nextProject };
  }

  return {
    project: nextProject,
    past: appendHistory(state.past, state.project),
    future: [],
  };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  project: createEmptyProject(),
  selectedElementId: null,
  past: [],
  future: [],
  historyBatchStart: null,

  reset: () => set({
    project: createEmptyProject(),
    selectedElementId: null,
    past: [],
    future: [],
    historyBatchStart: null,
  }),

  loadProject: (project) => {
    const validated = migrateProject(project);
    set({
      project: cloneProject(validated),
      selectedElementId: null,
      past: [],
      future: [],
      historyBatchStart: null,
    });
  },

  beginHistoryBatch: () => {
    const state = get();
    if (state.historyBatchStart) return;
    set({ historyBatchStart: cloneProject(state.project) });
  },

  endHistoryBatch: () => {
    const state = get();
    const start = state.historyBatchStart;
    if (!start) return;

    if (projectsEqual(start, state.project)) {
      set({ historyBatchStart: null });
      return;
    }

    set({
      past: appendHistory(state.past, start),
      future: [],
      historyBatchStart: null,
    });
  },

  selectElement: (id) => {
    const { project } = get();
    if (id !== null && !project.elements.some((element) => element.id === id)) return;
    set({ selectedElementId: id });
  },

  addText: (text = 'Yeni Yazı') => {
    const state = get();
    const id = createId();
    const width = Math.min(190, state.project.width * 0.72);
    const height = Math.min(64, state.project.height * 0.25);
    const element: TextElement = {
      id,
      type: 'text',
      name: 'Yazı',
      text,
      writingMode: 'horizontal',
      x: (state.project.width - width) / 2,
      y: (state.project.height - height) / 2,
      width,
      height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      animation: createDefaultAnimation(),
      fontFamily: 'Arial',
      fontSize: 42,
      fill: '#ffffff',
      stroke: '#111827',
      strokeWidth: 2,
      shadowColor: '#000000',
      shadowBlur: 8,
      align: 'center',
    };
    const nextProject: Project = {
      ...state.project,
      elements: [...state.project.elements, element],
    };
    set({
      project: nextProject,
      selectedElementId: id,
      past: appendHistory(state.past, state.project),
      future: [],
      historyBatchStart: null,
    });
    return id;
  },

  addImage: (assetUrl, naturalWidth, naturalHeight) => {
    if (!assetUrl) throw new Error('Fotoğraf adresi boş olamaz.');
    if (
      !Number.isFinite(naturalWidth) ||
      !Number.isFinite(naturalHeight) ||
      naturalWidth <= 0 ||
      naturalHeight <= 0
    ) {
      throw new Error('Fotoğraf boyutları geçersiz.');
    }

    const state = get();
    const id = createId();
    const maxWidth = state.project.width * 0.9;
    const maxHeight = state.project.height * 0.9;
    const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    const element: ImageElement = {
      id,
      type: 'image',
      name: 'Fotoğraf',
      assetUrl,
      x: (state.project.width - width) / 2,
      y: (state.project.height - height) / 2,
      width,
      height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      animation: createDefaultAnimation(),
      effects: createDefaultImageEffects(),
    };
    const nextProject: Project = {
      ...state.project,
      elements: [...state.project.elements, element],
    };
    set({
      project: nextProject,
      selectedElementId: id,
      past: appendHistory(state.past, state.project),
      future: [],
      historyBatchStart: null,
    });
    return id;
  },

  updateElement: (id, patch, options = {}) => {
    const state = get();
    const index = state.project.elements.findIndex((element) => element.id === id);
    if (index < 0) return;

    const nextElements = [...state.project.elements];
    nextElements[index] = patchElement(nextElements[index], patch);
    const nextProject: Project = { ...state.project, elements: nextElements };

    if (options.recordHistory === false) {
      set({ project: nextProject });
      return;
    }

    set(mutationWithHistory(state, nextProject));
  },

  setElementAnimation: (id, patch) => {
    const state = get();
    const index = state.project.elements.findIndex((element) => element.id === id);
    if (index < 0) return;

    const nextElements = [...state.project.elements];
    const element = nextElements[index];
    nextElements[index] = {
      ...element,
      animation: { ...element.animation, ...patch },
    } as EditorElement;
    set(mutationWithHistory(state, { ...state.project, elements: nextElements }));
  },

  setImageEffects: (id, patch) => {
    const state = get();
    const index = state.project.elements.findIndex((element) => element.id === id);
    if (index < 0 || state.project.elements[index].type !== 'image') return;

    const nextElements = [...state.project.elements];
    const element = nextElements[index] as ImageElement;
    nextElements[index] = {
      ...element,
      effects: { ...element.effects, ...patch },
    };
    set(mutationWithHistory(state, { ...state.project, elements: nextElements }));
  },

  addDecoration: (preset) => {
    const state = get();
    const id = createId();
    const decoration = {
      id,
      preset,
      count: 18,
      opacity: 0.8,
      speed: 'normal' as const,
    };
    set({
      project: {
        ...state.project,
        decorations: [...state.project.decorations, decoration].slice(-12),
      },
      past: appendHistory(state.past, state.project),
      future: [],
      historyBatchStart: null,
    });
    return id;
  },

  removeDecoration: (id) => {
    const state = get();
    if (!state.project.decorations.some((layer) => layer.id === id)) return;
    set({
      project: {
        ...state.project,
        decorations: state.project.decorations.filter((layer) => layer.id !== id),
      },
      past: appendHistory(state.past, state.project),
      future: [],
      historyBatchStart: null,
    });
  },

  setFrame: (preset, width) => {
    const state = get();
    const nextWidth = width ?? state.project.frame.width;
    const nextProject: Project = {
      ...state.project,
      frame: {
        preset,
        width: Math.min(32, Math.max(1, nextWidth)),
      },
    };
    set(mutationWithHistory(state, nextProject));
  },

  setExportSettings: (patch) => {
    const state = get();
    const nextProject = parseProject({
      ...state.project,
      exportSettings: {
        ...state.project.exportSettings,
        ...patch,
      },
    });
    set({ project: nextProject });
  },

  resizeProject: (width, height) => {
    const state = get();
    if (state.project.width === width && state.project.height === height) return;
    const nextProject = resizeProjectProportionally(state.project, width, height);
    set(mutationWithHistory(state, nextProject));
  },

  applyTemplate: (templateId) => {
    const state = get();
    const nextProject = parseProject(applyDesignTemplate(state.project, templateId));
    if (projectsEqual(state.project, nextProject)) return;
    set({
      project: nextProject,
      past: appendHistory(state.past, state.project),
      future: [],
      historyBatchStart: null,
    });
  },

  removeElement: (id) => {
    const state = get();
    if (!state.project.elements.some((element) => element.id === id)) return;
    const nextProject: Project = {
      ...state.project,
      elements: state.project.elements.filter((element) => element.id !== id),
    };
    set({
      project: nextProject,
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      past: appendHistory(state.past, state.project),
      future: [],
      historyBatchStart: null,
    });
  },

  commitTransform: (beforeProject, afterProject) => {
    const state = get();
    const validatedAfter = parseProject(afterProject);
    if (projectsEqual(beforeProject, validatedAfter)) {
      set({ project: cloneProject(validatedAfter), historyBatchStart: null });
      return;
    }
    set({
      project: cloneProject(validatedAfter),
      past: appendHistory(state.past, beforeProject),
      future: [],
      historyBatchStart: null,
    });
  },

  undo: () => {
    const state = get();
    const previous = state.past.at(-1);
    if (!previous) return;
    const restored = cloneProject(previous);
    set({
      project: restored,
      selectedElementId: containsElement(restored, state.selectedElementId)
        ? state.selectedElementId
        : null,
      past: state.past.slice(0, -1),
      future: [cloneProject(state.project), ...state.future].slice(0, HISTORY_LIMIT),
      historyBatchStart: null,
    });
  },

  redo: () => {
    const state = get();
    const [next, ...remainingFuture] = state.future;
    if (!next) return;
    const restored = cloneProject(next);
    set({
      project: restored,
      selectedElementId: containsElement(restored, state.selectedElementId)
        ? state.selectedElementId
        : null,
      past: appendHistory(state.past, state.project),
      future: remainingFuture,
      historyBatchStart: null,
    });
  },
}));

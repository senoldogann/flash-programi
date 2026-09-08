import { create } from 'zustand';
import {
  createDefaultAnimation,
  createDefaultImageEffects,
  createEmptyProject,
  createId,
  type AnimationDefinition,
  type DecorationPreset,
  type EditorElement,
  type FramePreset,
  type ImageEffects,
  type ImageElement,
  type Project,
  type TextElement,
} from '../model/project';
import { parseProject } from '../model/schema';
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
  reset: () => void;
  selectElement: (id: string | null) => void;
  addText: (text?: string) => string;
  addImage: (assetUrl: string, naturalWidth: number, naturalHeight: number) => string;
  updateElement: (id: string, patch: ElementPatch, options?: UpdateElementOptions) => void;
  setElementAnimation: (id: string, patch: Partial<AnimationDefinition>) => void;
  setImageEffects: (id: string, patch: Partial<ImageEffects>) => void;
  addDecoration: (preset: DecorationPreset) => string;
  removeDecoration: (id: string) => void;
  setFrame: (preset: FramePreset, width?: number) => void;
  applyTemplate: (templateId: string) => void;
  removeElement: (id: string) => void;
  commitTransform: (beforeProject: Project, afterProject: Project) => void;
  undo: () => void;
  redo: () => void;
};

function cloneProject(project: Project): Project { return structuredClone(project); }
function appendHistory(history: Project[], project: Project): Project[] { return [...history, cloneProject(project)].slice(-HISTORY_LIMIT); }
function containsElement(project: Project, id: string | null): boolean { return id !== null && project.elements.some((element) => element.id === id); }
function projectsEqual(left: Project, right: Project): boolean { return JSON.stringify(left) === JSON.stringify(right); }
function patchElement(element: EditorElement, patch: ElementPatch): EditorElement { return { ...element, ...patch } as EditorElement; }

export const useEditorStore = create<EditorStore>((set, get) => ({
  project: createEmptyProject(),
  selectedElementId: null,
  past: [],
  future: [],

  reset: () => set({ project: createEmptyProject(), selectedElementId: null, past: [], future: [] }),

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
      id, type: 'text', name: 'Yazı', text,
      x: (state.project.width - width) / 2, y: (state.project.height - height) / 2,
      width, height, rotation: 0, opacity: 1, visible: true, locked: false,
      animation: createDefaultAnimation(),
      fontFamily: 'Arial', fontSize: 42, fill: '#ffffff', stroke: '#111827', strokeWidth: 2,
      shadowColor: '#000000', shadowBlur: 8, align: 'center',
    };
    const nextProject: Project = { ...state.project, elements: [...state.project.elements, element] };
    set({ project: nextProject, selectedElementId: id, past: appendHistory(state.past, state.project), future: [] });
    return id;
  },

  addImage: (assetUrl, naturalWidth, naturalHeight) => {
    if (!assetUrl) throw new Error('Fotoğraf adresi boş olamaz.');
    if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) {
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
      id, type: 'image', name: 'Fotoğraf', assetUrl,
      x: (state.project.width - width) / 2, y: (state.project.height - height) / 2,
      width, height, rotation: 0, opacity: 1, visible: true, locked: false,
      animation: createDefaultAnimation(), effects: createDefaultImageEffects(),
    };
    const nextProject: Project = { ...state.project, elements: [...state.project.elements, element] };
    set({ project: nextProject, selectedElementId: id, past: appendHistory(state.past, state.project), future: [] });
    return id;
  },

  updateElement: (id, patch, options = {}) => {
    const state = get();
    const index = state.project.elements.findIndex((element) => element.id === id);
    if (index < 0) return;
    const nextElements = [...state.project.elements];
    nextElements[index] = patchElement(nextElements[index], patch);
    const nextProject: Project = { ...state.project, elements: nextElements };
    if (options.recordHistory === false) { set({ project: nextProject }); return; }
    set({ project: nextProject, past: appendHistory(state.past, state.project), future: [] });
  },

  setElementAnimation: (id, patch) => {
    const state = get();
    const index = state.project.elements.findIndex((element) => element.id === id);
    if (index < 0) return;
    const nextElements = [...state.project.elements];
    const element = nextElements[index];
    nextElements[index] = { ...element, animation: { ...element.animation, ...patch } } as EditorElement;
    set({ project: { ...state.project, elements: nextElements }, past: appendHistory(state.past, state.project), future: [] });
  },

  setImageEffects: (id, patch) => {
    const state = get();
    const index = state.project.elements.findIndex((element) => element.id === id);
    if (index < 0 || state.project.elements[index].type !== 'image') return;
    const nextElements = [...state.project.elements];
    const element = nextElements[index] as ImageElement;
    nextElements[index] = { ...element, effects: { ...element.effects, ...patch } };
    set({ project: { ...state.project, elements: nextElements }, past: appendHistory(state.past, state.project), future: [] });
  },

  addDecoration: (preset) => {
    const state = get();
    const id = createId();
    const decoration = { id, preset, count: 18, opacity: 0.8, speed: 'normal' as const };
    set({ project: { ...state.project, decorations: [...state.project.decorations, decoration].slice(-12) }, past: appendHistory(state.past, state.project), future: [] });
    return id;
  },

  removeDecoration: (id) => {
    const state = get();
    if (!state.project.decorations.some((layer) => layer.id === id)) return;
    set({ project: { ...state.project, decorations: state.project.decorations.filter((layer) => layer.id !== id) }, past: appendHistory(state.past, state.project), future: [] });
  },

  setFrame: (preset, width) => {
    const state = get();
    const nextWidth = width ?? state.project.frame.width;
    set({ project: { ...state.project, frame: { preset, width: Math.min(32, Math.max(1, nextWidth)) } }, past: appendHistory(state.past, state.project), future: [] });
  },

  applyTemplate: (templateId) => {
    const state = get();
    const nextProject = parseProject(applyDesignTemplate(state.project, templateId));
    if (projectsEqual(state.project, nextProject)) return;
    set({ project: nextProject, past: appendHistory(state.past, state.project), future: [] });
  },

  removeElement: (id) => {
    const state = get();
    if (!state.project.elements.some((element) => element.id === id)) return;
    const nextProject: Project = { ...state.project, elements: state.project.elements.filter((element) => element.id !== id) };
    set({ project: nextProject, selectedElementId: state.selectedElementId === id ? null : state.selectedElementId, past: appendHistory(state.past, state.project), future: [] });
  },

  commitTransform: (beforeProject, afterProject) => {
    const state = get();
    const validatedAfter = parseProject(afterProject);
    if (projectsEqual(beforeProject, validatedAfter)) { set({ project: cloneProject(validatedAfter) }); return; }
    set({ project: cloneProject(validatedAfter), past: appendHistory(state.past, beforeProject), future: [] });
  },

  undo: () => {
    const state = get();
    const previous = state.past.at(-1);
    if (!previous) return;
    const restored = cloneProject(previous);
    set({
      project: restored,
      selectedElementId: containsElement(restored, state.selectedElementId) ? state.selectedElementId : null,
      past: state.past.slice(0, -1),
      future: [cloneProject(state.project), ...state.future].slice(0, HISTORY_LIMIT),
    });
  },

  redo: () => {
    const state = get();
    const [next, ...remainingFuture] = state.future;
    if (!next) return;
    const restored = cloneProject(next);
    set({
      project: restored,
      selectedElementId: containsElement(restored, state.selectedElementId) ? state.selectedElementId : null,
      past: appendHistory(state.past, state.project),
      future: remainingFuture,
    });
  },
}));

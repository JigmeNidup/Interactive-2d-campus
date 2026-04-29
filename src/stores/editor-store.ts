"use client";

import { create } from "zustand";
import {
  type Building,
  type BuildingCategory,
  type CampusMap,
  type DrawingState,
  type EditorTool,
  type MapViewState,
  CATEGORY_COLORS,
} from "@/types";
import { centroidOf, rectFromTwoPoints } from "@/lib/utils";

const MAX_POLYGON_POINTS = 100;
const MAX_HISTORY = 50;

export interface MapMeta {
  id: string | null;
  userId: string | null;
  name: string;
  description: string;
  imageUrl: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  isPublished: boolean;
}

const DEFAULT_META: MapMeta = {
  id: null,
  userId: null,
  name: "Untitled map",
  description: "",
  imageUrl: "",
  viewBoxWidth: 800,
  viewBoxHeight: 600,
  isPublished: false,
};

const DEFAULT_DRAWING: DrawingState = {
  isDrawing: false,
  currentPoints: [],
  selectedBuildingId: null,
  tool: "select",
};

const DEFAULT_VIEW: MapViewState = { x: 0, y: 0, scale: 1 };

interface History {
  past: Building[][];
  future: Building[][];
}

export interface EditorStore {
  meta: MapMeta;
  buildings: Building[];
  drawing: DrawingState;
  view: MapViewState;
  isSaving: boolean;
  isDirty: boolean;
  history: History;

  setTool: (tool: EditorTool) => void;
  startDrawing: (point: [number, number]) => void;
  addPoint: (point: [number, number]) => void;
  finishDrawing: () => string | null;
  cancelDrawing: () => void;

  selectBuilding: (id: string | null) => void;
  addBuilding: (building: Building) => void;
  updateBuilding: (id: string, patch: Partial<Building>) => void;
  moveBuilding: (id: string, dx: number, dy: number) => void;
  pushHistorySnapshot: (snapshot: Building[]) => void;
  deleteBuilding: (id: string) => void;
  reorderBuildings: (orderedIds: string[]) => void;

  setView: (view: Partial<MapViewState>) => void;
  resetView: () => void;

  undo: () => void;
  redo: () => void;

  setMapData: (data: {
    map?: Partial<MapMeta>;
    buildings?: Building[];
    resetHistory?: boolean;
  }) => void;
  setIsSaving: (v: boolean) => void;
  markClean: () => void;
  hydrateFromCampusMap: (map: CampusMap) => void;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampHistory(arr: Building[][]): Building[][] {
  return arr.length > MAX_HISTORY ? arr.slice(arr.length - MAX_HISTORY) : arr;
}

function defaultName(buildings: Building[]): string {
  return `Building ${buildings.length + 1}`;
}

function nextSortOrder(buildings: Building[]): number {
  if (buildings.length === 0) return 0;
  return Math.max(...buildings.map((b) => b.sortOrder)) + 1;
}

function pushHistory(
  history: History,
  current: Building[],
): History {
  return {
    past: clampHistory([...history.past, current]),
    future: [],
  };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  meta: DEFAULT_META,
  buildings: [],
  drawing: DEFAULT_DRAWING,
  view: DEFAULT_VIEW,
  isSaving: false,
  isDirty: false,
  history: { past: [], future: [] },

  setTool: (tool) => {
    set((s) => ({
      drawing: {
        ...s.drawing,
        tool,
        isDrawing: false,
        currentPoints: [],
      },
    }));
  },

  startDrawing: (point) => {
    const { drawing } = get();
    if (drawing.isDrawing) return;
    if (drawing.tool !== "polygon" && drawing.tool !== "rectangle") return;
    set((s) => ({
      drawing: {
        ...s.drawing,
        isDrawing: true,
        currentPoints: [point],
      },
    }));
  },

  addPoint: (point) => {
    set((s) => {
      if (!s.drawing.isDrawing) return s;
      if (s.drawing.currentPoints.length >= MAX_POLYGON_POINTS) return s;
      return {
        drawing: {
          ...s.drawing,
          currentPoints: [...s.drawing.currentPoints, point],
        },
      };
    });
  },

  finishDrawing: () => {
    const { drawing, buildings, history, meta } = get();
    if (!drawing.isDrawing) return null;

    let polygon: [number, number][] = drawing.currentPoints;

    if (drawing.tool === "rectangle") {
      if (polygon.length < 2) {
        set((s) => ({
          drawing: { ...s.drawing, isDrawing: false, currentPoints: [] },
        }));
        return null;
      }
      polygon = rectFromTwoPoints(polygon[0], polygon[polygon.length - 1]);
    } else if (polygon.length < 3) {
      set((s) => ({
        drawing: { ...s.drawing, isDrawing: false, currentPoints: [] },
      }));
      return null;
    }

    const [cx, cy] = centroidOf(polygon);
    const id = uid();
    const newBuilding: Building = {
      id,
      mapId: meta.id ?? "new",
      name: defaultName(buildings),
      abbreviation: `B${buildings.length + 1}`.slice(0, 5).toUpperCase(),
      category: "academic",
      polygonPoints: polygon,
      centerX: cx,
      centerY: cy,
      departments: [],
      sortOrder: nextSortOrder(buildings),
      color: CATEGORY_COLORS.academic,
      locked: false,
    };

    set((s) => ({
      buildings: [...s.buildings, newBuilding],
      drawing: {
        ...s.drawing,
        isDrawing: false,
        currentPoints: [],
        selectedBuildingId: id,
        tool: "select",
      },
      history: pushHistory(history, s.buildings),
      isDirty: true,
    }));

    return id;
  },

  cancelDrawing: () => {
    set((s) => ({
      drawing: { ...s.drawing, isDrawing: false, currentPoints: [] },
    }));
  },

  selectBuilding: (id) => {
    set((s) => ({
      drawing: { ...s.drawing, selectedBuildingId: id },
    }));
  },

  addBuilding: (building) => {
    set((s) => ({
      buildings: [...s.buildings, building],
      history: pushHistory(s.history, s.buildings),
      isDirty: true,
    }));
  },

  updateBuilding: (id, patch) => {
    set((s) => {
      const next = s.buildings.map((b) => {
        if (b.id !== id) return b;
        const merged: Building = { ...b, ...patch };
        if (patch.polygonPoints) {
          const [cx, cy] = centroidOf(patch.polygonPoints);
          merged.centerX = cx;
          merged.centerY = cy;
        }
        if (patch.category && !patch.color) {
          merged.color = CATEGORY_COLORS[patch.category as BuildingCategory];
        }
        return merged;
      });
      return {
        buildings: next,
        history: pushHistory(s.history, s.buildings),
        isDirty: true,
      };
    });
  },

  moveBuilding: (id, dx, dy) => {
    set((s) => {
      const target = s.buildings.find((b) => b.id === id);
      if (!target || target.locked) return s;
      const next = s.buildings.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          polygonPoints: b.polygonPoints.map(
            ([x, y]) => [x + dx, y + dy] as [number, number],
          ),
          centerX: b.centerX + dx,
          centerY: b.centerY + dy,
        };
      });
      return {
        buildings: next,
        isDirty: true,
      };
    });
  },

  pushHistorySnapshot: (snapshot) => {
    set((s) => ({
      history: {
        past: clampHistory([...s.history.past, snapshot]),
        future: [],
      },
    }));
  },

  deleteBuilding: (id) => {
    set((s) => ({
      buildings: s.buildings.filter((b) => b.id !== id),
      drawing: {
        ...s.drawing,
        selectedBuildingId:
          s.drawing.selectedBuildingId === id ? null : s.drawing.selectedBuildingId,
      },
      history: pushHistory(s.history, s.buildings),
      isDirty: true,
    }));
  },

  reorderBuildings: (orderedIds) => {
    set((s) => {
      const byId = new Map(s.buildings.map((b) => [b.id, b]));
      const next: Building[] = [];
      orderedIds.forEach((id, idx) => {
        const b = byId.get(id);
        if (b) next.push({ ...b, sortOrder: idx });
      });
      const remaining = s.buildings.filter((b) => !orderedIds.includes(b.id));
      remaining.forEach((b, idx) => next.push({ ...b, sortOrder: orderedIds.length + idx }));
      return {
        buildings: next,
        history: pushHistory(s.history, s.buildings),
        isDirty: true,
      };
    });
  },

  setView: (view) => set((s) => ({ view: { ...s.view, ...view } })),
  resetView: () => set({ view: DEFAULT_VIEW }),

  undo: () => {
    set((s) => {
      const prev = s.history.past[s.history.past.length - 1];
      if (!prev) return s;
      const newPast = s.history.past.slice(0, -1);
      return {
        buildings: prev,
        history: {
          past: newPast,
          future: clampHistory([...s.history.future, s.buildings]),
        },
        isDirty: true,
      };
    });
  },

  redo: () => {
    set((s) => {
      const next = s.history.future[s.history.future.length - 1];
      if (!next) return s;
      const newFuture = s.history.future.slice(0, -1);
      return {
        buildings: next,
        history: {
          past: clampHistory([...s.history.past, s.buildings]),
          future: newFuture,
        },
        isDirty: true,
      };
    });
  },

  setMapData: ({ map, buildings, resetHistory }) => {
    set((s) => ({
      meta: { ...s.meta, ...(map ?? {}) },
      buildings: buildings ?? s.buildings,
      history: resetHistory ? { past: [], future: [] } : s.history,
    }));
  },

  setIsSaving: (v) => set({ isSaving: v }),
  markClean: () => set({ isDirty: false }),

  hydrateFromCampusMap: (map) => {
    set({
      meta: {
        id: map.id,
        userId: map.userId,
        name: map.name,
        description: map.description ?? "",
        imageUrl: map.imageUrl,
        viewBoxWidth: map.viewBoxWidth,
        viewBoxHeight: map.viewBoxHeight,
        isPublished: map.isPublished,
      },
      buildings: map.buildings,
      drawing: DEFAULT_DRAWING,
      view: DEFAULT_VIEW,
      history: { past: [], future: [] },
      isDirty: false,
    });
  },
}));

export function resetEditorStore() {
  useEditorStore.setState({
    meta: DEFAULT_META,
    buildings: [],
    drawing: DEFAULT_DRAWING,
    view: DEFAULT_VIEW,
    history: { past: [], future: [] },
    isSaving: false,
    isDirty: false,
  });
}

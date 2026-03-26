import { create } from "zustand";
import type {
  Viewport,
  CanvasComponent,
  Zone,
  Connector,
  ActiveTool,
} from "@/types/canvas";
import { MIN_ZOOM, MAX_ZOOM } from "@/lib/constants";

interface CanvasStore {
  // Viewport
  viewport: Viewport;
  setViewport: (v: Partial<Viewport>) => void;

  // Components
  components: Record<string, CanvasComponent>;
  addComponent: (c: CanvasComponent) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  deleteComponents: (ids: string[]) => void;
  setComponents: (components: CanvasComponent[]) => void;

  // Zones
  zones: Record<string, Zone>;
  addZone: (z: Zone) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  setZones: (zones: Zone[]) => void;

  // Connectors
  connectors: Record<string, Connector>;
  addConnector: (c: Connector) => void;
  updateConnector: (id: string, updates: Partial<Connector>) => void;
  deleteConnector: (id: string) => void;
  setConnectors: (connectors: Connector[]) => void;

  // Selection
  selectedIds: string[];
  select: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  minimapVisible: boolean;
  setMinimapVisible: (v: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (v: boolean) => void;
  activeTool: ActiveTool;
  setActiveTool: (t: ActiveTool) => void;

  // Save status
  saveStatus: "idle" | "saving" | "saved" | "error";
  setSaveStatus: (s: "idle" | "saving" | "saved" | "error") => void;

  // Data loaded
  isLoaded: boolean;
  setIsLoaded: (v: boolean) => void;

  // Dirty tracking
  isDirty: boolean;
  markDirty: () => void;
  markClean: () => void;

  // Deletion tracking (for Supabase sync)
  deletedComponentIds: string[];
  deletedConnectorIds: string[];
  deletedZoneIds: string[];
  clearDeletedIds: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  // Viewport
  viewport: { x: 0, y: 0, zoom: 1 },
  setViewport: (v) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...v,
        zoom: v.zoom
          ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom))
          : state.viewport.zoom,
      },
      isDirty: true,
    })),

  // Components
  components: {},
  addComponent: (c) =>
    set((state) => ({
      components: { ...state.components, [c.id]: c },
      isDirty: true,
    })),
  updateComponent: (id, updates) =>
    set((state) => {
      const existing = state.components[id];
      if (!existing) return state;
      return {
        components: {
          ...state.components,
          [id]: { ...existing, ...updates, updated_at: new Date().toISOString() },
        },
        isDirty: true,
      };
    }),
  deleteComponents: (ids) =>
    set((state) => {
      const components = { ...state.components };
      ids.forEach((id) => delete components[id]);
      return {
        components,
        selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
        deletedComponentIds: [...state.deletedComponentIds, ...ids],
        isDirty: true,
      };
    }),
  setComponents: (components) =>
    set({
      components: Object.fromEntries(components.map((c) => [c.id, c])),
    }),

  // Zones
  zones: {},
  addZone: (z) =>
    set((state) => ({ zones: { ...state.zones, [z.id]: z }, isDirty: true })),
  updateZone: (id, updates) =>
    set((state) => {
      const existing = state.zones[id];
      if (!existing) return state;
      return {
        zones: {
          ...state.zones,
          [id]: { ...existing, ...updates, updated_at: new Date().toISOString() },
        },
        isDirty: true,
      };
    }),
  deleteZone: (id) =>
    set((state) => {
      const zones = { ...state.zones };
      delete zones[id];
      return { zones, deletedZoneIds: [...state.deletedZoneIds, id], isDirty: true };
    }),
  setZones: (zones) =>
    set({ zones: Object.fromEntries(zones.map((z) => [z.id, z])) }),

  // Connectors
  connectors: {},
  addConnector: (c) =>
    set((state) => ({
      connectors: { ...state.connectors, [c.id]: c },
      isDirty: true,
    })),
  updateConnector: (id, updates) =>
    set((state) => {
      const existing = state.connectors[id];
      if (!existing) return state;
      return {
        connectors: {
          ...state.connectors,
          [id]: { ...existing, ...updates, updated_at: new Date().toISOString() },
        },
        isDirty: true,
      };
    }),
  deleteConnector: (id) =>
    set((state) => {
      const connectors = { ...state.connectors };
      delete connectors[id];
      return { connectors, deletedConnectorIds: [...state.deletedConnectorIds, id], isDirty: true };
    }),
  setConnectors: (connectors) =>
    set({
      connectors: Object.fromEntries(connectors.map((c) => [c.id, c])),
    }),

  // Selection
  selectedIds: [],
  select: (id, multi = false) =>
    set((state) => {
      if (multi) {
        const exists = state.selectedIds.includes(id);
        return {
          selectedIds: exists
            ? state.selectedIds.filter((i) => i !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    }),
  selectAll: () =>
    set((state) => ({
      selectedIds: Object.keys(state.components),
    })),
  deselectAll: () => set({ selectedIds: [] }),

  // UI State
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v, isDirty: true }),
  minimapVisible: true,
  setMinimapVisible: (v) => set({ minimapVisible: v, isDirty: true }),
  snapToGrid: true,
  setSnapToGrid: (v) => set({ snapToGrid: v, isDirty: true }),
  activeTool: "select",
  setActiveTool: (t) => set({ activeTool: t }),

  // Save status
  saveStatus: "idle",
  setSaveStatus: (s) => set({ saveStatus: s }),

  // Data loaded
  isLoaded: false,
  setIsLoaded: (v) => set({ isLoaded: v }),

  // Dirty tracking
  isDirty: false,
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  // Deletion tracking
  deletedComponentIds: [],
  deletedConnectorIds: [],
  deletedZoneIds: [],
  clearDeletedIds: () =>
    set({ deletedComponentIds: [], deletedConnectorIds: [], deletedZoneIds: [] }),
}));

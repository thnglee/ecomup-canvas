import { create } from "zustand";
import type { CanvasComponent, Zone, Connector } from "@/types/canvas";

const MAX_HISTORY = 50;

export type HistoryActionType =
  | "add_component"
  | "delete_components"
  | "update_component"
  | "move_components"
  | "resize_component"
  | "add_zone"
  | "delete_zone"
  | "update_zone"
  | "add_connector"
  | "delete_connector"
  | "update_connector";

export interface HistoryEntry {
  type: HistoryActionType;
  undo: () => void;
  redo: () => void;
}

interface HistoryStore {
  past: HistoryEntry[];
  future: HistoryEntry[];
  batchId: string | null;

  push: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;

  // Batching for drag operations
  startBatch: (id: string) => void;
  endBatch: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  batchId: null,

  push: (entry) =>
    set((state) => ({
      past: [...state.past.slice(-(MAX_HISTORY - 1)), entry],
      future: [], // Clear redo stack on new action
    })),

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const entry = past[past.length - 1];
    entry.undo();
    set({
      past: past.slice(0, -1),
      future: [...future, entry],
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const entry = future[future.length - 1];
    entry.redo();
    set({
      past: [...past, entry],
      future: future.slice(0, -1),
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),

  startBatch: (id) => set({ batchId: id }),
  endBatch: () => set({ batchId: null }),
}));

// Helper to record component changes with undo/redo
export function recordAction(
  type: HistoryActionType,
  undoFn: () => void,
  redoFn: () => void
) {
  useHistoryStore.getState().push({ type, undo: undoFn, redo: redoFn });
}

// Helper: record add component (undo = delete, redo = re-add)
export function recordAddComponent(
  component: CanvasComponent,
  addFn: (c: CanvasComponent) => void,
  deleteFn: (ids: string[]) => void
) {
  recordAction(
    "add_component",
    () => deleteFn([component.id]),
    () => addFn({ ...component })
  );
}

// Helper: record delete components (undo = re-add all, redo = delete again)
export function recordDeleteComponents(
  components: CanvasComponent[],
  connectors: Connector[],
  addCompFn: (c: CanvasComponent) => void,
  deleteCompFn: (ids: string[]) => void,
  addConnFn: (c: Connector) => void,
  deleteConnFn: (id: string) => void
) {
  const compCopies = components.map((c) => ({ ...c }));
  const connCopies = connectors.map((c) => ({ ...c }));
  const compIds = compCopies.map((c) => c.id);
  const connIds = connCopies.map((c) => c.id);

  recordAction(
    "delete_components",
    () => {
      // Restore components and their connectors
      compCopies.forEach((c) => addCompFn({ ...c }));
      connCopies.forEach((c) => addConnFn({ ...c }));
    },
    () => {
      connIds.forEach((id) => deleteConnFn(id));
      deleteCompFn(compIds);
    }
  );
}

// Helper: record component update (undo = restore old, redo = apply new)
export function recordUpdateComponent(
  id: string,
  oldValues: Partial<CanvasComponent>,
  newValues: Partial<CanvasComponent>,
  updateFn: (id: string, updates: Partial<CanvasComponent>) => void
) {
  recordAction(
    "update_component",
    () => updateFn(id, oldValues),
    () => updateFn(id, newValues)
  );
}

// Helper: record move (batch of position changes)
export function recordMoveComponents(
  moves: Array<{ id: string; oldX: number; oldY: number; newX: number; newY: number }>,
  updateFn: (id: string, updates: Partial<CanvasComponent>) => void
) {
  recordAction(
    "move_components",
    () => moves.forEach((m) => updateFn(m.id, { position_x: m.oldX, position_y: m.oldY })),
    () => moves.forEach((m) => updateFn(m.id, { position_x: m.newX, position_y: m.newY }))
  );
}

// Helper: record zone changes
export function recordAddZone(
  zone: Zone,
  addFn: (z: Zone) => void,
  deleteFn: (id: string) => void
) {
  recordAction(
    "add_zone",
    () => deleteFn(zone.id),
    () => addFn({ ...zone })
  );
}

export function recordDeleteZone(
  zone: Zone,
  addFn: (z: Zone) => void,
  deleteFn: (id: string) => void
) {
  recordAction(
    "delete_zone",
    () => addFn({ ...zone }),
    () => deleteFn(zone.id)
  );
}

export function recordAddConnector(
  connector: Connector,
  addFn: (c: Connector) => void,
  deleteFn: (id: string) => void
) {
  recordAction(
    "add_connector",
    () => deleteFn(connector.id),
    () => addFn({ ...connector })
  );
}

export function recordDeleteConnector(
  connector: Connector,
  addFn: (c: Connector) => void,
  deleteFn: (id: string) => void
) {
  recordAction(
    "delete_connector",
    () => addFn({ ...connector }),
    () => deleteFn(connector.id)
  );
}

// Helper: record connector update (undo = restore old, redo = apply new)
export function recordUpdateConnector(
  id: string,
  oldValues: Partial<Connector>,
  newValues: Partial<Connector>,
  updateFn: (id: string, updates: Partial<Connector>) => void
) {
  recordAction(
    "update_connector",
    () => updateFn(id, oldValues),
    () => updateFn(id, newValues)
  );
}

// Helper: record zone update (undo = restore old, redo = apply new)
export function recordUpdateZone(
  id: string,
  oldValues: Partial<Zone>,
  newValues: Partial<Zone>,
  updateFn: (id: string, updates: Partial<Zone>) => void
) {
  recordAction(
    "update_zone",
    () => updateFn(id, oldValues),
    () => updateFn(id, newValues)
  );
}

// Helper: record zone move with contained components (single undo step)
export function recordMoveZone(
  zoneId: string,
  oldZone: Partial<Zone>,
  newZone: Partial<Zone>,
  componentMoves: Array<{ id: string; oldX: number; oldY: number; newX: number; newY: number }>,
  updateZoneFn: (id: string, updates: Partial<Zone>) => void,
  updateComponentFn: (id: string, updates: Partial<CanvasComponent>) => void
) {
  recordAction(
    "update_zone",
    () => {
      updateZoneFn(zoneId, oldZone);
      componentMoves.forEach((m) => updateComponentFn(m.id, { position_x: m.oldX, position_y: m.oldY }));
    },
    () => {
      updateZoneFn(zoneId, newZone);
      componentMoves.forEach((m) => updateComponentFn(m.id, { position_x: m.newX, position_y: m.newY }));
    }
  );
}

// Helper: record zone resize (single undo step)
export function recordResizeZone(
  zoneId: string,
  oldValues: Partial<Zone>,
  newValues: Partial<Zone>,
  updateFn: (id: string, updates: Partial<Zone>) => void
) {
  recordAction(
    "update_zone",
    () => updateFn(zoneId, oldValues),
    () => updateFn(zoneId, newValues)
  );
}

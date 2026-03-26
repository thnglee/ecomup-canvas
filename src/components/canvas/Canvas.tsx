"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCanvasEvents } from "@/hooks/useCanvasEvents";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useDataLoader } from "@/hooks/useDataLoader";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useViewportCulling } from "@/hooks/useViewportCulling";
import { useCanvasStore } from "@/stores/canvasStore";
import {
  recordAddComponent,
  recordDeleteComponents,
} from "@/stores/historyStore";
import { screenToCanvas } from "@/lib/canvas/math";
import { GRID_SIZE, HEADER_HEIGHT, STATUSBAR_HEIGHT, SIDEBAR_WIDTH } from "@/lib/constants";
import GridBackground from "./GridBackground";
import TransformLayer from "./TransformLayer";
import StatusBar from "./StatusBar";
import Sidebar from "../sidebar/Sidebar";
import NodeWrapper from "./NodeWrapper";
import ComponentRenderer from "./ComponentRenderer";
import ContextMenu from "./ContextMenu";
import SelectionBox from "./SelectionBox";
import CanvasToolbar from "./CanvasToolbar";
import ConnectorLayer from "../connectors/ConnectorLayer";
import ConnectionPoints from "../connectors/ConnectionPoints";
import ZoneRenderer from "../zones/ZoneRenderer";
import ZoneDrawTool from "../zones/ZoneDrawTool";
import Minimap from "./Minimap";
import LoadingSkeleton from "./LoadingSkeleton";
import ToastContainer from "./ToastContainer";
import LinkBoxEditor from "./editors/LinkBoxEditor";
import StickyNoteEditor from "./editors/StickyNoteEditor";
import DataTableEditor from "./editors/DataTableEditor";
import ProcessBlockEditor from "./editors/ProcessBlockEditor";
import ImageEditor from "./editors/ImageEditor";
import type { CanvasComponent, ComponentType } from "@/types/canvas";

const DEFAULT_SIZES: Record<ComponentType, { w: number; h: number }> = {
  link_box: { w: 260, h: 80 },
  data_table: { w: 400, h: 250 },
  sticky_note: { w: 240, h: 160 },
  process_block: { w: 200, h: 80 },
  image: { w: 200, h: 200 },
};

const DEFAULT_DATA: Record<ComponentType, Record<string, unknown>> = {
  link_box: { title: "", description: "", url: "", icon: "web", color_accent: "#3b82f6" },
  data_table: { title: "", columns: ["Column 1", "Column 2"], rows: [] },
  sticky_note: { content: "", color: "blue", font_size: 14 },
  process_block: { title: "", description: "", block_type: "action", url: "" },
  image: { image_url: "", alt_text: "" },
};

function snapToGridValue(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

// NodeWrapper and ComponentRenderer are already memoized via their exports

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  useCanvasEvents(containerRef);
  useAutoSave();
  useDataLoader();

  const isLoaded = useCanvasStore((s) => s.isLoaded);
  const components = useCanvasStore((s) => s.components);
  const zones = useCanvasStore((s) => s.zones);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const addComponent = useCanvasStore((s) => s.addComponent);
  const updateComponent = useCanvasStore((s) => s.updateComponent);
  const deleteComponents = useCanvasStore((s) => s.deleteComponents);
  const deleteConnector = useCanvasStore((s) => s.deleteConnector);
  const addConnector = useCanvasStore((s) => s.addConnector);
  const sidebarCollapsed = useCanvasStore((s) => s.sidebarCollapsed);
  const minimapVisible = useCanvasStore((s) => s.minimapVisible);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; componentId: string } | null>(null);
  // Drag from sidebar
  const [draggingType, setDraggingType] = useState<ComponentType | null>(null);

  // Viewport culling
  const visibleComponentIds = useViewportCulling(containerRef);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Create new component at canvas position
  const createComponent = useCallback(
    (type: ComponentType, canvasX: number, canvasY: number): CanvasComponent => {
      const size = DEFAULT_SIZES[type];
      const maxZ = Math.max(0, ...Object.values(components).map((c) => c.z_index));
      const comp: CanvasComponent = {
        id: crypto.randomUUID(),
        user_id: "", // filled by auto-save
        type,
        position_x: snapToGridValue(canvasX),
        position_y: snapToGridValue(canvasY),
        width: size.w,
        height: size.h,
        z_index: maxZ + 1,
        data: { ...DEFAULT_DATA[type] },
        zone_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addComponent(comp);
      // Record for undo
      recordAddComponent(comp, addComponent, deleteComponents);
      return comp;
    },
    [components, addComponent, deleteComponents]
  );

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.fromSidebar) {
      setDraggingType(data.type as ComponentType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingType(null);
    const data = event.active.data.current;
    if (!data?.fromSidebar || !containerRef.current) return;

    const type = data.type as ComponentType;
    const rect = containerRef.current.getBoundingClientRect();
    const viewport = useCanvasStore.getState().viewport;

    const pointerX = (event.activatorEvent as PointerEvent).clientX + (event.delta?.x || 0);
    const pointerY = (event.activatorEvent as PointerEvent).clientY + (event.delta?.y || 0);

    if (
      pointerX < rect.left ||
      pointerX > rect.right ||
      pointerY < rect.top ||
      pointerY > rect.bottom
    ) {
      return;
    }

    const screenX = pointerX - rect.left;
    const screenY = pointerY - rect.top;
    const canvasPos = screenToCanvas(screenX, screenY, viewport);

    const comp = createComponent(type, canvasPos.x, canvasPos.y);
    setEditingId(comp.id);
  };

  // Actions
  const handleDuplicate = useCallback(() => {
    const state = useCanvasStore.getState();
    const ids = state.selectedIds;
    const maxZ = Math.max(0, ...Object.values(state.components).map((c) => c.z_index));

    ids.forEach((id, i) => {
      const orig = state.components[id];
      if (!orig) return;
      const dup: CanvasComponent = {
        ...orig,
        id: crypto.randomUUID(),
        position_x: orig.position_x + 20,
        position_y: orig.position_y + 20,
        z_index: maxZ + i + 1,
        data: { ...orig.data },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addComponent(dup);
      recordAddComponent(dup, addComponent, deleteComponents);
    });
  }, [addComponent, deleteComponents]);

  const handleDelete = useCallback(() => {
    const state = useCanvasStore.getState();
    const ids = state.selectedIds;
    const toDelete = ids.map((id) => state.components[id]).filter(Boolean);
    if (toDelete.length === 0) return;

    // Find connectors attached to deleted components
    const affectedConnectors = Object.values(state.connectors).filter(
      (c) => ids.includes(c.from_component_id) || ids.includes(c.to_component_id)
    );

    // Record for undo before deleting
    recordDeleteComponents(
      toDelete,
      affectedConnectors,
      addComponent,
      deleteComponents,
      addConnector,
      deleteConnector
    );

    affectedConnectors.forEach((c) => deleteConnector(c.id));
    deleteComponents(ids);
    setEditingId(null);
  }, [deleteComponents, deleteConnector, addComponent, addConnector]);

  const handleBringToFront = useCallback(() => {
    const state = useCanvasStore.getState();
    const maxZ = Math.max(0, ...Object.values(state.components).map((c) => c.z_index));
    selectedIds.forEach((id, i) => {
      updateComponent(id, { z_index: maxZ + i + 1 });
    });
  }, [selectedIds, updateComponent]);

  const handleSendToBack = useCallback(() => {
    const state = useCanvasStore.getState();
    const minZ = Math.min(0, ...Object.values(state.components).map((c) => c.z_index));
    selectedIds.forEach((id, i) => {
      updateComponent(id, { z_index: minZ - (selectedIds.length - i) });
    });
  }, [selectedIds, updateComponent]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onCloseEditor: () => setEditingId(null),
    containerRef,
  });

  // Listen for context menu events from NodeWrapper
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCtxMenu(detail);
    };
    window.addEventListener("canvas-context-menu", handler);
    return () => window.removeEventListener("canvas-context-menu", handler);
  }, []);

  // Render editor for the editing component
  const editingComponent = editingId ? components[editingId] : null;
  const renderEditor = () => {
    if (!editingComponent) return null;
    const props = { component: editingComponent, onClose: () => setEditingId(null) };
    switch (editingComponent.type) {
      case "link_box":
        return <LinkBoxEditor {...props} />;
      case "sticky_note":
        return <StickyNoteEditor {...props} />;
      case "data_table":
        return <DataTableEditor {...props} />;
      case "process_block":
        return <ProcessBlockEditor {...props} />;
      case "image":
        return <ImageEditor {...props} />;
      default:
        return null;
    }
  };

  const sidebarOffset = sidebarCollapsed ? 0 : SIDEBAR_WIDTH;

  // Memoize visible components list
  const visibleComponents = useMemo(() => {
    if (!visibleComponentIds) return Object.values(components);
    return Object.values(components).filter((c) => visibleComponentIds.has(c.id));
  }, [components, visibleComponentIds]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Sidebar />
      <div
        ref={containerRef}
        className="fixed overflow-hidden"
        style={{
          top: HEADER_HEIGHT,
          left: sidebarOffset,
          right: 0,
          bottom: STATUSBAR_HEIGHT,
          background: "#0a0a0f",
          transition: "left 200ms",
        }}
      >
        <GridBackground />
        <TransformLayer>
          {/* Zones — render below components */}
          {Object.values(zones).map((zone) => (
            <ZoneRenderer key={zone.id} zone={zone} />
          ))}

          {/* Zone draw preview */}
          <ZoneDrawTool containerRef={containerRef} />

          {/* Connector SVG layer */}
          <ConnectorLayer containerRef={containerRef} />

          {/* Render visible components only (viewport culling) */}
          {visibleComponents.map((comp) => (
            <NodeWrapper
              key={comp.id}
              component={comp}
              onDoubleClick={() => setEditingId(comp.id)}
            >
              <ComponentRenderer component={comp} />
              <ConnectionPoints component={comp} containerRef={containerRef} />
            </NodeWrapper>
          ))}
        </TransformLayer>

        <SelectionBox containerRef={containerRef} />

        {/* Canvas toolbar */}
        <CanvasToolbar />

        {/* Minimap */}
        {minimapVisible && <Minimap containerRef={containerRef} />}

        {/* Loading skeleton */}
        {!isLoaded && <LoadingSkeleton />}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          onEdit={() => setEditingId(ctxMenu.componentId)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />
      )}

      {/* Editor panel */}
      {renderEditor()}

      {/* Toast notifications */}
      <ToastContainer />

      {/* Drag overlay ghost */}
      <DragOverlay>
        {draggingType && (
          <div className="w-[200px] h-[60px] bg-[#1a1a2e] border border-[#3b82f6] rounded-lg opacity-60 flex items-center justify-center text-xs text-[#e4e4ef]">
            {draggingType.replace("_", " ")}
          </div>
        )}
      </DragOverlay>

      <StatusBar />
    </DndContext>
  );
}

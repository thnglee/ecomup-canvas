"use client";

import { useRef, useState, useCallback, useEffect, memo } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { recordMoveComponents, recordUpdateComponent } from "@/stores/historyStore";
import { GRID_SIZE } from "@/lib/constants";
import type { CanvasComponent } from "@/types/canvas";

interface NodeWrapperProps {
  component: CanvasComponent;
  children: React.ReactNode;
  onDoubleClick?: () => void;
}

function snapToGrid(value: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function NodeWrapper({
  component,
  children,
  onDoubleClick,
}: NodeWrapperProps) {
  const updateComponent = useCanvasStore((s) => s.updateComponent);
  const select = useCanvasStore((s) => s.select);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const snapEnabled = useCanvasStore((s) => s.snapToGrid);
  const viewport = useCanvasStore((s) => s.viewport);

  const isSelected = selectedIds.includes(component.id);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, compX: 0, compY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, compX: 0, compY: 0, handle: "" });

  // Drag to move
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, button, a")) return;

      e.stopPropagation();
      select(component.id, e.shiftKey);

      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        compX: component.position_x,
        compY: component.position_y,
      };
      setIsDragging(true);
    },
    [component.id, component.position_x, component.position_y, select]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.x) / viewport.zoom;
      const dy = (e.clientY - dragStart.current.y) / viewport.zoom;
      const newX = snapToGrid(dragStart.current.compX + dx, snapEnabled);
      const newY = snapToGrid(dragStart.current.compY + dy, snapEnabled);
      updateComponent(component.id, { position_x: newX, position_y: newY });
    };

    const handleUp = () => {
      // Record move for undo (batch: one undo step for the whole drag)
      const state = useCanvasStore.getState();
      const comp = state.components[component.id];
      if (
        comp &&
        (comp.position_x !== dragStart.current.compX ||
          comp.position_y !== dragStart.current.compY)
      ) {
        recordMoveComponents(
          [
            {
              id: component.id,
              oldX: dragStart.current.compX,
              oldY: dragStart.current.compY,
              newX: comp.position_x,
              newY: comp.position_y,
            },
          ],
          updateComponent
        );
      }
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, component.id, viewport.zoom, snapEnabled, updateComponent]);

  // Resize handles
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: component.width,
        h: component.height,
        compX: component.position_x,
        compY: component.position_y,
        handle,
      };
      setIsResizing(true);
    },
    [component.width, component.height, component.position_x, component.position_y]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      const { x: sx, y: sy, w, h, compX, compY, handle } = resizeStart.current;
      const dx = (e.clientX - sx) / viewport.zoom;
      const dy = (e.clientY - sy) / viewport.zoom;

      let newW = w;
      let newH = h;
      let newX = compX;
      let newY = compY;

      if (handle.includes("r")) newW = Math.max(80, w + dx);
      if (handle.includes("l")) {
        newW = Math.max(80, w - dx);
        newX = compX + (w - newW);
      }
      if (handle.includes("b")) newH = Math.max(40, h + dy);
      if (handle.includes("t")) {
        newH = Math.max(40, h - dy);
        newY = compY + (h - newH);
      }

      updateComponent(component.id, {
        width: snapToGrid(newW, snapEnabled),
        height: snapToGrid(newH, snapEnabled),
        position_x: snapToGrid(newX, snapEnabled),
        position_y: snapToGrid(newY, snapEnabled),
      });
    };

    const handleUp = () => {
      // Record resize for undo
      const state = useCanvasStore.getState();
      const comp = state.components[component.id];
      const { w, h, compX, compY } = resizeStart.current;
      if (
        comp &&
        (comp.width !== w || comp.height !== h || comp.position_x !== compX || comp.position_y !== compY)
      ) {
        recordUpdateComponent(
          component.id,
          { width: w, height: h, position_x: compX, position_y: compY },
          { width: comp.width, height: comp.height, position_x: comp.position_x, position_y: comp.position_y },
          updateComponent
        );
      }
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isResizing, component.id, viewport.zoom, snapEnabled, updateComponent]);

  const resizeHandles = ["t", "r", "b", "l", "tl", "tr", "bl", "br"];
  const handleCursors: Record<string, string> = {
    t: "n-resize",
    r: "e-resize",
    b: "s-resize",
    l: "w-resize",
    tl: "nw-resize",
    tr: "ne-resize",
    bl: "sw-resize",
    br: "se-resize",
  };
  const handlePositions: Record<string, React.CSSProperties> = {
    t: { top: -4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8 },
    r: { top: "50%", right: -4, transform: "translateY(-50%)", width: 8, height: 8 },
    b: { bottom: -4, left: "50%", transform: "translateX(-50%)", width: 8, height: 8 },
    l: { top: "50%", left: -4, transform: "translateY(-50%)", width: 8, height: 8 },
    tl: { top: -4, left: -4, width: 8, height: 8 },
    tr: { top: -4, right: -4, width: 8, height: 8 },
    bl: { bottom: -4, left: -4, width: 8, height: 8 },
    br: { bottom: -4, right: -4, width: 8, height: 8 },
  };

  return (
    <div
      data-component-id={component.id}
      className="group absolute"
      style={{
        left: component.position_x,
        top: component.position_y,
        width: component.width,
        height: component.height,
        zIndex: component.z_index,
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging || isResizing ? "none" : "opacity 150ms ease",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        select(component.id, false);
        window.dispatchEvent(
          new CustomEvent("canvas-context-menu", {
            detail: { x: e.clientX, y: e.clientY, componentId: component.id },
          })
        );
      }}
    >
      {/* Component content */}
      <div
        className={`w-full h-full rounded-lg overflow-hidden transition-shadow duration-150 ${
          isSelected
            ? "ring-2 ring-[#3b82f6] shadow-[0_0_0_1px_#3b82f6]"
            : "hover:shadow-lg hover:shadow-[#3b82f6]/10"
        }`}
      >
        {children}
      </div>

      {/* Resize handles — visible on select */}
      {isSelected &&
        resizeHandles.map((handle) => (
          <div
            key={handle}
            className="absolute bg-[#3b82f6] rounded-sm z-10 transition-transform duration-100 hover:scale-125"
            style={{
              ...handlePositions[handle],
              cursor: handleCursors[handle],
            }}
            onMouseDown={(e) => handleResizeStart(e, handle)}
          />
        ))}
    </div>
  );
}

export default memo(NodeWrapper);

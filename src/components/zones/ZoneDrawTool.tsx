"use client";

import { useState, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { recordAddZone } from "@/stores/historyStore";
import { screenToCanvas } from "@/lib/canvas/math";
import { GRID_SIZE } from "@/lib/constants";
import type { Zone } from "@/types/canvas";

interface ZoneDrawToolProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

const MIN_ZONE_SIZE = 100;

export default function ZoneDrawTool({ containerRef }: ZoneDrawToolProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const addZone = useCanvasStore((s) => s.addZone);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  const [drawBox, setDrawBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (activeTool !== "zone" || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-component-id]") || target.closest("[data-zone-id]")) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const vp = useCanvasStore.getState().viewport;
      const canvas = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vp);

      setDrawBox({
        startX: canvas.x,
        startY: canvas.y,
        endX: canvas.x,
        endY: canvas.y,
      });
    },
    [activeTool, containerRef]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeTool !== "zone") return;
    container.addEventListener("mousedown", handleMouseDown);
    return () => container.removeEventListener("mousedown", handleMouseDown);
  }, [containerRef, activeTool, handleMouseDown]);

  useEffect(() => {
    if (!drawBox) return;

    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const vp = useCanvasStore.getState().viewport;
      const canvas = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vp);
      setDrawBox((prev) =>
        prev ? { ...prev, endX: canvas.x, endY: canvas.y } : null
      );
    };

    const handleUp = () => {
      if (!drawBox) return;

      const x = Math.min(drawBox.startX, drawBox.endX);
      const y = Math.min(drawBox.startY, drawBox.endY);
      const w = Math.abs(drawBox.endX - drawBox.startX);
      const h = Math.abs(drawBox.endY - drawBox.startY);

      if (w >= MIN_ZONE_SIZE && h >= MIN_ZONE_SIZE) {
        const zone: Zone = {
          id: crypto.randomUUID(),
          user_id: "",
          name: "Untitled Zone",
          position_x: snapToGrid(x),
          position_y: snapToGrid(y),
          width: snapToGrid(w),
          height: snapToGrid(h),
          color: "#3b82f6",
          z_index: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        addZone(zone);
        recordAddZone(zone, addZone, useCanvasStore.getState().deleteZone);
      }

      setDrawBox(null);
      setActiveTool("select");
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [drawBox, addZone, setActiveTool, containerRef]);

  if (!drawBox || activeTool !== "zone") return null;

  const x = Math.min(drawBox.startX, drawBox.endX);
  const y = Math.min(drawBox.startY, drawBox.endY);
  const w = Math.abs(drawBox.endX - drawBox.startX);
  const h = Math.abs(drawBox.endY - drawBox.startY);

  // This is rendered inside TransformLayer (canvas space)
  return (
    <div
      className="absolute border-2 border-dashed border-[#3b82f6] rounded-lg pointer-events-none"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        backgroundColor: "#3b82f610",
        zIndex: -999,
      }}
    />
  );
}

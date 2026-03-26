"use client";

import { useState, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { screenToCanvas } from "@/lib/canvas/math";

interface SelectionBoxProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function SelectionBox({ containerRef }: SelectionBoxProps) {
  const [box, setBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const select = useCanvasStore((s) => s.select);
  const deselectAll = useCanvasStore((s) => s.deselectAll);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      // Don't start selection when panning (Space or Command held)
      if (e.metaKey) return;
      const cursor = containerRef.current?.style.cursor;
      if (cursor === "grab" || cursor === "grabbing") return;
      // Only start selection box if clicking directly on the canvas container or transform layer
      const target = e.target as HTMLElement;
      if (target.closest("[data-component-id]")) return;
      if (target !== containerRef.current && !target.classList.contains("transform-layer") && !target.classList.contains("grid-bg")) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setBox({ startX: x, startY: y, endX: x, endY: y });
    },
    [containerRef]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!box) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox((prev) =>
        prev
          ? { ...prev, endX: e.clientX - rect.left, endY: e.clientY - rect.top }
          : null
      );
    },
    [box, containerRef]
  );

  const handleMouseUp = useCallback(() => {
    if (!box) return;

    const viewport = useCanvasStore.getState().viewport;
    const components = useCanvasStore.getState().components;

    // Selection rect in canvas space
    const tl = screenToCanvas(Math.min(box.startX, box.endX), Math.min(box.startY, box.endY), viewport);
    const br = screenToCanvas(Math.max(box.startX, box.endX), Math.max(box.startY, box.endY), viewport);

    // Check if the box is too small (just a click)
    if (Math.abs(box.endX - box.startX) < 5 && Math.abs(box.endY - box.startY) < 5) {
      deselectAll();
      setBox(null);
      return;
    }

    // Find intersecting components
    let first = true;
    Object.values(components).forEach((c) => {
      const cx = c.position_x;
      const cy = c.position_y;
      const cw = c.width;
      const ch = c.height;

      if (
        cx + cw > tl.x &&
        cx < br.x &&
        cy + ch > tl.y &&
        cy < br.y
      ) {
        if (first) {
          select(c.id, false);
          first = false;
        } else {
          select(c.id, true);
        }
      }
    });

    if (first) deselectAll();
    setBox(null);
  }, [box, select, deselectAll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mousedown", handleMouseDown);
    return () => container.removeEventListener("mousedown", handleMouseDown);
  }, [containerRef, handleMouseDown]);

  useEffect(() => {
    if (!box) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [box, handleMouseMove, handleMouseUp]);

  if (!box) return null;

  const left = Math.min(box.startX, box.endX);
  const top = Math.min(box.startY, box.endY);
  const width = Math.abs(box.endX - box.startX);
  const height = Math.abs(box.endY - box.startY);

  if (width < 5 && height < 5) return null;

  return (
    <div
      className="absolute pointer-events-none border border-[#3b82f6] bg-[#3b82f6]/10 z-[60]"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
}

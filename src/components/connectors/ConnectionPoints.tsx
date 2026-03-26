"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { screenToCanvas } from "@/lib/canvas/math";
import type { AnchorPosition, CanvasComponent } from "@/types/canvas";

interface ConnectionPointsProps {
  component: CanvasComponent;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ANCHORS: AnchorPosition[] = ["top", "right", "bottom", "left"];

export default function ConnectionPoints({
  component,
  containerRef,
}: ConnectionPointsProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, anchor: AnchorPosition) => {
      e.stopPropagation();
      e.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const vp = useCanvasStore.getState().viewport;
      const canvas = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vp);

      window.dispatchEvent(
        new CustomEvent("connector-draw-start", {
          detail: {
            componentId: component.id,
            anchor,
            startX: canvas.x,
            startY: canvas.y,
          },
        })
      );
    },
    [component.id, containerRef]
  );

  // Positions relative to component's own coordinate space (0,0 = top-left of component)
  const anchorPositions: Record<AnchorPosition, { left: number; top: number }> = {
    top: { left: component.width / 2, top: 0 },
    right: { left: component.width, top: component.height / 2 },
    bottom: { left: component.width / 2, top: component.height },
    left: { left: 0, top: component.height / 2 },
  };

  return (
    <>
      {ANCHORS.map((anchor) => {
        const pos = anchorPositions[anchor];
        return (
          <div
            key={anchor}
            className={`absolute w-[10px] h-[10px] rounded-full border-2 border-[#3b82f6] bg-[#1a1a2e] z-20 transition-opacity ${
              activeTool === "connector"
                ? "opacity-100 group-hover:opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
            style={{
              left: pos.left - 5,
              top: pos.top - 5,
              cursor: "crosshair",
            }}
            onMouseDown={(e) => handleMouseDown(e, anchor)}
          />
        );
      })}
    </>
  );
}

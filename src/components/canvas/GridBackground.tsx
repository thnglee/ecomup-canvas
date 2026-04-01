"use client";

import { GRID_SIZE } from "@/lib/constants";
import { useCanvasStore } from "@/stores/canvasStore";

export default function GridBackground() {
  const zoom = useCanvasStore((s) => s.viewport.zoom);
  const scaledSize = GRID_SIZE * zoom;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
      style={{
        backgroundImage: `radial-gradient(circle, var(--grid-dot) 1px, transparent 1px)`,
        backgroundSize: `${scaledSize}px ${scaledSize}px`,
        backgroundPosition: "0 0",
        backgroundColor: "var(--background)",
      }}
    />
  );
}

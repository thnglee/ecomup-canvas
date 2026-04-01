"use client";

import { useRef, useCallback, useState, useMemo } from "react";
import { useCanvasStore } from "@/stores/canvasStore";

const MINIMAP_WIDTH = 140;
const MINIMAP_HEIGHT = 105;
const MINIMAP_PADDING = 20;

// Color map for component types
const TYPE_COLORS: Record<string, string> = {
  link_box: "#3b82f6",
  data_table: "#22c55e",
  sticky_note: "#eab308",
  process_block: "#a855f7",
  image: "#f97316",
};

interface MinimapProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function Minimap({ containerRef }: MinimapProps) {
  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const components = useCanvasStore((s) => s.components);
  const zones = useCanvasStore((s) => s.zones);
  const setMinimapVisible = useCanvasStore((s) => s.setMinimapVisible);

  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Compute bounding box of all content
  const bounds = useMemo(() => {
    const comps = Object.values(components);
    const zoneValues = Object.values(zones);

    if (comps.length === 0 && zoneValues.length === 0) {
      return { minX: -500, minY: -500, maxX: 500, maxY: 500 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const c of comps) {
      minX = Math.min(minX, c.position_x);
      minY = Math.min(minY, c.position_y);
      maxX = Math.max(maxX, c.position_x + c.width);
      maxY = Math.max(maxY, c.position_y + c.height);
    }
    for (const z of zoneValues) {
      minX = Math.min(minX, z.position_x);
      minY = Math.min(minY, z.position_y);
      maxX = Math.max(maxX, z.position_x + z.width);
      maxY = Math.max(maxY, z.position_y + z.height);
    }

    // Add padding
    const pw = (maxX - minX) * 0.1 + MINIMAP_PADDING;
    const ph = (maxY - minY) * 0.1 + MINIMAP_PADDING;
    return { minX: minX - pw, minY: minY - ph, maxX: maxX + pw, maxY: maxY + ph };
  }, [components, zones]);

  // Scale from canvas coords to minimap coords
  const worldW = bounds.maxX - bounds.minX;
  const worldH = bounds.maxY - bounds.minY;
  const scale = Math.min(MINIMAP_WIDTH / worldW, MINIMAP_HEIGHT / worldH);

  const toMinimap = useCallback(
    (cx: number, cy: number) => ({
      x: (cx - bounds.minX) * scale,
      y: (cy - bounds.minY) * scale,
    }),
    [bounds, scale]
  );

  // Viewport rectangle in minimap coords
  const container = containerRef.current;
  const containerW = container?.clientWidth ?? 800;
  const containerH = container?.clientHeight ?? 600;
  const vpLeft = -viewport.x / viewport.zoom;
  const vpTop = -viewport.y / viewport.zoom;
  const vpWidth = containerW / viewport.zoom;
  const vpHeight = containerH / viewport.zoom;
  const vpMinimap = toMinimap(vpLeft, vpTop);
  const vpW = vpWidth * scale;
  const vpH = vpHeight * scale;

  // Click/drag on minimap to pan
  const jumpTo = useCallback(
    (clientX: number, clientY: number) => {
      const minimap = minimapRef.current;
      if (!minimap) return;

      const rect = minimap.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      // Convert minimap coords to canvas coords
      const canvasX = mx / scale + bounds.minX;
      const canvasY = my / scale + bounds.minY;

      // Center viewport on that point
      const newX = -(canvasX - containerW / viewport.zoom / 2) * viewport.zoom;
      const newY = -(canvasY - containerH / viewport.zoom / 2) * viewport.zoom;

      setViewport({ x: newX, y: newY });
    },
    [scale, bounds, containerW, containerH, viewport.zoom, setViewport]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      jumpTo(e.clientX, e.clientY);
    },
    [jumpTo]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      jumpTo(e.clientX, e.clientY);
    },
    [isDragging, jumpTo]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="absolute bottom-3 right-3 z-40 select-none">
      {/* Collapse button */}
      <button
        onClick={() => setMinimapVisible(false)}
        className="absolute -top-5 right-0 text-[9px] font-medium transition-colors"
        style={{ color: "var(--foreground-faint)" }}
        title="Hide minimap"
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground-muted)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-faint)")}
      >
        Hide
      </button>

      <div
        ref={minimapRef}
        className="rounded-xl overflow-hidden"
        style={{
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          cursor: isDragging ? "grabbing" : "pointer",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render zones as rectangles */}
        {Object.values(zones).map((zone) => {
          const pos = toMinimap(zone.position_x, zone.position_y);
          return (
            <div
              key={zone.id}
              className="absolute rounded-sm"
              style={{
                left: pos.x,
                top: pos.y,
                width: Math.max(2, zone.width * scale),
                height: Math.max(2, zone.height * scale),
                background: zone.color + "20",
                border: `1px solid ${zone.color}40`,
              }}
            />
          );
        })}

        {/* Render components as small colored rectangles */}
        {Object.values(components).map((comp) => {
          const pos = toMinimap(comp.position_x, comp.position_y);
          const color = TYPE_COLORS[comp.type] || "#888";
          return (
            <div
              key={comp.id}
              className="absolute rounded-[1px]"
              style={{
                left: pos.x,
                top: pos.y,
                width: Math.max(2, comp.width * scale),
                height: Math.max(2, comp.height * scale),
                background: color,
                opacity: 0.7,
              }}
            />
          );
        })}

        {/* Viewport rectangle */}
        <div
          className="absolute rounded-sm pointer-events-none"
          style={{
            left: vpMinimap.x,
            top: vpMinimap.y,
            width: vpW,
            height: vpH,
            border: "1.5px solid var(--accent)",
            background: "var(--accent-dim)",
          }}
        />
      </div>
    </div>
  );
}

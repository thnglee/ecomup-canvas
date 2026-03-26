"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCanvasStore } from "@/stores/canvasStore";
import { GRID_SIZE } from "@/lib/constants";
import type { Zone } from "@/types/canvas";

interface ZoneRendererProps {
  zone: Zone;
}

function snapToGrid(value: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

const MIN_ZONE_SIZE = 100;

export default function ZoneRenderer({ zone }: ZoneRendererProps) {
  const updateZone = useCanvasStore((s) => s.updateZone);
  const deleteZone = useCanvasStore((s) => s.deleteZone);
  const updateComponent = useCanvasStore((s) => s.updateComponent);
  const viewport = useCanvasStore((s) => s.viewport);
  const snapEnabled = useCanvasStore((s) => s.snapToGrid);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(zone.name);
  const [showCtxMenu, setShowCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const dragStart = useRef({ x: 0, y: 0, zoneX: 0, zoneY: 0, containedComponents: [] as string[] });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, zoneX: 0, zoneY: 0, handle: "" });
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync name from props
  useEffect(() => {
    setName(zone.name);
  }, [zone.name]);

  // Focus name input when editing
  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  // Get components whose center is inside this zone
  const getContainedComponentIds = useCallback(() => {
    const components = useCanvasStore.getState().components;
    return Object.values(components)
      .filter((c) => {
        const cx = c.position_x + c.width / 2;
        const cy = c.position_y + c.height / 2;
        return (
          cx >= zone.position_x &&
          cx <= zone.position_x + zone.width &&
          cy >= zone.position_y &&
          cy <= zone.position_y + zone.height
        );
      })
      .map((c) => c.id);
  }, [zone.position_x, zone.position_y, zone.width, zone.height]);

  // Drag zone (and contained components)
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const containedIds = getContainedComponentIds();

      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        zoneX: zone.position_x,
        zoneY: zone.position_y,
        containedComponents: containedIds,
      };
      setIsDragging(true);
    },
    [zone.position_x, zone.position_y, getContainedComponentIds]
  );

  useEffect(() => {
    if (!isDragging) return;

    // Capture initial component positions
    const state = useCanvasStore.getState();
    const initialPositions: Record<string, { x: number; y: number }> = {};
    dragStart.current.containedComponents.forEach((id) => {
      const c = state.components[id];
      if (c) initialPositions[id] = { x: c.position_x, y: c.position_y };
    });

    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.x) / viewport.zoom;
      const dy = (e.clientY - dragStart.current.y) / viewport.zoom;

      const newX = snapToGrid(dragStart.current.zoneX + dx, snapEnabled);
      const newY = snapToGrid(dragStart.current.zoneY + dy, snapEnabled);
      updateZone(zone.id, { position_x: newX, position_y: newY });

      // Move contained components by same delta
      const actualDx = newX - dragStart.current.zoneX;
      const actualDy = newY - dragStart.current.zoneY;
      dragStart.current.containedComponents.forEach((id) => {
        const orig = initialPositions[id];
        if (orig) {
          updateComponent(id, {
            position_x: orig.x + actualDx,
            position_y: orig.y + actualDy,
          });
        }
      });
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, zone.id, viewport.zoom, snapEnabled, updateZone, updateComponent]);

  // Resize zone
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: zone.width,
        h: zone.height,
        zoneX: zone.position_x,
        zoneY: zone.position_y,
        handle,
      };
      setIsResizing(true);
    },
    [zone.width, zone.height, zone.position_x, zone.position_y]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent) => {
      const { x: sx, y: sy, w, h, zoneX, zoneY, handle } = resizeStart.current;
      const dx = (e.clientX - sx) / viewport.zoom;
      const dy = (e.clientY - sy) / viewport.zoom;

      let newW = w;
      let newH = h;
      let newX = zoneX;
      let newY = zoneY;

      if (handle.includes("r")) newW = Math.max(MIN_ZONE_SIZE, w + dx);
      if (handle.includes("l")) {
        newW = Math.max(MIN_ZONE_SIZE, w - dx);
        newX = zoneX + (w - newW);
      }
      if (handle.includes("b")) newH = Math.max(MIN_ZONE_SIZE, h + dy);
      if (handle.includes("t")) {
        newH = Math.max(MIN_ZONE_SIZE, h - dy);
        newY = zoneY + (h - newH);
      }

      updateZone(zone.id, {
        width: snapToGrid(newW, snapEnabled),
        height: snapToGrid(newH, snapEnabled),
        position_x: snapToGrid(newX, snapEnabled),
        position_y: snapToGrid(newY, snapEnabled),
      });
    };

    const handleUp = () => setIsResizing(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isResizing, zone.id, viewport.zoom, snapEnabled, updateZone]);

  // Context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCtxMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!showCtxMenu) return;
    const close = () => setShowCtxMenu(null);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [showCtxMenu]);

  // Save name
  const saveName = () => {
    updateZone(zone.id, { name: name.trim() || "Untitled Zone" });
    setIsEditingName(false);
  };

  const resizeHandles = ["t", "r", "b", "l", "tl", "tr", "bl", "br"];
  const handleCursors: Record<string, string> = {
    t: "n-resize", r: "e-resize", b: "s-resize", l: "w-resize",
    tl: "nw-resize", tr: "ne-resize", bl: "sw-resize", br: "se-resize",
  };
  const handlePositions: Record<string, React.CSSProperties> = {
    t: { top: -3, left: "50%", transform: "translateX(-50%)", width: 6, height: 6 },
    r: { top: "50%", right: -3, transform: "translateY(-50%)", width: 6, height: 6 },
    b: { bottom: -3, left: "50%", transform: "translateX(-50%)", width: 6, height: 6 },
    l: { top: "50%", left: -3, transform: "translateY(-50%)", width: 6, height: 6 },
    tl: { top: -3, left: -3, width: 6, height: 6 },
    tr: { top: -3, right: -3, width: 6, height: 6 },
    bl: { bottom: -3, left: -3, width: 6, height: 6 },
    br: { bottom: -3, right: -3, width: 6, height: 6 },
  };

  // Color presets
  const colorPresets = [
    { value: "#3b82f6", label: "Blue" },
    { value: "#22c55e", label: "Green" },
    { value: "#a855f7", label: "Purple" },
    { value: "#f97316", label: "Orange" },
    { value: "#ef4444", label: "Red" },
    { value: "#6b7280", label: "Gray" },
  ];

  return (
    <>
      <div
        data-zone-id={zone.id}
        className="absolute group"
        style={{
          left: zone.position_x,
          top: zone.position_y,
          width: zone.width,
          height: zone.height,
          zIndex: -1000 + (zone.z_index || 0),
          opacity: isDragging ? 0.7 : 1,
        }}
        onContextMenu={handleContextMenu}
      >
        {/* Zone background */}
        <div
          className="w-full h-full rounded-lg border border-dashed"
          style={{
            backgroundColor: `${zone.color}10`,
            borderColor: `${zone.color}40`,
          }}
        />

        {/* Name label — bold glowing banner */}
        <div
          className="absolute left-0 flex items-center"
          style={{ transform: "translateY(-100%)", top: -2 }}
        >
          {isEditingName ? (
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setName(zone.name);
                  setIsEditingName(false);
                }
              }}
              className="px-4 py-1.5 text-sm font-bold bg-[#1a1a2e] border-2 rounded-md text-[#e4e4ef] outline-none"
              style={{
                minWidth: 100,
                maxWidth: 400,
                borderColor: zone.color,
                boxShadow: `0 0 12px ${zone.color}60`,
              }}
            />
          ) : (
            <span
              className="px-4 py-1.5 rounded-md cursor-pointer font-bold text-sm tracking-wide uppercase"
              style={{
                backgroundColor: zone.color,
                color: "#ffffff",
                textShadow: `0 0 8px rgba(255,255,255,0.6), 0 0 20px ${zone.color}`,
                boxShadow: `0 0 15px ${zone.color}80, 0 0 30px ${zone.color}40, inset 0 0 15px ${zone.color}30`,
                letterSpacing: "0.05em",
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              onMouseDown={handleDragStart}
            >
              {zone.name}
            </span>
          )}
        </div>

        {/* Drag handle — entire border area */}
        <div
          className="absolute inset-0 cursor-move"
          style={{ margin: 0 }}
          onMouseDown={handleDragStart}
        />

        {/* Resize handles — visible on hover */}
        {resizeHandles.map((handle) => (
          <div
            key={handle}
            className="absolute rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              ...handlePositions[handle],
              cursor: handleCursors[handle],
              backgroundColor: zone.color,
            }}
            onMouseDown={(e) => handleResizeStart(e, handle)}
          />
        ))}
      </div>

      {/* Context menu — portal to body to escape transform layer */}
      {showCtxMenu && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-[100] bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg py-1 shadow-2xl min-w-[160px]"
          style={{ top: showCtxMenu.y, left: showCtxMenu.x }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setIsEditingName(true);
              setShowCtxMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-[#e4e4ef] hover:bg-[#222240] transition-colors"
          >
            Rename
          </button>

          <div className="border-t border-[#2a2a4a] my-1" />

          <div className="px-3 py-1 text-[10px] text-[#555577] uppercase tracking-wide">Color</div>
          <div className="flex gap-1 px-3 py-1">
            {colorPresets.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  updateZone(zone.id, { color: c.value });
                  setShowCtxMenu(null);
                }}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c.value,
                  borderColor: zone.color === c.value ? "#fff" : "#2a2a4a",
                }}
                title={c.label}
              />
            ))}
          </div>

          <div className="border-t border-[#2a2a4a] my-1" />

          <button
            onClick={() => {
              deleteZone(zone.id);
              setShowCtxMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-[#ef4444] hover:bg-[#3a1e1e] transition-colors"
          >
            Delete Zone
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

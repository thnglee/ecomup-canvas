"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { recordAddConnector, recordDeleteConnector, recordUpdateConnector } from "@/stores/historyStore";
import { screenToCanvas } from "@/lib/canvas/math";
import { getAnchorPoint } from "@/lib/canvas/connectors";
import ConnectorLine from "./ConnectorLine";
import ConnectorLabelEditor from "./ConnectorLabelEditor";
import type { AnchorPosition } from "@/types/canvas";

interface ConnectorLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function ConnectorLayer({ containerRef }: ConnectorLayerProps) {
  const connectors = useCanvasStore((s) => s.connectors);
  const components = useCanvasStore((s) => s.components);

  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [drawState, setDrawState] = useState<{
    fromComponentId: string;
    fromAnchor: AnchorPosition;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Connector context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; connectorId: string } | null>(null);

  const handleConnectorMouseDown = useCallback(
    (connectorId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedConnectorId(connectorId);

      if (e.button === 2) {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY, connectorId });
      }
    },
    []
  );

  const handleConnectorDoubleClick = useCallback(
    (connectorId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingLabelId(connectorId);
    },
    []
  );

  // Deselect connector when clicking empty space
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-component-id]") || target.closest("[data-zone-id]")) {
        setSelectedConnectorId(null);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  // Delete selected connector with Delete/Backspace
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedConnectorId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const state = useCanvasStore.getState();
        const conn = state.connectors[selectedConnectorId];
        if (conn) {
          recordDeleteConnector({ ...conn }, state.addConnector, state.deleteConnector);
        }
        state.deleteConnector(selectedConnectorId);
        setSelectedConnectorId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedConnectorId]);

  // Drawing connector: mouse move and mouse up
  useEffect(() => {
    if (!drawState) return;

    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const vp = useCanvasStore.getState().viewport;
      const canvas = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vp);
      setDrawState((prev) => prev ? { ...prev, currentX: canvas.x, currentY: canvas.y } : null);
    };

    const handleUp = (e: MouseEvent) => {
      if (!drawState) return;

      // Find if we're over a connection point
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        setDrawState(null);
        return;
      }
      const vp = useCanvasStore.getState().viewport;
      const canvas = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, vp);
      const state = useCanvasStore.getState();

      // Find nearest anchor on any component (except source)
      let bestDist = 20; // max snap distance in canvas coords
      let bestTarget: { componentId: string; anchor: AnchorPosition } | null = null;

      const anchors: AnchorPosition[] = ["top", "right", "bottom", "left"];
      for (const comp of Object.values(state.components)) {
        if (comp.id === drawState.fromComponentId) continue;
        for (const anchor of anchors) {
          const pt = getAnchorPoint(comp, anchor);
          const dist = Math.hypot(canvas.x - pt.x, canvas.y - pt.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestTarget = { componentId: comp.id, anchor };
          }
        }
      }

      if (bestTarget) {
        const fromComp = state.components[drawState.fromComponentId];
        const connector = {
          id: crypto.randomUUID(),
          user_id: fromComp?.user_id || "",
          from_component_id: drawState.fromComponentId,
          to_component_id: bestTarget.componentId,
          from_anchor: drawState.fromAnchor,
          to_anchor: bestTarget.anchor,
          type: "arrow" as const,
          style: "solid" as const,
          color: "#ffffff",
          label: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        state.addConnector(connector);
        recordAddConnector(connector, state.addConnector, state.deleteConnector);
      }

      setDrawState(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [drawState, containerRef]);

  // Start drawing (called from ConnectionPoints via custom event)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        componentId: string;
        anchor: AnchorPosition;
        startX: number;
        startY: number;
      };
      setDrawState({
        fromComponentId: detail.componentId,
        fromAnchor: detail.anchor,
        currentX: detail.startX,
        currentY: detail.startY,
      });
    };
    window.addEventListener("connector-draw-start", handler);
    return () => window.removeEventListener("connector-draw-start", handler);
  }, []);

  // Close context menu
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    return () => {
      window.removeEventListener("mousedown", close);
    };
  }, [ctxMenu]);

  // Get draw preview start point
  const getDrawPreviewStart = () => {
    if (!drawState) return null;
    const comp = components[drawState.fromComponentId];
    if (!comp) return null;
    return getAnchorPoint(comp, drawState.fromAnchor);
  };

  const drawStart = getDrawPreviewStart();

  return (
    <>
      {/* SVG layer for connectors - rendered inside TransformLayer */}
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
          zIndex: 0,
        }}
      >
        <g style={{ pointerEvents: "auto" }}>
          {Object.values(connectors).map((conn) => {
            const fromComp = components[conn.from_component_id];
            const toComp = components[conn.to_component_id];
            if (!fromComp || !toComp) return null;
            return (
              <ConnectorLine
                key={conn.id}
                connector={conn}
                fromComponent={fromComp}
                toComponent={toComp}
                isSelected={selectedConnectorId === conn.id}
                onMouseDown={(e) => handleConnectorMouseDown(conn.id, e)}
                onDoubleClick={(e) => handleConnectorDoubleClick(conn.id, e)}
              />
            );
          })}

          {/* Draw preview curve */}
          {drawState && drawStart && (() => {
            const dist = Math.hypot(drawState.currentX - drawStart.x, drawState.currentY - drawStart.y);
            const curv = Math.min(dist * 0.4, 150);
            const offsets: Record<string, { dx: number; dy: number }> = {
              top: { dx: 0, dy: -curv }, bottom: { dx: 0, dy: curv },
              left: { dx: -curv, dy: 0 }, right: { dx: curv, dy: 0 },
            };
            const c1 = offsets[drawState.fromAnchor] || { dx: 0, dy: 0 };
            const cp1x = drawStart.x + c1.dx;
            const cp1y = drawStart.y + c1.dy;
            // End control point: pull toward the start
            const cp2x = drawState.currentX - (drawState.currentX - drawStart.x) * 0.3;
            const cp2y = drawState.currentY - (drawState.currentY - drawStart.y) * 0.3;
            return (
              <path
                d={`M ${drawStart.x},${drawStart.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${drawState.currentX},${drawState.currentY}`}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="6,3"
                fill="none"
                style={{ pointerEvents: "none" }}
              />
            );
          })()}
        </g>
      </svg>

      {/* Connector label editor */}
      {editingLabelId && (
        <ConnectorLabelEditor
          connectorId={editingLabelId}
          onClose={() => setEditingLabelId(null)}
        />
      )}

      {/* Connector context menu */}
      {ctxMenu && (
        <ConnectorContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          connectorId={ctxMenu.connectorId}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}

// Inline connector context menu
function ConnectorContextMenu({
  x,
  y,
  connectorId,
  onClose,
}: {
  x: number;
  y: number;
  connectorId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const connector = useCanvasStore((s) => s.connectors[connectorId]);
  const updateConnector = useCanvasStore((s) => s.updateConnector);
  const deleteConnector = useCanvasStore((s) => s.deleteConnector);
  const addConnector = useCanvasStore((s) => s.addConnector);

  if (!connector) return null;

  const typeOptions = [
    { value: "line", label: "Line (no arrow)" },
    { value: "arrow", label: "Arrow" },
    { value: "bidirectional", label: "Bidirectional" },
  ] as const;

  const styleOptions = [
    { value: "solid", label: "Solid" },
    { value: "dashed", label: "Dashed" },
  ] as const;

  const colorOptions = [
    { value: "#ffffff", label: "White" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#22c55e", label: "Green" },
    { value: "#eab308", label: "Yellow" },
    { value: "#ef4444", label: "Red" },
    { value: "#a855f7", label: "Purple" },
  ];

  return (
    <div
      ref={ref}
      className="fixed z-[100] bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg py-1 shadow-2xl min-w-[180px]"
      style={{ top: y, left: x }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Type */}
      <div className="px-3 py-1 text-[10px] text-[#555577] uppercase tracking-wide">Type</div>
      {typeOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            const oldType = connector.type;
            updateConnector(connectorId, { type: opt.value });
            recordUpdateConnector(connectorId, { type: oldType }, { type: opt.value }, updateConnector);
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#222240] transition-colors ${
            connector.type === opt.value ? "text-[#3b82f6]" : "text-[#e4e4ef]"
          }`}
        >
          {opt.label}
        </button>
      ))}

      <div className="border-t border-[#2a2a4a] my-1" />

      {/* Style */}
      <div className="px-3 py-1 text-[10px] text-[#555577] uppercase tracking-wide">Style</div>
      {styleOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            const oldStyle = connector.style;
            updateConnector(connectorId, { style: opt.value });
            recordUpdateConnector(connectorId, { style: oldStyle }, { style: opt.value }, updateConnector);
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#222240] transition-colors ${
            connector.style === opt.value ? "text-[#3b82f6]" : "text-[#e4e4ef]"
          }`}
        >
          {opt.label}
        </button>
      ))}

      <div className="border-t border-[#2a2a4a] my-1" />

      {/* Color */}
      <div className="px-3 py-1 text-[10px] text-[#555577] uppercase tracking-wide">Color</div>
      <div className="flex gap-1 px-3 py-1">
        {colorOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              const oldColor = connector.color;
              updateConnector(connectorId, { color: opt.value });
              recordUpdateConnector(connectorId, { color: oldColor }, { color: opt.value }, updateConnector);
              onClose();
            }}
            className="w-5 h-5 rounded-full border-2 transition-all"
            style={{
              backgroundColor: opt.value,
              borderColor: connector.color === opt.value ? "#3b82f6" : "#2a2a4a",
            }}
            title={opt.label}
          />
        ))}
      </div>

      <div className="border-t border-[#2a2a4a] my-1" />

      {/* Delete */}
      <button
        onClick={() => {
          recordDeleteConnector({ ...connector }, addConnector, deleteConnector);
          deleteConnector(connectorId);
          onClose();
        }}
        className="w-full text-left px-3 py-1.5 text-xs text-[#ef4444] hover:bg-[#3a1e1e] transition-colors"
      >
        Delete Connector
      </button>
    </div>
  );
}

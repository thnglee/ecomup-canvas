"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import type { ActiveTool } from "@/types/canvas";

function exportCanvasData() {
  const state = useCanvasStore.getState();
  const exportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    canvas_state: { viewport: state.viewport, snap_to_grid: state.snapToGrid },
    components: Object.values(state.components),
    zones: Object.values(state.zones),
    connectors: Object.values(state.connectors),
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ecomup-canvas-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const TOOLS: { tool: ActiveTool; label: string; icon: string }[] = [
  { tool: "select",    label: "Select",    icon: "↖" },
  { tool: "connector", label: "Connector", icon: "⤳" },
  { tool: "zone",      label: "Zone",      icon: "▢" },
];

export default function CanvasToolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const handleExport = useCallback(() => exportCanvasData(), []);

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 px-1 py-1 rounded-xl shadow-2xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
      }}
      role="toolbar"
      aria-label="Canvas tools"
    >
      {TOOLS.map(({ tool, label, icon }) => {
        const isActive = activeTool === tool;
        return (
          <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            title={label}
            aria-pressed={isActive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "#fff" : "var(--foreground-muted)",
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--foreground-muted)";
            }}
          >
            <span className="text-sm leading-none" aria-hidden="true">{icon}</span>
            {label}
          </button>
        );
      })}

      {/* Divider */}
      <div
        className="w-px mx-0.5 self-stretch"
        style={{ background: "var(--border)" }}
        aria-hidden="true"
      />

      <button
        onClick={handleExport}
        title="Export canvas as JSON"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
        style={{ color: "var(--foreground-muted)" }}
        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--foreground)"}
        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "var(--foreground-muted)"}
      >
        <span className="text-sm leading-none" aria-hidden="true">↓</span>
        Export
      </button>
    </div>
  );
}

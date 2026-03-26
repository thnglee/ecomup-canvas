"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import type { ActiveTool } from "@/types/canvas";

function exportCanvasData() {
  const state = useCanvasStore.getState();
  const exportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    canvas_state: {
      viewport: state.viewport,
      snap_to_grid: state.snapToGrid,
    },
    components: Object.values(state.components),
    zones: Object.values(state.zones),
    connectors: Object.values(state.connectors),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ecomup-canvas-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CanvasToolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  const handleExport = useCallback(() => exportCanvasData(), []);

  const tools: { tool: ActiveTool; label: string; icon: string }[] = [
    { tool: "select", label: "Select", icon: "↖" },
    { tool: "connector", label: "Connector", icon: "↗" },
    { tool: "zone", label: "Add Zone", icon: "▢" },
  ];

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg px-1 py-1 shadow-xl">
      {tools.map(({ tool, label, icon }) => (
        <button
          key={tool}
          onClick={() => setActiveTool(tool)}
          className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
            activeTool === tool
              ? "bg-[#3b82f6] text-white"
              : "text-[#8888aa] hover:text-[#e4e4ef] hover:bg-[#222240]"
          }`}
          title={label}
        >
          <span className="text-sm">{icon}</span>
          {label}
        </button>
      ))}

      <div className="w-px h-5 bg-[#2a2a4a] mx-0.5" />

      <button
        onClick={handleExport}
        className="px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 text-[#8888aa] hover:text-[#e4e4ef] hover:bg-[#222240]"
        title="Export canvas as JSON"
      >
        <span className="text-sm">↓</span>
        Export
      </button>
    </div>
  );
}

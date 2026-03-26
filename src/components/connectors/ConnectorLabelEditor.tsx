"use client";

import { useState, useRef, useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { canvasToScreen } from "@/lib/canvas/math";
import { HEADER_HEIGHT } from "@/lib/constants";
import { getAnchorPoint } from "@/lib/canvas/connectors";

interface ConnectorLabelEditorProps {
  connectorId: string;
  onClose: () => void;
}

export default function ConnectorLabelEditor({
  connectorId,
  onClose,
}: ConnectorLabelEditorProps) {
  const connector = useCanvasStore((s) => s.connectors[connectorId]);
  const components = useCanvasStore((s) => s.components);
  const viewport = useCanvasStore((s) => s.viewport);
  const updateConnector = useCanvasStore((s) => s.updateConnector);

  const [label, setLabel] = useState(connector?.label || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  if (!connector) return null;

  const fromComp = components[connector.from_component_id];
  const toComp = components[connector.to_component_id];
  if (!fromComp || !toComp) return null;

  const fromPt = getAnchorPoint(fromComp, connector.from_anchor);
  const toPt = getAnchorPoint(toComp, connector.to_anchor);
  const midX = (fromPt.x + toPt.x) / 2;
  const midY = (fromPt.y + toPt.y) / 2;

  const screen = canvasToScreen(midX, midY, viewport);
  const sidebarOffset = useCanvasStore.getState().sidebarCollapsed ? 0 : 260;

  const handleSave = () => {
    updateConnector(connectorId, { label: label.trim() || null });
    onClose();
  };

  return (
    <div
      className="fixed z-[110]"
      style={{
        top: screen.y + HEADER_HEIGHT - 16,
        left: screen.x + sidebarOffset - 80,
      }}
    >
      <input
        ref={inputRef}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onClose();
        }}
        onBlur={handleSave}
        className="w-[160px] px-2 py-1 text-xs bg-[#1a1a2e] border border-[#3b82f6] rounded text-[#e4e4ef] outline-none"
        placeholder="Label..."
      />
    </div>
  );
}

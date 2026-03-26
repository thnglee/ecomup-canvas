"use client";

import type { CanvasComponent } from "@/types/canvas";

const BLOCK_TYPES: Record<string, { bg: string; border: string; icon: string }> = {
  action: { bg: "#1e3a5f", border: "#2563eb", icon: "🔵" },
  decision: { bg: "#3d3520", border: "#eab308", icon: "🟡" },
  contact: { bg: "#2d1e3a", border: "#7c3aed", icon: "🟣" },
  wait: { bg: "#2a2a2a", border: "#525252", icon: "⚪" },
};

interface ProcessBlockProps {
  component: CanvasComponent;
}

export default function ProcessBlock({ component }: ProcessBlockProps) {
  const { title, description, block_type, url } = component.data;
  const style = BLOCK_TYPES[block_type] || BLOCK_TYPES.action;

  return (
    <div
      className="w-full h-full rounded-lg border p-3 flex flex-col justify-center relative hover:brightness-110 transition-all"
      style={{ backgroundColor: style.bg, borderColor: style.border }}
      onClick={(e) => {
        if ((e.ctrlKey || e.metaKey) && url) {
          e.stopPropagation();
          window.open(url, "_blank", "noopener");
        }
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm select-none">{style.icon}</span>
        <span className="text-sm font-semibold text-[#e4e4ef] truncate">
          {title || "Untitled"}
        </span>
      </div>
      {description && (
        <div className="text-xs text-[#8888aa] mt-1 line-clamp-2">{description}</div>
      )}
      {url && (
        <span className="absolute bottom-2 right-2 text-[10px] text-[#555577]">🔗</span>
      )}
      {/* Connection points — visible on hover */}
      {["top", "right", "bottom", "left"].map((pos) => {
        const posStyle: Record<string, React.CSSProperties> = {
          top: { top: -3, left: "50%", transform: "translateX(-50%)" },
          right: { top: "50%", right: -3, transform: "translateY(-50%)" },
          bottom: { bottom: -3, left: "50%", transform: "translateX(-50%)" },
          left: { top: "50%", left: -3, transform: "translateY(-50%)" },
        };
        return (
          <div
            key={pos}
            className="absolute w-[6px] h-[6px] rounded-full bg-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity"
            style={posStyle[pos]}
          />
        );
      })}
    </div>
  );
}

export { BLOCK_TYPES };

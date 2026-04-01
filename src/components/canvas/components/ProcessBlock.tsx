"use client";

import type { CanvasComponent } from "@/types/canvas";

const BLOCK_TYPES: Record<string, { bg: string; border: string; dot: string }> = {
  action:   { bg: "rgba(91,156,246,0.07)",  border: "rgba(91,156,246,0.3)",  dot: "var(--accent)" },
  decision: { bg: "rgba(224,185,74,0.07)",  border: "rgba(224,185,74,0.3)",  dot: "#c9a84c" },
  contact:  { bg: "rgba(168,85,247,0.07)",  border: "rgba(168,85,247,0.3)",  dot: "#a855f7" },
  wait:     { bg: "rgba(120,120,160,0.07)", border: "rgba(120,120,160,0.3)", dot: "var(--foreground-muted)" },
};

interface ProcessBlockProps {
  component: CanvasComponent;
}

export default function ProcessBlock({ component }: ProcessBlockProps) {
  const { title, description, block_type, url } = component.data;
  const style = BLOCK_TYPES[(block_type as string)] || BLOCK_TYPES.action;

  return (
    <div
      className="w-full h-full p-3 flex flex-col justify-center relative transition-all"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: "var(--radius)",
      }}
      onClick={(e) => {
        if ((e.ctrlKey || e.metaKey) && url) {
          e.stopPropagation();
          window.open(url as string, "_blank", "noopener");
        }
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.filter = "brightness(1.1)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.filter = "brightness(1)")}
    >
      <div className="flex items-center gap-2">
        {/* Type indicator dot */}
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: style.dot }}
          aria-hidden="true"
        />
        <span
          className="text-xs font-semibold truncate"
          style={{ color: "var(--foreground)" }}
        >
          {(title as string) || "Untitled"}
        </span>
      </div>

      {description && (
        <div
          className="text-[10px] mt-1.5 line-clamp-2 leading-snug"
          style={{ color: "var(--foreground-muted)" }}
        >
          {description as string}
        </div>
      )}

      {url && (
        <span
          className="absolute bottom-2 right-2 text-[9px] font-medium"
          style={{ color: "var(--foreground-faint)" }}
          aria-hidden="true"
        >
          ↗
        </span>
      )}
    </div>
  );
}

export { BLOCK_TYPES };

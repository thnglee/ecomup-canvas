"use client";

import type { CanvasComponent } from "@/types/canvas";

const PRESET_ICONS: Record<string, string> = {
  sheet: "📊",
  web: "🌐",
  chat: "💬",
  folder: "📁",
  video: "🎬",
  image: "🖼️",
  tool: "🔧",
  ads: "📢",
};

interface LinkBoxProps {
  component: CanvasComponent;
}

export default function LinkBox({ component }: LinkBoxProps) {
  const { title, description, url, icon, color_accent } = component.data;
  const displayIcon = PRESET_ICONS[icon] || icon || "🔗";
  const accent = color_accent || "#3b82f6";

  const handleCtrlClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      e.preventDefault();
      if (url) window.open(url, "_blank", "noopener");
    }
  };

  return (
    <div
      className="w-full h-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg flex items-start gap-3 p-3 hover:bg-[#222240] hover:border-[#3a3a5a] transition-colors relative overflow-hidden"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
      onClick={handleCtrlClick}
      title={url}
    >
      <span className="text-lg shrink-0 select-none">{displayIcon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[#e4e4ef] truncate">{title || "Untitled"}</div>
        {description && (
          <div className="text-xs text-[#8888aa] mt-1 line-clamp-2">{description}</div>
        )}
      </div>
      {url && (
        <span
          className="absolute top-2 right-2 text-[#555577] hover:text-[#e4e4ef] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-xs"
          onClick={(e) => {
            e.stopPropagation();
            window.open(url, "_blank", "noopener");
          }}
        >
          ↗
        </span>
      )}
    </div>
  );
}

export { PRESET_ICONS };

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

  const normalizeUrl = (rawUrl: string) => {
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    return `https://${rawUrl}`;
  };

  const handleCtrlClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      e.preventDefault();
      if (url) window.open(normalizeUrl(url), "_blank", "noopener");
    }
  };

  return (
    <div
      className="group w-full h-full bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg flex items-start gap-3 p-3 hover:bg-[#222240] hover:border-[#3a3a5a] transition-colors relative overflow-hidden"
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
        <a
          href={normalizeUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 self-center w-7 h-7 flex items-center justify-center rounded-md bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/40 hover:text-white hover:shadow-[0_0_8px_rgba(59,130,246,0.5)] cursor-pointer transition-all text-sm font-bold"
          onClick={(e) => e.stopPropagation()}
          title={`Open ${url}`}
        >
          ↗
        </a>
      )}
    </div>
  );
}

export { PRESET_ICONS };

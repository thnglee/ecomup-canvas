"use client";

import type { CanvasComponent } from "@/types/canvas";

const PRESET_ICONS: Record<string, string> = {
  sheet:  "⊞",
  web:    "↗",
  chat:   "◷",
  folder: "◫",
  video:  "▷",
  image:  "⊡",
  tool:   "⚙",
  ads:    "◈",
};

interface LinkBoxProps {
  component: CanvasComponent;
}

export default function LinkBox({ component }: LinkBoxProps) {
  const { title, description, url, icon, color_accent } = component.data;
  const displayIcon = PRESET_ICONS[icon] ?? icon ?? "↗";
  const accent = (color_accent as string) || "var(--accent)";

  const normalizeUrl = (rawUrl: string) => {
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    return `https://${rawUrl}`;
  };

  const handleCtrlClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      e.preventDefault();
      if (url) window.open(normalizeUrl(url as string), "_blank", "noopener");
    }
  };

  return (
    <div
      className="group w-full h-full flex items-start gap-3 p-3 relative overflow-hidden transition-colors"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        borderLeftColor: accent,
        borderLeftWidth: 2,
      }}
      onClick={handleCtrlClick}
      title={url as string | undefined}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-hover)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-raised)")}
    >
      {/* Icon */}
      <span
        className="text-sm shrink-0 select-none w-7 h-7 flex items-center justify-center rounded-md font-semibold"
        style={{ background: "var(--surface)", color: accent, border: "1px solid var(--border)" }}
        aria-hidden="true"
      >
        {displayIcon}
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div
          className="text-xs font-semibold truncate leading-snug"
          style={{ color: "var(--foreground)" }}
        >
          {(title as string) || "Untitled"}
        </div>
        {description && (
          <div
            className="text-[10px] mt-0.5 line-clamp-2 leading-snug"
            style={{ color: "var(--foreground-muted)" }}
          >
            {description as string}
          </div>
        )}
      </div>

      {/* Open link */}
      {url && (
        <a
          href={normalizeUrl(url as string)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 self-center w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid rgba(91,156,246,0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
          title={`Open ${url}`}
          aria-label={`Open ${title || url}`}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent)";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--accent-dim)";
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
        >
          ↗
        </a>
      )}
    </div>
  );
}

export { PRESET_ICONS };

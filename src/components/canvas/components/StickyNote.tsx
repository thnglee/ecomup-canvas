"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CanvasComponent } from "@/types/canvas";

/** Each color maps to a subtle tinted surface on top of the dark canvas */
const NOTE_COLORS: Record<string, { bg: string; border: string; labelColor: string }> = {
  yellow: { bg: "rgba(224,185,74,0.07)",  border: "rgba(224,185,74,0.25)",  labelColor: "#c9a84c" },
  blue:   { bg: "rgba(91,156,246,0.07)",  border: "rgba(91,156,246,0.25)",  labelColor: "var(--accent)" },
  green:  { bg: "rgba(52,196,122,0.07)",  border: "rgba(52,196,122,0.25)",  labelColor: "var(--success)" },
  red:    { bg: "rgba(240,96,96,0.07)",   border: "rgba(240,96,96,0.25)",   labelColor: "var(--danger)" },
  purple: { bg: "rgba(168,85,247,0.07)",  border: "rgba(168,85,247,0.25)",  labelColor: "#a855f7" },
  gray:   { bg: "rgba(120,120,160,0.07)", border: "rgba(120,120,160,0.25)", labelColor: "var(--foreground-muted)" },
};

interface StickyNoteProps {
  component: CanvasComponent;
}

export default function StickyNote({ component }: StickyNoteProps) {
  const { content, color, font_size } = component.data;
  const colors = NOTE_COLORS[(color as string)] || NOTE_COLORS.blue;
  const fontSize = (font_size as number) || 13;

  return (
    <div
      className="w-full h-full p-3 overflow-auto"
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "var(--radius)",
        fontSize: `${fontSize}px`,
      }}
    >
      <div
        className="prose prose-invert prose-sm max-w-none leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-4
          [&_ol]:list-decimal [&_ol]:pl-4
          [&_li]:my-0.5
          [&_p]:my-1
          [&_code]:px-1 [&_code]:rounded [&_code]:text-[0.85em]
          [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs"
        style={{
          color: "var(--foreground)",
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {(content as string) || "*Empty note*"}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export { NOTE_COLORS };

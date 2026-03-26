"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CanvasComponent } from "@/types/canvas";

const NOTE_COLORS: Record<string, { bg: string; border: string }> = {
  yellow: { bg: "#3d3520", border: "#6b5c28" },
  blue: { bg: "#1e2a3a", border: "#2563eb" },
  green: { bg: "#1a2e1a", border: "#22863a" },
  red: { bg: "#3a1e1e", border: "#dc2626" },
  purple: { bg: "#2d1e3a", border: "#7c3aed" },
  gray: { bg: "#2a2a2a", border: "#525252" },
};

interface StickyNoteProps {
  component: CanvasComponent;
}

export default function StickyNote({ component }: StickyNoteProps) {
  const { content, color, font_size } = component.data;
  const colors = NOTE_COLORS[color] || NOTE_COLORS.blue;
  const fontSize = font_size || 14;

  return (
    <div
      className="w-full h-full rounded-lg border p-3 overflow-auto"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        fontSize: `${fontSize}px`,
      }}
    >
      <div className="prose prose-invert prose-sm max-w-none text-[#e4e4ef] [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_p]:my-1 [&_code]:bg-black/30 [&_code]:px-1 [&_code]:rounded [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content || "*Empty note*"}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export { NOTE_COLORS };

"use client";

import { useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { HEADER_HEIGHT, STATUSBAR_HEIGHT, SIDEBAR_WIDTH } from "@/lib/constants";
import { useDraggable } from "@dnd-kit/core";
import type { ComponentType } from "@/types/canvas";

interface ComponentCard {
  type: ComponentType;
  name: string;
  icon: string;
  description: string;
}

const COMPONENT_CARDS: ComponentCard[] = [
  { type: "link_box",      name: "Link Box",      icon: "↗", description: "External link to any resource" },
  { type: "data_table",    name: "Data Table",    icon: "⊞", description: "Tabular data on canvas" },
  { type: "sticky_note",   name: "Sticky Note",   icon: "◫", description: "Markdown notes & tips" },
  { type: "process_block", name: "Process Block", icon: "⬡", description: "Workflow step for flowcharts" },
  { type: "image",         name: "Image",         icon: "⊡", description: "Images, logos, badges" },
];

function DraggableCard({ card }: { card: ComponentCard }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${card.type}`,
    data: { type: card.type, fromSidebar: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-grab transition-all"
      style={{
        background: isDragging ? "var(--surface-hover)" : "var(--surface-raised)",
        borderColor: "var(--border)",
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = isDragging ? "var(--surface-hover)" : "var(--surface-raised)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      <span
        className="w-7 h-7 flex items-center justify-center rounded-md text-sm font-medium shrink-0"
        style={{ background: "var(--surface)", color: "var(--accent)", border: "1px solid var(--border)" }}
        aria-hidden="true"
      >
        {card.icon}
      </span>
      <div className="min-w-0">
        <div
          className="text-xs font-semibold leading-snug"
          style={{ color: "var(--foreground)" }}
        >
          {card.name}
        </div>
        <div
          className="text-[10px] leading-snug mt-0.5"
          style={{ color: "var(--foreground-muted)" }}
        >
          {card.description}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const collapsed = useCanvasStore((s) => s.sidebarCollapsed);
  const setCollapsed = useCanvasStore((s) => s.setSidebarCollapsed);
  const [search, setSearch] = useState("");

  const filtered = COMPONENT_CARDS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="fixed z-40 flex items-center justify-center w-5 h-7 rounded-r-md text-xs transition-all"
        style={{
          top: HEADER_HEIGHT + 14,
          left: collapsed ? 0 : SIDEBAR_WIDTH,
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          borderLeft: "none",
          color: "var(--foreground-muted)",
        }}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* Sidebar panel */}
      <div
        className="fixed z-30 overflow-hidden transition-[width] duration-200"
        style={{
          top: HEADER_HEIGHT,
          left: 0,
          bottom: STATUSBAR_HEIGHT,
          width: collapsed ? 0 : SIDEBAR_WIDTH,
          background: "var(--surface)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex flex-col h-full p-3 gap-3" style={{ width: SIDEBAR_WIDTH }}>
          {/* Section label */}
          <div className="flex items-center justify-between px-1 pt-1">
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "var(--foreground-faint)" }}
            >
              Components
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <span
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
              style={{ color: "var(--foreground-faint)" }}
            >
              ⌕
            </span>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg outline-none transition-colors"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
            {filtered.map((card) => (
              <DraggableCard key={card.type} card={card} />
            ))}
            {filtered.length === 0 && (
              <p
                className="text-[11px] text-center mt-6"
                style={{ color: "var(--foreground-faint)" }}
              >
                No matches
              </p>
            )}
          </div>

          {/* Footer hint */}
          <p
            className="text-[9px] text-center px-1 pb-1"
            style={{ color: "var(--foreground-faint)" }}
          >
            Drag onto canvas to place
          </p>
        </div>
      </div>
    </>
  );
}

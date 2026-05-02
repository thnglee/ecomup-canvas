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
  {
    type: "link_box",
    name: "Link Box",
    icon: "🔗",
    description: "External link to any resource",
  },
  {
    type: "data_table",
    name: "Data Table",
    icon: "📊",
    description: "Tabular data on canvas",
  },
  {
    type: "sticky_note",
    name: "Sticky Note",
    icon: "📝",
    description: "Markdown notes & tips",
  },
  {
    type: "process_block",
    name: "Process Block",
    icon: "⚙️",
    description: "Workflow step for flowcharts",
  },
  {
    type: "image",
    name: "Image",
    icon: "🖼️",
    description: "Images, logos, badges",
  },
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
      className={`flex items-start gap-3 p-3 rounded-lg border border-[#2a2a4a] bg-[#1a1a2e] hover:bg-[#222240] hover:border-[#3a3a5a] cursor-grab transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <span className="text-lg mt-0.5 select-none">{card.icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[#e4e4ef]">{card.name}</div>
        <div className="text-xs text-[#8888aa] mt-0.5">{card.description}</div>
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
      {/* Toggle button — always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed z-40 flex items-center justify-center w-6 h-8 rounded-r bg-[#12121f] border border-l-0 border-[#2a2a4a] text-[#8888aa] hover:text-[#e4e4ef] hover:bg-[#1a1a2e] transition-colors"
        style={{
          top: HEADER_HEIGHT + 12,
          left: collapsed ? 0 : SIDEBAR_WIDTH,
        }}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* Sidebar panel */}
      <div
        className="fixed z-30 overflow-hidden bg-[#12121f] border-r border-[#2a2a4a] transition-[width] duration-200"
        style={{
          top: HEADER_HEIGHT,
          left: 0,
          bottom: STATUSBAR_HEIGHT,
          width: collapsed ? 0 : SIDEBAR_WIDTH,
        }}
      >
        <div className="flex flex-col h-full p-3 gap-3" style={{ width: SIDEBAR_WIDTH }}>
          <h2 className="text-xs font-semibold text-[#8888aa] uppercase tracking-wider px-1">
            Components
          </h2>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded bg-[#0a0a0f] border border-[#2a2a4a] text-[#e4e4ef] placeholder-[#555577] outline-none focus:border-[#3b82f6] transition-colors"
          />
          <div className="flex flex-col gap-2 overflow-y-auto flex-1">
            {filtered.map((card) => (
              <DraggableCard key={card.type} card={card} />
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-[#555577] text-center mt-4">No matches</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import WorldMap from "@/components/map/WorldMap";
import { HEADER_HEIGHT } from "@/lib/constants";

export default function MapPage() {
  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#0a0a0f]">
      <header
        className="flex items-center justify-between px-4 bg-[#0d0d18] border-b border-[#2a2a4a] select-none"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[#8888aa] hover:text-white text-sm flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[#1a1a2e] transition-colors"
          >
            <span>←</span>
            <span>Back to canvas</span>
          </Link>
          <div className="w-px h-5 bg-[#2a2a4a]" />
          <h1 className="text-[#e4e4ef] text-sm font-semibold">
            Market Timezone Map
          </h1>
        </div>
        <div className="text-[10px] text-[#555577]">
          Scroll to zoom • Drag to pan
        </div>
      </header>
      <div className="flex-1 relative">
        <WorldMap />
      </div>
    </main>
  );
}

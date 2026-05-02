"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/stores/canvasStore";
import { useHistoryStore } from "@/stores/historyStore";
import { createClient } from "@/lib/supabase/client";
import { STATUSBAR_HEIGHT } from "@/lib/constants";

export default function StatusBar() {
  const zoom = useCanvasStore((s) => s.viewport.zoom);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const setSnapToGrid = useCanvasStore((s) => s.setSnapToGrid);
  const saveStatus = useCanvasStore((s) => s.saveStatus);
  const minimapVisible = useCanvasStore((s) => s.minimapVisible);
  const setMinimapVisible = useCanvasStore((s) => s.setMinimapVisible);

  const past = useHistoryStore((s) => s.past);
  const future = useHistoryStore((s) => s.future);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const router = useRouter();

  const zoomPercent = Math.round(zoom * 100);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 bg-[#0d0d18] border-t border-[#2a2a4a] text-xs select-none"
      style={{ height: STATUSBAR_HEIGHT }}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-[#8888aa]">{zoomPercent}%</span>

        <div className="w-px h-4 bg-[#2a2a4a]" />

        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            snapToGrid
              ? "bg-[#3b82f6]/20 text-[#3b82f6]"
              : "text-[#555577] hover:text-[#8888aa]"
          }`}
        >
          Snap
        </button>

        <button
          onClick={() => setMinimapVisible(!minimapVisible)}
          className={`px-2 py-0.5 rounded text-xs transition-colors ${
            minimapVisible
              ? "bg-[#3b82f6]/20 text-[#3b82f6]"
              : "text-[#555577] hover:text-[#8888aa]"
          }`}
        >
          Map
        </button>

        <div className="w-px h-4 bg-[#2a2a4a]" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={past.length === 0}
          className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
            past.length > 0
              ? "text-[#8888aa] hover:text-[#e4e4ef] hover:bg-[#222240]"
              : "text-[#333355] cursor-not-allowed"
          }`}
          title="Undo (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
            future.length > 0
              ? "text-[#8888aa] hover:text-[#e4e4ef] hover:bg-[#222240]"
              : "text-[#333355] cursor-not-allowed"
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </button>
      </div>

      <div className="flex items-center gap-3">
        {saveStatus === "saving" && (
          <span className="text-[#eab308] flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-[#eab308] rounded-full animate-pulse" />
            Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="text-[#22c55e] flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
            Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-[#ef4444] flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-[#ef4444] rounded-full" />
            Save failed
          </span>
        )}

        <div className="w-px h-4 bg-[#2a2a4a]" />

        <button
          onClick={handleLogout}
          className="px-2 py-0.5 rounded text-xs text-[#555577] hover:text-[#ef4444] transition-colors"
          title="Sign out"
        >
          Sign Out
        </button>
      </div>
    </footer>
  );
}

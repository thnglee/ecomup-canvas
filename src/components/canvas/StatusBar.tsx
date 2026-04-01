"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/stores/canvasStore";
import { useHistoryStore } from "@/stores/historyStore";
import { createClient } from "@/lib/supabase/client";
import { STATUSBAR_HEIGHT } from "@/lib/constants";

export default function StatusBar() {
  const zoom            = useCanvasStore((s) => s.viewport.zoom);
  const snapToGrid      = useCanvasStore((s) => s.snapToGrid);
  const setSnapToGrid   = useCanvasStore((s) => s.setSnapToGrid);
  const saveStatus      = useCanvasStore((s) => s.saveStatus);
  const minimapVisible  = useCanvasStore((s) => s.minimapVisible);
  const setMinimapVisible = useCanvasStore((s) => s.setMinimapVisible);

  const past   = useHistoryStore((s) => s.past);
  const future = useHistoryStore((s) => s.future);
  const undo   = useHistoryStore((s) => s.undo);
  const redo   = useHistoryStore((s) => s.redo);
  const router = useRouter();

  const zoomPercent = Math.round(zoom * 100);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const toggleStyle = (active: boolean) => ({
    background: active ? "var(--accent-dim)" : "transparent",
    color: active ? "var(--accent)" : "var(--foreground-faint)",
    border: active ? "1px solid rgba(91,156,246,0.22)" : "1px solid transparent",
  });

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 select-none"
      style={{
        height: STATUSBAR_HEIGHT,
        background: "var(--surface)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      {/* Left cluster */}
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-[11px] tabular-nums w-10"
          style={{ color: "var(--foreground-muted)" }}
        >
          {zoomPercent}%
        </span>

        <div className="w-px h-3.5" style={{ background: "var(--border)" }} aria-hidden="true" />

        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
          style={toggleStyle(snapToGrid)}
          title="Toggle snap to grid"
        >
          Snap
        </button>

        <button
          onClick={() => setMinimapVisible(!minimapVisible)}
          className="px-2 py-0.5 rounded text-[11px] font-medium transition-all"
          style={toggleStyle(minimapVisible)}
          title="Toggle minimap"
        >
          Map
        </button>

        <div className="w-px h-3.5" style={{ background: "var(--border)" }} aria-hidden="true" />

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={past.length === 0}
          className="px-1.5 py-0.5 rounded text-[12px] transition-all"
          style={{
            color: past.length > 0 ? "var(--foreground-muted)" : "var(--foreground-faint)",
            cursor: past.length > 0 ? "pointer" : "not-allowed",
          }}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="px-1.5 py-0.5 rounded text-[12px] transition-all"
          style={{
            color: future.length > 0 ? "var(--foreground-muted)" : "var(--foreground-faint)",
            cursor: future.length > 0 ? "pointer" : "not-allowed",
          }}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          ↪
        </button>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        {/* Save status indicator */}
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--warning)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--warning)" }} />
            Saving
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--success)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
            Saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--danger)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--danger)" }} />
            Save failed
          </span>
        )}

        <div className="w-px h-3.5" style={{ background: "var(--border)" }} aria-hidden="true" />

        <button
          onClick={handleLogout}
          className="text-[11px] transition-all"
          style={{ color: "var(--foreground-faint)" }}
          title="Sign out"
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-faint)")}
        >
          Sign out
        </button>
      </div>
    </footer>
  );
}

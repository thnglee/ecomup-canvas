"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useToastStore } from "@/stores/toastStore";
import { createClient } from "@/lib/supabase/client";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/constants";

export function useAutoSave() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const setSaveStatus = useCanvasStore((s) => s.setSaveStatus);

  const save = useCallback(async () => {
    const state = useCanvasStore.getState();
    if (!state.isDirty || !state.isLoaded) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaveStatus("saving");

    try {
      // Save canvas state (viewport, UI settings)
      await supabase.from("canvas_state").upsert(
        {
          user_id: user.id,
          viewport_x: state.viewport.x,
          viewport_y: state.viewport.y,
          viewport_zoom: state.viewport.zoom,
          snap_to_grid: state.snapToGrid,
          sidebar_collapsed: state.sidebarCollapsed,
          minimap_visible: state.minimapVisible,
        },
        { onConflict: "user_id" }
      );

      // Save components (fill in user_id)
      const components = Object.values(state.components).map((c) => ({
        ...c,
        user_id: c.user_id || user.id,
      }));
      if (components.length > 0) {
        await supabase.from("components").upsert(components);
      }

      // Save zones (fill in user_id)
      const zones = Object.values(state.zones).map((z) => ({
        ...z,
        user_id: z.user_id || user.id,
      }));
      if (zones.length > 0) {
        await supabase.from("zones").upsert(zones);
      }

      // Save connectors (fill in user_id)
      const connectors = Object.values(state.connectors).map((c) => ({
        ...c,
        user_id: c.user_id || user.id,
      }));
      if (connectors.length > 0) {
        await supabase.from("connectors").upsert(connectors);
      }

      // Delete removed items from Supabase
      if (state.deletedComponentIds.length > 0) {
        await supabase
          .from("components")
          .delete()
          .in("id", state.deletedComponentIds);
      }
      if (state.deletedConnectorIds.length > 0) {
        await supabase
          .from("connectors")
          .delete()
          .in("id", state.deletedConnectorIds);
      }
      if (state.deletedZoneIds.length > 0) {
        await supabase
          .from("zones")
          .delete()
          .in("id", state.deletedZoneIds);
      }
      state.clearDeletedIds();

      state.markClean();
      setSaveStatus("saved");
      retryCount.current = 0;

      // Reset to idle after 2s
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch {
      setSaveStatus("error");
      retryCount.current += 1;

      if (retryCount.current <= 3) {
        // Auto-retry with backoff
        const delay = Math.min(retryCount.current * 2000, 6000);
        setTimeout(save, delay);
      } else {
        // Show toast with manual retry
        useToastStore.getState().addToast({
          message: "Failed to save changes. Check your connection.",
          type: "error",
          duration: 0,
          action: {
            label: "Retry",
            onClick: () => {
              retryCount.current = 0;
              save();
            },
          },
        });
      }
    }
  }, [setSaveStatus]);

  // Watch for dirty state changes
  useEffect(() => {
    const unsub = useCanvasStore.subscribe((state, prevState) => {
      if (state.isDirty && !prevState.isDirty && state.isLoaded) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(save, AUTOSAVE_DEBOUNCE_MS);
      }
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [save]);
}

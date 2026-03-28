"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useToastStore } from "@/stores/toastStore";
import { createClient } from "@/lib/supabase/client";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/constants";

let retryCount = 0;

async function performSave() {
  const state = useCanvasStore.getState();
  if (!state.isDirty || !state.isLoaded || state.editorOpen) return;

  const savedVersion = state.dirtyVersion;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  state.setSaveStatus("saving");

  try {
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

    const components = Object.values(state.components).map((c) => ({
      ...c,
      user_id: c.user_id || user.id,
    }));
    if (components.length > 0) {
      await supabase.from("components").upsert(components);
    }

    const zones = Object.values(state.zones).map((z) => ({
      ...z,
      user_id: z.user_id || user.id,
    }));
    if (zones.length > 0) {
      await supabase.from("zones").upsert(zones);
    }

    const connectors = Object.values(state.connectors).map((c) => ({
      ...c,
      user_id: c.user_id || user.id,
    }));
    if (connectors.length > 0) {
      await supabase.from("connectors").upsert(connectors);
    }

    if (state.deletedComponentIds.length > 0) {
      await supabase.from("components").delete().in("id", state.deletedComponentIds);
    }
    if (state.deletedConnectorIds.length > 0) {
      await supabase.from("connectors").delete().in("id", state.deletedConnectorIds);
    }
    if (state.deletedZoneIds.length > 0) {
      await supabase.from("zones").delete().in("id", state.deletedZoneIds);
    }
    useCanvasStore.getState().clearDeletedIds();

    useCanvasStore.getState().markClean(savedVersion);
    state.setSaveStatus("saved");
    retryCount = 0;

    setTimeout(() => {
      useCanvasStore.getState().setSaveStatus("idle");
    }, 2000);
  } catch {
    state.setSaveStatus("error");
    retryCount += 1;

    if (retryCount <= 3) {
      const delay = Math.min(retryCount * 2000, 6000);
      setTimeout(performSave, delay);
    } else {
      useToastStore.getState().addToast({
        message: "Failed to save changes. Check your connection.",
        type: "error",
        duration: 0,
        action: {
          label: "Retry",
          onClick: () => {
            retryCount = 0;
            performSave();
          },
        },
      });
    }
  }
}

/** Force an immediate save — used by the manual Save button */
export async function forceSave() {
  const state = useCanvasStore.getState();
  if (!state.isLoaded) return;
  state.markDirty();
  await performSave();
}

export function useAutoSave() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(() => {
    performSave();
  }, []);

  useEffect(() => {
    const unsub = useCanvasStore.subscribe((state, prevState) => {
      if (state.isDirty && state.isLoaded && !state.editorOpen && state.dirtyVersion !== prevState.dirtyVersion) {
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

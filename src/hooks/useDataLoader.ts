"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { createClient } from "@/lib/supabase/client";
import type { CanvasComponent, Connector } from "@/types/canvas";

export function useDataLoader() {
  const setComponents = useCanvasStore((s) => s.setComponents);
  const setZones = useCanvasStore((s) => s.setZones);
  const setConnectors = useCanvasStore((s) => s.setConnectors);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const setSnapToGrid = useCanvasStore((s) => s.setSnapToGrid);
  const setSidebarCollapsed = useCanvasStore((s) => s.setSidebarCollapsed);
  const setMinimapVisible = useCanvasStore((s) => s.setMinimapVisible);
  const setIsLoaded = useCanvasStore((s) => s.setIsLoaded);
  const markClean = useCanvasStore((s) => s.markClean);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load canvas state
      const { data: canvasState } = await supabase
        .from("canvas_state")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (canvasState) {
        setViewport({
          x: canvasState.viewport_x,
          y: canvasState.viewport_y,
          zoom: canvasState.viewport_zoom,
        });
        setSnapToGrid(canvasState.snap_to_grid);
        setSidebarCollapsed(canvasState.sidebar_collapsed);
        setMinimapVisible(canvasState.minimap_visible);
      }

      // Load components
      const { data: components } = await supabase
        .from("components")
        .select("*")
        .eq("user_id", user.id);
      if (components) setComponents(components as unknown as CanvasComponent[]);

      // Load zones
      const { data: zones } = await supabase
        .from("zones")
        .select("*")
        .eq("user_id", user.id);
      if (zones) setZones(zones);

      // Load connectors
      const { data: connectors } = await supabase
        .from("connectors")
        .select("*")
        .eq("user_id", user.id);
      if (connectors) setConnectors(connectors as unknown as Connector[]);

      markClean();
      setIsLoaded(true);
    }

    load();
  }, [
    setComponents,
    setZones,
    setConnectors,
    setViewport,
    setSnapToGrid,
    setSidebarCollapsed,
    setMinimapVisible,
    setIsLoaded,
    markClean,
  ]);
}

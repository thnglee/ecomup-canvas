"use client";

import { useMemo } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { VIEWPORT_BUFFER } from "@/lib/constants";

/**
 * Returns a Set of component IDs that are within the visible viewport + buffer.
 * Components outside this area are not rendered (DOM culling for performance).
 * Returns null when there are few enough components that culling isn't needed.
 */
export function useViewportCulling(
  containerRef: React.RefObject<HTMLDivElement | null>
): Set<string> | null {
  const viewport = useCanvasStore((s) => s.viewport);
  const components = useCanvasStore((s) => s.components);

  return useMemo(() => {
    const compValues = Object.values(components);

    // Don't bother culling if fewer than 50 components
    if (compValues.length < 50) return null;

    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const { x: vx, y: vy, zoom } = viewport;
    const buffer = VIEWPORT_BUFFER;

    // Calculate visible canvas bounds
    const visibleLeft = (-vx / zoom) - buffer;
    const visibleTop = (-vy / zoom) - buffer;
    const visibleRight = (-vx + rect.width) / zoom + buffer;
    const visibleBottom = (-vy + rect.height) / zoom + buffer;

    const visible = new Set<string>();
    for (const comp of compValues) {
      const right = comp.position_x + comp.width;
      const bottom = comp.position_y + comp.height;

      // AABB overlap test
      if (
        comp.position_x <= visibleRight &&
        right >= visibleLeft &&
        comp.position_y <= visibleBottom &&
        bottom >= visibleTop
      ) {
        visible.add(comp.id);
      }
    }

    return visible;
  }, [viewport, components, containerRef]);
}

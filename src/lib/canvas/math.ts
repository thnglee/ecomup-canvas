import type { Viewport } from "@/types/canvas";

/** Convert screen coordinates to canvas coordinates */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  };
}

/** Convert canvas coordinates to screen coordinates */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: canvasX * viewport.zoom + viewport.x,
    y: canvasY * viewport.zoom + viewport.y,
  };
}

/** Calculate new viewport after zooming toward a point */
export function zoomTowardPoint(
  viewport: Viewport,
  screenX: number,
  screenY: number,
  newZoom: number
): Viewport {
  // Point in canvas space before zoom
  const canvasX = (screenX - viewport.x) / viewport.zoom;
  const canvasY = (screenY - viewport.y) / viewport.zoom;

  // After zoom, the same canvas point should be at the same screen position
  const newX = screenX - canvasX * newZoom;
  const newY = screenY - canvasY * newZoom;

  return { x: newX, y: newY, zoom: newZoom };
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

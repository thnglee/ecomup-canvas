import type { AnchorPosition, CanvasComponent } from "@/types/canvas";

/** Get the anchor point coordinates for a component */
export function getAnchorPoint(
  comp: CanvasComponent,
  anchor: AnchorPosition
): { x: number; y: number } {
  const { position_x: x, position_y: y, width: w, height: h } = comp;
  switch (anchor) {
    case "top":
      return { x: x + w / 2, y };
    case "right":
      return { x: x + w, y: y + h / 2 };
    case "bottom":
      return { x: x + w / 2, y: y + h };
    case "left":
      return { x, y: y + h / 2 };
  }
}

/** Find the best anchor pair between two components (shortest distance) */
export function findBestAnchors(
  from: CanvasComponent,
  to: CanvasComponent
): { fromAnchor: AnchorPosition; toAnchor: AnchorPosition } {
  const anchors: AnchorPosition[] = ["top", "right", "bottom", "left"];
  let best = { fromAnchor: "right" as AnchorPosition, toAnchor: "left" as AnchorPosition };
  let bestDist = Infinity;

  for (const fa of anchors) {
    for (const ta of anchors) {
      const fp = getAnchorPoint(from, fa);
      const tp = getAnchorPoint(to, ta);
      const dist = Math.hypot(fp.x - tp.x, fp.y - tp.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = { fromAnchor: fa, toAnchor: ta };
      }
    }
  }

  return best;
}

/** Check if a point is near a line segment (for click detection) */
export function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

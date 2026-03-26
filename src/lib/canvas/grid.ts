import { GRID_SIZE } from "@/lib/constants";

/** Snap a value to the nearest grid point */
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

/** Snap x,y coordinates to the grid */
export function snapPositionToGrid(x: number, y: number): { x: number; y: number } {
  return {
    x: snapToGrid(x),
    y: snapToGrid(y),
  };
}

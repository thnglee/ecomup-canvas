"use client";

import { useEffect, useCallback } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useHistoryStore } from "@/stores/historyStore";
import { ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from "@/lib/constants";
import { zoomTowardPoint, clamp } from "@/lib/canvas/math";

interface KeyboardShortcutsConfig {
  onDelete: () => void;
  onDuplicate: () => void;
  onCloseEditor: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useKeyboardShortcuts({
  onDelete,
  onDuplicate,
  onCloseEditor,
  containerRef,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isEditable = target.isContentEditable;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || isEditable;

      // Escape always works
      if (e.key === "Escape") {
        onCloseEditor();
        useCanvasStore.getState().deselectAll();
        useCanvasStore.getState().setActiveTool("select");
        return;
      }

      // Skip other shortcuts when focused on input
      if (isInput) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z
      if (e.key === "z" && ctrl && !e.shiftKey) {
        e.preventDefault();
        useHistoryStore.getState().undo();
        return;
      }

      // Redo: Ctrl+Shift+Z
      if (e.key === "z" && ctrl && e.shiftKey) {
        e.preventDefault();
        useHistoryStore.getState().redo();
        return;
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        onDelete();
        return;
      }

      // Ctrl+D: Duplicate
      if (e.key === "d" && ctrl) {
        e.preventDefault();
        onDuplicate();
        return;
      }

      // Ctrl+A: Select all
      if (e.key === "a" && ctrl) {
        e.preventDefault();
        useCanvasStore.getState().selectAll();
        return;
      }

      // Ctrl+0: Reset zoom to 100%
      if (e.key === "0" && ctrl) {
        e.preventDefault();
        resetZoom();
        return;
      }

      // Ctrl+1: Fit all content
      if (e.key === "1" && ctrl) {
        e.preventDefault();
        fitAll(containerRef);
        return;
      }

      // + / = : Zoom in
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomStep(1, containerRef);
        return;
      }

      // - : Zoom out
      if (e.key === "-" && !ctrl) {
        e.preventDefault();
        zoomStep(-1, containerRef);
        return;
      }
    },
    [onDelete, onDuplicate, onCloseEditor, containerRef]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

function resetZoom() {
  // Reset zoom to 1.0, center on (0, 0)
  useCanvasStore.getState().setViewport({ x: 0, y: 0, zoom: 1.0 });
}

function fitAll(containerRef: React.RefObject<HTMLDivElement | null>) {
  const state = useCanvasStore.getState();
  const comps = Object.values(state.components);
  const zones = Object.values(state.zones);

  if (comps.length === 0 && zones.length === 0) {
    resetZoom();
    return;
  }

  // Calculate bounding box of all components and zones
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const c of comps) {
    minX = Math.min(minX, c.position_x);
    minY = Math.min(minY, c.position_y);
    maxX = Math.max(maxX, c.position_x + c.width);
    maxY = Math.max(maxY, c.position_y + c.height);
  }
  for (const z of zones) {
    minX = Math.min(minX, z.position_x);
    minY = Math.min(minY, z.position_y);
    maxX = Math.max(maxX, z.position_x + z.width);
    maxY = Math.max(maxY, z.position_y + z.height);
  }

  const container = containerRef.current;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const padding = 60;
  const contentW = maxX - minX;
  const contentH = maxY - minY;

  if (contentW === 0 || contentH === 0) {
    resetZoom();
    return;
  }

  const scaleX = (rect.width - padding * 2) / contentW;
  const scaleY = (rect.height - padding * 2) / contentH;
  const zoom = clamp(Math.min(scaleX, scaleY), MIN_ZOOM, MAX_ZOOM);

  // Center the content
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const x = rect.width / 2 - centerX * zoom;
  const y = rect.height / 2 - centerY * zoom;

  state.setViewport({ x, y, zoom });
}

function zoomStep(direction: 1 | -1, containerRef: React.RefObject<HTMLDivElement | null>) {
  const state = useCanvasStore.getState();
  const viewport = state.viewport;
  const newZoom = clamp(viewport.zoom + direction * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);

  const container = containerRef.current;
  if (!container) {
    state.setViewport({ zoom: newZoom });
    return;
  }

  // Zoom toward center of viewport
  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const newViewport = zoomTowardPoint(viewport, centerX, centerY, newZoom);
  state.setViewport(newViewport);
}

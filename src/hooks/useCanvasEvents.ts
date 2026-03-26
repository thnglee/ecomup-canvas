"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { zoomTowardPoint, clamp } from "@/lib/canvas/math";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SENSITIVITY } from "@/lib/constants";

export function useCanvasEvents(containerRef: React.RefObject<HTMLDivElement | null>) {
  const isPanning = useRef(false);
  const isSpaceDown = useRef(false);
  const isMetaDown = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const setViewport = useCanvasStore((s) => s.setViewport);
  const deselectAll = useCanvasStore((s) => s.deselectAll);

  // Update cursor based on active tool
  const updateCursor = useCallback(
    (override?: string) => {
      if (!containerRef.current) return;
      if (override) {
        containerRef.current.style.cursor = override;
        return;
      }
      const activeTool = useCanvasStore.getState().activeTool;
      if (isSpaceDown.current || isMetaDown.current) {
        containerRef.current.style.cursor = isPanning.current ? "grabbing" : "grab";
      } else if (activeTool === "connector") {
        containerRef.current.style.cursor = "crosshair";
      } else if (activeTool === "zone") {
        containerRef.current.style.cursor = "crosshair";
      } else {
        containerRef.current.style.cursor = "default";
      }
    },
    [containerRef]
  );

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const viewport = useCanvasStore.getState().viewport;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Pinch zoom (ctrlKey) or scroll wheel zoom
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = clamp(viewport.zoom * (1 + delta * 5), MIN_ZOOM, MAX_ZOOM);

      const newViewport = zoomTowardPoint(viewport, screenX, screenY, newZoom);
      setViewport(newViewport);
    },
    [containerRef, setViewport]
  );

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      // Middle mouse button
      if (e.button === 1) {
        e.preventDefault();
        isPanning.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        updateCursor("grabbing");
        return;
      }

      // Space or Command + left click
      if (e.button === 0 && (isSpaceDown.current || isMetaDown.current)) {
        e.preventDefault();
        isPanning.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        updateCursor("grabbing");
        return;
      }

      // Left click on empty canvas area — deselect
      if (e.button === 0 && e.target === containerRef.current) {
        deselectAll();
      }
    },
    [containerRef, deselectAll, updateCursor]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning.current) return;

      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const viewport = useCanvasStore.getState().viewport;
      setViewport({
        x: viewport.x + dx,
        y: viewport.y + dy,
      });
    },
    [setViewport]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      updateCursor();
    }
  }, [updateCursor]);

  // Handle keyboard events for space bar and Command key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        isSpaceDown.current = true;
        updateCursor();
      }
      if ((e.code === "MetaLeft" || e.code === "MetaRight") && !e.repeat) {
        isMetaDown.current = true;
        updateCursor();
      }
    },
    [updateCursor]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpaceDown.current = false;
        updateCursor();
      }
      if (e.code === "MetaLeft" || e.code === "MetaRight") {
        isMetaDown.current = false;
        if (!isPanning.current) updateCursor();
      }
    },
    [updateCursor]
  );

  // Attach/detach events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Prevent default middle-click auto-scroll
    container.addEventListener("auxclick", (e) => e.preventDefault());

    // Reset meta key on window blur (Command+Tab won't fire keyup)
    const handleBlur = () => {
      isMetaDown.current = false;
      isSpaceDown.current = false;
      updateCursor();
    };
    window.addEventListener("blur", handleBlur);

    // Update cursor when active tool changes
    let prevTool = useCanvasStore.getState().activeTool;
    const unsub = useCanvasStore.subscribe((state) => {
      if (state.activeTool !== prevTool) {
        prevTool = state.activeTool;
        updateCursor();
      }
    });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      unsub();
    };
  }, [
    containerRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    handleKeyUp,
    updateCursor,
  ]);
}

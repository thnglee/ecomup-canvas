"use client";

import { useCanvasStore } from "@/stores/canvasStore";

interface TransformLayerProps {
  children?: React.ReactNode;
}

export default function TransformLayer({ children }: TransformLayerProps) {
  const viewport = useCanvasStore((s) => s.viewport);

  return (
    <div
      className="transform-layer"
      style={{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        transformOrigin: "0 0",
        willChange: "transform",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

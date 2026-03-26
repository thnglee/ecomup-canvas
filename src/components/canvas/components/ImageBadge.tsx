"use client";

import { useState } from "react";
import type { CanvasComponent } from "@/types/canvas";

interface ImageBadgeProps {
  component: CanvasComponent;
}

export default function ImageBadge({ component }: ImageBadgeProps) {
  const { image_url, alt_text } = component.data;
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const src = image_url;

  if (!src) {
    return (
      <div className="w-full h-full rounded-lg border border-[#2a2a4a] bg-[#1a1a2e] flex items-center justify-center text-[#555577] text-sm">
        No image
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg border border-[#2a2a4a] bg-[#1a1a2e] overflow-hidden flex items-center justify-center relative">
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] text-[#555577] text-xs">
          Loading...
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center gap-1 text-[#555577] text-xs">
          <span className="text-2xl">🖼️</span>
          <span>{alt_text || "Image failed to load"}</span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt_text || ""}
          className="max-w-full max-h-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
}

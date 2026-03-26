"use client";

export default function LoadingSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/90 z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Animated skeleton blocks */}
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg bg-[#1a1a2e] animate-pulse"
              style={{
                width: 60 + i * 20,
                height: 40 + i * 10,
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#8888aa] text-sm">Loading canvas...</span>
        </div>
      </div>
    </div>
  );
}

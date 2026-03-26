"use client";

import { useEffect, useState } from "react";
import { CLOCKS, HEADER_HEIGHT } from "@/lib/constants";

function formatTime(timezone: string, date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export default function WorldClockBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-4 px-4 bg-[#0d0d18] border-b border-[#2a2a4a] select-none"
      style={{ height: HEADER_HEIGHT }}
    >
      {CLOCKS.map((clock) => (
        <div
          key={clock.timezone}
          className="flex items-center gap-1.5 text-xs whitespace-nowrap"
        >
          <span>{clock.flag}</span>
          <span className="text-[#8888aa]">{clock.country}</span>
          <span className="font-mono text-[#e4e4ef] w-[88px]">
            {now ? formatTime(clock.timezone, now) : "--:--:-- --"}
          </span>
        </div>
      ))}
    </header>
  );
}

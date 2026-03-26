"use client";

import { useEffect, useState, useCallback } from "react";
import { CLOCKS, HEADER_HEIGHT } from "@/lib/constants";

interface TempData {
  min: number;
  max: number;
}

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
  const [temps, setTemps] = useState<Record<string, TempData>>({});

  // Fetch temperatures from Open-Meteo (free, no API key needed)
  const fetchTemps = useCallback(async () => {
    try {
      // Batch all locations into parallel requests
      const results = await Promise.allSettled(
        CLOCKS.map(async (clock) => {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${clock.lat}&longitude=${clock.lon}&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(clock.timezone)}&forecast_days=1`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          return {
            timezone: clock.timezone,
            min: Math.round(data.daily.temperature_2m_min[0]),
            max: Math.round(data.daily.temperature_2m_max[0]),
          };
        })
      );

      const tempMap: Record<string, TempData> = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          tempMap[r.value.timezone] = { min: r.value.min, max: r.value.max };
        }
      });
      setTemps(tempMap);
    } catch {
      // Silently fail — temps are a nice-to-have
    }
  }, []);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch temps on mount, then refresh every 30 minutes
  useEffect(() => {
    fetchTemps();
    const interval = setInterval(fetchTemps, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTemps]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-4 px-4 bg-[#0d0d18] border-b border-[#2a2a4a] select-none"
      style={{ height: HEADER_HEIGHT }}
    >
      {CLOCKS.map((clock) => {
        const temp = temps[clock.timezone];
        return (
          <div
            key={clock.timezone}
            className="flex items-center gap-1.5 text-xs whitespace-nowrap"
          >
            <span>{clock.flag}</span>
            <div className="flex flex-col items-start leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-[#8888aa]">{clock.country}</span>
                <span className="font-mono text-[#e4e4ef] w-[88px]">
                  {now ? formatTime(clock.timezone, now) : "--:--:-- --"}
                </span>
              </div>
              <span className="text-[10px] text-[#666688]">
                {temp ? `${temp.min}°–${temp.max}°C` : "…"}
              </span>
            </div>
          </div>
        );
      })}
    </header>
  );
}

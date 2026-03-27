"use client";

import { useEffect, useState, useCallback } from "react";
import { CLOCKS, HEADER_HEIGHT } from "@/lib/constants";
import {
  getScore,
  getCurrentHour,
  scoreToBarBg,
} from "@/lib/timelineScoring";
import TimelineModal from "./TimelineModal";

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
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch temperatures from Open-Meteo (free, no API key needed)
  const fetchTemps = useCallback(async () => {
    try {
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

  useEffect(() => {
    fetchTemps();
    const interval = setInterval(fetchTemps, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTemps]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-4 px-4 bg-[#0d0d18] border-b border-[#2a2a4a] select-none"
        style={{ height: HEADER_HEIGHT }}
      >
        {CLOCKS.map((clock) => {
          const temp = temps[clock.timezone];
          // Use the same `now` for display and scoring to guarantee consistency
          const hour = now ? getCurrentHour(clock.timezone, now) : null;
          const score = hour !== null ? getScore(clock.country, hour) : null;
          const bgStyle = score !== null ? scoreToBarBg(score) : "transparent";

          return (
            <div
              key={clock.timezone}
              className="flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer rounded-md px-2 py-1 transition-all hover:brightness-125"
              style={{ background: bgStyle }}
              onClick={() => setModalOpen(true)}
              title={
                score !== null
                  ? `Purchase likelihood: ${(score * 100).toFixed(0)}%`
                  : undefined
              }
            >
              <span style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}>{clock.flag}</span>
              <div className="flex flex-col items-start leading-tight" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>
                <div className="flex items-center gap-1">
                  <span className="text-white/90">{clock.country}</span>
                  <span className="font-mono w-[88px] font-bold text-white">
                    {now ? formatTime(clock.timezone, now) : "--:--:-- --"}
                  </span>
                </div>
                <span className="text-[10px] text-white/70">
                  {temp ? `${temp.min}°–${temp.max}°C` : "…"}
                </span>
              </div>
            </div>
          );
        })}
      </header>

      <TimelineModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

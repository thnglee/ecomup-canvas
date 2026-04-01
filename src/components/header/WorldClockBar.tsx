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

/** Map a 0–1 score to a very subtle background tint on the dark surface */
function scoreChipStyle(score: number | null): React.CSSProperties {
  if (score === null) return {};
  // High score → faint green tint; low → faint red tint; mid → neutral
  if (score >= 0.7) return { background: "rgba(52, 196, 122, 0.08)", borderColor: "rgba(52, 196, 122, 0.22)" };
  if (score >= 0.4) return { background: "rgba(91, 156, 246, 0.06)", borderColor: "rgba(91, 156, 246, 0.18)" };
  return { background: "rgba(240, 96, 96, 0.06)", borderColor: "rgba(240, 96, 96, 0.16)" };
}

export default function WorldClockBar() {
  const [now, setNow] = useState<Date | null>(null);
  const [temps, setTemps] = useState<Record<string, TempData>>({});
  const [modalOpen, setModalOpen] = useState(false);

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
      // silently ignore
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
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-1.5 px-3 select-none"
        style={{
          height: HEADER_HEIGHT,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* Brand mark */}
        <div className="absolute left-4 flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[9px] font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            EC
          </div>
          <span
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: "var(--foreground-muted)", letterSpacing: "0.12em" }}
          >
            EcomUp
          </span>
        </div>

        {/* Clock chips */}
        {CLOCKS.map((clock) => {
          const temp = temps[clock.timezone];
          const hour = now ? getCurrentHour(clock.timezone, now) : null;
          const score = hour !== null ? getScore(clock.country, hour) : null;
          const nextScore =
            hour !== null ? getScore(clock.country, (hour + 1) % 24) : null;
          const trend =
            score !== null && nextScore !== null
              ? nextScore > score
                ? "up"
                : nextScore < score
                  ? "down"
                  : "flat"
              : null;
          const chipStyle = scoreChipStyle(score);

          return (
            <button
              key={clock.timezone}
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border text-left transition-all hover:brightness-125 group"
              style={chipStyle}
              title={score !== null ? `Purchase likelihood: ${(score * 100).toFixed(0)}%` : undefined}
            >
              <span className="text-sm leading-none" aria-hidden="true">
                {clock.flag}
              </span>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    {clock.country}
                  </span>
                  <span
                    className="font-mono text-[11px] font-semibold tabular-nums"
                    style={{ color: "var(--foreground)" }}
                  >
                    {now ? formatTime(clock.timezone, now) : "--:--:-- --"}
                  </span>
                </div>
                <span
                  className="text-[9px] tabular-nums"
                  style={{ color: "var(--foreground-faint)" }}
                >
                  {temp ? `${temp.min}°–${temp.max}°C` : "·"}
                </span>
              </div>
              {score !== null && (
                <span
                  className="text-[10px] font-mono font-bold flex items-center gap-0.5 ml-1"
                  style={{
                    color:
                      score >= 0.7
                        ? "var(--success)"
                        : score >= 0.4
                          ? "var(--accent)"
                          : "var(--danger)",
                  }}
                >
                  {score.toFixed(2)}
                  {trend === "up" && (
                    <span style={{ color: "var(--success)" }}>▲</span>
                  )}
                  {trend === "down" && (
                    <span style={{ color: "var(--danger)" }}>▼</span>
                  )}
                  {trend === "flat" && (
                    <span style={{ color: "var(--foreground-faint)" }}>▸</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </header>

      <TimelineModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

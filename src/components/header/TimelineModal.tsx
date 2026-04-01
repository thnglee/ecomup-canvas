"use client";

import { useEffect, useRef, useState } from "react";
import { CLOCKS } from "@/lib/constants";
import {
  SCORING_HOURS,
  SCORING_DATA,
  COUNTRY_TO_SCORING_KEY,
  getCurrentHour,
  scoreToBgColor,
  scoreToColor,
  scoreToGlowShadow,
} from "@/lib/timelineScoring";

interface TimelineModalProps {
  open: boolean;
  onClose: () => void;
}

const COLUMN_KEYS   = ["US", "UK", "Australia", "Canada", "New_Zealand", "Germany"];
const COLUMN_LABELS = ["US", "UK", "Australia", "Canada", "NZ", "Germany"];

const PEAK_THRESHOLD = 0.75;

const COUNTRY_TZ: Record<string, string> = {
  US:          "America/New_York",
  UK:          "Europe/London",
  Australia:   "Australia/Sydney",
  Canada:      "America/Toronto",
  New_Zealand: "Pacific/Auckland",
  Germany:     "Europe/Berlin",
};
const VN_TZ = "Asia/Ho_Chi_Minh";

function toVietnamTime(countryKey: string, localHour: number): string {
  const tz = COUNTRY_TZ[countryKey];
  if (!tz) return "";
  const ref = new Date();
  const getOffset = (timezone: string) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(ref);
    const h = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
    const m = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
    return h * 60 + m;
  };
  const countryNow  = getOffset(tz);
  const vnNow       = getOffset(VN_TZ);
  const diffMinutes = vnNow - countryNow;
  const vnHour = ((localHour * 60 + diffMinutes) / 60 + 24) % 24;
  const h      = Math.floor(vnHour);
  const suffix = h < 12 ? "AM" : "PM";
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}${suffix}`;
}

export default function TimelineModal({ open, onClose }: TimelineModalProps) {
  const [currentHours, setCurrentHours] = useState<Record<string, number>>({});
  const tableRef   = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!open) { hasScrolled.current = false; return; }
    const update = () => {
      const d = new Date();
      const hours: Record<string, number> = {};
      CLOCKS.forEach((clock) => {
        const key = COUNTRY_TO_SCORING_KEY[clock.country];
        if (key) hours[key] = getCurrentHour(clock.timezone, d);
      });
      setCurrentHours(hours);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!open || hasScrolled.current) return;
    const timeout = setTimeout(() => {
      const firstKey = COLUMN_KEYS[0];
      const hour = currentHours[firstKey];
      if (hour !== undefined && tableRef.current) {
        const row = tableRef.current.querySelector(`[data-hour="${hour}"]`);
        if (row) { row.scrollIntoView({ block: "center", behavior: "smooth" }); hasScrolled.current = true; }
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [open, currentHours]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Purchase Likelihood Timeline"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative max-w-[940px] w-[95vw] max-h-[85vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Purchase Likelihood Timeline
            </h2>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--foreground-faint)" }}
            >
              Probability of customer purchase by local hour
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors"
            style={{ color: "var(--foreground-faint)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-raised)";
              (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--foreground-faint)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-4 px-6 py-2 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-raised)" }}
        >
          <span className="text-[10px]" style={{ color: "var(--foreground-faint)" }}>
            Score
          </span>
          <div className="flex items-center gap-0.5">
            {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0].map((s) => (
              <div
                key={s}
                className="w-5 h-2.5 first:rounded-l-sm last:rounded-r-sm"
                style={{ background: scoreToBgColor(s, 0.75) }}
              />
            ))}
            <span className="text-[9px] ml-2" style={{ color: "var(--foreground-faint)" }}>
              Low → High
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded border-[1.5px]"
              style={{ borderColor: "var(--foreground)", boxShadow: "0 0 6px rgba(255,255,255,0.3)" }}
            />
            <span className="text-[10px]" style={{ color: "var(--foreground-faint)" }}>
              Now
            </span>
          </div>
        </div>

        {/* Table */}
        <div ref={tableRef} className="overflow-auto flex-1">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "var(--surface)" }}>
                <th
                  className="text-left text-[10px] font-semibold uppercase tracking-widest px-4 py-2.5 min-w-[88px]"
                  style={{
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    color: "var(--foreground-faint)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Hour
                </th>
                {COLUMN_LABELS.map((label, i) => {
                  const key   = COLUMN_KEYS[i];
                  const clock = CLOCKS.find((c) => COUNTRY_TO_SCORING_KEY[c.country] === key);
                  return (
                    <th
                      key={key}
                      className="text-center text-[10px] font-semibold uppercase tracking-widest px-2 py-2.5 min-w-[85px]"
                      style={{
                        background: "var(--surface)",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--foreground-faint)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      <span className="mr-1" aria-hidden="true">{clock?.flag}</span>
                      {label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SCORING_HOURS.map((hourLabel, hourIdx) => (
                <tr key={hourIdx} data-hour={hourIdx}>
                  <td
                    className="px-4 py-[6px] font-mono text-[10px] whitespace-nowrap"
                    style={{
                      background: "var(--surface)",
                      borderBottom: "1px solid var(--border-subtle)",
                      color: "var(--foreground-muted)",
                    }}
                  >
                    {hourLabel}
                  </td>
                  {COLUMN_KEYS.map((key) => {
                    const score     = SCORING_DATA[key][hourIdx];
                    const isCurrent = currentHours[key] === hourIdx;
                    const isPeak    = score >= PEAK_THRESHOLD;
                    return (
                      <td
                        key={key}
                        className="px-2 py-[5px] text-center font-mono text-[10px] relative"
                        style={{
                          background: scoreToBgColor(score, isCurrent ? 0.9 : 0.7),
                          borderBottom: "1px solid rgba(0,0,0,0.12)",
                        }}
                      >
                        {isCurrent && (
                          <div
                            className="absolute inset-0 pointer-events-none z-[2] rounded-[2px]"
                            style={{
                              border: "1.5px solid rgba(255,255,255,0.85)",
                              boxShadow: scoreToGlowShadow(score),
                              animation: "cellGlow 2s ease-in-out infinite",
                            }}
                          />
                        )}
                        <span
                          className="relative z-[1]"
                          style={{
                            color: "#fff",
                            fontWeight: isCurrent ? 700 : 400,
                            fontSize: isCurrent ? 11 : 10,
                          }}
                        >
                          {score.toFixed(2)}
                        </span>
                        {isPeak && (
                          <div className="relative z-[1] text-[8px] leading-tight mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                            VN {toVietnamTime(key, hourIdx)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer — current scores */}
        <div
          className="px-6 py-3 flex flex-wrap gap-4 shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-raised)" }}
        >
          {CLOCKS.map((clock) => {
            const key   = COUNTRY_TO_SCORING_KEY[clock.country];
            if (!key) return null;
            const hour  = currentHours[key];
            const score = hour !== undefined ? SCORING_DATA[key][hour] : null;
            if (score === null) return null;
            return (
              <div key={clock.country} className="flex items-center gap-1.5 text-[11px]">
                <span aria-hidden="true">{clock.flag}</span>
                <span style={{ color: "var(--foreground-muted)" }}>{clock.country}</span>
                <span
                  className="font-mono font-bold text-[12px]"
                  style={{ color: scoreToColor(score) }}
                >
                  {score.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

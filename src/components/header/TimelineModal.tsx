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

const COLUMN_KEYS = ["US", "UK", "Australia", "Canada", "New_Zealand", "Germany"];
const COLUMN_LABELS = ["US", "UK", "Australia", "Canada", "NZ", "Germany"];

const PEAK_THRESHOLD = 0.75;

// Country timezone lookup (from CLOCKS)
const COUNTRY_TZ: Record<string, string> = {
  US: "America/New_York",
  UK: "Europe/London",
  Australia: "Australia/Sydney",
  Canada: "America/Toronto",
  New_Zealand: "Pacific/Auckland",
  Germany: "Europe/Berlin",
};
const VN_TZ = "Asia/Ho_Chi_Minh";

/** Convert a local hour (0-23) in a country's timezone to Vietnam time label */
function toVietnamTime(countryKey: string, localHour: number): string {
  const tz = COUNTRY_TZ[countryKey];
  if (!tz) return "";
  // Use a reference date and compute offsets via Intl
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
  const countryNow = getOffset(tz);
  const vnNow = getOffset(VN_TZ);
  const diffMinutes = vnNow - countryNow;
  const vnHour = ((localHour * 60 + diffMinutes) / 60 + 24) % 24;
  const h = Math.floor(vnHour);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}${suffix}`;
}

export default function TimelineModal({ open, onClose }: TimelineModalProps) {
  const [currentHours, setCurrentHours] = useState<Record<string, number>>({});
  const tableRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!open) {
      hasScrolled.current = false;
      return;
    }
    const update = () => {
      const d = new Date();
      const hours: Record<string, number> = {};
      CLOCKS.forEach((clock) => {
        const key = COUNTRY_TO_SCORING_KEY[clock.country];
        if (key) {
          hours[key] = getCurrentHour(clock.timezone, d);
        }
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
        if (row) {
          row.scrollIntoView({ block: "center", behavior: "smooth" });
          hasScrolled.current = true;
        }
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [open, currentHours]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div
        className="relative bg-[#0e0e1a] border border-[#2a2a4a] rounded-2xl shadow-2xl max-w-[920px] w-[95vw] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]/60">
          <div>
            <h2 className="text-[#e4e4ef] text-base font-semibold tracking-tight">
              Purchase Likelihood Timeline
            </h2>
            <p className="text-[#555577] text-xs mt-0.5">
              Score indicates probability of customer purchase by local hour
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#555577] hover:text-[#e4e4ef] transition-colors text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1a1a2e]"
          >
            ✕
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 px-6 py-2 border-b border-[#2a2a4a]/30 bg-[#0c0c16]">
          <span className="text-[#555577] text-[11px]">Scale:</span>
          <div className="flex items-center gap-0.5">
            {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0].map((s) => (
              <div
                key={s}
                className="w-6 h-3 first:rounded-l-sm last:rounded-r-sm"
                style={{ background: scoreToBgColor(s, 0.7) }}
              />
            ))}
            <span className="text-[#555577] text-[10px] ml-2">Low → High</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded border-2 border-white/80"
              style={{ boxShadow: "0 0 8px rgba(255,255,255,0.4)" }}
            />
            <span className="text-[#555577] text-[10px]">Now</span>
          </div>
        </div>

        {/* Table */}
        <div ref={tableRef} className="overflow-auto flex-1">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#0e0e1a]">
                <th className="text-left text-[#8888aa] font-medium text-[11px] px-4 py-2.5 border-b border-[#2a2a4a]/60 min-w-[88px] bg-[#0e0e1a]">
                  Hour
                </th>
                {COLUMN_LABELS.map((label, i) => {
                  const key = COLUMN_KEYS[i];
                  const clock = CLOCKS.find(
                    (c) => COUNTRY_TO_SCORING_KEY[c.country] === key
                  );
                  return (
                    <th
                      key={key}
                      className="text-center text-[#8888aa] font-medium text-[11px] px-2 py-2.5 border-b border-[#2a2a4a]/60 min-w-[85px] bg-[#0e0e1a]"
                    >
                      <span className="mr-1">{clock?.flag}</span>
                      {label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SCORING_HOURS.map((hourLabel, hourIdx) => (
                <tr key={hourIdx} data-hour={hourIdx}>
                  <td className="px-4 py-[7px] text-[#6a6a88] font-mono text-[11px] border-b border-[#1a1a2e]/60 whitespace-nowrap bg-[#0e0e1a]">
                    {hourLabel}
                  </td>
                  {COLUMN_KEYS.map((key) => {
                    const score = SCORING_DATA[key][hourIdx];
                    const isCurrent = currentHours[key] === hourIdx;
                    const isPeak = score >= PEAK_THRESHOLD;
                    return (
                      <td
                        key={key}
                        className="px-2 py-[5px] text-center font-mono text-[11px] border-b border-[#0e0e1a]/40 relative"
                        style={{
                          background: scoreToBgColor(score, isCurrent ? 0.85 : 0.7),
                        }}
                      >
                        {isCurrent && (
                          <div
                            className="absolute inset-0 border-2 border-white/90 rounded-[3px] pointer-events-none z-[2]"
                            style={{
                              boxShadow: scoreToGlowShadow(score),
                              animation: "cellGlow 2s ease-in-out infinite",
                            }}
                          />
                        )}
                        <span
                          className={`relative z-[1] ${
                            isCurrent
                              ? "font-bold text-[12px] text-white"
                              : "text-white/90"
                          }`}
                        >
                          {score.toFixed(2)}
                        </span>
                        {isPeak && (
                          <div className="relative z-[1] text-[8px] text-white/50 leading-tight mt-0.5">
                            🇻🇳{toVietnamTime(key, hourIdx)}
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2a2a4a]/60 bg-[#0c0c16] flex flex-wrap gap-4">
          {CLOCKS.map((clock) => {
            const key = COUNTRY_TO_SCORING_KEY[clock.country];
            if (!key) return null;
            const hour = currentHours[key];
            const score = hour !== undefined ? SCORING_DATA[key][hour] : null;
            if (score === null) return null;
            return (
              <div key={clock.country} className="flex items-center gap-1.5 text-xs">
                <span>{clock.flag}</span>
                <span className="text-[#6a6a88]">{clock.country}</span>
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

      <style jsx global>{`
        @keyframes cellGlow {
          0%, 100% { box-shadow: 0 0 16px rgba(255,255,255,0.4), inset 0 0 10px rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 24px rgba(255,255,255,0.6), inset 0 0 14px rgba(255,255,255,0.2); }
        }
      `}</style>
    </div>
  );
}

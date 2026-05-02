"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, Geometry, FeatureCollection } from "geojson";
import {
  WORLD_COUNTRIES,
  US_STATES,
  US_STATE_TZ,
  CA_PROVINCE_TZ,
  AU_STATE_TZ,
  loadCanadaProvinces,
  loadAustraliaStates,
} from "@/lib/mapData";
import {
  getScore,
  getCurrentHour,
  scoreToBgColor,
} from "@/lib/timelineScoring";
import { CLOCKS } from "@/lib/constants";

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 60;
const SUBDIVISION_ZOOM = 3.5;
const LABEL_ZOOM = 3.0;

// timeanddate.com-ish palette
const OCEAN_BG = "#b3d8f0";
const LAND_FILL = "#fafafa";
const LAND_STROKE = "#4a4a4a";
const SUBDIV_STROKE = "#111";

type NamedFC = FeatureCollection<Geometry, { name: string }>;

interface Subdiv {
  id: string;
  name: string;
  country: string;
  countryKey: string; // scoring key (US/Canada/Australia)
  timezone: string;
  d: string;
  centroid: [number, number];
}

function formatLocal(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

export default function WorldMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [transform, setTransform] = useState({ k: 1, tx: 0, ty: 0 });
  const [now, setNow] = useState(() => new Date());
  const [caFeatures, setCaFeatures] = useState<NamedFC | null>(null);
  const [auFeatures, setAuFeatures] = useState<NamedFC | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // ----- Measure container -----
  useEffect(() => {
    const measure = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // ----- Tick clock every 30s -----
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(i);
  }, []);

  // ----- Load subdivisions when zoomed in -----
  useEffect(() => {
    if (transform.k >= SUBDIVISION_ZOOM) {
      if (!caFeatures) loadCanadaProvinces().then(setCaFeatures).catch(() => {});
      if (!auFeatures) loadAustraliaStates().then(setAuFeatures).catch(() => {});
    }
  }, [transform.k, caFeatures, auFeatures]);

  // ----- Projection + precomputed paths/centroids (only recompute on resize) -----
  const geom = useMemo(() => {
    if (size.w === 0 || size.h === 0) return null;
    const proj = geoNaturalEarth1().fitSize([size.w, size.h], { type: "Sphere" } as never);
    const path = geoPath(proj);

    const countries = WORLD_COUNTRIES.map((f) => ({
      id: f.id,
      name: f.properties.name,
      d: path(f as Feature) || "",
      centroid: path.centroid(f as Feature) as [number, number],
    }));

    const subdivs: Subdiv[] = [];
    US_STATES.forEach((s) => {
      const tz = US_STATE_TZ[s.id];
      if (!tz) return;
      subdivs.push({
        id: `us-${s.id}`,
        name: s.properties.name,
        country: "US",
        countryKey: "US",
        timezone: tz,
        d: path(s as Feature) || "",
        centroid: path.centroid(s as Feature) as [number, number],
      });
    });

    const cityDots = CLOCKS.map((c) => ({
      country: c.country,
      pos: proj([c.lon, c.lat]) || [0, 0],
    }));

    return { proj, path, countries, subdivs, cityDots };
  }, [size]);

  // Extend subdivs when CA/AU load
  const allSubdivs = useMemo<Subdiv[]>(() => {
    if (!geom) return [];
    const list = [...geom.subdivs];
    if (caFeatures) {
      caFeatures.features.forEach((p, i) => {
        const name = p.properties.name;
        const tz = CA_PROVINCE_TZ[name];
        if (!tz) return;
        list.push({
          id: `ca-${i}`,
          name,
          country: "Canada",
          countryKey: "Canada",
          timezone: tz,
          d: geom.path(p as Feature) || "",
          centroid: geom.path.centroid(p as Feature) as [number, number],
        });
      });
    }
    if (auFeatures) {
      auFeatures.features.forEach((p, i) => {
        const name = p.properties.name;
        const tz = AU_STATE_TZ[name];
        if (!tz) return;
        list.push({
          id: `au-${i}`,
          name,
          country: "Australia",
          countryKey: "Australia",
          timezone: tz,
          d: geom.path(p as Feature) || "",
          centroid: geom.path.centroid(p as Feature) as [number, number],
        });
      });
    }
    return list;
  }, [geom, caFeatures, auFeatures]);

  // ----- Native wheel listener (passive:false so preventDefault works) -----
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      // trackpad pinch: e.ctrlKey is true; normal wheel: false. Either way we zoom.
      const intensity = Math.min(Math.abs(e.deltaY), 40) / 40;
      const step = 0.18 * intensity + 0.06;
      const factor = e.deltaY < 0 ? 1 + step : 1 / (1 + step);
      setTransform((prev) => {
        const nk = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.k * factor));
        const ratio = nk / prev.k;
        return {
          k: nk,
          tx: cx - (cx - prev.tx) * ratio,
          ty: cy - (cy - prev.ty) * ratio,
        };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ----- Drag handlers (native on window, to avoid losing cursor) -----
  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setTransform((prev) => ({
        ...prev,
        tx: d.tx + (e.clientX - d.x),
        ty: d.ty + (e.clientY - d.y),
      }));
    };
    const onUp = () => {
      dragRef.current = null;
      setDragging(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const zoomAt = useCallback((factor: number) => {
    setTransform((prev) => {
      const nk = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.k * factor));
      const ratio = nk / prev.k;
      const cx = size.w / 2;
      const cy = size.h / 2;
      return {
        k: nk,
        tx: cx - (cx - prev.tx) * ratio,
        ty: cy - (cy - prev.ty) * ratio,
      };
    });
  }, [size.w, size.h]);

  const resetView = () => setTransform({ k: 1, tx: 0, ty: 0 });

  // ISO → CLOCKS entry
  const marketByIso = useMemo(() => {
    const m = new Map<string, (typeof CLOCKS)[number]>();
    CLOCKS.forEach((c) => m.set(c.iso, c));
    return m;
  }, []);

  const showSubdivisions = transform.k >= SUBDIVISION_ZOOM;
  const showLabels = transform.k >= LABEL_ZOOM;

  const isHiddenAtCountryLevel = (iso: string) => {
    if (!showSubdivisions) return false;
    if (iso === "840") return true;
    if (iso === "124") return !!caFeatures;
    if (iso === "036") return !!auFeatures;
    return false;
  };

  // ----- Country-level fill helper -----
  const countryStyle = (iso: string): { fill: string; stroke: string } => {
    const market = marketByIso.get(iso);
    if (!market) return { fill: LAND_FILL, stroke: LAND_STROKE };
    if (isHiddenAtCountryLevel(iso)) {
      // subdivisions render on top — still draw a white outline beneath
      return { fill: LAND_FILL, stroke: LAND_STROKE };
    }
    const hour = getCurrentHour(market.timezone, now);
    const score = getScore(market.country, hour);
    if (score === null) return { fill: LAND_FILL, stroke: LAND_STROKE };
    return { fill: scoreToBgColor(score, 0.9), stroke: "#222" };
  };

  const subdivFill = (s: Subdiv): string => {
    const hour = getCurrentHour(s.timezone, now);
    const score = getScore(s.countryKey, hour);
    return score !== null ? scoreToBgColor(score, 0.9) : LAND_FILL;
  };

  // ----- Labels to render (country centroid or subdivision centroid) -----
  interface LabelSpec {
    id: string;
    x: number;
    y: number;
    title: string;
    time: string;
    score: number | null;
  }
  const labels = useMemo<LabelSpec[]>(() => {
    if (!geom || !showLabels) return [];
    const out: LabelSpec[] = [];

    // Country-level labels for markets that aren't subdivided
    geom.countries.forEach((c) => {
      const market = marketByIso.get(c.id);
      if (!market) return;
      if (isHiddenAtCountryLevel(c.id)) return;
      const hour = getCurrentHour(market.timezone, now);
      const score = getScore(market.country, hour);
      out.push({
        id: `country-${c.id}`,
        x: c.centroid[0],
        y: c.centroid[1],
        title: market.country,
        time: formatLocal(market.timezone, now),
        score,
      });
    });

    // Subdivision labels
    if (showSubdivisions) {
      allSubdivs.forEach((s) => {
        const hour = getCurrentHour(s.timezone, now);
        const score = getScore(s.countryKey, hour);
        out.push({
          id: s.id,
          x: s.centroid[0],
          y: s.centroid[1],
          title: s.name,
          time: formatLocal(s.timezone, now),
          score,
        });
      });
    }
    return out;
  }, [geom, allSubdivs, showLabels, showSubdivisions, now, marketByIso, caFeatures, auFeatures]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: OCEAN_BG, touchAction: "none", cursor: dragging ? "grabbing" : "grab" }}
      onMouseDown={startDrag}
    >
      <svg
        ref={svgRef}
        width={size.w || 0}
        height={size.h || 0}
        style={{ display: "block" }}
      >
        <g
          style={{
            transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.k})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {/* World base */}
          {geom?.countries.map((c) => {
            const { fill, stroke } = countryStyle(c.id);
            const isMarket = marketByIso.has(c.id);
            return (
              <path
                key={c.id}
                d={c.d}
                fill={fill}
                stroke={stroke}
                strokeWidth={isMarket ? 0.9 : 0.5}
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setHoverId(`country-${c.id}`)}
                onMouseLeave={() => setHoverId(null)}
                style={{ cursor: isMarket ? "pointer" : "default" }}
              />
            );
          })}

          {/* Subdivisions overlay */}
          {showSubdivisions &&
            allSubdivs.map((s) => (
              <path
                key={s.id}
                d={s.d}
                fill={subdivFill(s)}
                stroke={SUBDIV_STROKE}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{ cursor: "pointer" }}
              />
            ))}

          {/* City dots */}
          {geom?.cityDots.map((d, i) => (
            <g key={i}>
              <circle
                cx={d.pos[0]}
                cy={d.pos[1]}
                r={4}
                fill="#ec4899"
                stroke="white"
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
                style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.4))" }}
              />
            </g>
          ))}
        </g>
      </svg>

      {/* Auto-visible labels (HTML overlay, positioned per transform) */}
      {(() => {
        // Scale label sizing with zoom so they remain readable when zoomed in.
        const labelScale = Math.min(1.6, Math.max(1, transform.k / 4));
        const timeFs = Math.round(13 * labelScale);
        const subFs = Math.round(11 * labelScale);
        const padX = Math.round(8 * labelScale);
        const padY = Math.round(4 * labelScale);
        const minW = Math.round(64 * labelScale);
        return labels.map((l) => {
          const screenX = l.x * transform.k + transform.tx;
          const screenY = l.y * transform.k + transform.ty;
          if (
            screenX < -80 ||
            screenY < -40 ||
            screenX > size.w + 80 ||
            screenY > size.h + 40
          )
            return null;
          const isHovered = hoverId === l.id;
          return (
            <div
              key={l.id}
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: screenX,
                top: screenY,
                transition: dragging ? "none" : "opacity 150ms",
                opacity: isHovered ? 1 : 0.95,
              }}
            >
              <div
                className="rounded-md bg-white/95 border border-black/20 shadow-md text-center"
                style={{ minWidth: minW, padding: `${padY}px ${padX}px` }}
              >
                <div
                  className="font-mono font-bold leading-tight text-gray-900"
                  style={{ fontSize: timeFs }}
                >
                  {l.time}
                </div>
                <div
                  className="leading-tight text-gray-700 truncate max-w-[160px]"
                  style={{ fontSize: subFs }}
                >
                  {l.title}
                </div>
                {l.score !== null && (
                  <div
                    className="leading-tight font-bold"
                    style={{ fontSize: subFs, color: scoreToBgColor(l.score, 1) }}
                  >
                    {l.score.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          );
        });
      })()}

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 z-30">
        <button
          onClick={() => zoomAt(1.4)}
          className="w-9 h-9 rounded-md bg-white/95 border border-black/20 text-gray-800 hover:bg-white text-lg shadow"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => zoomAt(1 / 1.4)}
          className="w-9 h-9 rounded-md bg-white/95 border border-black/20 text-gray-800 hover:bg-white text-lg shadow"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-9 h-9 rounded-md bg-white/95 border border-black/20 text-gray-700 hover:bg-white text-xs shadow"
          title="Reset view"
        >
          ⌂
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-md bg-white/95 border border-black/20 px-3 py-2 shadow z-30">
        <div className="text-[10px] text-gray-600 mb-1 font-medium">
          Purchase likelihood (now)
        </div>
        <div className="flex items-center gap-0.5">
          {[0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0].map((s) => (
            <div
              key={s}
              className="w-6 h-3 first:rounded-l-sm last:rounded-r-sm"
              style={{ background: scoreToBgColor(s, 0.9) }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
        {!showSubdivisions && (
          <div className="text-[10px] text-gray-500 mt-2">
            Zoom in to reveal timezones
          </div>
        )}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 text-[10px] text-gray-700 bg-white/80 px-2 py-1 rounded border border-black/10 z-30 font-mono">
        {transform.k.toFixed(1)}×
      </div>
    </div>
  );
}

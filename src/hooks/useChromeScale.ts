"use client";

import { useEffect, useState } from "react";

const MIN_CHROME_SCALE = 0.5;
const MAX_CHROME_SCALE = 4;

/**
 * Returns a multiplier that counter-acts the current browser zoom level so
 * the app chrome (topbar, sidebar, statusbar, minimap) keeps a constant
 * visual size regardless of how the user has zoomed the browser. Only the
 * canvas content scales with browser zoom.
 *
 * Baseline DPR is inferred from the physical screen width
 * (`screen.width * devicePixelRatio`) — wide displays are assumed to be
 * retina (native DPR 2), narrow ones non-retina (native DPR 1). This lets us
 * compute the correct counter-scale even when the page first loads at a
 * non-100% browser zoom.
 */
export function useChromeScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const dpr = window.devicePixelRatio || 1;
      const physicalScreenWidth = window.screen.width * dpr;
      const baselineDPR = physicalScreenWidth >= 2400 ? 2 : 1;
      const browserZoom = dpr / baselineDPR;
      const counter = browserZoom > 0 ? 1 / browserZoom : 1;
      setScale(Math.min(MAX_CHROME_SCALE, Math.max(MIN_CHROME_SCALE, counter)));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

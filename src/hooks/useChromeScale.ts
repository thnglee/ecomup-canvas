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
 * Detection uses devicePixelRatio relative to the initial DPR captured on
 * first render — if the user changes browser zoom, DPR changes and we
 * inversely scale the chrome to compensate.
 */
export function useChromeScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const baseDPR = window.devicePixelRatio || 1;

    const update = () => {
      const currentDPR = window.devicePixelRatio || 1;
      const browserZoom = currentDPR / baseDPR;
      const counter = browserZoom > 0 ? 1 / browserZoom : 1;
      setScale(Math.min(MAX_CHROME_SCALE, Math.max(MIN_CHROME_SCALE, counter)));
    };

    update();
    window.addEventListener("resize", update);
    // Also listen for DPR-only changes (rare but possible)
    const mq = window.matchMedia(`(resolution: ${baseDPR}dppx)`);
    mq.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  return scale;
}

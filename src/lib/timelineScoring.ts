// Timeline scoring data from timeline_scoring.csv
// Scores represent likelihood of customer making a purchase (0 = unlikely, 1 = very likely)

export const SCORING_HOURS = [
  "12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM", "4:00 AM", "5:00 AM",
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM",
];

// country key → scores indexed by hour (0-23)
export const SCORING_DATA: Record<string, number[]> = {
  US:          [0.10, 0.05, 0.03, 0.02, 0.02, 0.03, 0.12, 0.25, 0.40, 0.55, 0.65, 0.75, 0.85, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.80, 0.85, 0.75, 0.50, 0.25],
  UK:          [0.08, 0.04, 0.02, 0.02, 0.02, 0.03, 0.08, 0.18, 0.35, 0.50, 0.60, 0.55, 0.55, 0.60, 0.60, 0.65, 0.70, 0.75, 0.80, 0.90, 0.95, 0.85, 0.55, 0.20],
  Australia:   [0.08, 0.04, 0.02, 0.02, 0.02, 0.03, 0.08, 0.15, 0.30, 0.50, 0.55, 0.55, 0.60, 0.60, 0.55, 0.60, 0.65, 0.70, 0.80, 0.90, 0.95, 0.80, 0.50, 0.18],
  Canada:      [0.10, 0.05, 0.03, 0.02, 0.02, 0.03, 0.10, 0.22, 0.38, 0.52, 0.62, 0.70, 0.80, 0.90, 0.85, 0.80, 0.75, 0.72, 0.75, 0.85, 0.88, 0.78, 0.50, 0.22],
  New_Zealand: [0.07, 0.04, 0.02, 0.02, 0.02, 0.03, 0.08, 0.15, 0.28, 0.48, 0.52, 0.52, 0.58, 0.58, 0.55, 0.58, 0.62, 0.68, 0.78, 0.88, 0.92, 0.78, 0.48, 0.17],
  Germany:     [0.07, 0.03, 0.02, 0.02, 0.02, 0.03, 0.07, 0.15, 0.30, 0.45, 0.52, 0.50, 0.52, 0.55, 0.55, 0.58, 0.65, 0.72, 0.82, 0.92, 0.95, 0.90, 0.60, 0.22],
};

// Map CLOCKS country names → scoring keys
export const COUNTRY_TO_SCORING_KEY: Record<string, string> = {
  US: "US",
  UK: "UK",
  Australia: "Australia",
  Canada: "Canada",
  NZ: "New_Zealand",
  Germany: "Germany",
  // Vietnam has no scoring data
};

/** Get the hour (0-23) in a given timezone for the supplied date (defaults to now) */
export function getCurrentHour(timezone: string, date?: Date): number {
  const d = date ?? new Date();
  // Use hourCycle "h23" (0-23) explicitly — hour12:false is unreliable in Safari
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hourCycle: "h23",
  }).format(d);
  return parseInt(hourStr, 10) % 24;
}

/** Get score for a country at a specific hour. Returns null if no data. */
export function getScore(countryName: string, hour: number): number | null {
  const key = COUNTRY_TO_SCORING_KEY[countryName];
  if (!key) return null;
  return SCORING_DATA[key]?.[hour] ?? null;
}

// Bright coral red (#ef4444) → amber → bright emerald green (#10b981)
// Using direct RGB lerp between curated anchor colors for vivid results
const ANCHORS = {
  red:   [239, 68, 68],   // #ef4444 — bright coral red
  amber: [234, 179, 8],   // #eab308 — warm amber
  green: [16, 185, 129],  // #10b981 — emerald green
};

function scoreToRGB(score: number): [number, number, number] {
  let from: number[], to: number[], t: number;
  if (score < 0.5) {
    from = ANCHORS.red;
    to = ANCHORS.amber;
    t = score * 2;
  } else {
    from = ANCHORS.amber;
    to = ANCHORS.green;
    t = (score - 0.5) * 2;
  }
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t),
  ];
}

/** Vivid text color for scores */
export function scoreToColor(score: number): string {
  const [r, g, b] = scoreToRGB(score);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Background for table cells — vivid and saturated */
export function scoreToBgColor(score: number, opacity = 0.7): string {
  const [r, g, b] = scoreToRGB(score);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Background for clock containers in the header bar */
export function scoreToBarBg(score: number): string {
  const [r, g, b] = scoreToRGB(score);
  return `rgba(${r}, ${g}, ${b}, 0.75)`;
}

/** Glow box-shadow for current-hour cells */
export function scoreToGlowShadow(score: number): string {
  const [r, g, b] = scoreToRGB(score);
  return `0 0 18px rgba(${r}, ${g}, ${b}, 0.6), inset 0 0 12px rgba(${r}, ${g}, ${b}, 0.2)`;
}

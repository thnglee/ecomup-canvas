export const GRID_SIZE = 20;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4.0;
export const ZOOM_STEP = 0.1;
export const ZOOM_SENSITIVITY = 0.001;
export const VIEWPORT_BUFFER = 200;
export const AUTOSAVE_DEBOUNCE_MS = 500;
export const HEADER_HEIGHT = 52;
export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 0;
export const STATUSBAR_HEIGHT = 32;

export const COLORS = {
  bg: {
    primary: "#0a0a0f",
    card: "#1a1a2e",
    cardHover: "#222240",
    sidebar: "#12121f",
    header: "#0d0d18",
  },
  border: "#2a2a4a",
  text: {
    primary: "#e4e4ef",
    secondary: "#8888aa",
    muted: "#555577",
  },
  accent: {
    blue: "#3b82f6",
    green: "#22c55e",
    red: "#ef4444",
    yellow: "#eab308",
  },
  grid: {
    dot: "#ffffff0a",
    bg: "transparent",
  },
} as const;

export const CLOCKS = [
  { country: "Vietnam", timezone: "Asia/Ho_Chi_Minh", flag: "\u{1F1FB}\u{1F1F3}", lat: 10.82, lon: 106.63 },
  { country: "UK", timezone: "Europe/London", flag: "\u{1F1EC}\u{1F1E7}", lat: 51.51, lon: -0.13 },
  { country: "US", timezone: "America/New_York", flag: "\u{1F1FA}\u{1F1F8}", lat: 40.71, lon: -74.01 },
  { country: "Australia", timezone: "Australia/Sydney", flag: "\u{1F1E6}\u{1F1FA}", lat: -33.87, lon: 151.21 },
  { country: "Canada", timezone: "America/Toronto", flag: "\u{1F1E8}\u{1F1E6}", lat: 43.65, lon: -79.38 },
  { country: "NZ", timezone: "Pacific/Auckland", flag: "\u{1F1F3}\u{1F1FF}", lat: -36.85, lon: 174.76 },
  { country: "Germany", timezone: "Europe/Berlin", flag: "\u{1F1E9}\u{1F1EA}", lat: 52.52, lon: 13.41 },
] as const;

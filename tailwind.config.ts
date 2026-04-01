import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:       "var(--background)",
        surface:          "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        "surface-hover":  "var(--surface-hover)",
        border:           "var(--border)",
        "border-subtle":  "var(--border-subtle)",
        foreground:       "var(--foreground)",
        "fg-muted":       "var(--foreground-muted)",
        "fg-faint":       "var(--foreground-faint)",
        accent:           "var(--accent)",
        "accent-dim":     "var(--accent-dim)",
        success:          "var(--success)",
        warning:          "var(--warning)",
        danger:           "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [],
};
export default config;

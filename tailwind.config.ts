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
        canvas: {
          bg: "#0a0a0f",
          card: "#1a1a2e",
          "card-hover": "#222240",
          sidebar: "#12121f",
          header: "#0d0d18",
          border: "#2a2a4a",
        },
        text: {
          primary: "#e4e4ef",
          secondary: "#8888aa",
          muted: "#555577",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clay: {
          bg: "#EBDCCB",
          surface: "#E4CDB7",
          sunken: "#EAD7C4",
          ink: "#4A2E1E",
          heading: "#7A3B22",
          muted: "#8A6650",
          soft: "#9A6A4E",
          brand: "#C15F3C",
          brandDeep: "#A0492B",
          accent: "#C87A54",
          line: "#C98F6B",
        },
      },
      fontFamily: {
        voice: ["var(--font-voice)", "Lora", "serif"],
        sans: ["var(--font-sans)", "Poppins", "sans-serif"],
      },
      boxShadow: {
        clay: "12px 12px 28px rgba(120,78,48,0.30), -10px -10px 24px rgba(255,248,240,0.55)",
        "clay-sm":
          "4px 4px 9px rgba(120,78,48,0.26), -3px -3px 7px rgba(255,248,240,0.55)",
        "clay-in":
          "inset 5px 5px 11px rgba(120,78,48,0.22), inset -5px -5px 11px rgba(255,248,240,0.6)",
        "clay-in-sm":
          "inset 3px 3px 6px rgba(120,78,48,0.30), inset -3px -3px 6px rgba(255,248,240,0.5)",
        brand:
          "4px 4px 11px rgba(150,70,40,0.4), -3px -3px 8px rgba(255,248,240,0.4)",
      },
      borderRadius: {
        clay: "28px",
      },
    },
  },
  plugins: [],
};

export default config;

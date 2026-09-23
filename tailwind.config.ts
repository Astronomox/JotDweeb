import type { Config } from "tailwindcss";

// Classical design system tokens (see design handoff README).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      screens: {
        wide: "820px",
      },
      colors: {
        paper: "#f3f2f2",
        surface: "#eae9e9",
        ink: "#201f1d",
        divider: "rgb(32 31 29 / 0.16)",
        backdrop: "#2d2b2b",
        accent: {
          DEFAULT: "#b68235",
          100: "#fff3e4",
          200: "#ffe3bf",
          600: "#a06f24",
          700: "#7d5411",
          800: "#5a3b0a",
          900: "#3a270d",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        lg: "7px",
      },
      boxShadow: {
        dialog: "0 12px 32px rgba(45,43,43,.22)",
      },
    },
  },
  plugins: [],
};

export default config;

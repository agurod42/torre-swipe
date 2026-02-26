import type { Config } from "tailwindcss";

// Colors and tokens extracted verbatim from references/ui/home-screen.html and empty-screen.html
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#CCDC39",
        "bg-midnight": "#0B0E14",
        "card-dark": "#1C1F26",
        "card-dark-lighter": "#282C35",
        "neon-cyan": "#A5F3FC",
        "neon-magenta": "#FBCFE8",
        "neon-amber": "#FDE68A",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "16px",
      },
    },
  },
  plugins: [],
};

export default config;

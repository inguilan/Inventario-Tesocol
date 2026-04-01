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
        orange: {
          DEFAULT: "#F5620F",
          light: "#FF7C3A",
          dark: "#C44A08",
          glow: "rgba(245,98,15,0.18)",
        },
        bg: {
          DEFAULT: "#0D0D0D",
          2: "#141414",
          3: "#1C1C1C",
          4: "#242424",
        },
      },
      fontFamily: {
        bebas: ["'Bebas Neue'", "cursive"],
        sans: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

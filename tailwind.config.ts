import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1120px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        cream: "#f8f0e5",
        ivory: "#fffaf0",
        sand: "#ead8bf",
        terracotta: "#b85d3b",
        burgundy: "#5f1626",
        wine: "#7d2435",
        "muted-gold": "#c7a15a",
        espresso: "#33251f",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(95, 22, 38, 0.08)",
        luxe: "0 20px 55px rgba(95, 22, 38, 0.16)",
        "inner-soft": "inset 0 1px 2px rgba(95, 22, 38, 0.05)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 420ms ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

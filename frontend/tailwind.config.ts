import type { Config } from "tailwindcss";

/**
 * Brand colours are fixed hex values (they are the same in both themes), while
 * everything surface-related reads a CSS variable so light/dark mode is a single
 * class swap on <html> rather than a `dark:` variant on every element.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#58CC02", dark: "#58A700", light: "#89E219", tint: "#E5F8D6" },
        info: { DEFAULT: "#1CB0F6", dark: "#1899D6", tint: "#DDF4FF" },
        danger: { DEFAULT: "#FF4B4B", dark: "#EA2B2B", tint: "#FFDFE0" },
        gold: { DEFAULT: "#FFC800", dark: "#E5B400" },
        flame: { DEFAULT: "#FF9600", dark: "#E08500" },
        grape: { DEFAULT: "#CE82FF", dark: "#A568CC", tint: "#F7ECFF" },
        page: "rgb(var(--page) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        correct: "rgb(var(--correct) / <alpha-value>)",
        "correct-ink": "rgb(var(--correct-ink) / <alpha-value>)",
        wrong: "rgb(var(--wrong) / <alpha-value>)",
        "wrong-ink": "rgb(var(--wrong-ink) / <alpha-value>)",
        locked: "rgb(var(--locked) / <alpha-value>)",
        "locked-ink": "rgb(var(--locked-ink) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        node: "0 6px 0 0 rgb(0 0 0 / 0.18)",
        pop: "0 4px 16px rgb(0 0 0 / 0.12)",
      },
      keyframes: {
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "bubble-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        bob: "bob 2.6s ease-in-out infinite",
        "bubble-bounce": "bubble-bounce 1.4s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

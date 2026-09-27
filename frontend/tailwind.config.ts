import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        ui: ["Manrope", "system-ui", "sans-serif"],
        display: ["Fraunces", "serif"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          faint: "var(--ink-faint)",
        },
        line: {
          DEFAULT: "var(--line)",
          soft: "var(--line-soft)",
        },
        pine: {
          DEFAULT: "var(--pine)",
          2: "var(--pine-2)",
          tint: "var(--pine-tint)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          tint: "var(--gold-tint)",
        },
        income: {
          DEFAULT: "var(--income)",
          tint: "var(--income-tint)",
        },
        expense: {
          DEFAULT: "var(--expense)",
          tint: "var(--expense-tint)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          tint: "var(--warn-tint)",
        },
        // Backwards compatibility aliases
        paper: "var(--bg)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        "ink-muted": "var(--ink-soft)",
        "ink-light": "var(--ink-faint)",
        "income-text": "var(--income)",
        "expense-text": "var(--expense)",
        primary: "var(--pine)",
        "primary-dark": "var(--pine-2)",
        "primary-light": "var(--pine-tint)",
        danger: "var(--expense)",
      },
      borderRadius: {
        "r-sm": "10px",
        "r-md": "14px",
        "r-lg": "22px",
        "r-sheet": "26px",
        "2xl": "16px",
        xl: "14px",
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,25,21,.04), 0 6px 20px rgba(18,25,21,.06)",
        float: "0 1px 2px rgba(18,25,21,.04), 0 6px 20px rgba(18,25,21,.06)",
        btn: "0 4px 14px rgba(18,59,49,0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;

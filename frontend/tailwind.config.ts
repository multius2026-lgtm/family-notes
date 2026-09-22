import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["Inter", "sans-serif"],
      },
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "ink-light": "var(--ink-light)",
        income: "var(--income)",
        "income-text": "var(--income-text)",
        expense: "var(--expense)",
        "expense-text": "var(--expense-text)",
        gold: "var(--gold)",
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        "primary-light": "var(--primary-light)",
        danger: "var(--danger)",
      },
      borderRadius: {
        "2xl": "16px",
        xl: "12px",
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        btn: "0 4px 14px rgba(45,190,126,0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;

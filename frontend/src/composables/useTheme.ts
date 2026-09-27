import { ref } from "vue";

export interface ThemeOption {
  id: string;
  name: string;
  primaryColor: string;
  gradient: string;
  isDark?: boolean;
}

export const AVAILABLE_THEMES: ThemeOption[] = [
  {
    id: "pine",
    name: "Pine Forest (Default)",
    primaryColor: "#123B31",
    gradient: "linear-gradient(135deg, #123B31 0%, #1C5445 100%)",
  },
  {
    id: "green",
    name: "Emerald Green",
    primaryColor: "#059669",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  {
    id: "blue",
    name: "Ocean Blue",
    primaryColor: "#2563eb",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  },
  {
    id: "purple",
    name: "Royal Purple",
    primaryColor: "#7c3aed",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
  },
  {
    id: "orange",
    name: "Sunset Orange",
    primaryColor: "#ea580c",
    gradient: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
  },
  {
    id: "rose",
    name: "Rose Berry",
    primaryColor: "#e11d48",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #be123c 100%)",
  },
  {
    id: "teal",
    name: "Nordic Teal",
    primaryColor: "#0d9488",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
  },
  {
    id: "dark",
    name: "Midnight Dark",
    primaryColor: "#2B7A66",
    gradient: "linear-gradient(135deg, #141F1A 0%, #20312B 100%)",
    isDark: true,
  },
  {
    id: "dark-blue",
    name: "Deep Ocean (Gelap)",
    primaryColor: "#3b82f6",
    gradient: "linear-gradient(135deg, #111a2e 0%, #1e2e4f 100%)",
    isDark: true,
  },
  {
    id: "dark-purple",
    name: "Night Purple (Gelap)",
    primaryColor: "#8b5cf6",
    gradient: "linear-gradient(135deg, #1a122c 0%, #2e214f 100%)",
    isDark: true,
  },
];

const currentTheme = ref<string>(localStorage.getItem("app-theme") || "pine");

export function useTheme() {
  function setTheme(themeId: string) {
    currentTheme.value = themeId;
    localStorage.setItem("app-theme", themeId);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", themeId);
      const active = AVAILABLE_THEMES.find((t) => t.id === themeId);
      if (active?.isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      // Update browser theme-color meta tag
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta && active) {
        meta.setAttribute("content", active.isDark ? "#0E1613" : active.primaryColor);
      }
    }
  }

  function initTheme() {
    const saved = localStorage.getItem("app-theme") || "pine";
    setTheme(saved);
  }

  return {
    currentTheme,
    themes: AVAILABLE_THEMES,
    setTheme,
    initTheme,
  };
}

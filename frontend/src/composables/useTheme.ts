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
    id: "green",
    name: "Emerald Green",
    primaryColor: "#2dbe7e",
    gradient: "linear-gradient(135deg, #2dbe7e 0%, #1a9e65 100%)",
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
    primaryColor: "#8b5cf6",
    gradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
  },
  {
    id: "orange",
    name: "Sunset Orange",
    primaryColor: "#f97316",
    gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
  },
  {
    id: "rose",
    name: "Rose Berry",
    primaryColor: "#f43f5e",
    gradient: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
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
    primaryColor: "#10b981",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    isDark: true,
  },
];

const currentTheme = ref<string>(localStorage.getItem("app-theme") || "green");

export function useTheme() {
  function setTheme(themeId: string) {
    currentTheme.value = themeId;
    localStorage.setItem("app-theme", themeId);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", themeId);
      // Update browser theme-color meta tag
      const active = AVAILABLE_THEMES.find((t) => t.id === themeId);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta && active) {
        meta.setAttribute("content", active.primaryColor);
      }
    }
  }

  function initTheme() {
    const saved = localStorage.getItem("app-theme") || "green";
    setTheme(saved);
  }

  return {
    currentTheme,
    themes: AVAILABLE_THEMES,
    setTheme,
    initTheme,
  };
}

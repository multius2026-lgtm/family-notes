import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import type { DailySummary, WeeklySummary, TrendResponse, MonthlySummary } from "@/types";

export const useSummaryStore = defineStore("summary", {
  state: () => ({
    daily: null as DailySummary | null,
    weekly: null as WeeklySummary | null,
    trend: null as TrendResponse | null,
    monthly: null as MonthlySummary | null,
    loading: false,
    loadingMonthly: false,
  }),

  actions: {
    async fetchDashboard() {
      const { api } = useApi();
      this.loading = true;
      try {
        const [daily, weekly, trend] = await Promise.all([
          api<DailySummary>("/summary/daily"),
          api<WeeklySummary>("/summary/weekly"),
          api<TrendResponse>("/summary/trend", { query: { range: "14d" } }),
        ]);
        this.daily = daily;
        this.weekly = weekly;
        this.trend = trend;
      } finally {
        this.loading = false;
      }
    },

    async fetchMonthly(year: number, month: number) {
      const { api } = useApi();
      this.loadingMonthly = true;
      try {
        this.monthly = await api<MonthlySummary>("/summary/monthly", {
          query: { year: String(year), month: String(month) },
        });
      } finally {
        this.loadingMonthly = false;
      }
    },

    async fetchTrend(range: "7d" | "14d" | "30d" = "14d") {
      const { api } = useApi();
      try {
        this.trend = await api<TrendResponse>("/summary/trend", { query: { range } });
      } catch (err) {
        console.error("Gagal mengambil trend:", err);
      }
    },
  },
});

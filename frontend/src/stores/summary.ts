import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { DailySummary, WeeklySummary, TrendResponse, MonthlySummary, CategoryBreakdown, SourceBreakdown } from "@/types";

function dailyEquivalent(amount: number, period: string): number {
  if (period === "weekly") return amount / 7;
  if (period === "monthly") return amount / 30;
  return amount;
}

async function getTransactionsByRange(from: string, to: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      income_sources(id, name, icon, default_period_type, is_default),
      expense_categories(id, name, icon, is_default)
    `)
    .gte("occurred_at", from)
    .lte("occurred_at", to)
    .order("occurred_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function summarize(rows: any[]) {
  let incomeRaw = 0;
  let expenseRaw = 0;
  let incomeDailyEquivalent = 0;
  const byPeriodType: Record<string, number> = { daily: 0, weekly: 0, monthly: 0 };

  for (const r of rows) {
    const amount = Number(r.amount);
    const period = r.period_type as string;
    if (r.type === "income") {
      incomeRaw += amount;
      incomeDailyEquivalent += dailyEquivalent(amount, period);
      byPeriodType[period] = (byPeriodType[period] || 0) + amount;
    } else {
      expenseRaw += amount;
    }
  }
  return { incomeRaw, expenseRaw, incomeDailyEquivalent, byPeriodType };
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

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
      this.loading = true;
      try {
        const today = toDateStr(new Date());
        const d = new Date();
        // Hitung awal minggu ISO (Senin)
        const dayOfWeek = (d.getDay() + 6) % 7;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - dayOfWeek);
        const weekFrom = toDateStr(weekStart);
        const weekTo = toDateStr(new Date(weekStart.getTime() + 6 * 86400000));

        const [dailyRows, weeklyRows] = await Promise.all([
          getTransactionsByRange(today, today),
          getTransactionsByRange(weekFrom, weekTo),
        ]);

        // Daily
        const ds = summarize(dailyRows);
        this.daily = {
          date: today,
          income: ds.incomeRaw,
          expense: ds.expenseRaw,
          net: ds.incomeRaw - ds.expenseRaw,
          incomeByPeriodType: ds.byPeriodType as any,
        };

        // Weekly
        const ws = summarize(weeklyRows);
        this.weekly = {
          from: weekFrom,
          to: weekTo,
          totalIncome: ws.incomeRaw,
          totalExpense: ws.expenseRaw,
          avgDailyIncome: ws.incomeDailyEquivalent,
          avgDailyExpense: ws.expenseRaw > 0 ? ws.expenseRaw / 7 : 0,
          weeklyTarget: null,
          targetProgressPct: null,
          incomeByPeriodType: ws.byPeriodType as any,
        };

        // Trend 14 hari
        await this.fetchTrend("14d");
      } finally {
        this.loading = false;
      }
    },

    async fetchMonthly(year: number, month: number) {
      this.loadingMonthly = true;
      try {
        const from = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const rows = await getTransactionsByRange(from, to);
        const s = summarize(rows);

        // Expense by category
        const catMap = new Map<string, { label: string; total: number }>();
        for (const r of rows.filter((r: any) => r.type === "expense")) {
          const key = r.expense_category_id || r.category || "Lainnya";
          const label = r.expense_categories?.name || r.category || "Lainnya";
          const prev = catMap.get(key) || { label, total: 0 };
          catMap.set(key, { label, total: prev.total + Number(r.amount) });
        }
        const expenseByCategory: CategoryBreakdown[] = Array.from(catMap.entries())
          .map(([key, { label, total }]) => ({ key, label, total }))
          .sort((a, b) => b.total - a.total);

        // Income by source
        const srcMap = new Map<string, { label: string; total: number; periodType: string }>();
        for (const r of rows.filter((r: any) => r.type === "income")) {
          const key = r.income_source_id || "other";
          const label = r.income_sources?.name || "Lainnya";
          const prev = srcMap.get(key) || { label, total: 0, periodType: r.period_type };
          srcMap.set(key, { label, total: prev.total + Number(r.amount), periodType: r.period_type });
        }
        const incomeBySource: SourceBreakdown[] = Array.from(srcMap.entries())
          .map(([key, { label, total, periodType }]) => ({ key, label, total, periodType }))
          .sort((a, b) => b.total - a.total);

        this.monthly = {
          year,
          month,
          from,
          to,
          totalIncome: s.incomeRaw,
          totalExpense: s.expenseRaw,
          net: s.incomeRaw - s.expenseRaw,
          avgDailyIncome: s.incomeDailyEquivalent,
          avgDailyExpense: s.expenseRaw > 0 ? s.expenseRaw / lastDay : 0,
          incomeByPeriodType: s.byPeriodType as any,
          expenseByCategory,
          incomeBySource,
          daysInMonth: lastDay,
        };
      } finally {
        this.loadingMonthly = false;
      }
    },

    async fetchTrend(range: "7d" | "14d" | "30d" = "14d") {
      const days = parseInt(range);
      const from = daysAgoStr(days - 1);
      const to = toDateStr(new Date());

      try {
        const rows = await getTransactionsByRange(from, to);
        const points = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = daysAgoStr(i);
          const dayRows = rows.filter((r: any) => r.occurred_at === d);
          const s = summarize(dayRows);
          points.push({ date: d, income: s.incomeRaw, expense: s.expenseRaw, incomeDailyEquivalent: s.incomeDailyEquivalent });
        }
        this.trend = { from, to, points };
      } catch (err) {
        console.error("Gagal memuat trend:", err);
      }
    },
  },
});

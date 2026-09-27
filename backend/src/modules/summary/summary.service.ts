import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { dailyEquivalent, type PeriodType } from "@/utils/period";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}
function startOfIsoWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Senin = 0
  date.setDate(date.getDate() - day);
  return toDateStr(date);
}

async function getRangeTransactions(userId: string, from: string, to: string) {
  return db.query.transactions.findMany({
    where: and(eq(transactions.userId, userId), gte(transactions.occurredAt, from), lte(transactions.occurredAt, to)),
    with: {
      expenseCategory: true,
      incomeSource: true,
    },
  });
}

/**
 * Menjumlahkan transaksi dalam satu rentang tanggal dengan DUA sudut pandang:
 * - `raw`   : total uang yang benar-benar diterima/dibelanjakan pada tanggal
 *             tersebut (dipakai untuk "berapa yang masuk hari ini").
 * - `dailyEquivalentTotal` : setiap nilai income dibagi sesuai periodType
 *             (mingguan/7, bulanan/30) sebelum dijumlahkan, dipakai untuk
 *             rata-rata harian yang adil ketika user punya campuran
 *             penghasilan harian/mingguan/bulanan.
 */
function summarize(rows: Awaited<ReturnType<typeof getRangeTransactions>>) {
  let incomeRaw = 0;
  let expenseRaw = 0;
  let incomeDailyEquivalent = 0;
  let expenseDailyEquivalent = 0;
  const byPeriodType: Record<PeriodType, number> = { daily: 0, weekly: 0, monthly: 0 };

  for (const r of rows) {
    const amount = Number(r.amount);
    const period = r.periodType as PeriodType;
    if (r.type === "income") {
      incomeRaw += amount;
      incomeDailyEquivalent += dailyEquivalent(amount, period);
      byPeriodType[period] += amount;
    } else {
      expenseRaw += amount;
      expenseDailyEquivalent += dailyEquivalent(amount, period);
    }
  }

  return { incomeRaw, expenseRaw, incomeDailyEquivalent, expenseDailyEquivalent, byPeriodType };
}

export async function getDailySummary(userId: string, date: string) {
  const rows = await getRangeTransactions(userId, date, date);
  const s = summarize(rows);
  return {
    date,
    income: s.incomeRaw,
    expense: s.expenseRaw,
    net: s.incomeRaw - s.expenseRaw,
    incomeByPeriodType: s.byPeriodType,
  };
}

export async function getWeeklySummary(userId: string, weekStart?: string) {
  const from = weekStart || startOfIsoWeek();
  const to = toDateStr(new Date(new Date(from).getTime() + 6 * 86400000));
  const rows = await getRangeTransactions(userId, from, to);
  const s = summarize(rows);

  // FIX: avgDailyIncome = incomeDailyEquivalent langsung.
  // incomeDailyEquivalent sudah merupakan "setara harian" per transaksi
  // (bulanan/30, mingguan/7, harian/1). Menjumlahkannya = total setara harian
  // dari semua sumber. TIDAK perlu dibagi 7 lagi — itu menyebabkan dobel bagi
  // sehingga gaji bulanan 6jt menjadi ~28rb padahal seharusnya ~200rb/hari.
  const avgDailyIncome = s.incomeDailyEquivalent;
  const avgDailyExpense = s.expenseRaw > 0 ? s.expenseRaw / 7 : 0;

  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
  const weeklyTarget = user?.weeklyTarget ? Number(user.weeklyTarget) : null;

  return {
    from,
    to,
    totalIncome: s.incomeRaw,
    totalExpense: s.expenseRaw,
    avgDailyIncome,
    avgDailyExpense,
    weeklyTarget,
    targetProgressPct: weeklyTarget ? Math.round((s.incomeRaw / weeklyTarget) * 100) : null,
    incomeByPeriodType: s.byPeriodType,
  };
}

export async function getTrend(userId: string, rangeDays: number) {
  const from = daysAgo(rangeDays - 1);
  const to = toDateStr(new Date());
  const rows = await getRangeTransactions(userId, from, to);

  const points: { date: string; income: number; expense: number; incomeDailyEquivalent: number }[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const dayRows = rows.filter((r) => r.occurredAt === d);
    const s = summarize(dayRows);
    points.push({ date: d, income: s.incomeRaw, expense: s.expenseRaw, incomeDailyEquivalent: s.incomeDailyEquivalent });
  }
  return { from, to, points };
}

export async function getByCategory(userId: string, from: string, to: string) {
  const rows = await getRangeTransactions(userId, from, to);
  const expenseRows = rows.filter((r) => r.type === "expense");
  const totals = new Map<string, { total: number; label: string }>();

  for (const r of expenseRows) {
    const key = r.expenseCategoryId || r.category || "Lainnya";
    const label = r.expenseCategory?.name || r.category || "Lainnya";
    const prev = totals.get(key) || { total: 0, label };
    totals.set(key, { total: prev.total + Number(r.amount), label });
  }

  return Array.from(totals.entries()).map(([key, { total, label }]) => ({ key, total, label }));
}

export async function getMonthlySummary(userId: string, year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rows = await getRangeTransactions(userId, from, to);
  const s = summarize(rows);

  // Breakdown expense per kategori
  const catMap = new Map<string, { label: string; total: number }>();
  for (const r of rows.filter((r) => r.type === "expense")) {
    const key = r.expenseCategoryId || r.category || "Lainnya";
    const label = r.expenseCategory?.name || r.category || "Lainnya";
    const prev = catMap.get(key) || { label, total: 0 };
    catMap.set(key, { label, total: prev.total + Number(r.amount) });
  }
  const expenseByCategory = Array.from(catMap.entries())
    .map(([key, { label, total }]) => ({ key, label, total }))
    .sort((a, b) => b.total - a.total);

  // Breakdown income per sumber
  const srcMap = new Map<string, { label: string; total: number; periodType: string }>();
  for (const r of rows.filter((r) => r.type === "income")) {
    const key = r.incomeSourceId || "other";
    const label = r.incomeSource?.name || "Lainnya";
    const prev = srcMap.get(key) || { label, total: 0, periodType: r.periodType };
    srcMap.set(key, { label, total: prev.total + Number(r.amount), periodType: r.periodType });
  }
  const incomeBySource = Array.from(srcMap.entries())
    .map(([key, { label, total, periodType }]) => ({ key, label, total, periodType }))
    .sort((a, b) => b.total - a.total);

  // Rata-rata harian setara (total daily equivalent — sudah ternormalisasi per-hari)
  const avgDailyIncome = s.incomeDailyEquivalent;
  const avgDailyExpense = s.expenseRaw > 0 ? s.expenseRaw / lastDay : 0;

  return {
    year,
    month,
    from,
    to,
    totalIncome: s.incomeRaw,
    totalExpense: s.expenseRaw,
    net: s.incomeRaw - s.expenseRaw,
    avgDailyIncome,
    avgDailyExpense,
    incomeByPeriodType: s.byPeriodType,
    expenseByCategory,
    incomeBySource,
    daysInMonth: lastDay,
  };
}

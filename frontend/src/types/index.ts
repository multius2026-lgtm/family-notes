export type PeriodType = "daily" | "weekly" | "monthly";
export type TransactionType = "income" | "expense";

export const PERIOD_LABEL: Record<PeriodType, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
};

export interface IncomeSource {
  id: string;
  name: string;
  icon: string | null;
  defaultPeriodType: PeriodType;
  isDefault: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string; // numeric dari Postgres datang sebagai string
  periodType: PeriodType;
  incomeSourceId: string | null;
  expenseCategoryId: string | null;
  category: string | null;
  note: string | null;
  occurredAt: string; // YYYY-MM-DD
  createdAt: string;
  incomeSource?: IncomeSource | null;
  expenseCategory?: ExpenseCategory | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  weeklyTarget?: string | number | null;
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
  net: number;
  incomeByPeriodType: Record<PeriodType, number>;
}

export interface WeeklySummary {
  from: string;
  to: string;
  totalIncome: number;
  totalExpense: number;
  avgDailyIncome: number;
  avgDailyExpense: number;
  weeklyTarget: number | null;
  targetProgressPct: number | null;
  incomeByPeriodType: Record<PeriodType, number>;
}

export interface TrendPoint {
  date: string;
  income: number;
  expense: number;
  incomeDailyEquivalent: number;
}

export interface TrendResponse {
  from: string;
  to: string;
  points: TrendPoint[];
}

export interface CategoryBreakdown {
  key: string;
  label: string;
  total: number;
}

export interface SourceBreakdown {
  key: string;
  label: string;
  total: number;
  periodType: string;
}

export interface MonthlySummary {
  year: number;
  month: number;
  from: string;
  to: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  avgDailyIncome: number;
  avgDailyExpense: number;
  incomeByPeriodType: Record<PeriodType, number>;
  expenseByCategory: CategoryBreakdown[];
  incomeBySource: SourceBreakdown[];
  daysInMonth: number;
}

export type PeriodType = "daily" | "weekly" | "monthly";
export type TransactionType = "income" | "expense" | "transfer";

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

export interface ReceiptItem {
  name: string;
  price: number | null;
  qty?: number;
}

export type WalletType = "cash" | "bank" | "ewallet" | "credit_card";

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: "Tunai (Cash)",
  bank: "Rekening Bank",
  ewallet: "E-Wallet (GoPay/OVO/Dana)",
  credit_card: "Kartu Kredit",
};

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
  icon: string | null;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // YYYY-MM
  amount: number;
  createdAt: string;
  category?: ExpenseCategory | null;
  spent?: number; // dihitung di frontend
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  icon: string;
  color: string;
  isCompleted: boolean;
  createdAt: string;
}

export type DebtType = "debt" | "loan"; // debt = utang kita, loan = piutang (orang utang ke kita)

export interface Debt {
  id: string;
  userId: string;
  type: DebtType;
  personName: string;
  amount: number;
  remainingAmount: number;
  dueDate: string | null;
  status: "unpaid" | "partial" | "paid";
  notes: string | null;
  createdAt: string;
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
  receiptUrl: string | null;   // URL foto struk di Supabase Storage
  isOcr: boolean;              // true = input via scan struk
  receiptItems?: ReceiptItem[] | null; // Rincian item dari struk belanja
  walletId?: string | null;
  transferToWalletId?: string | null;
  incomeSource?: IncomeSource | null;
  expenseCategory?: ExpenseCategory | null;
  wallet?: Wallet | null;
  transferToWallet?: Wallet | null;
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

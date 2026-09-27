import { z } from "zod";

const periodTypeSchema = z.enum(["daily", "weekly", "monthly"]).default("daily");

const createTransactionBaseSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  // Untuk income: periode yang direpresentasikan nilai ini (harian/mingguan/
  // bulanan). Untuk expense, biarkan default "daily".
  periodType: periodTypeSchema,
  incomeSourceId: z.string().uuid().optional(),
  expenseCategoryId: z.string().uuid().optional(),
  category: z.string().optional(),
  note: z.string().max(280).optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
});

export const createTransactionSchema = createTransactionBaseSchema.refine(
  (v) => (v.type === "income" ? !!v.incomeSourceId : !!v.expenseCategoryId),
  {
    message: "incomeSourceId wajib untuk pemasukan, expenseCategoryId wajib untuk pengeluaran",
  }
);
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionBaseSchema.partial().extend({
  type: z.enum(["income", "expense"]).optional(),
});
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const listTransactionsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(["income", "expense"]).optional(),
});
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

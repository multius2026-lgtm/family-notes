import { and, eq, gte, lte, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import type { CreateTransactionInput, UpdateTransactionInput, ListTransactionsQuery } from "./transactions.schema";

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  const conditions = [eq(transactions.userId, userId)];
  if (query.from) conditions.push(gte(transactions.occurredAt, query.from));
  if (query.to) conditions.push(lte(transactions.occurredAt, query.to));
  if (query.type) conditions.push(eq(transactions.type, query.type));

  return db.query.transactions.findMany({
    where: and(...conditions),
    orderBy: [desc(transactions.occurredAt), desc(transactions.createdAt)],
    with: { incomeSource: true, expenseCategory: true },
  });
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      type: input.type,
      amount: input.amount.toString(),
      periodType: input.periodType,
      incomeSourceId: input.type === "income" ? input.incomeSourceId : null,
      expenseCategoryId: input.type === "expense" ? input.expenseCategoryId : null,
      category: input.category,
      note: input.note,
      occurredAt: input.occurredAt,
    })
    .returning();

  return row;
}

export async function updateTransaction(userId: string, id: string, input: UpdateTransactionInput) {
  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
  });
  if (!existing) throw new Error("Transaksi tidak ditemukan.");

  const [row] = await db
    .update(transactions)
    .set({
      ...(input.type && { type: input.type }),
      ...(input.amount !== undefined && { amount: input.amount.toString() }),
      ...(input.periodType && { periodType: input.periodType }),
      ...(input.incomeSourceId !== undefined && { incomeSourceId: input.incomeSourceId }),
      ...(input.expenseCategoryId !== undefined && { expenseCategoryId: input.expenseCategoryId }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.occurredAt && { occurredAt: input.occurredAt }),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();

  return row;
}

export async function deleteTransaction(userId: string, id: string) {
  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
  });
  if (!existing) throw new Error("Transaksi tidak ditemukan.");

  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  return { success: true };
}

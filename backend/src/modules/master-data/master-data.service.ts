import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { incomeSources, expenseCategories } from "@/db/schema";
import type { PeriodType } from "@/utils/period";

export async function listIncomeSources(userId: string) {
  return db.query.incomeSources.findMany({ where: eq(incomeSources.userId, userId) });
}

export async function createIncomeSource(
  userId: string,
  input: { name: string; icon?: string; defaultPeriodType?: PeriodType }
) {
  const [row] = await db
    .insert(incomeSources)
    .values({ userId, name: input.name, icon: input.icon || "dots", defaultPeriodType: input.defaultPeriodType || "daily" })
    .returning();
  return row;
}

export async function deleteIncomeSource(userId: string, id: string) {
  const existing = await db.query.incomeSources.findFirst({ where: and(eq(incomeSources.id, id), eq(incomeSources.userId, userId)) });
  if (!existing) throw new Error("Sumber pemasukan tidak ditemukan.");
  if (existing.isDefault) throw new Error("Sumber pemasukan bawaan tidak bisa dihapus.");
  await db.delete(incomeSources).where(and(eq(incomeSources.id, id), eq(incomeSources.userId, userId)));
  return { success: true };
}

export async function listExpenseCategories(userId: string) {
  return db.query.expenseCategories.findMany({ where: eq(expenseCategories.userId, userId) });
}

export async function createExpenseCategory(userId: string, input: { name: string; icon?: string }) {
  const [row] = await db
    .insert(expenseCategories)
    .values({ userId, name: input.name, icon: input.icon || "dots" })
    .returning();
  return row;
}

export async function deleteExpenseCategory(userId: string, id: string) {
  const existing = await db.query.expenseCategories.findFirst({ where: and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId)) });
  if (!existing) throw new Error("Kategori pengeluaran tidak ditemukan.");
  if (existing.isDefault) throw new Error("Kategori bawaan tidak bisa dihapus.");
  await db.delete(expenseCategories).where(and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId)));
  return { success: true };
}

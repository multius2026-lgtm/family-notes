import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { Transaction, PeriodType, TransactionType } from "@/types";

interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  periodType: PeriodType;
  incomeSourceId?: string;
  expenseCategoryId?: string;
  note?: string;
  occurredAt: string;
}

function mapRow(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    periodType: row.period_type,
    incomeSourceId: row.income_source_id,
    expenseCategoryId: row.expense_category_id,
    category: row.category,
    note: row.note,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    incomeSource: row.income_sources
      ? { id: row.income_sources.id, name: row.income_sources.name, icon: row.income_sources.icon, defaultPeriodType: row.income_sources.default_period_type, isDefault: row.income_sources.is_default }
      : null,
    expenseCategory: row.expense_categories
      ? { id: row.expense_categories.id, name: row.expense_categories.name, icon: row.expense_categories.icon, isDefault: row.expense_categories.is_default }
      : null,
  };
}

export const useTransactionsStore = defineStore("transactions", {
  state: () => ({
    items: [] as Transaction[],
    loading: false,
  }),

  actions: {
    async fetchList(params: { from?: string; to?: string; type?: TransactionType } = {}) {
      this.loading = true;
      try {
        let query = supabase
          .from("transactions")
          .select(`
            *,
            income_sources(id, name, icon, default_period_type, is_default),
            expense_categories(id, name, icon, is_default)
          `)
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false });

        if (params.from) query = query.gte("occurred_at", params.from);
        if (params.to) query = query.lte("occurred_at", params.to);
        if (params.type) query = query.eq("type", params.type);

        const { data, error } = await query;
        if (error) throw error;
        this.items = (data ?? []).map(mapRow);
      } finally {
        this.loading = false;
      }
    },

    async create(input: NewTransactionInput) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: input.type,
          amount: input.amount,
          period_type: input.periodType,
          income_source_id: input.incomeSourceId ?? null,
          expense_category_id: input.expenseCategoryId ?? null,
          note: input.note ?? null,
          occurred_at: input.occurredAt,
        })
        .select(`
          *,
          income_sources(id, name, icon, default_period_type, is_default),
          expense_categories(id, name, icon, is_default)
        `)
        .single();
      if (error) throw error;

      const row = mapRow(data);
      this.items.unshift(row);
      return row;
    },

    async update(id: string, input: Partial<NewTransactionInput>) {
      const updates: Record<string, any> = {};
      if (input.type !== undefined) updates.type = input.type;
      if (input.amount !== undefined) updates.amount = input.amount;
      if (input.periodType !== undefined) updates.period_type = input.periodType;
      if (input.incomeSourceId !== undefined) updates.income_source_id = input.incomeSourceId;
      if (input.expenseCategoryId !== undefined) updates.expense_category_id = input.expenseCategoryId;
      if (input.note !== undefined) updates.note = input.note;
      if (input.occurredAt !== undefined) updates.occurred_at = input.occurredAt;

      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          income_sources(id, name, icon, default_period_type, is_default),
          expense_categories(id, name, icon, is_default)
        `)
        .single();
      if (error) throw error;

      const row = mapRow(data);
      const idx = this.items.findIndex((t) => t.id === id);
      if (idx !== -1) this.items[idx] = row;
      return row;
    },

    async remove(id: string) {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      this.items = this.items.filter((t) => t.id !== id);
    },
  },
});

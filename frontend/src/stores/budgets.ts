import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { Budget } from "@/types";

function mapBudget(row: any): Budget {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    month: row.month,
    amount: Number(row.amount),
    createdAt: row.created_at,
    category: row.expense_categories
      ? {
          id: row.expense_categories.id,
          name: row.expense_categories.name,
          icon: row.expense_categories.icon,
          isDefault: row.expense_categories.is_default,
        }
      : null,
  };
}

export const useBudgetsStore = defineStore("budgets", {
  state: () => ({
    items: [] as Budget[],
    loading: false,
  }),

  actions: {
    async fetchList(month: string) {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("budgets")
          .select(`
            *,
            expense_categories(id, name, icon, is_default)
          `)
          .eq("month", month);

        if (error) throw error;
        this.items = (data || []).map(mapBudget);
      } finally {
        this.loading = false;
      }
    },

    async setBudget(input: { categoryId: string; month: string; amount: number }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const { data, error } = await supabase
        .from("budgets")
        .upsert(
          {
            user_id: user.id,
            category_id: input.categoryId,
            month: input.month,
            amount: input.amount,
          },
          { onConflict: "user_id,category_id,month" }
        )
        .select(`
          *,
          expense_categories(id, name, icon, is_default)
        `)
        .single();

      if (error) throw error;
      const row = mapBudget(data);
      const idx = this.items.findIndex((b) => b.categoryId === input.categoryId && b.month === input.month);
      if (idx !== -1) {
        this.items[idx] = row;
      } else {
        this.items.push(row);
      }
      return row;
    },

    async remove(id: string) {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
      this.items = this.items.filter((b) => b.id !== id);
    },
  },
});

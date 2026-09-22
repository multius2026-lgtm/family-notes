import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { IncomeSource, ExpenseCategory, PeriodType } from "@/types";

export const useMasterDataStore = defineStore("masterData", {
  state: () => ({
    incomeSources: [] as IncomeSource[],
    expenseCategories: [] as ExpenseCategory[],
  }),

  actions: {
    async fetchAll() {
      const [{ data: sources }, { data: categories }] = await Promise.all([
        supabase
          .from("income_sources")
          .select("id, name, icon, default_period_type, is_default")
          .order("is_default", { ascending: false })
          .order("name"),
        supabase
          .from("expense_categories")
          .select("id, name, icon, is_default")
          .order("is_default", { ascending: false })
          .order("name"),
      ]);

      this.incomeSources = (sources ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        defaultPeriodType: s.default_period_type as PeriodType,
        isDefault: s.is_default,
      }));

      this.expenseCategories = (categories ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        isDefault: c.is_default,
      }));
    },

    async addIncomeSource(name: string, defaultPeriodType: PeriodType = "daily") {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const { data, error } = await supabase
        .from("income_sources")
        .insert({ user_id: user.id, name, default_period_type: defaultPeriodType })
        .select("id, name, icon, default_period_type, is_default")
        .single();
      if (error) throw error;

      const row: IncomeSource = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        defaultPeriodType: data.default_period_type,
        isDefault: data.is_default,
      };
      this.incomeSources.push(row);
      return row;
    },

    async removeIncomeSource(id: string) {
      const { error } = await supabase.from("income_sources").delete().eq("id", id);
      if (error) throw error;
      this.incomeSources = this.incomeSources.filter((s) => s.id !== id);
    },

    async addExpenseCategory(name: string) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const { data, error } = await supabase
        .from("expense_categories")
        .insert({ user_id: user.id, name })
        .select("id, name, icon, is_default")
        .single();
      if (error) throw error;

      const row: ExpenseCategory = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        isDefault: data.is_default,
      };
      this.expenseCategories.push(row);
      return row;
    },

    async removeExpenseCategory(id: string) {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;
      this.expenseCategories = this.expenseCategories.filter((c) => c.id !== id);
    },
  },
});

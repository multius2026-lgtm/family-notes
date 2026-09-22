import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import type { IncomeSource, ExpenseCategory, PeriodType } from "@/types";

export const useMasterDataStore = defineStore("masterData", {
  state: () => ({
    incomeSources: [] as IncomeSource[],
    expenseCategories: [] as ExpenseCategory[],
  }),

  actions: {
    async fetchAll() {
      const { api } = useApi();
      const [sources, categories] = await Promise.all([
        api<IncomeSource[]>("/income-sources"),
        api<ExpenseCategory[]>("/expense-categories"),
      ]);
      this.incomeSources = sources;
      this.expenseCategories = categories;
    },

    async addIncomeSource(name: string, defaultPeriodType: PeriodType = "daily") {
      const { api } = useApi();
      const row = await api<IncomeSource>("/income-sources", { method: "POST", body: { name, defaultPeriodType } });
      this.incomeSources.push(row);
      return row;
    },

    async removeIncomeSource(id: string) {
      const { api } = useApi();
      await api(`/income-sources/${id}`, { method: "DELETE" });
      this.incomeSources = this.incomeSources.filter((s) => s.id !== id);
    },

    async addExpenseCategory(name: string) {
      const { api } = useApi();
      const row = await api<ExpenseCategory>("/expense-categories", { method: "POST", body: { name } });
      this.expenseCategories.push(row);
      return row;
    },

    async removeExpenseCategory(id: string) {
      const { api } = useApi();
      await api(`/expense-categories/${id}`, { method: "DELETE" });
      this.expenseCategories = this.expenseCategories.filter((c) => c.id !== id);
    },
  },
});

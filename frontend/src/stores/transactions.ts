import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
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

export const useTransactionsStore = defineStore("transactions", {
  state: () => ({
    items: [] as Transaction[],
    loading: false,
  }),

  actions: {
    async fetchList(params: { from?: string; to?: string; type?: TransactionType } = {}) {
      const { api } = useApi();
      this.loading = true;
      try {
        this.items = await api<Transaction[]>("/transactions", { query: params });
      } finally {
        this.loading = false;
      }
    },

    async create(input: NewTransactionInput) {
      const { api } = useApi();
      const row = await api<Transaction>("/transactions", { method: "POST", body: input });
      this.items.unshift(row);
      return row;
    },

    async update(id: string, input: Partial<NewTransactionInput>) {
      const { api } = useApi();
      const row = await api<Transaction>(`/transactions/${id}`, { method: "PUT", body: input });
      const idx = this.items.findIndex((t) => t.id === id);
      if (idx !== -1) this.items[idx] = row;
      return row;
    },

    async remove(id: string) {
      const { api } = useApi();
      await api(`/transactions/${id}`, { method: "DELETE" });
      this.items = this.items.filter((t) => t.id !== id);
    },
  },
});

import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { Debt, DebtType } from "@/types";

function mapDebt(row: any): Debt {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as DebtType,
    personName: row.person_name,
    amount: Number(row.amount),
    remainingAmount: Number(row.remaining_amount),
    dueDate: row.due_date,
    status: row.status as "unpaid" | "partial" | "paid",
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export const useDebtsStore = defineStore("debts", {
  state: () => ({
    items: [] as Debt[],
    loading: false,
  }),

  getters: {
    totalDebt: (state) => {
      // Total utang kita ke orang lain yang belum lunas
      return state.items
        .filter((d) => d.type === "debt" && d.status !== "paid")
        .reduce((sum, d) => sum + Number(d.remainingAmount), 0);
    },
    totalLoan: (state) => {
      // Total piutang orang lain ke kita yang belum dibayar
      return state.items
        .filter((d) => d.type === "loan" && d.status !== "paid")
        .reduce((sum, d) => sum + Number(d.remainingAmount), 0);
    },
  },

  actions: {
    async fetchList() {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("debts")
          .select("*")
          .order("status", { ascending: false }) // unpaid/partial first
          .order("created_at", { ascending: false });

        if (error) throw error;
        this.items = (data || []).map(mapDebt);
      } finally {
        this.loading = false;
      }
    },

    async create(input: {
      type: DebtType;
      personName: string;
      amount: number;
      remainingAmount?: number;
      dueDate?: string | null;
      notes?: string | null;
    }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const rem = input.remainingAmount !== undefined ? input.remainingAmount : input.amount;

      const { data, error } = await supabase
        .from("debts")
        .insert({
          user_id: user.id,
          type: input.type,
          person_name: input.personName,
          amount: input.amount,
          remaining_amount: rem,
          due_date: input.dueDate || null,
          status: rem <= 0 ? "paid" : rem < input.amount ? "partial" : "unpaid",
          notes: input.notes || null,
        })
        .select("*")
        .single();

      if (error) throw error;
      const row = mapDebt(data);
      this.items.unshift(row);
      return row;
    },

    async payInstallment(id: string, paymentAmount: number) {
      const item = this.items.find((d) => d.id === id);
      if (!item) return;

      const newRemaining = Math.max(0, item.remainingAmount - paymentAmount);
      const newStatus = newRemaining <= 0 ? "paid" : "partial";

      const { data, error } = await supabase
        .from("debts")
        .update({
          remaining_amount: newRemaining,
          status: newStatus,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      const row = mapDebt(data);
      const idx = this.items.findIndex((d) => d.id === id);
      if (idx !== -1) this.items[idx] = row;
      return row;
    },

    async remove(id: string) {
      const { error } = await supabase.from("debts").delete().eq("id", id);
      if (error) throw error;
      this.items = this.items.filter((d) => d.id !== id);
    },
  },
});

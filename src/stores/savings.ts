import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { SavingsGoal } from "@/types";

function mapGoal(row: any): SavingsGoal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: row.deadline,
    icon: row.icon || "🎯",
    color: row.color || "#6366f1",
    isCompleted: Boolean(row.is_completed),
    createdAt: row.created_at,
  };
}

export const useSavingsStore = defineStore("savings", {
  state: () => ({
    items: [] as SavingsGoal[],
    loading: false,
  }),

  actions: {
    async fetchList() {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("savings_goals")
          .select("*")
          .order("is_completed", { ascending: true })
          .order("created_at", { ascending: false });

        if (error) throw error;
        this.items = (data || []).map(mapGoal);
      } finally {
        this.loading = false;
      }
    },

    async create(input: {
      name: string;
      targetAmount: number;
      currentAmount?: number;
      deadline?: string | null;
      icon?: string;
      color?: string;
    }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const { data, error } = await supabase
        .from("savings_goals")
        .insert({
          user_id: user.id,
          name: input.name,
          target_amount: input.targetAmount,
          current_amount: input.currentAmount || 0,
          deadline: input.deadline || null,
          icon: input.icon || "🎯",
          color: input.color || "#6366f1",
          is_completed: (input.currentAmount || 0) >= input.targetAmount,
        })
        .select("*")
        .single();

      if (error) throw error;
      const row = mapGoal(data);
      this.items.unshift(row);
      return row;
    },

    async addContribution(id: string, amount: number) {
      const item = this.items.find((g) => g.id === id);
      if (!item) return;

      const newCurrent = item.currentAmount + amount;
      const isCompleted = newCurrent >= item.targetAmount;

      const { data, error } = await supabase
        .from("savings_goals")
        .update({
          current_amount: newCurrent,
          is_completed: isCompleted,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      const row = mapGoal(data);
      const idx = this.items.findIndex((g) => g.id === id);
      if (idx !== -1) this.items[idx] = row;
      return row;
    },

    async update(id: string, updates: Partial<{
      name: string;
      targetAmount: number;
      currentAmount: number;
      deadline: string | null;
      icon: string;
      color: string;
      isCompleted: boolean;
    }>) {
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
      if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount;
      if (updates.deadline !== undefined) updateData.deadline = updates.deadline;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;

      const { data, error } = await supabase
        .from("savings_goals")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      const row = mapGoal(data);
      const idx = this.items.findIndex((g) => g.id === id);
      if (idx !== -1) this.items[idx] = row;
      return row;
    },

    async remove(id: string) {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id);
      if (error) throw error;
      this.items = this.items.filter((g) => g.id !== id);
    },
  },
});

import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { Wallet, WalletType } from "@/types";

function mapWallet(row: any): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type as WalletType,
    balance: Number(row.balance),
    currency: row.currency || "IDR",
    icon: row.icon || "💵",
    color: row.color || "#10b981",
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

export const useWalletsStore = defineStore("wallets", {
  state: () => ({
    items: [] as Wallet[],
    loading: false,
  }),

  getters: {
    totalBalance: (state) => {
      return state.items.reduce((sum, w) => sum + Number(w.balance), 0);
    },
    defaultWallet: (state) => {
      return state.items.find((w) => w.isDefault) || state.items[0] || null;
    },
  },

  actions: {
    async fetchList() {
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("*")
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true });

        if (error) throw error;
        this.items = (data || []).map(mapWallet);
      } finally {
        this.loading = false;
      }
    },

    async create(input: {
      name: string;
      type: WalletType;
      balance: number;
      icon?: string;
      color?: string;
      isDefault?: boolean;
    }) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      if (input.isDefault) {
        // Reset default wallet lama jika ini jadi default
        await supabase.from("wallets").update({ is_default: false }).eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .from("wallets")
        .insert({
          user_id: user.id,
          name: input.name,
          type: input.type,
          balance: input.balance || 0,
          icon: input.icon || "💵",
          color: input.color || "#10b981",
          is_default: Boolean(input.isDefault),
        })
        .select("*")
        .single();

      if (error) throw error;
      const row = mapWallet(data);
      this.items.push(row);
      return row;
    },

    async update(id: string, input: Partial<{
      name: string;
      type: WalletType;
      balance: number;
      icon: string;
      color: string;
      isDefault: boolean;
    }>) {
      const { data: { user } } = await supabase.auth.getUser();
      if (input.isDefault && user) {
        await supabase.from("wallets").update({ is_default: false }).eq("user_id", user.id);
      }

      const updates: Record<string, any> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.type !== undefined) updates.type = input.type;
      if (input.balance !== undefined) updates.balance = input.balance;
      if (input.icon !== undefined) updates.icon = input.icon;
      if (input.color !== undefined) updates.color = input.color;
      if (input.isDefault !== undefined) updates.is_default = input.isDefault;

      const { data, error } = await supabase
        .from("wallets")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      const row = mapWallet(data);
      const idx = this.items.findIndex((w) => w.id === id);
      if (idx !== -1) this.items[idx] = row;
      return row;
    },

    async remove(id: string) {
      const { error } = await supabase.from("wallets").delete().eq("id", id);
      if (error) throw error;
      this.items = this.items.filter((w) => w.id !== id);
    },

    async adjustBalance(walletId: string, amountDiff: number) {
      const wallet = this.items.find((w) => w.id === walletId);
      if (!wallet) return;
      const newBal = Number(wallet.balance) + amountDiff;
      await this.update(walletId, { balance: newBal });
    },
  },
});

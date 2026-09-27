import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { Transaction, PeriodType, TransactionType, ReceiptItem } from "@/types";
import { useWalletsStore } from "./wallets";

interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  periodType: PeriodType;
  incomeSourceId?: string | null;
  expenseCategoryId?: string | null;
  note?: string | null;
  occurredAt: string;
  receiptUrl?: string | null;
  isOcr?: boolean;
  receiptItems?: ReceiptItem[] | null;
  walletId?: string | null;
  transferToWalletId?: string | null;
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
    receiptUrl: row.receipt_url ?? null,
    isOcr: Boolean(row.is_ocr),
    receiptItems: row.receipt_items ?? null,
    walletId: row.wallet_id ?? null,
    transferToWalletId: row.transfer_to_wallet_id ?? null,
    incomeSource: row.income_sources
      ? { id: row.income_sources.id, name: row.income_sources.name, icon: row.income_sources.icon, defaultPeriodType: row.income_sources.default_period_type, isDefault: row.income_sources.is_default }
      : null,
    expenseCategory: row.expense_categories
      ? { id: row.expense_categories.id, name: row.expense_categories.name, icon: row.expense_categories.icon, isDefault: row.expense_categories.is_default }
      : null,
    wallet: row.wallets
      ? {
          id: row.wallets.id,
          userId: row.wallets.user_id,
          name: row.wallets.name,
          type: row.wallets.type,
          balance: Number(row.wallets.balance),
          currency: row.wallets.currency,
          icon: row.wallets.icon,
          color: row.wallets.color,
          isDefault: row.wallets.is_default,
          createdAt: row.wallets.created_at,
        }
      : null,
    transferToWallet: row.transfer_to_wallet
      ? {
          id: row.transfer_to_wallet.id,
          userId: row.transfer_to_wallet.user_id,
          name: row.transfer_to_wallet.name,
          type: row.transfer_to_wallet.type,
          balance: Number(row.transfer_to_wallet.balance),
          currency: row.transfer_to_wallet.currency,
          icon: row.transfer_to_wallet.icon,
          color: row.transfer_to_wallet.color,
          isDefault: row.transfer_to_wallet.is_default,
          createdAt: row.transfer_to_wallet.created_at,
        }
      : null,
  };
}

const SELECT_QUERY = `
  *,
  income_sources(id, name, icon, default_period_type, is_default),
  expense_categories(id, name, icon, is_default),
  wallets:wallet_id(id, user_id, name, type, balance, currency, icon, color, is_default, created_at),
  transfer_to_wallet:transfer_to_wallet_id(id, user_id, name, type, balance, currency, icon, color, is_default, created_at)
`;

export const useTransactionsStore = defineStore("transactions", {
  state: () => ({
    items: [] as Transaction[],
    loading: false,
  }),

  actions: {
    async fetchList(params: { from?: string; to?: string; type?: TransactionType; search?: string; walletId?: string } = {}) {
      this.loading = true;
      try {
        let query = supabase
          .from("transactions")
          .select(SELECT_QUERY)
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false });

        if (params.from) query = query.gte("occurred_at", params.from);
        if (params.to) query = query.lte("occurred_at", params.to);
        if (params.type) query = query.eq("type", params.type);
        if (params.walletId) query = query.or(`wallet_id.eq.${params.walletId},transfer_to_wallet_id.eq.${params.walletId}`);
        if (params.search && params.search.trim()) {
          query = query.ilike("note", `%${params.search.trim()}%`);
        }

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
          income_source_id: input.type === "income" ? (input.incomeSourceId ?? null) : null,
          expense_category_id: input.type === "expense" ? (input.expenseCategoryId ?? null) : null,
          note: input.note ?? null,
          occurred_at: input.occurredAt,
          receipt_url: input.receiptUrl ?? null,
          is_ocr: Boolean(input.isOcr),
          receipt_items: input.receiptItems ?? null,
          wallet_id: input.walletId ?? null,
          transfer_to_wallet_id: input.type === "transfer" ? (input.transferToWalletId ?? null) : null,
        })
        .select(SELECT_QUERY)
        .single();

      if (error) throw error;

      // Update saldo dompet otomatis
      const walletsStore = useWalletsStore();
      if (input.walletId) {
        if (input.type === "income") {
          await walletsStore.adjustBalance(input.walletId, input.amount);
        } else if (input.type === "expense") {
          await walletsStore.adjustBalance(input.walletId, -input.amount);
        } else if (input.type === "transfer") {
          await walletsStore.adjustBalance(input.walletId, -input.amount);
          if (input.transferToWalletId) {
            await walletsStore.adjustBalance(input.transferToWalletId, input.amount);
          }
        }
      }

      const row = mapRow(data);
      this.items.unshift(row);
      return row;
    },

    async update(id: string, input: Partial<NewTransactionInput>) {
      const oldTx = this.items.find((t) => t.id === id);

      const updates: Record<string, any> = {};
      if (input.type !== undefined) updates.type = input.type;
      if (input.amount !== undefined) updates.amount = input.amount;
      if (input.periodType !== undefined) updates.period_type = input.periodType;
      if (input.incomeSourceId !== undefined) updates.income_source_id = input.incomeSourceId;
      if (input.expenseCategoryId !== undefined) updates.expense_category_id = input.expenseCategoryId;
      if (input.note !== undefined) updates.note = input.note;
      if (input.occurredAt !== undefined) updates.occurred_at = input.occurredAt;
      if (input.receiptUrl !== undefined) updates.receipt_url = input.receiptUrl;
      if (input.isOcr !== undefined) updates.is_ocr = input.isOcr;
      if (input.receiptItems !== undefined) updates.receipt_items = input.receiptItems;
      if (input.walletId !== undefined) updates.wallet_id = input.walletId;
      if (input.transferToWalletId !== undefined) updates.transfer_to_wallet_id = input.transferToWalletId;

      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select(SELECT_QUERY)
        .single();

      if (error) throw error;

      // Re-fetch wallets jika ada perubahan amount/wallet
      const walletsStore = useWalletsStore();
      await walletsStore.fetchList();

      const row = mapRow(data);
      const idx = this.items.findIndex((t) => t.id === id);
      if (idx !== -1) this.items[idx] = row;
      return row;
    },

    async remove(id: string) {
      const tx = this.items.find((t) => t.id === id);
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;

      // Rollback saldo dompet
      if (tx && tx.walletId) {
        const walletsStore = useWalletsStore();
        const amt = Number(tx.amount);
        if (tx.type === "income") {
          await walletsStore.adjustBalance(tx.walletId, -amt);
        } else if (tx.type === "expense") {
          await walletsStore.adjustBalance(tx.walletId, amt);
        } else if (tx.type === "transfer") {
          await walletsStore.adjustBalance(tx.walletId, amt);
          if (tx.transferToWalletId) {
            await walletsStore.adjustBalance(tx.transferToWalletId, -amt);
          }
        }
      }

      this.items = this.items.filter((t) => t.id !== id);
    },
  },
});

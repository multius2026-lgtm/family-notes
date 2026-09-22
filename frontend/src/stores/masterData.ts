import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { IncomeSource, ExpenseCategory, PeriodType } from "@/types";

export const useMasterDataStore = defineStore("masterData", {
  state: () => ({
    incomeSources: [] as IncomeSource[],
    expenseCategories: [] as ExpenseCategory[],
    loading: false,
  }),

  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: sources }, { data: categories }] = await Promise.all([
          supabase
            .from("income_sources")
            .select("id, name, icon, default_period_type, is_default, user_id")
            .order("created_at", { ascending: true }),
          supabase
            .from("expense_categories")
            .select("id, name, icon, is_default, user_id")
            .order("created_at", { ascending: true }),
        ]);

        let finalSources = sources ?? [];
        let finalCategories = categories ?? [];

        // Jika user baru belum punya data sumber pemasukan, auto-buatkan data awal
        if (finalSources.length === 0) {
          const defaultSources = [
            { user_id: user.id, name: "Gaji Utama", icon: "briefcase", default_period_type: "monthly", is_default: false },
            { user_id: user.id, name: "Gojek / Grab", icon: "scooter", default_period_type: "daily", is_default: false },
            { user_id: user.id, name: "Freelance", icon: "laptop", default_period_type: "weekly", is_default: false },
            { user_id: user.id, name: "Jualan / Dagang", icon: "store", default_period_type: "daily", is_default: false },
            { user_id: user.id, name: "Lainnya", icon: "dots", default_period_type: "daily", is_default: false },
          ];
          const { data: seededSources } = await supabase
            .from("income_sources")
            .insert(defaultSources)
            .select("id, name, icon, default_period_type, is_default, user_id");
          if (seededSources) finalSources = seededSources;
        }

        // Jika user baru belum punya kategori pengeluaran, auto-buatkan data awal
        if (finalCategories.length === 0) {
          const defaultCats = [
            { user_id: user.id, name: "Makan & Minum", icon: "food", is_default: false },
            { user_id: user.id, name: "Bensin & Transport", icon: "fuel", is_default: false },
            { user_id: user.id, name: "Belanja Harian", icon: "cart", is_default: false },
            { user_id: user.id, name: "Tagihan & Listrik", icon: "bolt", is_default: false },
            { user_id: user.id, name: "Servis Kendaraan", icon: "wrench", is_default: false },
            { user_id: user.id, name: "Lainnya", icon: "dots", is_default: false },
          ];
          const { data: seededCats } = await supabase
            .from("expense_categories")
            .insert(defaultCats)
            .select("id, name, icon, is_default, user_id");
          if (seededCats) finalCategories = seededCats;
        }

        this.incomeSources = finalSources.map((s: any) => ({
          id: s.id,
          name: s.name,
          icon: s.icon,
          defaultPeriodType: s.default_period_type as PeriodType,
          isDefault: s.is_default,
        }));

        this.expenseCategories = finalCategories.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          isDefault: c.is_default,
        }));
      } finally {
        this.loading = false;
      }
    },

    async addIncomeSource(name: string, defaultPeriodType: PeriodType = "daily") {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Tidak terautentikasi");

      const { data, error } = await supabase
        .from("income_sources")
        .insert({ user_id: user.id, name, default_period_type: defaultPeriodType, is_default: false })
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

    async updateIncomeSource(id: string, payload: { name: string; defaultPeriodType?: PeriodType }) {
      const updates: any = { name: payload.name.trim() };
      if (payload.defaultPeriodType) updates.default_period_type = payload.defaultPeriodType;

      const { error } = await supabase
        .from("income_sources")
        .update(updates)
        .eq("id", id);
      if (error) throw error;

      const item = this.incomeSources.find((s) => s.id === id);
      if (item) {
        item.name = payload.name.trim();
        if (payload.defaultPeriodType) item.defaultPeriodType = payload.defaultPeriodType;
      }
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
        .insert({ user_id: user.id, name, is_default: false })
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

    async updateExpenseCategory(id: string, payload: { name: string }) {
      const { error } = await supabase
        .from("expense_categories")
        .update({ name: payload.name.trim() })
        .eq("id", id);
      if (error) throw error;

      const item = this.expenseCategories.find((c) => c.id === id);
      if (item) {
        item.name = payload.name.trim();
      }
    },

    async removeExpenseCategory(id: string) {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;
      this.expenseCategories = this.expenseCategories.filter((c) => c.id !== id);
    },
  },
});

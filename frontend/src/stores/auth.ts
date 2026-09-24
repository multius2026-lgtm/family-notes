import { defineStore } from "pinia";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  session: any | null;
  isInitialized: boolean;
}

let initPromise: Promise<void> | null = null;

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    session: null,
    isInitialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.session,
  },

  actions: {
    async init() {
      if (this.isInitialized) return;
      if (initPromise) return initPromise;

      initPromise = (async () => {
        try {
          // Cek session yang tersimpan saat startup
          const { data } = await supabase.auth.getSession();
          this.session = data.session;
          if (data.session?.user) {
            await this._loadUserProfile(data.session.user.id);
          }

          // Dengarkan perubahan auth state
          supabase.auth.onAuthStateChange(async (_event, session) => {
            this.session = session;
            if (session?.user) {
              await this._loadUserProfile(session.user.id);
            } else {
              this.user = null;
            }
          });
        } finally {
          this.isInitialized = true;
          initPromise = null;
        }
      })();

      return initPromise;
    },

    async _loadUserProfile(userId: string) {
      const { data } = await supabase
        .from("users")
        .select("id, name, email, weekly_target")
        .eq("id", userId)
        .single();

      if (data) {
        this.user = {
          id: data.id,
          name: data.name,
          email: data.email,
          weeklyTarget: data.weekly_target,
        };
      }
    },

    async register(payload: { name: string; email: string; password: string }) {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: { name: payload.name },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Gagal membuat akun");

      // Simpan profil user ke tabel users
      await supabase.from("users").upsert({
        id: data.user.id,
        email: payload.email,
        name: payload.name,
        password_hash: "supabase_auth", // placeholder — auth dihandle Supabase
      });

      // Seed default income sources & expense categories
      await this._seedDefaults(data.user.id);

      this.session = data.session;
      if (data.user) await this._loadUserProfile(data.user.id);
    },

    async _seedDefaults(userId: string) {
      await supabase.from("income_sources").insert([
        { user_id: userId, name: "Gojek", icon: "scooter", default_period_type: "daily", is_default: true },
        { user_id: userId, name: "Grab", icon: "scooter", default_period_type: "daily", is_default: true },
        { user_id: userId, name: "Freelance", icon: "briefcase", default_period_type: "weekly", is_default: true },
        { user_id: userId, name: "Lainnya", icon: "dots", default_period_type: "daily", is_default: true },
      ]);
      await supabase.from("expense_categories").insert([
        { user_id: userId, name: "Bensin", icon: "fuel", is_default: true },
        { user_id: userId, name: "Makan", icon: "food", is_default: true },
        { user_id: userId, name: "Servis", icon: "wrench", is_default: true },
        { user_id: userId, name: "Lainnya", icon: "dots", is_default: true },
      ]);
    },

    async login(payload: { email: string; password: string }) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });
      if (error) throw error;
      this.session = data.session;
      if (data.user) await this._loadUserProfile(data.user.id);
    },

    async logout() {
      await supabase.auth.signOut();
      this.user = null;
      this.session = null;
    },

    async updateProfile(payload: { name?: string; weeklyTarget?: number | null }) {
      if (!this.session?.user?.id) throw new Error("Tidak ada sesi aktif");

      const updates: Record<string, any> = {};
      if (payload.name !== undefined) updates.name = payload.name;
      if (payload.weeklyTarget !== undefined) updates.weekly_target = payload.weeklyTarget;

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", this.session.user.id);
      if (error) throw error;

      // Update juga di auth metadata
      if (payload.name) {
        await supabase.auth.updateUser({ data: { name: payload.name } });
      }

      await this._loadUserProfile(this.session.user.id);
    },
  },
});

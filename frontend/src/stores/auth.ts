import { defineStore } from "pinia";
import { ofetch } from "ofetch";
import type { User } from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: JSON.parse(localStorage.getItem("ch_user") || "null"),
    accessToken: localStorage.getItem("ch_access_token"),
    refreshToken: localStorage.getItem("ch_refresh_token"),
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    setTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem("ch_access_token", accessToken);
      localStorage.setItem("ch_refresh_token", refreshToken);
    },
    setUser(user: User) {
      this.user = user;
      localStorage.setItem("ch_user", JSON.stringify(user));
    },

    async register(payload: { name: string; email: string; password: string }) {
      const res = await ofetch<{ user: User; accessToken: string; refreshToken: string }>("/auth/register", {
        baseURL: BASE_URL,
        method: "POST",
        body: payload,
      });
      this.setUser(res.user);
      this.setTokens(res.accessToken, res.refreshToken);
    },

    async login(payload: { email: string; password: string }) {
      const res = await ofetch<{ user: User; accessToken: string; refreshToken: string }>("/auth/login", {
        baseURL: BASE_URL,
        method: "POST",
        body: payload,
      });
      this.setUser(res.user);
      this.setTokens(res.accessToken, res.refreshToken);
    },

    async logout() {
      if (this.refreshToken) {
        try {
          await ofetch("/auth/logout", { baseURL: BASE_URL, method: "POST", body: { refreshToken: this.refreshToken } });
        } catch {
          // abaikan — tetap bersihkan sesi lokal walau request logout gagal
        }
      }
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem("ch_user");
      localStorage.removeItem("ch_access_token");
      localStorage.removeItem("ch_refresh_token");
    },
  },
});

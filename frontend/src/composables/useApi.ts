import { ofetch } from "ofetch";
import { useAuthStore } from "@/stores/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export function useApi() {
  const auth = useAuthStore();

  const api = ofetch.create({
    baseURL: BASE_URL,
    async onRequest({ options }) {
      const token = auth.session?.access_token;
      if (token) {
        options.headers = new Headers(options.headers);
        options.headers.set("Authorization", `Bearer ${token}`);
      }
    },
  });

  return { api };
}


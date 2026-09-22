import { ofetch } from "ofetch";
import { useAuthStore } from "@/stores/auth";

// Base URL: di dev, vite.config.ts proxy /api -> http://localhost:3000.
// Di production, arahkan VITE_API_BASE_URL ke domain backend kamu.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const auth = useAuthStore();
  if (!auth.refreshToken) return null;

  try {
    const res = await ofetch<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      baseURL: BASE_URL,
      method: "POST",
      body: { refreshToken: auth.refreshToken },
    });
    auth.setTokens(res.accessToken, res.refreshToken);
    return res.accessToken;
  } catch {
    auth.logout();
    return null;
  }
}

export function useApi() {
  const auth = useAuthStore();

  const api = ofetch.create({
    baseURL: BASE_URL,
    async onRequest({ options }) {
      if (auth.accessToken) {
        options.headers = new Headers(options.headers);
        options.headers.set("Authorization", `Bearer ${auth.accessToken}`);
      }
    },
    async onResponseError({ request, options, response }) {
      // Access token kedaluwarsa -> coba refresh sekali, lalu ulangi request asli.
      if (response.status === 401 && auth.refreshToken) {
        refreshPromise = refreshPromise || doRefresh();
        const newToken = await refreshPromise;
        refreshPromise = null;

        if (newToken) {
          const headers = new Headers(options.headers);
          headers.set("Authorization", `Bearer ${newToken}`);
          await ofetch(request, { ...options, headers, baseURL: BASE_URL });
        }
      }
    },
  });

  return { api };
}

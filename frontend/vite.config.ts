import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  // "/" untuk custom domain, "/family-notes/" untuk GitHub Pages default URL
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Family Notes — Keuangan Keluarga",
        short_name: "FamilyNotes",
        description: "Pencatat pemasukan & pengeluaran harian untuk keluarga",
        theme_color: "#12201b",
        background_color: "#12201b",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /supabase\.co\/rest/,
            handler: "NetworkFirst",
            options: { cacheName: "supabase-cache", expiration: { maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 3636,
  },
});

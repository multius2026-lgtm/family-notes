import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Catatan Harian — Finance Tracker",
        short_name: "CatatanHarian",
        description: "Pencatat pemasukan & pengeluaran harian untuk pekerja lepas",
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
            urlPattern: /\/api\/summary/,
            handler: "NetworkFirst",
            options: { cacheName: "summary-cache", expiration: { maxAgeSeconds: 3600 } },
          },
          {
            urlPattern: /\/api\/transactions/,
            handler: "NetworkFirst",
            options: { cacheName: "transactions-cache", expiration: { maxAgeSeconds: 3600 } },
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
    proxy: {
      // saat dev, request ke /api/* diteruskan ke backend Elysia di :3000
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});

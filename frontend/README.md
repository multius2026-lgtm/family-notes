# Catatan Harian — Frontend

PWA mobile-first untuk mencatat pemasukan & pengeluaran harian, dibangun
dengan Vue 3 (Composition API + `<script setup>`), TypeScript, Pinia,
Tailwind CSS, dan Chart.js.

## Menjalankan secara lokal

Pastikan backend sudah jalan dulu (lihat `../backend/README.md`).

```bash
bun install       # atau npm install / pnpm install
bun run dev       # jalan di http://localhost:5173
```

Saat development, request ke `/api/*` otomatis diteruskan ke backend
`http://localhost:3000` lewat proxy di `vite.config.ts`.

Build production:

```bash
bun run build     # hasil di dist/
bun run preview   # cek hasil build secara lokal
```

## Fitur yang sudah diimplementasikan (MVP)

- Register/login dengan email + password (JWT, auto-refresh token)
- Tambah pemasukan (pilih sumber) & pengeluaran (pilih kategori)
- **Periode pemasukan (harian/mingguan/bulanan)** — lihat `TransactionForm.vue`.
  Ini penting untuk gig worker: pemasukan yang diterima mingguan/bulanan
  ditandai apa adanya, lalu backend menormalisasinya jadi "setara harian"
  untuk perhitungan rata-rata di dashboard, supaya tidak menyesatkan.
- Riwayat transaksi dengan filter periode (7/30 hari/semua) & tipe
- Edit & hapus transaksi
- Dashboard: total hari ini, rata-rata 7 hari, grafik tren 14 hari, alert
  kalau pengeluaran mingguan melebihi pemasukan, progress vs target mingguan
- Pengaturan: profil, target mingguan, kelola sumber pemasukan (dengan
  periode default per sumber) & kategori pengeluaran custom
- PWA installable (manifest + service worker basic caching via
  `vite-plugin-pwa`)
- Mobile-first, aman untuk notch/safe-area, bottom navigation ala aplikasi native

## Struktur

Lihat `src/views` untuk tiap halaman, `src/components` untuk komponen yang
dipakai ulang (chart, kartu metrik, form transaksi, dsb), `src/stores` untuk
state management Pinia, dan `src/composables/useApi.ts` untuk wrapper HTTP
dengan auto-refresh token.

## Belum diimplementasikan (lihat rencana Fase 2/3)

- Mode offline penuh (queue transaksi saat tidak ada koneksi)
- Export laporan PDF/Excel
- Notifikasi push
- Perbandingan anonim antar pengguna

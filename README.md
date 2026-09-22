# Catatan Harian — Pencatat Keuangan Harian untuk Gig Worker

Aplikasi web mobile (PWA) untuk mencatat pemasukan & pengeluaran harian bagi
driver ojol, freelancer, dan pedagang kecil dengan penghasilan tidak tetap —
termasuk yang penghasilannya campuran **harian, mingguan, dan bulanan**.

Proyek ini terdiri dari dua bagian, masing-masing punya README sendiri:

- **`backend/`** — API Bun.js + Elysia + Drizzle ORM + PostgreSQL
- **`frontend/`** — PWA Vue 3 + TypeScript + Pinia + Tailwind CSS + Chart.js

## Kenapa ada dukungan periode harian/mingguan/bulanan?

Gig worker jarang punya pola pemasukan yang seragam:
- Driver ojol biasanya dapat pemasukan **harian**.
- Proyek freelance sering dibayar **mingguan** sekali jadi.
- Sebagian punya pemasukan tambahan **bulanan** (retainer, gaji paruh waktu).

Kalau semua nilai transaksi dianggap "pemasukan hari itu", pemasukan bulanan
3 juta akan terlihat seperti lonjakan raksasa di satu hari, membuat rata-rata
harian menyesatkan. Karena itu setiap transaksi pemasukan punya field
`periodType` (`daily` / `weekly` / `monthly`):

- Nilai transaksi tetap dicatat apa adanya (uang yang benar-benar diterima
  pada tanggal itu) — dipakai untuk laporan "berapa yang masuk hari ini".
- Untuk perhitungan rata-rata & tren, nilai mingguan dibagi 7 dan nilai
  bulanan dibagi 30 terlebih dahulu ("setara harian") — dipakai untuk
  "berapa perkiraan pemasukan rata-rata per hari".

Lihat `backend/src/utils/period.ts` untuk implementasinya, dan
`frontend/src/components/transactions/TransactionForm.vue` untuk UI
pemilihan periode saat menambah transaksi.

## Menjalankan proyek secara lokal

```bash
# Terminal 1 — backend
cd backend
bun install
docker compose up -d        # Postgres lokal
cp .env.example .env        # lalu isi secret JWT
bun run db:generate && bun run db:migrate
bun run dev                 # http://localhost:3000

# Terminal 2 — frontend
cd frontend
bun install
bun run dev                 # http://localhost:5173
```

Buka `http://localhost:5173` di browser HP (atau mode responsive di
desktop) untuk mencoba tampilan mobile-first-nya.

## Status fitur vs rencana implementasi awal

| Fitur (MVP — Fase 1) | Status |
|---|---|
| Register/login email + password | ✅ |
| Input pemasukan (pilih sumber) | ✅ (+ periode harian/mingguan/bulanan) |
| Input pengeluaran (pilih kategori) | ✅ |
| Riwayat transaksi + filter | ✅ |
| Edit & hapus transaksi | ✅ |
| Dashboard: total hari ini, rata-rata 7 hari, tren | ✅ |
| Alert pengeluaran > pemasukan mingguan | ✅ |
| PWA installable | ✅ (manifest + service worker dasar) |
| Responsive mobile-first | ✅ |
| Donut chart breakdown kategori (Fase 2) | Endpoint backend sudah ada (`/summary/by-category`), komponen `CategoryDonutChart.vue` sudah ada — tinggal dipasang di view yang diinginkan |
| Export laporan PDF/Excel (Fase 2) | Belum |
| Notifikasi push (Fase 2) | Belum |
| Mode offline penuh (Fase 2) | Belum — service worker baru cache dasar, belum queue transaksi offline |
| Multi-currency, tier premium (Fase 2/3) | Belum |

## Catatan sebelum production

- Ganti `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` di `.env` backend dengan
  string acak yang panjang — jangan pakai nilai contoh.
- Tambahkan rate limiting di endpoint `/auth/login` (belum ada di scaffold ini).
- Siapkan ikon PWA sungguhan di `frontend/public/icons/` (lihat README di
  folder tersebut) sebelum build production.
- Kode ini belum pernah dijalankan/di-test end-to-end di lingkungan pembuat
  (sandbox tanpa akses jaringan) — jalankan `bun install` lalu ikuti langkah
  di atas, dan kabari kalau ada error supaya bisa langsung diperbaiki.

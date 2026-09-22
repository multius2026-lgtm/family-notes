# Catatan Harian — Backend

API untuk aplikasi pencatat keuangan harian gig worker. Dibangun dengan
Bun.js + Elysia + Drizzle ORM + PostgreSQL, sesuai rencana implementasi.

## Fitur inti

- Auth JWT (access + refresh token, rotasi & revoke saat logout)
- CRUD transaksi pemasukan & pengeluaran
- **Dukungan periode pemasukan**: setiap transaksi income punya `periodType`
  (`daily` / `weekly` / `monthly`) sehingga penghasilan harian (ojol harian),
  mingguan (setoran/proyek mingguan), dan bulanan (retainer/gaji paruh waktu)
  bisa dicatat apa adanya, tapi tetap dinormalisasi jadi "setara harian" saat
  dihitung rata-rata mingguan & tren — lihat `src/utils/period.ts`.
- Sumber pemasukan & kategori pengeluaran custom per user, dengan default
  periode per sumber (`defaultPeriodType`)
- Ringkasan harian, mingguan (dengan progress vs target), tren N hari, dan
  breakdown per kategori

## Menjalankan secara lokal

```bash
# 1. Install dependency
bun install

# 2. Siapkan database (pilih salah satu)
docker compose up -d          # Postgres lokal via Docker
# atau pakai Supabase/Neon dan isi DATABASE_URL di .env

# 3. Salin env
cp .env.example .env
# lalu edit .env: isi DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 4. Generate & jalankan migrasi
bun run db:generate
bun run db:migrate

# 5. Jalankan server (auto-reload saat development)
bun run dev
```

Server default jalan di `http://localhost:3000`. Cek `GET /health` untuk
memastikan API dan koneksi berjalan.

## Struktur folder

Lihat `src/modules/*` untuk tiap domain (auth, transactions, summary,
master-data, users) — masing-masing punya `*.routes.ts` (endpoint),
`*.service.ts` (logika bisnis & query database), dan `*.schema.ts`
(validasi Zod) bila relevan.

## Catatan keamanan

- Access token berumur pendek (default 15 menit, lihat `.env`).
- Refresh token disimpan HASH-nya saja di tabel `refresh_tokens`, dan
  dirotasi (revoke lama, terbitkan baru) setiap kali dipakai — mencegah
  token lama dipakai ulang kalau bocor.
- Tambahkan rate limiting di `/auth/login` sebelum production (belum
  disertakan di scaffold ini) untuk mencegah brute-force.

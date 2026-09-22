// ---------------------------------------------------------------------------
// Kenapa file ini ada:
// Gig worker tidak selalu dibayar harian. Seorang driver ojol biasanya
// setoran/pendapatan harian, tapi proyek freelance sering dibayar mingguan,
// dan sebagian punya penghasilan tambahan bulanan (retainer, gaji paruh
// waktu). Kalau semua nilai `amount` diperlakukan sebagai "pemasukan hari
// itu", maka pemasukan bulanan 3 juta akan terlihat seperti lonjakan
// pemasukan raksasa di satu hari lalu nol selama 29 hari — rata-rata harian
// jadi menyesatkan.
//
// Solusinya: setiap transaksi income punya `periodType` (daily/weekly/
// monthly) yang menyatakan periode apa yang direpresentasikan oleh nilai
// tersebut. Untuk kebutuhan analitik (rata-rata harian, tren, dsb) kita
// hitung "setara harian" (daily equivalent) dengan membagi rata:
//   - daily   -> amount / 1
//   - weekly  -> amount / 7
//   - monthly -> amount / 30
//
// Untuk laporan "total diterima" pada tanggal tertentu, nilai asli
// (non-dibagi) tetap dipakai — karena itu memang uang yang benar-benar
// diterima pada tanggal itu. Dua sudut pandang ini sengaja dipisah supaya
// user bisa lihat keduanya: "berapa yang masuk hari ini" vs "berapa
// perkiraan pemasukan rata-rata per hari".
// ---------------------------------------------------------------------------

export type PeriodType = "daily" | "weekly" | "monthly";

const DIVISOR: Record<PeriodType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export function dailyEquivalent(amount: number, periodType: PeriodType): number {
  return amount / DIVISOR[periodType];
}

export const PERIOD_LABEL: Record<PeriodType, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
};

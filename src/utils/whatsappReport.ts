import type { MonthlySummary, Transaction } from "@/types";

export interface WhatsAppReportOptions {
  userName?: string;
  monthLabel: string;
  summary: MonthlySummary;
  topExpenses?: Transaction[];
}

function formatRp(n: number | string): string {
  const num = Math.round(Number(n) || 0);
  const neg = num < 0;
  const abs = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-Rp " : "Rp ") + abs;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

/**
 * Format nomor HP WhatsApp standar internasional (contoh: 0812xxx -> 62812xxx)
 */
export function sanitizePhoneNumber(phone?: string): string {
  if (!phone) return "";
  let clean = phone.replace(/[^\d+]/g, "");
  if (clean.startsWith("+")) clean = clean.slice(1);
  if (clean.startsWith("0")) clean = "62" + clean.slice(1);
  return clean;
}

/**
 * Buat URL WhatsApp direct link (kompatibel mobile app & WA Web)
 */
export function buildWhatsAppUrl(messageText: string, phoneNumber?: string): string {
  const encoded = encodeURIComponent(messageText);
  const cleanPhone = sanitizePhoneNumber(phoneNumber);
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

/**
 * Buat laporan keuangan bulanan terperinci dalam format pesan WhatsApp yang rapi dan profesional
 */
export function generateDetailedWhatsAppReport(options: WhatsAppReportOptions): string {
  const { userName, monthLabel, summary, topExpenses = [] } = options;
  const isSurplus = summary.net >= 0;
  const savingsRate = summary.totalIncome > 0
    ? ((summary.net / summary.totalIncome) * 100).toFixed(1)
    : "0";
  const expenseRatio = summary.totalIncome > 0
    ? ((summary.totalExpense / summary.totalIncome) * 100).toFixed(1)
    : "0";

  const lines: string[] = [];

  lines.push(`📊 *LAPORAN KEUANGAN BULANAN*`);
  lines.push(`📅 *Periode:* ${monthLabel}`);
  if (userName) {
    lines.push(`👤 *Nama:* ${userName}`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);

  lines.push(`💰 *RINGKASAN EKSEKUTIF*`);
  lines.push(`• *Saldo Bersih:* ${isSurplus ? "🟢 +" : "🔴 "}${formatRp(summary.net)} (${isSurplus ? "Surplus" : "Defisit"})`);
  lines.push(`• *Total Pemasukan:* ${formatRp(summary.totalIncome)}`);
  lines.push(`• *Total Pengeluaran:* ${formatRp(summary.totalExpense)}`);
  lines.push(`• *Tingkat Tabungan (Savings Rate):* ${savingsRate}%`);
  lines.push(`• *Beban Pengeluaran:* ${expenseRatio}% dari pemasukan`);
  lines.push(`• *Rata-rata Pengeluaran/Hari:* ${formatRp(summary.avgDailyExpense)}`);
  lines.push(``);

  // Sumber Pemasukan
  if (summary.incomeBySource && summary.incomeBySource.length > 0) {
    lines.push(`📈 *SUMBER PEMASUKAN*`);
    summary.incomeBySource.forEach((src, idx) => {
      const pct = summary.totalIncome > 0 ? ((src.total / summary.totalIncome) * 100).toFixed(1) : "0";
      lines.push(`${idx + 1}. *${src.label}:* ${formatRp(src.total)} (${pct}%)`);
    });
    lines.push(``);
  }

  // Rincian Pengeluaran per Kategori
  if (summary.expenseByCategory && summary.expenseByCategory.length > 0) {
    lines.push(`🏷️ *RINCIAN PENGELUARAN PER KATEGORI*`);
    summary.expenseByCategory.forEach((cat, idx) => {
      const pct = summary.totalExpense > 0 ? ((cat.total / summary.totalExpense) * 100).toFixed(1) : "0";
      lines.push(`${idx + 1}. *${cat.label}:* ${formatRp(cat.total)} (${pct}%)`);
    });
    lines.push(``);
  }

  // Top 3-5 Pengeluaran Terbesar
  if (topExpenses.length > 0) {
    lines.push(`🔥 *PENGELUARAN TERBESAR BULAN INI*`);
    topExpenses.slice(0, 5).forEach((tx, idx) => {
      const catName = tx.expenseCategory?.name || tx.category || "Pengeluaran";
      const note = tx.note ? ` (${tx.note})` : "";
      const date = formatDate(tx.occurredAt);
      lines.push(`${idx + 1}. *${catName}${note}:* ${formatRp(tx.amount)} _[${date}]_`);
    });
    lines.push(``);
  }

  // Evaluasi & Rekomendasi Finansial
  lines.push(`💡 *EVALUASI FINANSIAL*`);
  if (summary.totalIncome === 0 && summary.totalExpense === 0) {
    lines.push(`Belum ada data transaksi tercatat untuk periode ini.`);
  } else if (!isSurplus) {
    lines.push(`⚠️ *Peringatan Defisit:* Pengeluaran bulan ini melebihi pemasukan sebesar ${formatRp(Math.abs(summary.net))}. Disarankan untuk meninjau kembali kategori pengeluaran terbesar di atas.`);
  } else if (Number(savingsRate) >= 30) {
    lines.push(`✨ *Kondisi Sangat Sehat!* Kamu berhasil menabung ${savingsRate}% dari total pemasukan bulan ini. Pertahankan kebiasaan finansial yang sangat baik ini.`);
  } else if (Number(savingsRate) >= 10) {
    lines.push(`👍 *Arus Kas Positif:* Saldo kamu surplus ${savingsRate}%. Pantau pengeluaran harian agar rasio tabungan bisa terus bertumbuh.`);
  } else {
    lines.push(`ℹ️ *Perhatian:* Saldo surplus tipis (${savingsRate}%). Sebagian besar penghasilan (${expenseRatio}%) terserap oleh pengeluaran.`);
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Catatan Harian Keuangan Pribadi_ 📱`);

  return lines.join("\n");
}

/**
 * Buat ringkasan ringkas (Quick Summary) untuk pesan WhatsApp yang cepat dan padat
 */
export function generateSimpleWhatsAppReport(options: WhatsAppReportOptions): string {
  const { userName, monthLabel, summary } = options;
  const isSurplus = summary.net >= 0;
  const savingsRate = summary.totalIncome > 0
    ? ((summary.net / summary.totalIncome) * 100).toFixed(0)
    : "0";

  const topCategory = summary.expenseByCategory?.[0];

  const lines: string[] = [
    `📊 *RINGKASAN KEUANGAN - ${monthLabel.toUpperCase()}*`,
    userName ? `👤 ${userName}` : "",
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Saldo Bersih:* ${isSurplus ? "+" : ""}${formatRp(summary.net)} (${isSurplus ? "Surplus 🟢" : "Defisit 🔴"})`,
    `🟢 *Pemasukan:* ${formatRp(summary.totalIncome)}`,
    `🔴 *Pengeluaran:* ${formatRp(summary.totalExpense)}`,
    `📈 *Rasio Tabungan:* ${savingsRate}%`,
    topCategory ? `🏷️ *Pengeluaran Terbanyak:* ${topCategory.label} (${formatRp(topCategory.total)})` : "",
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_Dikirim via Catatan Harian_`,
  ].filter(Boolean);

  return lines.join("\n");
}

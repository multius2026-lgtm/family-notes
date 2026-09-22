<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useSummaryStore } from "@/stores/summary";
import { useAuthStore } from "@/stores/auth";
import { useTransactionsStore } from "@/stores/transactions";
import { useCurrency } from "@/composables/useCurrency";
import CategoryDonutChart from "@/components/charts/CategoryDonutChart.vue";
import WhatsAppShareModal from "@/components/ui/WhatsAppShareModal.vue";
import { PERIOD_LABEL, type Transaction } from "@/types";
import { buildWhatsAppUrl, generateDetailedWhatsAppReport } from "@/utils/whatsappReport";

const summary = useSummaryStore();
const auth = useAuthStore();
const txStore = useTransactionsStore();
const { fmt } = useCurrency();

const now = new Date();
const selectedYear = ref(now.getFullYear());
const selectedMonth = ref(now.getMonth() + 1);

const showWhatsAppModal = ref(false);
const copySuccess = ref(false);
const monthlyTransactions = ref<Transaction[]>([]);
const loadingTx = ref(false);

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const monthLabel = computed(() => `${MONTHS[selectedMonth.value - 1]} ${selectedYear.value}`);
const data = computed(() => summary.monthly);
const loading = computed(() => summary.loadingMonthly);
const isNetSurplus = computed(() => (data.value?.net ?? 0) >= 0);

// Savings rate %
const savingsRate = computed(() => {
  if (!data.value || data.value.totalIncome <= 0) return 0;
  return Math.round((data.value.net / data.value.totalIncome) * 100);
});

// Expense ratio %
const expenseRatio = computed(() => {
  if (!data.value || data.value.totalIncome <= 0) return 0;
  return Math.min(100, Math.round((data.value.totalExpense / data.value.totalIncome) * 100));
});

const donutData = computed(() =>
  (data.value?.expenseByCategory ?? []).map((c) => ({ key: c.key, label: c.label, total: c.total }))
);

// Top 5 pengeluaran terbesar bulan ini
const topExpenses = computed(() => {
  return [...monthlyTransactions.value]
    .filter((t) => t.type === "expense")
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);
});

function prevMonth() {
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12;
    selectedYear.value--;
  } else {
    selectedMonth.value--;
  }
}

function nextMonth() {
  const n = new Date();
  if (selectedYear.value > n.getFullYear() || (selectedYear.value === n.getFullYear() && selectedMonth.value >= n.getMonth() + 1)) return;
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1;
    selectedYear.value++;
  } else {
    selectedMonth.value++;
  }
}

function goToCurrentMonth() {
  const n = new Date();
  selectedYear.value = n.getFullYear();
  selectedMonth.value = n.getMonth() + 1;
}

const isCurrentMonth = computed(() => {
  const n = new Date();
  return selectedYear.value === n.getFullYear() && selectedMonth.value === n.getMonth() + 1;
});

async function load() {
  summary.fetchMonthly(selectedYear.value, selectedMonth.value);

  // Ambil transaksi bulan bersangkutan untuk top expense detail
  const year = selectedYear.value;
  const month = selectedMonth.value;
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  loadingTx.value = true;
  try {
    const { useTransactionsStore } = await import("@/stores/transactions");
    const txStore = useTransactionsStore();
    await txStore.fetchList({ from, to });
    monthlyTransactions.value = txStore.items;
  } catch (err) {
    console.error("Gagal memuat transaksi laporan:", err);
    monthlyTransactions.value = [];
  } finally {
    loadingTx.value = false;
  }
}

function quickSendWhatsApp() {
  if (!data.value) return;
  const text = generateDetailedWhatsAppReport({
    userName: auth.user?.name,
    monthLabel: monthLabel.value,
    summary: data.value,
    topExpenses: topExpenses.value,
  });
  window.open(buildWhatsAppUrl(text), "_blank");
}

async function quickCopyReport() {
  if (!data.value) return;
  const text = generateDetailedWhatsAppReport({
    userName: auth.user?.name,
    monthLabel: monthLabel.value,
    summary: data.value,
    topExpenses: topExpenses.value,
  });

  try {
    await navigator.clipboard.writeText(text);
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2500);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2500);
  }
}

onMounted(load);
watch([selectedYear, selectedMonth], load);

const DONUT_COLORS = ["#2dbe7e", "#f8a730", "#f05a5a", "#6c63ff", "#00bcd4", "#ff6b6b", "#e91e63", "#ff9f43"];
</script>

<template>
  <div class="pb-28">
    <!-- Header -->
    <div
      class="px-5 pb-4 bg-surface border-b border-line sticky top-0 z-20"
      style="padding-top: calc(20px + env(safe-area-inset-top, 0px))"
    >
      <div class="flex items-center justify-between mb-3">
        <div>
          <h1 class="text-[20px] font-bold text-ink">Laporan Keuangan</h1>
          <p class="text-[12px] text-ink-muted">Analisis mendalam & rekapitulasi</p>
        </div>

        <!-- Tombol WhatsApp di Header -->
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
          style="background: #25D366;"
          title="Kirim ke WhatsApp"
          @click="showWhatsAppModal = true"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.787-3.119-2.73-3.214-2.857-.095-.128-.771-1.025-.771-1.954 0-.928.487-1.385.66-1.574.173-.189.378-.236.504-.236.126 0 .252.001.362.007.116.006.27-.044.423.323.16.38.544 1.325.592 1.422.048.096.08.209.016.335-.064.126-.096.205-.192.316-.096.112-.202.25-.288.336-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.332.734.655 1.353.858 1.545.954.192.096.305.08.417-.048.112-.128.481-.56.609-.752.128-.192.256-.16.433-.096.176.064 1.122.529 1.314.625.192.096.32.144.368.224.048.08.048.464-.096.869z"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.468-1.28l-.32-.2-2.956.776.789-2.883-.21-.334A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.522 0 8.2 3.679 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z"/>
          </svg>
          <span>Kirim WA</span>
        </button>
      </div>

      <!-- Month Selector Bar -->
      <div class="flex items-center justify-between bg-surface-2 rounded-2xl p-1.5 border border-line">
        <button
          class="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted hover:bg-surface hover:text-ink transition-all shadow-none hover:shadow-sm"
          title="Bulan sebelumnya"
          @click="prevMonth"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <div class="flex items-center gap-2">
          <span class="font-bold text-[14.5px] text-ink">{{ monthLabel }}</span>
          <span
            v-if="isCurrentMonth"
            class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20"
          >
            Bulan Ini
          </span>
          <button
            v-else
            class="text-[10.5px] font-semibold text-primary underline underline-offset-2 hover:opacity-80"
            @click="goToCurrentMonth"
          >
            Kembali
          </button>
        </div>

        <button
          class="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          :class="isCurrentMonth ? 'text-ink-light/40 cursor-not-allowed' : 'text-ink-muted hover:bg-surface hover:text-ink shadow-none hover:shadow-sm'"
          :disabled="isCurrentMonth"
          title="Bulan berikutnya"
          @click="nextMonth"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col justify-center items-center py-24 text-ink-muted">
      <svg class="animate-spin w-8 h-8 text-primary mb-3" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <p class="text-[13px] font-medium">Menganalisis data laporan...</p>
    </div>

    <template v-else-if="data">
      <div class="px-5 pt-4 space-y-4">
        <!-- Executive Hero Card -->
        <div class="hero-card relative overflow-hidden shadow-lg">
          <!-- Background decoration -->
          <div class="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/5 pointer-events-none blur-xl"></div>

          <div class="flex items-center justify-between mb-2">
            <span class="text-white/80 text-[12.5px] font-medium tracking-wide">
              Saldo Bersih (Net Cash Flow)
            </span>
            <span
              class="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md"
              :class="isNetSurplus ? 'bg-white/20 text-white' : 'bg-red-500/40 text-white'"
            >
              <span>{{ isNetSurplus ? '🟢' : '🔴' }}</span>
              {{ isNetSurplus ? 'Surplus' : 'Defisit' }}
            </span>
          </div>

          <h2 class="text-white text-[32px] font-black tracking-tight leading-tight mb-4">
            {{ isNetSurplus ? '+' : '' }}{{ fmt(data.net) }}
          </h2>

          <!-- Cashflow Progress Bar -->
          <div class="mb-4 bg-black/20 rounded-full p-1 backdrop-blur-sm">
            <div class="flex justify-between text-[11px] text-white/80 px-2 mb-1 font-medium">
              <span>Beban Pengeluaran</span>
              <span>{{ expenseRatio }}% dari pemasukan</span>
            </div>
            <div class="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="{
                  width: `${Math.min(100, expenseRatio)}%`,
                  background: expenseRatio > 90 ? '#f05a5a' : expenseRatio > 70 ? '#f8a730' : '#ffffff'
                }"
              ></div>
            </div>
          </div>

          <!-- 4 Mini Metrics Grid -->
          <div class="grid grid-cols-2 gap-2.5">
            <div class="metric-mini">
              <p class="text-white/70 text-[11px] font-medium mb-0.5 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-white"></span> Total Pemasukan
              </p>
              <p class="text-white font-bold text-[14.5px]">{{ fmt(data.totalIncome) }}</p>
            </div>
            <div class="metric-mini">
              <p class="text-white/70 text-[11px] font-medium mb-0.5 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-red-200"></span> Total Pengeluaran
              </p>
              <p class="text-white font-bold text-[14.5px]">{{ fmt(data.totalExpense) }}</p>
            </div>
            <div class="metric-mini">
              <p class="text-white/70 text-[11px] font-medium mb-0.5">Tingkat Tabungan</p>
              <p class="text-white font-bold text-[14.5px]">
                {{ savingsRate }}%
                <span class="text-[10px] font-normal text-white/70">tersimpan</span>
              </p>
            </div>
            <div class="metric-mini">
              <p class="text-white/70 text-[11px] font-medium mb-0.5">Rata-rata Keluar</p>
              <p class="text-white font-bold text-[14.5px]">{{ fmt(data.avgDailyExpense) }}<span class="text-[10px] font-normal text-white/70">/hari</span></p>
            </div>
          </div>
        </div>

        <!-- WhatsApp Action Banner -->
        <div class="card p-4 border border-[#25D366]/30 bg-gradient-to-r from-[#25D366]/5 via-surface to-surface">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-[#25D366]/15 flex items-center justify-center text-[#25D366] flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.787-3.119-2.73-3.214-2.857-.095-.128-.771-1.025-.771-1.954 0-.928.487-1.385.66-1.574.173-.189.378-.236.504-.236.126 0 .252.001.362.007.116.006.27-.044.423.323.16.38.544 1.325.592 1.422.048.096.08.209.016.335-.064.126-.096.205-.192.316-.096.112-.202.25-.288.336-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.332.734.655 1.353.858 1.545.954.192.096.305.08.417-.048.112-.128.481-.56.609-.752.128-.192.256-.16.433-.096.176.064 1.122.529 1.314.625.192.096.32.144.368.224.048.08.048.464-.096.869z"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.468-1.28l-.32-.2-2.956.776.789-2.883-.21-.334A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.522 0 8.2 3.679 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-[14px] font-bold text-ink">Kirim Laporan ke WhatsApp</h3>
                <p class="text-[11.5px] text-ink-muted">Format terstruktur, rapi, dan mudah dibaca</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <button
              class="py-2.5 px-2 rounded-xl text-white font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-all"
              style="background: #25D366;"
              @click="quickSendWhatsApp"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.787-3.119-2.73-3.214-2.857-.095-.128-.771-1.025-.771-1.954 0-.928.487-1.385.66-1.574.173-.189.378-.236.504-.236.126 0 .252.001.362.007.116.006.27-.044.423.323.16.38.544 1.325.592 1.422.048.096.08.209.016.335-.064.126-.096.205-.192.316-.096.112-.202.25-.288.336-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.332.734.655 1.353.858 1.545.954.192.096.305.08.417-.048.112-.128.481-.56.609-.752.128-.192.256-.16.433-.096.176.064 1.122.529 1.314.625.192.096.32.144.368.224.048.08.048.464-.096.869z"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.468-1.28l-.32-.2-2.956.776.789-2.883-.21-.334A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.522 0 8.2 3.679 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z"/>
              </svg>
              <span>Kirim Langsung</span>
            </button>

            <button
              class="py-2.5 px-2 rounded-xl bg-surface-2 hover:bg-surface border border-line text-ink font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all"
              @click="quickCopyReport"
            >
              <svg v-if="!copySuccess" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2dbe7e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ copySuccess ? 'Tersalin!' : 'Salin Teks' }}</span>
            </button>

            <button
              class="py-2.5 px-2 rounded-xl bg-surface-2 hover:bg-surface border border-line text-ink font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all"
              @click="showWhatsAppModal = true"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <span>Pratinjau</span>
            </button>
          </div>
        </div>

        <!-- Rata-rata Harian & Pace Pengeluaran -->
        <div class="card px-5 py-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-[14px] font-bold text-ink">Aktivitas & Rata-rata Harian</h2>
            <span class="text-[11px] font-medium text-ink-muted">{{ data.daysInMonth }} hari dalam bulan</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl p-3" style="background: var(--income-soft)">
              <p class="text-[11px] font-medium mb-0.5" style="color: var(--income-text)">Pemasukan Setara/hari</p>
              <p class="font-bold text-[15px]" style="color: var(--income-text)">{{ fmt(data.avgDailyIncome) }}</p>
            </div>
            <div class="rounded-xl p-3" style="background: var(--expense-soft)">
              <p class="text-[11px] font-medium mb-0.5" style="color: var(--expense-text)">Pengeluaran Riil/hari</p>
              <p class="font-bold text-[15px]" style="color: var(--expense-text)">{{ fmt(data.avgDailyExpense) }}</p>
            </div>
          </div>
          <p class="text-[11px] text-ink-muted mt-2.5 leading-relaxed">
            Pemasukan telah dinormalisasi setara harian untuk memberikan perbandingan yang adil antara gaji bulanan, usaha mingguan, dan harian.
          </p>
        </div>

        <!-- Sumber Pemasukan Terperinci -->
        <div class="card px-5 py-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-[14px] font-bold text-ink">Rincian Sumber Pemasukan</h2>
            <span class="text-[12px] font-semibold text-ink-muted">{{ data.incomeBySource.length }} Sumber</span>
          </div>

          <div v-if="data.incomeBySource.length > 0" class="space-y-3.5">
            <div v-for="(src, idx) in data.incomeBySource" :key="src.key" class="space-y-1.5">
              <div class="flex items-center justify-between text-[13px]">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10.5px] font-bold flex items-center justify-center flex-shrink-0">
                    {{ idx + 1 }}
                  </span>
                  <span class="font-semibold text-ink truncate">{{ src.label }}</span>
                  <span class="text-[9.5px] px-1.5 py-0.5 rounded font-semibold bg-surface-2 text-ink-muted flex-shrink-0">
                    {{ PERIOD_LABEL[src.periodType as keyof typeof PERIOD_LABEL] || src.periodType }}
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-[11.5px] text-ink-muted font-medium">
                    {{ data.totalIncome > 0 ? ((src.total / data.totalIncome) * 100).toFixed(1) : 0 }}%
                  </span>
                  <span class="font-bold text-ink">{{ fmt(src.total) }}</span>
                </div>
              </div>

              <!-- Bar proporsi -->
              <div class="h-1.5 rounded-full overflow-hidden bg-surface-2">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  style="background: var(--primary)"
                  :style="{ width: `${data.totalIncome > 0 ? (src.total / data.totalIncome) * 100 : 0}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div v-else class="text-[13px] text-ink-muted text-center py-5">
            Belum ada pemasukan tercatat bulan ini
          </div>
        </div>

        <!-- Donut Chart & Pengeluaran per Kategori -->
        <div class="card px-5 py-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-[14px] font-bold text-ink">Pengeluaran per Kategori</h2>
            <span class="text-[12px] font-semibold text-ink-muted">{{ data.expenseByCategory.length }} Kategori</span>
          </div>

          <div v-if="donutData.length > 0">
            <CategoryDonutChart :data="donutData" :colors="DONUT_COLORS" />

            <div class="mt-4 space-y-3">
              <div
                v-for="(cat, i) in data.expenseByCategory"
                :key="cat.key"
                class="space-y-1.5"
              >
                <div class="flex items-center justify-between text-[13px]">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: DONUT_COLORS[i % DONUT_COLORS.length] }"></div>
                    <span class="font-medium text-ink truncate">{{ cat.label }}</span>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-[11.5px] text-ink-muted font-medium">
                      {{ data.totalExpense > 0 ? ((cat.total / data.totalExpense) * 100).toFixed(1) : 0 }}%
                    </span>
                    <span class="font-bold text-ink">{{ fmt(cat.total) }}</span>
                  </div>
                </div>

                <!-- Progress bar kategori -->
                <div class="h-1.5 rounded-full overflow-hidden bg-surface-2">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :style="{
                      background: DONUT_COLORS[i % DONUT_COLORS.length],
                      width: `${data.totalExpense > 0 ? (cat.total / data.totalExpense) * 100 : 0}%`
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-[13px] text-ink-muted text-center py-8">
            Belum ada pengeluaran tercatat bulan ini
          </div>
        </div>

        <!-- Top 5 Pengeluaran Terbesar Bulan Ini -->
        <div class="card px-5 py-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-[14px] font-bold text-ink">Pengeluaran Terbesar Bulan Ini</h2>
            <span class="text-[11px] font-medium text-ink-muted">Top 5 transaksi</span>
          </div>

          <div v-if="loadingTx" class="py-4 text-center text-ink-muted text-[12px]">
            Memuat detail transaksi...
          </div>
          <div v-else-if="topExpenses.length > 0" class="divide-y divide-line">
            <div
              v-for="(tx, idx) in topExpenses"
              :key="tx.id"
              class="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="w-6 h-6 rounded-full bg-expense/10 text-expense text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold text-ink truncate">
                    {{ tx.expenseCategory?.name || tx.category || 'Pengeluaran' }}
                  </p>
                  <p class="text-[11px] text-ink-muted truncate">
                    {{ tx.occurredAt }} {{ tx.note ? `• ${tx.note}` : '' }}
                  </p>
                </div>
              </div>
              <span class="font-bold text-[13px] text-expense flex-shrink-0">
                -{{ fmt(tx.amount) }}
              </span>
            </div>
          </div>
          <div v-else class="text-[13px] text-ink-muted text-center py-4">
            Belum ada transaksi pengeluaran
          </div>
        </div>

        <!-- Evaluasi Finansial & Insight -->
        <div class="card px-5 py-4 border-l-4" :style="{ borderColor: isNetSurplus ? 'var(--primary)' : 'var(--expense)' }">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[16px]">{{ isNetSurplus ? '💡' : '⚠️' }}</span>
            <h2 class="text-[14px] font-bold text-ink">Evaluasi Keuangan</h2>
          </div>
          <p class="text-[12.5px] text-ink-muted leading-relaxed">
            <template v-if="data.totalIncome === 0 && data.totalExpense === 0">
              Belum ada aktivitas transaksi yang tercatat pada bulan ini.
            </template>
            <template v-else-if="!isNetSurplus">
              Bulan ini pengeluaranmu melebihi pemasukan sebesar <strong class="text-ink">{{ fmt(Math.abs(data.net)) }}</strong>. Tinjau kembali kategori pengeluaran terbesar di atas untuk mengoptimalkan anggaran bulan depan.
            </template>
            <template v-else-if="savingsRate >= 30">
              Performa luar biasa! Kamu berhasil menyisihkan <strong class="text-ink">{{ savingsRate }}%</strong> dari total pemasukanmu bulan ini. Pertahankan kedisiplinan finansial ini.
            </template>
            <template v-else-if="savingsRate >= 10">
              Arus kas bulan ini positif dengan tingkat tabungan <strong class="text-ink">{{ savingsRate }}%</strong>. Pastikan untuk terus mencatat setiap pengeluaran kecil agar tidak melampaui batas.
            </template>
            <template v-else>
              Saldo bulan ini surplus tipis (<strong class="text-ink">{{ savingsRate }}%</strong>). Sebagian besar penghasilan terserap untuk pengeluaran.
            </template>
          </p>
        </div>
      </div>
    </template>

    <div v-else-if="!loading" class="text-center py-16 text-ink-muted text-[13px] px-5">
      Gagal memuat data laporan. Silakan periksa koneksi.
    </div>

    <!-- WhatsApp Share Modal -->
    <WhatsAppShareModal
      :show="showWhatsAppModal"
      :userName="auth.user?.name"
      :monthLabel="monthLabel"
      :summary="data"
      :topExpenses="topExpenses"
      @close="showWhatsAppModal = false"
    />
  </div>
</template>

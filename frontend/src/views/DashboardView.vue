<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSummaryStore } from "@/stores/summary";
import { useMasterDataStore } from "@/stores/masterData";
import { useTransactionsStore } from "@/stores/transactions";
import { useCurrency } from "@/composables/useCurrency";
import CategoryDonutChart from "@/components/charts/CategoryDonutChart.vue";
import TrendLineChart from "@/components/charts/TrendLineChart.vue";
import TransactionIcon from "@/components/transactions/TransactionIcon.vue";
import ThemePicker from "@/components/ui/ThemePicker.vue";
import WhatsAppShareModal from "@/components/ui/WhatsAppShareModal.vue";

const auth = useAuthStore();
const summary = useSummaryStore();
const master = useMasterDataStore();
const txStore = useTransactionsStore();
const router = useRouter();
const { fmt } = useCurrency();

const showThemeModal = ref(false);
const showWhatsAppModal = ref(false);
const trendRange = ref<"7d" | "14d" | "30d">("14d");
const periodView = ref<"monthly" | "weekly">("monthly");

const now = new Date();

onMounted(() => {
  summary.fetchDashboard();
  summary.fetchMonthly(now.getFullYear(), now.getMonth() + 1);
  master.fetchAll();
  txStore.fetchList({ from: daysAgo(29) });
});

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Format tanggal hari ini
const todayLabel = computed(() => {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
});

const monthLabel = computed(() => {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
});

const greeting = computed(() => {
  const h = new Date().getHours();
  const g = h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
  const name = auth.user?.name?.split(" ")[0];
  return name ? `${g}, ${name}` : g;
});

// Perhitungan Data berdasarkan Toggle Periode (Bulanan / Mingguan)
const currentIncome = computed(() => {
  if (periodView.value === "weekly") {
    return summary.weekly?.totalIncome || 0;
  }
  return summary.monthly?.totalIncome || 0;
});

const currentExpense = computed(() => {
  if (periodView.value === "weekly") {
    return summary.weekly?.totalExpense || 0;
  }
  return summary.monthly?.totalExpense || 0;
});

const currentNet = computed(() => currentIncome.value - currentExpense.value);

const savingsRate = computed(() => {
  if (currentIncome.value <= 0) return 0;
  return Math.round((currentNet.value / currentIncome.value) * 100);
});

const expenseRatio = computed(() => {
  if (currentIncome.value <= 0) return 0;
  return Math.min(100, Math.round((currentExpense.value / currentIncome.value) * 100));
});

// Status Kesehatan Finansial
const financialHealth = computed(() => {
  if (currentIncome.value === 0 && currentExpense.value === 0) {
    return { label: "Belum Ada Data", color: "text-ink-muted", bg: "bg-surface-2", dot: "⚪" };
  }
  if (currentNet.value < 0) {
    return { label: "Defisit Anggaran", color: "text-expense", bg: "bg-expense/10", dot: "🔴" };
  }
  if (savingsRate.value >= 30) {
    return { label: "Kondisi Prima", color: "text-[#10b981]", bg: "bg-[#10b981]/15", dot: "🟢" };
  }
  if (savingsRate.value >= 10) {
    return { label: "Arus Kas Stabil", color: "text-primary", bg: "bg-primary/15", dot: "🟢" };
  }
  return { label: "Perhatian (Boros)", color: "text-amber-500", bg: "bg-amber-500/15", dot: "🟡" };
});

// Transaksi terbaru (5 item)
const recentTx = computed(() => txStore.items.slice(0, 5));

// Donut chart pengeluaran bulan ini
const expenseBreakdown = computed(() =>
  (summary.monthly?.expenseByCategory ?? []).map((c) => ({
    key: c.key,
    label: c.label,
    total: c.total,
  }))
);

const totalExpenseChart = computed(() =>
  expenseBreakdown.value.reduce((s, i) => s + i.total, 0)
);

function setTrendRange(range: "7d" | "14d" | "30d") {
  trendRange.value = range;
  summary.fetchTrend(range);
}

function quickAdd(sourceId: string) {
  router.push({ name: "add-transaction", query: { sourceId } });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

const DONUT_COLORS = ["#2dbe7e", "#f8a730", "#f05a5a", "#6c63ff", "#00bcd4", "#ff9f43", "#e91e63"];
</script>

<template>
  <div class="pb-28 md:pb-0 min-h-screen">
    <!-- Executive Top Bar -->
    <div
      class="px-5 pb-3 sticky top-0 z-20 border-b border-line"
      style="padding-top: calc(16px + env(safe-area-inset-top, 0px)); background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);"
    >
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="text-[10.5px] font-bold text-ink-muted uppercase tracking-widest">{{ todayLabel }}</span>
          </div>
          <h1 class="text-[19px] font-black text-ink tracking-tight" style="letter-spacing: -0.5px;">{{ greeting }}</h1>
        </div>

        <div class="flex items-center gap-2">
          <!-- WhatsApp Quick Rekap Button -->
          <button
            class="h-9 px-3 rounded-full flex items-center gap-1.5 text-[11.5px] font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
            style="background: linear-gradient(135deg, #25D366 0%, #1da851 100%);"
            title="Kirim Rekap WhatsApp"
            @click="showWhatsAppModal = true"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.787-3.119-2.73-3.214-2.857-.095-.128-.771-1.025-.771-1.954 0-.928.487-1.385.66-1.574.173-.189.378-.236.504-.236.126 0 .252.001.362.007.116.006.27-.044.423.323.16.38.544 1.325.592 1.422.048.096.08.209.016.335-.064.126-.096.205-.192.316-.096.112-.202.25-.288.336-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.332.734.655 1.353.858 1.545.954.192.096.305.08.417-.048.112-.128.481-.56.609-.752.128-.192.256-.16.433-.096.176.064 1.122.529 1.314.625.192.096.32.144.368.224.048.08.048.464-.096.869z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.468-1.28l-.32-.2-2.956.776.789-2.883-.21-.334A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.522 0 8.2 3.679 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z"/>
            </svg>
            <span class="hidden xs:inline">WA</span>
          </button>

          <!-- Theme switcher -->
          <button
            id="btn-theme-quick"
            class="w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
            style="background: var(--surface-2); border: 1px solid var(--line);"
            title="Ganti Tema & Warna"
            @click="showThemeModal = true"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="px-5 pt-4 lg:px-8">
      <!-- Financial Health Badge & Toggle Row -->
      <div class="flex items-center justify-between mb-4">
        <div
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all shadow-sm"
          :class="[financialHealth.bg, financialHealth.color]"
        >
          <span>{{ financialHealth.dot }}</span>
          <span>{{ financialHealth.label }}</span>
        </div>

        <!-- Periode Toggle: Bulan Ini vs Minggu Ini -->
        <div class="p-0.5 rounded-xl flex items-center" style="background: var(--surface-2); border: 1px solid var(--line);">
          <button
            class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            :class="periodView === 'monthly' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'"
            @click="periodView = 'monthly'"
          >
            Bulan Ini
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            :class="periodView === 'weekly' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'"
            @click="periodView = 'weekly'"
          >
            Minggu Ini
          </button>
        </div>
      </div>

      <!-- Responsive 2-col grid -->
      <div class="db-cols">
        <!-- ── LEFT COLUMN: stats & charts ── -->
        <div class="space-y-4">

      <!-- Executive Hero Card -->
      <div class="hero-card relative overflow-hidden fade-slide-up">
        <!-- Floating glass shapes -->
        <div class="absolute -right-10 -top-10 w-36 h-36 rounded-full pointer-events-none" style="background: rgba(255,255,255,0.07); filter: blur(20px);"></div>
        <div class="absolute bottom-0 left-0 w-24 h-24 rounded-full pointer-events-none" style="background: rgba(255,255,255,0.05); filter: blur(15px);"></div>

        <div class="flex items-start justify-between mb-1">
          <div>
            <p class="text-white/75 text-[12px] font-semibold tracking-wide mb-0.5">
              Saldo Bersih &middot; {{ periodView === 'monthly' ? monthLabel : '7 Hari Ini' }}
            </p>
            <h2 class="text-white font-black leading-tight" style="font-size: 30px; letter-spacing: -1px;">
              {{ currentNet >= 0 ? '+' : '' }}{{ fmt(currentNet) }}
            </h2>
          </div>

          <button
            class="p-2 rounded-xl text-white transition-all"
            style="background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);"
            title="Buka Laporan Lengkap"
            @click="router.push({ name: 'laporan' })"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 17l9.2-9.2M17 17V8H8"/>
            </svg>
          </button>
        </div>

        <!-- Expense to Income Ratio Bar -->
        <div class="mt-3 mb-4 rounded-xl p-3" style="background: rgba(0,0,0,0.15); backdrop-filter: blur(4px);">
          <div class="flex justify-between items-center text-[11px] text-white/85 font-semibold mb-2">
            <span>Rasio Anggaran</span>
            <span>
              {{ expenseRatio }}% terpakai
              <span v-if="savingsRate > 0" class="text-white/60">&nbsp;({{ savingsRate }}% tersimpan)</span>
            </span>
          </div>
          <div class="h-1.5 w-full rounded-full overflow-hidden" style="background: rgba(255,255,255,0.2);">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{
                width: `${Math.min(100, expenseRatio)}%`,
                background: expenseRatio > 90 ? '#ef4444' : expenseRatio > 70 ? '#f59e0b' : 'rgba(255,255,255,0.9)'
              }"
            ></div>
          </div>
        </div>

        <!-- Metric Mini Cards Grid -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- Pemasukan -->
          <div class="metric-mini">
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-5 h-5 rounded-full flex items-center justify-center" style="background: rgba(255,255,255,0.2);">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7v10"/>
                </svg>
              </div>
              <span class="text-white/75 text-[11px] font-semibold">Pemasukan</span>
            </div>
            <p class="text-white font-black text-[16px]" style="letter-spacing: -0.5px;">{{ fmt(currentIncome) }}</p>
          </div>

          <!-- Pengeluaran -->
          <div class="metric-mini">
            <div class="flex items-center gap-1.5 mb-1.5">
              <div class="w-5 h-5 rounded-full flex items-center justify-center" style="background: rgba(255,255,255,0.2);">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 7L7 17M7 17H17M7 17V7"/>
                </svg>
              </div>
              <span class="text-white/75 text-[11px] font-semibold">Pengeluaran</span>
            </div>
            <p class="text-white font-black text-[16px]" style="letter-spacing: -0.5px;">{{ fmt(currentExpense) }}</p>
          </div>
        </div>
      </div>

      <!-- Neo-Fintech Quick Actions Bar -->
      <div class="grid grid-cols-4 gap-2">
        <button
          class="card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer"
          @click="router.push({ name: 'add-transaction', query: { type: 'income' } })"
        >
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center" style="background: var(--income-soft); color: var(--income-text);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span class="text-[11px] font-bold text-ink leading-tight">Pemasukan</span>
        </button>

        <button
          class="card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer"
          @click="router.push({ name: 'add-transaction', query: { type: 'expense' } })"
        >
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center" style="background: var(--expense-soft); color: var(--expense-text);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span class="text-[11px] font-bold text-ink leading-tight">Pengeluaran</span>
        </button>

        <button
          class="card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer"
          @click="router.push({ name: 'laporan' })"
        >
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center" style="background: rgba(37,99,235,0.1); color: #2563eb;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <span class="text-[11px] font-bold text-ink leading-tight">Laporan</span>
        </button>

        <button
          class="card p-3 flex flex-col items-center gap-1.5 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer"
          @click="showWhatsAppModal = true"
        >
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center" style="background: rgba(37,211,102,0.12); color: #25D366;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.787-3.119-2.73-3.214-2.857-.095-.128-.771-1.025-.771-1.954 0-.928.487-1.385.66-1.574.173-.189.378-.236.504-.236.126 0 .252.001.362.007.116.006.27-.044.423.323.16.38.544 1.325.592 1.422.048.096.08.209.016.335-.064.126-.096.205-.192.316-.096.112-.202.25-.288.336-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.332.734.655 1.353.858 1.545.954.192.096.305.08.417-.048.112-.128.481-.56.609-.752.128-.192.256-.16.433-.096.176.064 1.122.529 1.314.625.192.096.32.144.368.224.048.08.048.464-.096.869z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.468-1.28l-.32-.2-2.956.776.789-2.883-.21-.334A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.522 0 8.2 3.679 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z"/>
            </svg>
          </div>
          <span class="text-[11px] font-bold text-ink leading-tight">Rekap WA</span>
        </button>
      </div>

      <!-- Trend Arus Kas (Interactive Line Chart) -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-[14px] font-bold text-ink">Tren Arus Kas</h2>
            <p class="text-[11px] text-ink-muted">Pemasukan vs Pengeluaran</p>
          </div>

          <!-- Trend Range Toggle -->
          <div class="p-0.5 bg-surface-2 rounded-xl border border-line flex items-center">
            <button
              class="px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all"
              :class="trendRange === '7d' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'"
              @click="setTrendRange('7d')"
            >
              7H
            </button>
            <button
              class="px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all"
              :class="trendRange === '14d' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'"
              @click="setTrendRange('14d')"
            >
              14H
            </button>
            <button
              class="px-2 py-0.5 rounded-lg text-[10.5px] font-bold transition-all"
              :class="trendRange === '30d' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'"
              @click="setTrendRange('30d')"
            >
              30H
            </button>
          </div>
        </div>

        <div v-if="summary.trend && summary.trend.points.length > 0">
          <TrendLineChart :points="summary.trend.points" />
        </div>
        <div v-else class="text-center py-8 text-ink-muted text-[12px]">
          Memuat data tren transaksi...
        </div>
      </div>

      <!-- Kategori Pengeluaran Bulan Ini (Donut + Progress) -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-[14px] font-bold text-ink">Distribusi Pengeluaran</h2>
          <span class="text-[11.5px] font-semibold text-primary cursor-pointer hover:underline" @click="router.push({ name: 'laporan' })">
            Lihat Detail
          </span>
        </div>
        <p class="text-[11.5px] text-ink-muted mb-3">{{ monthLabel }}</p>

        <!-- Loading state -->
        <div v-if="summary.loadingMonthly" class="flex items-center gap-4 py-4">
          <div class="skeleton w-[110px] h-[110px] rounded-full flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div v-for="i in 3" :key="i" class="skeleton h-3.5 w-full rounded"></div>
          </div>
        </div>

        <!-- No data -->
        <div v-else-if="expenseBreakdown.length === 0" class="text-center py-6 text-ink-muted text-[13px]">
          Belum ada catatan pengeluaran bulan ini
        </div>

        <!-- Chart + Legend -->
        <div v-else class="flex items-center gap-4">
          <!-- Donut chart -->
          <div class="relative flex-shrink-0" style="width: 125px; height: 125px;">
            <CategoryDonutChart
              :data="expenseBreakdown"
              :showLegend="false"
              heightClass="h-[125px] w-[125px]"
              :colors="DONUT_COLORS"
            />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p class="text-[9.5px] text-ink-muted font-medium">Total</p>
              <p class="text-[11.5px] font-bold text-ink leading-tight">{{ fmt(totalExpenseChart) }}</p>
            </div>
          </div>

          <!-- Legend -->
          <div class="flex-1 space-y-2 min-w-0">
            <div
              v-for="(item, i) in expenseBreakdown.slice(0, 4)"
              :key="item.key"
              class="space-y-0.5"
            >
              <div class="flex items-center justify-between text-[12px]">
                <div class="flex items-center gap-1.5 min-w-0">
                  <div
                    class="w-2 h-2 rounded-full flex-shrink-0"
                    :style="{ background: DONUT_COLORS[i % DONUT_COLORS.length] }"
                  ></div>
                  <span class="text-ink truncate">{{ item.label }}</span>
                </div>
                <span class="font-bold text-ink ml-1 flex-shrink-0">
                  {{ totalExpenseChart > 0 ? Math.round((item.total / totalExpenseChart) * 100) : 0 }}%
                </span>
              </div>

              <!-- Bar -->
              <div class="h-1 rounded-full overflow-hidden bg-surface-2">
                <div
                  class="h-full rounded-full"
                  :style="{
                    background: DONUT_COLORS[i % DONUT_COLORS.length],
                    width: `${totalExpenseChart > 0 ? (item.total / totalExpenseChart) * 100 : 0}%`
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        </div><!-- /donut card -->

        </div><!-- /left column -->

        <!-- ── RIGHT COLUMN: activity & shortcuts ── -->
        <div class="space-y-4">

          <!-- Transaksi Terbaru -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <h2 class="text-[14px] font-bold text-ink">Aktivitas Terbaru</h2>
          <button
            class="text-[12px] font-semibold text-primary hover:underline"
            @click="router.push({ name: 'transactions' })"
          >
            Lihat semua
          </button>
        </div>

        <div class="card px-4 py-1">
          <!-- Loading skeleton -->
          <template v-if="txStore.loading">
            <div v-for="i in 3" :key="i" class="flex items-center gap-3 py-3 border-b border-line last:border-b-0">
              <div class="skeleton w-10 h-10 rounded-xl flex-shrink-0"></div>
              <div class="flex-1">
                <div class="skeleton h-3.5 w-28 mb-1.5 rounded"></div>
                <div class="skeleton h-3 w-20 rounded"></div>
              </div>
              <div class="skeleton h-4 w-20 rounded"></div>
            </div>
          </template>

          <template v-else-if="recentTx.length === 0">
            <div class="text-center py-8 text-ink-muted text-[13px]">
              Belum ada transaksi tercatat
            </div>
          </template>

          <template v-else>
            <div
              v-for="tx in recentTx"
              :key="tx.id"
              class="tx-item py-3 flex items-center gap-3 border-b border-line last:border-b-0 cursor-pointer hover:opacity-90"
              @click="router.push({ name: 'edit-transaction', params: { id: tx.id } })"
            >
              <TransactionIcon
                :type="tx.type"
                :categoryName="tx.expenseCategory?.name"
                :sourceName="tx.incomeSource?.name"
              />

              <div class="flex-1 min-w-0">
                <p class="text-[13.5px] font-semibold text-ink truncate">
                  {{ tx.type === 'income' ? (tx.incomeSource?.name || 'Pemasukan') : (tx.expenseCategory?.name || 'Pengeluaran') }}
                </p>
                <p class="text-[11.5px] text-ink-muted truncate">
                  {{ formatDate(tx.occurredAt) }} {{ tx.note ? `• ${tx.note}` : '' }}
                </p>
              </div>

              <div class="text-right flex-shrink-0">
                <p
                  class="font-bold text-[13.5px]"
                  :style="{ color: tx.type === 'income' ? 'var(--income-text)' : 'var(--expense-text)' }"
                >
                  {{ tx.type === 'income' ? '+' : '-' }}{{ fmt(tx.amount) }}
                </p>
                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  :style="{
                    background: tx.type === 'income' ? 'var(--income-soft)' : 'var(--expense-soft)',
                    color: tx.type === 'income' ? 'var(--income-text)' : 'var(--expense-text)'
                  }"
                >
                  {{ tx.type === 'income' ? 'Masuk' : 'Keluar' }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Tambah Cepat Sumber & Kategori -->
      <div v-if="master.incomeSources.length > 0 || master.expenseCategories.length > 0" class="space-y-2">
        <h2 class="text-[13px] font-bold text-ink-muted tracking-wider uppercase">Shortcut Tambah</h2>

        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="s in master.incomeSources.slice(0, 2)"
            :key="s.id"
            class="card p-2.5 flex flex-col items-center gap-1 cursor-pointer hover:shadow-md active:scale-95 transition-all text-center"
            @click="quickAdd(s.id)"
          >
            <div class="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span class="text-[10.5px] font-semibold text-ink truncate w-full">{{ s.name }}</span>
          </div>

          <div
            v-for="cat in master.expenseCategories.slice(0, 2)"
            :key="cat.id"
            class="card p-2.5 flex flex-col items-center gap-1 cursor-pointer hover:shadow-md active:scale-95 transition-all text-center"
            @click="router.push({ name: 'add-transaction', query: { type: 'expense' } })"
          >
            <div class="w-8 h-8 rounded-xl flex items-center justify-center bg-expense/10 text-expense">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <span class="text-[10.5px] font-semibold text-ink truncate w-full">{{ cat.name }}</span>
          </div>
        </div>
        </div><!-- /shortcuts section -->

        </div><!-- /right column -->
      </div><!-- /db-cols -->
    </div><!-- /content wrapper -->


    <!-- Theme Modal -->
    <div
      v-if="showThemeModal"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity"
      @click.self="showThemeModal = false"
    >
      <div class="w-full max-w-[480px] bg-surface rounded-t-3xl p-5 shadow-2xl border-t border-line animate-slide-up">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-[16px] font-bold text-ink">Ganti Tema & Warna</h3>
            <p class="text-[12px] text-ink-muted">Pilih nuansa warna aplikasi yang kamu sukai</p>
          </div>
          <button
            class="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
            @click="showThemeModal = false"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <ThemePicker />

        <button
          class="w-full mt-4 py-3 rounded-xl font-bold text-[14px] text-white transition-opacity hover:opacity-90"
          style="background: var(--primary)"
          @click="showThemeModal = false"
        >
          Terapkan
        </button>
      </div>
    </div>

    <!-- WhatsApp Share Modal -->
    <WhatsAppShareModal
      :show="showWhatsAppModal"
      :userName="auth.user?.name"
      :monthLabel="monthLabel"
      :summary="summary.monthly"
      :topExpenses="txStore.items.filter(t => t.type === 'expense').slice(0, 5)"
      @close="showWhatsAppModal = false"
    />
  </div>
</template>

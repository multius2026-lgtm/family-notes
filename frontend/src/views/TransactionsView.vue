<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useTransactionsStore } from "@/stores/transactions";
import { useMasterDataStore } from "@/stores/masterData";
import { useWalletsStore } from "@/stores/wallets";
import TransactionListItem from "@/components/transactions/TransactionListItem.vue";
import CategoryDonutChart from "@/components/charts/CategoryDonutChart.vue";
import { useCurrency } from "@/composables/useCurrency";
import type { TransactionType } from "@/types";

const store = useTransactionsStore();
const master = useMasterDataStore();
const walletsStore = useWalletsStore();
const { fmt } = useCurrency();

const period = ref<"7" | "30" | "all">("30");
const typeFilter = ref<TransactionType | "all">("all");
const walletFilter = ref<string>("all");
const searchQuery = ref("");

onMounted(async () => {
  if (master.expenseCategories.length === 0) master.fetchAll();
  if (walletsStore.items.length === 0) await walletsStore.fetchList();
  load();
});

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function load() {
  const params: any = {};
  if (period.value === "7") params.from = daysAgo(6);
  else if (period.value === "30") params.from = daysAgo(29);
  if (typeFilter.value !== "all") params.type = typeFilter.value;
  if (walletFilter.value !== "all") params.walletId = walletFilter.value;
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
  store.fetchList(params);
}

watch([period, typeFilter, walletFilter], load);

// Debounce search
let searchTimer: any = null;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    load();
  }, 350);
});

const expenseBreakdown = computed(() => {
  const totals = new Map<string, number>();
  for (const t of store.items) {
    if (t.type !== "expense") continue;
    const key = t.expenseCategory?.name || t.category || "Lainnya";
    totals.set(key, (totals.get(key) || 0) + Number(t.amount));
  }
  return Array.from(totals.entries())
    .map(([label, total]) => ({ key: label, label, total }))
    .sort((a, b) => b.total - a.total);
});

function dateLabel(d: string) {
  const today = todayStr();
  const yest = daysAgo(1);
  if (d === today) return "Hari ini";
  if (d === yest) return "Kemarin";
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const grouped = computed(() => {
  const groups: Record<string, typeof store.items> = {};
  for (const t of store.items) {
    (groups[t.occurredAt] = groups[t.occurredAt] || []).push(t);
  }
  return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
});

function dayTotal(items: typeof store.items) {
  return items.reduce((s, t) => {
    if (t.type === "transfer") return s;
    return s + (t.type === "income" ? Number(t.amount) : -Number(t.amount));
  }, 0);
}

// ════ Export CSV ════
function exportCSV() {
  if (store.items.length === 0) {
    alert("Tidak ada transaksi untuk diexport.");
    return;
  }

  const headers = ["Tanggal", "Tipe", "Kategori/Sumber", "Jumlah", "Dompet", "Catatan", "Metode Input", "Foto Struk"];
  const rows = store.items.map((t) => [
    t.occurredAt,
    t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer",
    t.type === "income"
      ? (t.incomeSource?.name || "Lainnya")
      : t.type === "expense"
      ? (t.expenseCategory?.name || "Lainnya")
      : `${t.wallet?.name || "Dompet"} -> ${t.transferToWallet?.name || "Tujuan"}`,
    t.amount,
    t.wallet?.name || "-",
    `"${(t.note || "").replace(/"/g, '""')}"`,
    t.isOcr || t.receiptUrl ? "Scan Struk" : "Manual",
    t.receiptUrl || "-",
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transaksi_${todayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="pb-6">
    <!-- Header -->
    <div
      class="px-5 pb-4 bg-surface border-b border-line"
      style="padding-top: calc(20px + env(safe-area-inset-top, 0px))"
    >
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-[22px] font-bold text-ink m-0">Transaksi</h1>
        <!-- Tombol Export CSV -->
        <button
          type="button"
          class="btn-export-csv"
          title="Export data ke file CSV / Excel"
          @click="exportCSV"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      <!-- Search Input Bar -->
      <div class="relative mb-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari transaksi, toko, atau catatan..."
          class="search-input"
        />
        <span class="search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <button
          v-if="searchQuery"
          type="button"
          class="search-clear"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Period filter -->
      <div class="flex bg-surface-2 rounded-xl p-1 mb-2.5">
        <button
          v-for="opt in [{ v: '7', l: '7 Hari' }, { v: '30', l: '30 Hari' }, { v: 'all', l: 'Semua' }]"
          :key="opt.v"
          class="flex-1 py-1.5 rounded-[10px] text-[12.5px] font-semibold transition-all"
          :style="period === opt.v
            ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
            : { background: 'transparent', color: 'var(--ink-muted)' }"
          @click="period = opt.v as any"
        >
          {{ opt.l }}
        </button>
      </div>

      <!-- Type filter chips + Dompet Filter -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          v-for="opt in [{ v: 'all', l: 'Semua' }, { v: 'income', l: 'Pemasukan' }, { v: 'expense', l: 'Pengeluaran' }, { v: 'transfer', l: 'Transfer' }]"
          :key="opt.v"
          class="chip-sm"
          :class="typeFilter === opt.v ? 'active' : ''"
          @click="typeFilter = opt.v as any"
        >
          {{ opt.l }}
        </button>

        <span class="text-line mx-0.5">|</span>

        <!-- Dompet filter dropdown -->
        <select
          v-model="walletFilter"
          class="wallet-filter-select"
        >
          <option value="all">Semua Dompet</option>
          <option v-for="w in walletsStore.items" :key="w.id" :value="w.id">
            {{ w.icon }} {{ w.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="px-5 pt-4">
      <!-- Donut chart -->
      <div v-if="typeFilter !== 'income' && typeFilter !== 'transfer' && expenseBreakdown.length > 0" class="card px-4 py-4 mb-5">
        <h2 class="text-[14px] font-bold text-ink mb-3">Pengeluaran per kategori</h2>
        <CategoryDonutChart :data="expenseBreakdown" />
      </div>

      <!-- Empty state -->
      <div v-if="!store.loading && store.items.length === 0" class="text-center py-14 text-ink-muted">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: var(--primary-light)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
          </svg>
        </div>
        <h3 class="font-bold text-ink text-[17px] mb-1">Belum ada transaksi</h3>
        <p class="text-[13px] leading-relaxed">
          {{ searchQuery ? 'Tidak ada transaksi yang cocok dengan kata kunci pencarian.' : 'Ketuk tombol + di bawah untuk mencatat transaksi.' }}
        </p>
      </div>

      <!-- Loading skeleton -->
      <template v-if="store.loading">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 py-3 border-b border-line">
          <div class="skeleton w-10 h-10 rounded-xl flex-shrink-0"></div>
          <div class="flex-1">
            <div class="skeleton h-3.5 w-32 mb-2 rounded"></div>
            <div class="skeleton h-3 w-24 rounded"></div>
          </div>
          <div class="skeleton h-4 w-24 rounded"></div>
        </div>
      </template>

      <!-- Grouped list -->
      <div v-for="[date, items] in grouped" :key="date" class="mb-2">
        <div class="flex justify-between items-center py-2 mt-2">
          <span class="text-[12px] font-bold text-ink-muted">{{ dateLabel(date) }}</span>
          <span
            class="text-[12px] font-bold"
            :style="{ color: dayTotal(items) >= 0 ? 'var(--income-text)' : 'var(--expense-text)' }"
          >{{ fmt(dayTotal(items)) }}</span>
        </div>
        <div class="card px-4 py-1">
          <TransactionListItem v-for="t in items" :key="t.id" :tx="t" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-export-csv {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 12px;
  border: 1.5px solid var(--line);
  background: var(--surface-2);
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-export-csv:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.search-input {
  width: 100%;
  padding: 9px 36px 9px 36px;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  background: var(--surface-2);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-muted);
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-muted);
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
}

.chip-sm {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 700;
  background: var(--surface-2);
  color: var(--ink-muted);
  border: 1px solid var(--line);
  white-space: nowrap;
  cursor: pointer;
}
.chip-sm.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.wallet-filter-select {
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 700;
  background: var(--surface-2);
  color: var(--ink);
  border: 1px solid var(--line);
  outline: none;
  cursor: pointer;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

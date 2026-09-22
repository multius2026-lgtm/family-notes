<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useTransactionsStore } from "@/stores/transactions";
import { useMasterDataStore } from "@/stores/masterData";
import TransactionListItem from "@/components/transactions/TransactionListItem.vue";
import CategoryDonutChart from "@/components/charts/CategoryDonutChart.vue";
import { useCurrency } from "@/composables/useCurrency";
import { ICON_MAP } from "@/components/icons";
import type { TransactionType } from "@/types";

const store = useTransactionsStore();
const master = useMasterDataStore();
const { fmt } = useCurrency();

onMounted(() => {
  if (master.expenseCategories.length === 0) master.fetchAll();
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

const period = ref<"7" | "30" | "all">("30");
const typeFilter = ref<TransactionType | "all">("all");

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
  store.fetchList(params);
}

onMounted(load);
watch([period, typeFilter], load);

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
  return items.reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
}
</script>

<template>
  <div class="pb-4">
    <!-- Header -->
    <div
      class="px-5 pb-4 bg-surface border-b border-line"
      style="padding-top: calc(20px + env(safe-area-inset-top, 0px))"
    >
      <h1 class="text-[22px] font-bold text-ink mb-4">Transaksi</h1>

      <!-- Period filter -->
      <div class="flex bg-surface-2 rounded-xl p-1 mb-3">
        <button
          v-for="opt in [{ v: '7', l: '7 Hari' }, { v: '30', l: '30 Hari' }, { v: 'all', l: 'Semua' }]"
          :key="opt.v"
          class="flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
          :style="period === opt.v
            ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
            : { background: 'transparent', color: 'var(--ink-muted)' }"
          @click="period = opt.v as any"
        >
          {{ opt.l }}
        </button>
      </div>

      <!-- Type filter chips -->
      <div class="flex gap-2">
        <button
          v-for="opt in [{ v: 'all', l: 'Semua' }, { v: 'income', l: 'Pemasukan' }, { v: 'expense', l: 'Pengeluaran' }]"
          :key="opt.v"
          class="chip"
          :class="typeFilter === opt.v ? 'active' : ''"
          @click="typeFilter = opt.v as any"
        >
          {{ opt.l }}
        </button>
      </div>
    </div>

    <div class="px-5 pt-4">
      <!-- Donut chart -->
      <div v-if="typeFilter !== 'income' && expenseBreakdown.length > 0" class="card px-4 py-4 mb-5">
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
        <p class="text-[13px] leading-relaxed">Ketuk tombol + di bawah untuk<br />mencatat pemasukan atau pengeluaran.</p>
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
      <div v-for="[date, items] in grouped" :key="date" class="mb-1">
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

<script setup lang="ts">
import { computed } from "vue";
import { useCurrency } from "@/composables/useCurrency";
import type { Transaction } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Receipt,
  Edit3,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Package,
  Briefcase,
  Gift,
  TrendingUp,
  CreditCard,
  DollarSign
} from "lucide-vue-next";

const props = defineProps<{
  tx: Transaction;
}>();

const emit = defineEmits<{
  click: [tx: Transaction];
}>();

const { fmt } = useCurrency();

const isIncome = computed(() => props.tx.type === "income");
const isExpense = computed(() => props.tx.type === "expense");
const isTransfer = computed(() => props.tx.type === "transfer");

const displayName = computed(() => {
  if (isTransfer.value) {
    const from = props.tx.wallet?.name || "Dompet";
    const to = props.tx.transferToWallet?.name || "Tujuan";
    return `${from} → ${to}`;
  }
  if (isIncome.value) {
    return props.tx.incomeSource?.name || "Pemasukan Lainnya";
  }
  return props.tx.expenseCategory?.name || "Pengeluaran";
});

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

// Icon selector per category/source
const categoryIconComponent = computed(() => {
  if (isTransfer.value) return ArrowLeftRight;
  if (isIncome.value) {
    const srcName = props.tx.incomeSource?.name?.toLowerCase() || "";
    if (srcName.includes("gaji")) return Briefcase;
    if (srcName.includes("freelance") || srcName.includes("proyek")) return Briefcase;
    if (srcName.includes("bonus") || srcName.includes("thr")) return Gift;
    if (srcName.includes("investasi") || srcName.includes("dividen")) return TrendingUp;
    return ArrowUpRight;
  }
  const catName = props.tx.expenseCategory?.name?.toLowerCase() || "";
  if (catName.includes("makan") || catName.includes("minum") || catName.includes("kuliner")) return Utensils;
  if (catName.includes("transport") || catName.includes("bensin") || catName.includes("ojek")) return Car;
  if (catName.includes("belanja") || catName.includes("pasar")) return ShoppingBag;
  if (catName.includes("tagihan") || catName.includes("listrik") || catName.includes("air")) return Zap;
  if (catName.includes("hiburan") || catName.includes("nonton")) return Film;
  if (catName.includes("sehat") || catName.includes("obat")) return HeartPulse;
  if (catName.includes("didik") || catName.includes("kursus")) return GraduationCap;
  return ArrowDownLeft;
});
</script>

<template>
  <div
    class="tx-row flex items-center gap-3 py-3 border-b border-line-soft hover:bg-bg/60 cursor-pointer transition-colors px-1 select-none"
    @click="emit('click', tx)"
  >
    <!-- Ikon kategori dalam kotak 38x38px, radius 12px, background tint sesuai jenis per Design System -->
    <div
      class="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
      :style="{
        background: isIncome
          ? 'var(--income-tint)'
          : isExpense
          ? 'var(--expense-tint)'
          : 'var(--gold-tint)',
        color: isIncome
          ? 'var(--income)'
          : isExpense
          ? 'var(--expense)'
          : 'var(--gold)'
      }"
    >
      <component :is="categoryIconComponent" :size="18" :stroke-width="1.8" />
    </div>

    <!-- Info Transaksi -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5 mb-0.5">
        <h4 class="text-[13px] font-[700] text-ink truncate leading-tight font-ui">
          {{ displayName }}
        </h4>

        <!-- Badge metode / status -->
        <span
          v-if="isTransfer"
          class="px-1.5 py-0.5 rounded-[6px] text-[10px] font-[700] bg-gold-tint text-gold flex items-center gap-1"
        >
          Transfer
        </span>
        <span
          v-else-if="tx.isOcr || tx.receiptUrl"
          class="px-1.5 py-0.5 rounded-[6px] text-[10px] font-[700] bg-pine-tint text-pine flex items-center gap-1"
          title="Transaksi dibuat dari scan struk"
        >
          <Receipt :size="10" :stroke-width="2" />
          <span>Struk</span>
        </span>
        <span
          v-else
          class="px-1.5 py-0.5 rounded-[6px] text-[10px] font-[600] bg-bg text-ink-soft border border-line flex items-center gap-1"
          title="Diinput manual"
        >
          <Edit3 :size="9" :stroke-width="2" />
          <span>Manual</span>
        </span>
      </div>

      <p class="text-[11px] font-[600] text-ink-soft truncate leading-none">
        <span>{{ formatDate(tx.occurredAt) }}</span>
        <span v-if="tx.wallet && !isTransfer" class="ml-1 text-pine font-[700]">
          &middot; {{ tx.wallet.name }}
        </span>
        <span v-if="tx.note" class="ml-1 text-ink-faint">
          &middot; {{ tx.note }}
        </span>
      </p>
    </div>

    <!-- Nominal Transaksi -->
    <!-- Nominal expense: warna expense, prefix - | Nominal income: warna income, prefix + -->
    <div class="text-right flex-shrink-0">
      <p
        class="text-[13.5px] font-[700] leading-tight font-ui"
        :style="{
          color: isTransfer
            ? 'var(--pine)'
            : isIncome
            ? 'var(--income)'
            : 'var(--expense)'
        }"
      >
        {{ isTransfer ? '' : isIncome ? '+' : '-' }}{{ fmt(tx.amount) }}
      </p>
      <p class="text-[10.5px] font-[600] text-ink-faint mt-0.5">
        {{ isTransfer ? 'Transfer' : isIncome ? 'Pemasukan' : 'Pengeluaran' }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.tx-row:last-child {
  border-bottom: none;
}
</style>

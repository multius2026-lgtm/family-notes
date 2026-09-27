<script setup lang="ts">
import { computed } from "vue";
import { useCurrency } from "@/composables/useCurrency";
import type { Transaction } from "@/types";
import { getCategoryIconComponent } from "@/composables/useCategoryIcon";
import { ArrowLeftRight, Receipt, Edit3 } from "lucide-vue-next";

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
  return props.tx.expenseCategory?.name || props.tx.category || "Pengeluaran";
});

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

// Icon selector per category/source with comprehensive fallback
const categoryIconComponent = computed(() => {
  if (isTransfer.value) return getCategoryIconComponent("transfer", "transfer");
  if (isIncome.value) {
    const src = props.tx.incomeSource;
    const identifier = [src?.name, src?.icon].filter(Boolean).join(" ");
    return getCategoryIconComponent(identifier, "income");
  }
  const exp = props.tx.expenseCategory;
  const identifier = [exp?.name, exp?.icon, props.tx.category].filter(Boolean).join(" ");
  return getCategoryIconComponent(identifier, "expense");
});
</script>

<template>
  <div
    class="tx-row flex items-center gap-3 py-3.5 border-b border-line-soft hover:bg-bg cursor-pointer transition-colors px-1 select-none rounded-[12px]"
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
        class="text-[13.5px] font-[700] leading-tight font-display"
        style="font-style: italic;"
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

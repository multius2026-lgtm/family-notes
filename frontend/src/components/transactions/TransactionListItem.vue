<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useCurrency } from "@/composables/useCurrency";
import TransactionIcon from "@/components/transactions/TransactionIcon.vue";
import type { Transaction } from "@/types";

const props = defineProps<{ tx: Transaction }>();
const router = useRouter();
const { fmt } = useCurrency();

const isIncome = computed(() => props.tx.type === "income");
const isTransfer = computed(() => props.tx.type === "transfer");

const name = computed(() => {
  if (isTransfer.value) {
    const from = props.tx.wallet?.name || "Dompet";
    const to = props.tx.transferToWallet?.name || "Tujuan";
    return `${from} → ${to}`;
  }
  return (isIncome.value ? props.tx.incomeSource?.name : props.tx.expenseCategory?.name) || "Lainnya";
});

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div
    class="tx-item"
    @click="router.push({ name: 'edit-transaction', params: { id: tx.id } })"
  >
    <TransactionIcon
      :type="tx.type"
      :categoryName="tx.expenseCategory?.name"
      :sourceName="tx.incomeSource?.name"
    />

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5 mb-0.5">
        <p class="text-[14px] font-semibold text-ink truncate">{{ name }}</p>
        <span
          v-if="isTransfer"
          class="badge-transfer"
          title="Transfer Antar Dompet"
        >
          Transfer
        </span>
        <span
          v-else-if="tx.isOcr || tx.receiptUrl"
          class="badge-receipt"
          title="Transaksi dibuat dari scan struk"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="m9 9 3-3 3 3"/>
            <path d="M12 6v9"/>
            <path d="M9 15h6"/>
          </svg>
          Struk
        </span>
        <span
          v-else
          class="badge-manual"
          title="Transaksi diinput manual"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Manual
        </span>
      </div>
      <p class="text-[12px] text-ink-muted truncate">
        {{ formatDate(tx.occurredAt) }}
        <span v-if="tx.wallet && !isTransfer" class="ml-1 text-primary">({{ tx.wallet.name }})</span>
        <span v-if="tx.note">• {{ tx.note }}</span>
      </p>
    </div>

    <div class="text-right flex-shrink-0">
      <p
        class="font-bold text-[14px]"
        :style="{
          color: isTransfer
            ? 'var(--primary)'
            : isIncome
            ? 'var(--income-text)'
            : 'var(--expense-text)'
        }"
      >
        {{ isTransfer ? "" : isIncome ? "+" : "-" }}{{ fmt(tx.amount) }}
      </p>
      <p class="text-[11px] text-ink-muted">
        {{ isTransfer ? "Transfer" : isIncome ? "Pemasukan" : "Pengeluaran" }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.badge-transfer {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1.5px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.25);
  flex-shrink: 0;
  line-height: 1.2;
}

.badge-receipt {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1.5px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid rgba(5, 150, 105, 0.2);
  flex-shrink: 0;
  line-height: 1.2;
}

.badge-manual {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1.5px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  background: var(--surface-2);
  color: var(--ink-muted);
  border: 1px solid var(--line);
  flex-shrink: 0;
  line-height: 1.2;
}
</style>

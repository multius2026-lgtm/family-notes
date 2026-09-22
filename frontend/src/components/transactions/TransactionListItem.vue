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
const name = computed(() => (isIncome.value ? props.tx.incomeSource?.name : props.tx.expenseCategory?.name) || "Lainnya");

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
      <p class="text-[14px] font-semibold text-ink truncate">{{ name }}</p>
      <p class="text-[12px] text-ink-muted truncate">{{ formatDate(tx.occurredAt) }}</p>
    </div>

    <div class="text-right flex-shrink-0">
      <p
        class="font-bold text-[14px]"
        :style="{ color: isIncome ? 'var(--income-text)' : 'var(--expense-text)' }"
      >
        {{ isIncome ? "+" : "-" }}{{ fmt(tx.amount) }}
      </p>
      <p class="text-[11px] text-ink-muted">
        {{ isIncome ? "Pemasukan" : "Pengeluaran" }}
      </p>
    </div>
  </div>
</template>

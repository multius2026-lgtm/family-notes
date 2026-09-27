<script setup lang="ts">
import { useTransactionModal } from "@/composables/useTransactionModal";
import TransactionRow from "@/components/ui/TransactionRow.vue";
import type { Transaction } from "@/types";

const props = defineProps<{ tx: Transaction }>();
const { openModal } = useTransactionModal();

function handleClick() {
  openModal({ editingId: props.tx.id });
}
</script>

<template>
  <TransactionRow :tx="tx" @click="handleClick" />
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

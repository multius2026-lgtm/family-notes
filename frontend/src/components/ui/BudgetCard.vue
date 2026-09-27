<script setup lang="ts">
import { computed } from "vue";
import { useCurrency } from "@/composables/useCurrency";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-vue-next";

const props = defineProps<{
  categoryName: string;
  categoryIcon?: string;
  budgetAmount: number;
  spentAmount: number;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { fmt } = useCurrency();

const percentage = computed(() => {
  if (props.budgetAmount <= 0) return 0;
  return Math.round((props.spentAmount / props.budgetAmount) * 100);
});

const remaining = computed(() => {
  return props.budgetAmount - props.spentAmount;
});

// Status rules per Design System:
// pine = aman (<80%), warn = hampir habis (80-100%), expense = melebihi budget (>100%)
const statusInfo = computed(() => {
  if (percentage.value > 100) {
    return {
      label: "Melebihi Budget",
      fillColor: "var(--expense)",
      textColor: "var(--expense)",
      bgColor: "var(--expense-tint)",
      icon: AlertCircle,
    };
  }
  if (percentage.value >= 80) {
    return {
      label: "Hampir Habis",
      fillColor: "var(--warn)",
      textColor: "var(--warn)",
      bgColor: "var(--warn-tint)",
      icon: AlertTriangle,
    };
  }
  return {
    label: "Aman",
    fillColor: "var(--pine)",
    textColor: "var(--income)",
    bgColor: "var(--income-tint)",
    icon: CheckCircle2,
  };
});
</script>

<template>
  <!-- BudgetCard: Border 1px line, radius r-md (14px), background surface per Design System -->
  <div
    class="budget-card p-3.5 rounded-[14px] bg-surface border border-line cursor-pointer hover:border-line-soft transition-all"
    @click="emit('click')"
  >
    <!-- Top info -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-7 h-7 rounded-[8px] bg-bg flex items-center justify-center text-sm border border-line-soft">
          {{ categoryIcon || '🏷️' }}
        </span>
        <h4 class="text-[12.5px] font-[800] text-ink truncate font-ui leading-tight">
          {{ categoryName }}
        </h4>
      </div>

      <div class="text-right flex-shrink-0">
        <span class="text-[11.5px] font-[700] text-ink font-ui">
          {{ fmt(spentAmount) }}
        </span>
        <span class="text-[10px] font-[600] text-ink-faint">
          / {{ fmt(budgetAmount) }}
        </span>
      </div>
    </div>

    <!-- Progress bar: track line-soft, fill sesuai status per Design System -->
    <div class="w-full h-2 rounded-full overflow-hidden bg-line-soft my-2">
      <div
        class="h-full rounded-full transition-all duration-500"
        :style="{
          width: `${Math.min(100, percentage)}%`,
          backgroundColor: statusInfo.fillColor
        }"
      ></div>
    </div>

    <!-- Bottom row: Sisa & Badge status di kanan bawah per Design System -->
    <div class="flex items-center justify-between text-[11px] pt-1">
      <span class="text-ink-soft font-[600]">
        {{ remaining >= 0 ? `Sisa ${fmt(remaining)}` : `Lebih ${fmt(Math.abs(remaining))}` }}
      </span>

      <!-- Badge status di kanan bawah, warna teks & bg sesuai status -->
      <span
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-[700]"
        :style="{
          backgroundColor: statusInfo.bgColor,
          color: statusInfo.textColor
        }"
      >
        <component :is="statusInfo.icon" :size="11" :stroke-width="2" />
        <span>{{ statusInfo.label }} ({{ percentage }}%)</span>
      </span>
    </div>
  </div>
</template>

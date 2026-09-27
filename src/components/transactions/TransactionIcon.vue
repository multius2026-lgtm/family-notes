<script setup lang="ts">
import { computed } from "vue";
import { getCategoryIconComponent } from "@/composables/useCategoryIcon";

const props = withDefaults(
  defineProps<{
    type?: "income" | "expense" | "transfer";
    categoryName?: string;
    sourceName?: string;
    size?: number;
  }>(),
  {
    type: "expense",
    categoryName: "",
    sourceName: "",
    size: 18,
  }
);

const iconComponent = computed(() => {
  const target = props.type === "income" ? props.sourceName : props.categoryName;
  return getCategoryIconComponent(target, props.type);
});

const colorClasses = computed(() => {
  if (props.type === "transfer") {
    return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
  }
  if (props.type === "income") {
    return "bg-income-tint text-income dark:bg-emerald-950/40 dark:text-income";
  }
  return "bg-bg text-ink dark:bg-surface-2 dark:text-ink";
});
</script>

<template>
  <div
    class="tx-icon inline-flex items-center justify-center rounded-[10px] p-2 border border-line-soft transition-colors"
    :class="colorClasses"
  >
    <component :is="iconComponent" :size="size" :stroke-width="1.8" />
  </div>
</template>

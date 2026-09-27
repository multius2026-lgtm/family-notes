<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  tone?: "income" | "expense" | "neutral";
}>();
</script>

<template>
  <div>
    <div class="text-[11.5px] text-ink-muted mb-1">{{ label }}</div>
    <div
      class="text-[15px] font-bold"
      :class="{
        'text-income': tone === 'income',
        'text-expense': tone === 'expense',
        'text-ink': !tone || tone === 'neutral',
      }"
    >
      {{ value }}
    </div>
  </div>
</template>

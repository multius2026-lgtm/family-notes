<script setup lang="ts">
import { getCategoryEmoji } from "@/composables/useCategoryIcon";

defineProps<{
  items: { id: string; name: string; icon: string | null }[];
  modelValue: string | null;
}>();
const emit = defineEmits<{ (e: "update:modelValue", id: string): void }>();
</script>

<template>
  <div class="relative">
    <select
      class="form-input pr-10 appearance-none cursor-pointer"
      :value="modelValue || ''"
      @change="(e) => emit('update:modelValue', (e.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>Pilih kategori...</option>
      <option v-for="item in items" :key="item.id" :value="item.id">
        {{ getCategoryEmoji(`${item.name} ${item.icon || ''}`) }} {{ item.name }}
      </option>
    </select>
    <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </div>
  </div>
</template>

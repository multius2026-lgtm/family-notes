<script setup lang="ts">
import { computed } from "vue";
import { formatRupiahInput, parseRupiahInput } from "@/composables/useRupiahInput";

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    placeholder?: string;
    inputClass?: string;
    id?: string;
  }>(),
  {
    placeholder: "0",
    inputClass: "",
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
}>();

const display = computed(() => formatRupiahInput(props.modelValue));

function onInput(e: Event) {
  const el = e.target as HTMLInputElement;
  const parsed = parseRupiahInput(el.value);
  emit("update:modelValue", parsed);
  el.value = formatRupiahInput(parsed);
}
</script>

<template>
  <input
    :id="id"
    :value="display"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    :placeholder="placeholder"
    :class="inputClass"
    @input="onInput"
  />
</template>

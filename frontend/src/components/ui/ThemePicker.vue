<script setup lang="ts">
import { useTheme, AVAILABLE_THEMES } from "@/composables/useTheme";

const { currentTheme, setTheme } = useTheme();
</script>

<template>
  <div class="space-y-2">
    <div class="grid grid-cols-2 gap-2.5">
      <button
        v-for="theme in AVAILABLE_THEMES"
        :key="theme.id"
        type="button"
        class="flex items-center gap-3 p-3 rounded-2xl border transition-all text-left"
        :class="[
          currentTheme === theme.id
            ? 'border-2 shadow-sm'
            : 'border-line hover:border-ink-muted/30 bg-surface'
        ]"
        :style="{
          borderColor: currentTheme === theme.id ? theme.primaryColor : undefined,
          background: currentTheme === theme.id ? (theme.isDark ? '#1e293b' : 'var(--surface-2)') : 'var(--surface)'
        }"
        @click="setTheme(theme.id)"
      >
        <!-- Color Circle / Preview -->
        <div
          class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm"
          :style="{ background: theme.gradient }"
        >
          <!-- Checkmark when active -->
          <svg
            v-if="currentTheme === theme.id"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <!-- Theme Name & Tag -->
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-semibold text-ink truncate leading-tight">
            {{ theme.name }}
          </p>
          <p class="text-[10.5px] text-ink-muted truncate mt-0.5">
            {{ theme.isDark ? 'Mode Gelap' : 'Warna Utama' }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const navItems = [
  {
    id: "nav-beranda",
    name: "dashboard",
    label: "Beranda",
    icon: `<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/>`,
  },
  {
    id: "nav-transaksi",
    name: "transactions",
    label: "Transaksi",
    icon: `<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>`,
  },
  {
    id: "nav-laporan",
    name: "laporan",
    label: "Laporan",
    icon: `<path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 4-4"/>`,
  },
  {
    id: "nav-akun",
    name: "settings",
    label: "Akun",
    icon: `<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>`,
  },
];
</script>

<template>
  <nav class="dock-nav">
    <div class="dock-inner">
      <template v-for="(item, i) in navItems" :key="item.id">
        <!-- Insert FAB after index 1 -->
        <button
          v-if="i === 2"
          id="nav-tambah"
          class="dock-fab"
          aria-label="Tambah transaksi"
          @click="router.push({ name: 'add-transaction' })"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
        </button>

        <button
          :id="item.id"
          class="dock-btn"
          :class="{ 'dock-btn--active': route.name === item.name }"
          @click="router.push({ name: item.name })"
        >
          <span class="dock-bubble" :class="{ 'dock-bubble--show': route.name === item.name }"></span>
          <span class="dock-icon-wrap">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              :stroke="route.name === item.name ? 'var(--primary)' : 'var(--ink-muted)'"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              v-html="item.icon"
            />
          </span>
          <span class="dock-label" :style="{ color: route.name === item.name ? 'var(--primary)' : 'var(--ink-muted)' }">
            {{ item.label }}
          </span>
        </button>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.dock-nav {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  display: flex;
  justify-content: center;
  z-index: 40;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  pointer-events: none;
}

.dock-inner {
  pointer-events: all;
  max-width: 480px;
  width: 100%;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border);
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 6px 8px 8px;
  box-shadow: var(--shadow-nav);
  gap: 2px;
}

/* Regular nav button */
.dock-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  position: relative;
  min-width: 48px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dock-btn--active {
  transform: translateY(-6px);
}

/* Bubble indicator */
.dock-bubble {
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  width: 46px; height: 46px;
  border-radius: 50%;
  background: var(--primary-light);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;
  opacity: 0;
  z-index: 0;
}
.dock-bubble--show {
  transform: translateX(-50%) scale(1);
  opacity: 1;
}

.dock-icon-wrap {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
}

.dock-label {
  font-size: 10px;
  font-weight: 700;
  transition: color 0.2s;
  position: relative;
  z-index: 1;
  letter-spacing: 0.1px;
}

/* FAB */
.dock-fab {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  box-shadow: var(--shadow-btn);
  border: none;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s;
  flex-shrink: 0;
}
.dock-fab:hover { transform: scale(1.1); box-shadow: 0 8px 24px rgba(5,150,105,0.5); }
.dock-fab:active { transform: scale(0.92); box-shadow: 0 2px 8px rgba(5,150,105,0.3); }
</style>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const initials = computed(() => {
  const name = auth.user?.name || auth.user?.email || "U";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
});

const navItems = [
  {
    name: "dashboard",
    label: "Beranda",
    icon: `<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/>`,
  },
  {
    name: "transactions",
    label: "Transaksi",
    icon: `<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>`,
  },
  {
    name: "laporan",
    label: "Laporan",
    icon: `<path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 4-4"/>`,
  },
  {
    name: "settings",
    label: "Pengaturan",
    icon: `<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>`,
  },
];
</script>

<template>
  <aside class="sn">
    <!-- Brand -->
    <div class="sn-logo">
      <div class="sn-logo-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/>
          <polyline points="12,8 21,8 21,16 12,16" fill="rgba(255,255,255,0.25)"/>
          <circle cx="16.5" cy="12" r="1.5" fill="white"/>
        </svg>
      </div>
      <div class="sn-brand">
        <span class="sn-brand-name">Family Notes</span>
        <span class="sn-brand-sub">Manajemen Keuangan</span>
      </div>
    </div>

    <!-- Nav items -->
    <nav class="sn-nav">
      <button
        v-for="item in navItems"
        :key="item.name"
        class="sn-item"
        :class="{ 'sn-item--active': route.name === item.name }"
        :title="item.label"
        @click="router.push({ name: item.name })"
      >
        <span class="sn-item-bg"></span>
        <span class="sn-item-icon-wrap">
          <svg
            class="sn-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            v-html="item.icon"
          />
        </span>
        <span class="sn-label">{{ item.label }}</span>
        <span class="sn-tip">{{ item.label }}</span>
      </button>
    </nav>

    <!-- Add button -->
    <div class="sn-add-wrap">
      <button class="sn-add-btn" title="Tambah Transaksi" @click="router.push({ name: 'add-transaction' })">
        <span class="sn-add-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"/><path d="M5 12h14"/>
          </svg>
        </span>
        <span class="sn-label">Tambah Transaksi</span>
      </button>
    </div>

    <div class="sn-spacer"></div>

    <!-- User -->
    <div class="sn-user">
      <div class="sn-avatar">{{ initials }}</div>
      <div class="sn-user-info">
        <p class="sn-user-name">{{ auth.user?.name || "Pengguna" }}</p>
        <p class="sn-user-email">{{ auth.user?.email }}</p>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sn { display: none; }

@media (min-width: 768px) {
  .sn {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0;
    height: 100vh;
    width: 76px;
    background: var(--surface);
    border-right: 1px solid var(--line);
    z-index: 30;
    padding: 20px 0 16px;
    overflow: hidden;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
    box-shadow: 2px 0 20px rgba(0,0,0,0.05);
  }
}

@media (min-width: 1024px) {
  .sn { width: 248px; box-shadow: none; }
}

.sn-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  margin-bottom: 28px;
  min-width: 248px;
}

.sn-logo-icon {
  width: 40px; height: 40px;
  border-radius: 14px;
  background: var(--primary-gradient);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--primary-glow);
}

.sn-brand { overflow: hidden; }

.sn-brand-name {
  display: block;
  font-size: 15px; font-weight: 800;
  color: var(--ink);
  white-space: nowrap;
  letter-spacing: -0.3px;
}

.sn-brand-sub {
  display: block;
  font-size: 10.5px; font-weight: 600;
  color: var(--ink-muted);
  white-space: nowrap;
}

.sn-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
}

.sn-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 14px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--ink-muted);
  transition: color 0.2s, background 0.2s;
  width: 100%;
  white-space: nowrap;
  min-width: 0;
}
.sn-item:hover { color: var(--ink); background: var(--surface-2); }
.sn-item--active { color: var(--primary); background: var(--primary-light); }

.sn-item-bg { display: none; }
.sn-item--active .sn-item-bg {
  display: block;
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 55%;
  border-radius: 0 3px 3px 0;
  background: var(--primary);
}

.sn-item-icon-wrap {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}
.sn-item--active .sn-item-icon-wrap { background: var(--primary-light); }
.sn-icon { flex-shrink: 0; }

.sn-label {
  font-size: 14px; font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0; width: 0;
  transition: opacity 0.2s, width 0.2s;
}
@media (min-width: 1024px) {
  .sn-label { opacity: 1; width: auto; }
}

.sn-tip {
  display: none;
  position: absolute;
  left: calc(100% + 14px);
  top: 50%; transform: translateY(-50%);
  background: var(--ink); color: #fff;
  font-size: 12px; font-weight: 700;
  padding: 6px 12px;
  border-radius: 10px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.sn-tip::before {
  content: '';
  position: absolute;
  right: 100%; top: 50%;
  transform: translateY(-50%);
  border: 5px solid transparent;
  border-right-color: var(--ink);
}
@media (min-width: 768px) and (max-width: 1023px) {
  .sn-item:hover .sn-tip { display: block; }
}

.sn-add-wrap { padding: 12px 10px; margin-top: 8px; }

.sn-add-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: var(--primary-gradient);
  color: white;
  font-weight: 800; font-size: 14px;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: var(--shadow-btn);
  white-space: nowrap;
  justify-content: center;
}
.sn-add-btn:hover { opacity: 0.9; box-shadow: 0 8px 24px rgba(5,150,105,0.5); }
.sn-add-btn:active { transform: scale(0.97); }

.sn-add-icon {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .sn-add-btn { justify-content: flex-start; padding: 11px 14px; }
}

.sn-spacer { flex: 1; }

.sn-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 10px;
  border-top: 1px solid var(--line);
  margin-top: 8px;
  min-width: 248px;
}

.sn-avatar {
  width: 38px; height: 38px;
  border-radius: 12px;
  background: var(--primary-gradient);
  color: white;
  font-size: 13px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(5,150,105,0.3);
}

.sn-user-info { overflow: hidden; }

.sn-user-name {
  font-size: 13px; font-weight: 700;
  color: var(--ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin: 0;
}

.sn-user-email {
  font-size: 11px;
  color: var(--ink-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin: 0;
}
</style>

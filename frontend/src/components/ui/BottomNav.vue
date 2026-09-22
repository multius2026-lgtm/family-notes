<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
</script>

<template>
  <nav class="bottom-nav">
    <div class="bottom-nav-inner">
      <!-- Beranda -->
      <button
        id="nav-beranda"
        class="nav-btn"
        :class="route.name === 'dashboard' ? 'active' : ''"
        @click="router.push({ name: 'dashboard' })"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 11.5 12 4l9 7.5"/>
          <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/>
        </svg>
        <span>Beranda</span>
      </button>

      <!-- Transaksi -->
      <button
        id="nav-transaksi"
        class="nav-btn"
        :class="route.name === 'transactions' ? 'active' : ''"
        @click="router.push({ name: 'transactions' })"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/>
          <path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>
        </svg>
        <span>Transaksi</span>
      </button>

      <!-- FAB Tambah -->
      <button
        id="nav-tambah"
        class="nav-btn-fab"
        @click="router.push({ name: 'add-transaction' })"
        aria-label="Tambah transaksi"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
      </button>

      <!-- Laporan -->
      <button
        id="nav-laporan"
        class="nav-btn"
        :class="route.name === 'laporan' ? 'active' : ''"
        @click="router.push({ name: 'laporan' })"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 4-4"/>
        </svg>
        <span>Laporan</span>
      </button>

      <!-- Akun -->
      <button
        id="nav-akun"
        class="nav-btn"
        :class="route.name === 'settings' ? 'active' : ''"
        @click="router.push({ name: 'settings' })"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        <span>Akun</span>
      </button>
    </div>
  </nav>
</template>

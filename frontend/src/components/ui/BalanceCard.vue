<script setup lang="ts">
import { useCurrency } from "@/composables/useCurrency";
import { usePrivacyMode } from "@/composables/usePrivacyMode";
import { useTransactionModal } from "@/composables/useTransactionModal";
import type { Wallet } from "@/types";
import { Eye, EyeOff, ArrowLeftRight, Plus, Wallet as WalletIcon } from "lucide-vue-next";

const props = defineProps<{
  totalBalance: number;
  wallets: Wallet[];
  periodLabel?: string;
}>();

const emit = defineEmits<{
  addWallet: [];
  selectWallet: [wallet: Wallet];
}>();

const { fmt } = useCurrency();
const { isPrivacyMode, togglePrivacy, maskValue } = usePrivacyMode();
const { openModal } = useTransactionModal();
</script>

<template>
  <div class="balance-card relative overflow-hidden text-white p-5 rounded-[22px] select-none">
    <!-- Background Gradient: pine -> pine-2 (155deg) per Design System -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background: linear-gradient(155deg, #123B31 0%, #1C5445 100%);"
    ></div>

    <!-- Soft ambient background lights -->
    <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full pointer-events-none opacity-20 bg-white blur-xl"></div>
    <div class="absolute -left-6 -bottom-6 w-28 h-28 rounded-full pointer-events-none opacity-10 bg-gold blur-lg"></div>

    <div class="relative z-10">
      <!-- Top Row: Label & Privacy Button -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-[11.5px] font-[700] text-white/75 uppercase tracking-wider font-ui">
            Total Saldo Bersih
          </span>
          <button
            type="button"
            class="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            :title="isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'"
            @click="togglePrivacy"
          >
            <component :is="isPrivacyMode ? EyeOff : Eye" :size="14" :stroke-width="1.8" />
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Quick Transfer button -->
          <button
            type="button"
            class="px-2.5 py-1 rounded-[10px] bg-white/14 hover:bg-white/20 text-white text-[11px] font-[700] flex items-center gap-1 transition-all active:scale-[0.98]"
            title="Transfer Saldo Antar Dompet"
            @click="openModal({ type: 'transfer' })"
          >
            <ArrowLeftRight :size="12" :stroke-width="2" />
            <span>Transfer</span>
          </button>

          <!-- Add wallet -->
          <button
            type="button"
            class="w-7 h-7 rounded-[10px] bg-white/14 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-[0.98]"
            title="Tambah Dompet Baru"
            @click="emit('addWallet')"
          >
            <Plus :size="14" :stroke-width="2" />
          </button>
        </div>
      </div>

      <!-- Main Balance: Fraunces italic 29px (28-32px weight 500) per Design System -->
      <div class="my-2.5">
        <h2 class="text-[29px] leading-tight font-[500] font-display text-white tracking-tight">
          {{ maskValue(fmt(totalBalance)) }}
        </h2>
        <p v-if="periodLabel" class="text-[11px] font-[600] text-white/60 mt-0.5">
          {{ periodLabel }}
        </p>
      </div>

      <!-- Wallet chips: pill kecil, background putih transparan 14%, radius 20px per Design System -->
      <div class="mt-4 pt-3 border-t border-white/10">
        <p class="text-[10.5px] font-[700] text-white/70 uppercase tracking-wider mb-2 font-ui">
          Akun & Dompet
        </p>
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            v-for="w in wallets"
            :key="w.id"
            type="button"
            class="wallet-chip flex items-center gap-2 px-3 py-1.5 rounded-[20px] bg-white/14 hover:bg-white/22 text-white transition-all flex-shrink-0 active:scale-[0.98]"
            @click="emit('selectWallet', w)"
          >
            <span class="text-xs">{{ w.icon || '💵' }}</span>
            <span class="text-[12px] font-[700] truncate max-w-[90px]">{{ w.name }}</span>
            <span class="text-[11px] font-[600] text-white/80">{{ maskValue(fmt(w.balance)) }}</span>
          </button>

          <button
            v-if="wallets.length === 0"
            type="button"
            class="px-3 py-1.5 rounded-[20px] bg-white/10 hover:bg-white/15 text-white/80 text-[11.5px] font-[600] flex items-center gap-1.5"
            @click="emit('addWallet')"
          >
            <Plus :size="12" />
            <span>Tambah Akun</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.balance-card {
  box-shadow: 0 1px 2px rgba(18,25,21,.04), 0 6px 20px rgba(18,25,21,.06);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

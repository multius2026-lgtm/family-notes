<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useMasterDataStore } from "@/stores/masterData";
import { useWalletsStore } from "@/stores/wallets";
import CategoryPicker from "./CategoryPicker.vue";
import type { PeriodType, TransactionType, ReceiptItem } from "@/types";
import { PERIOD_LABEL } from "@/types";
import RupiahInput from "@/components/ui/RupiahInput.vue";
import { useCurrency } from "@/composables/useCurrency";

export interface TxFormState {
  type: TransactionType;
  amount: number | null;
  periodType: PeriodType;
  incomeSourceId: string | null;
  expenseCategoryId: string | null;
  note: string;
  occurredAt: string;
  receiptUrl?: string | null;
  isOcr?: boolean;
  receiptItems?: ReceiptItem[] | null;
  walletId?: string | null;
  transferToWalletId?: string | null;
}

const form = defineModel<TxFormState>({ required: true });
const master = useMasterDataStore();
const walletsStore = useWalletsStore();
const { fmt } = useCurrency();

const isIncome = computed(() => form.value.type === "income");
const isExpense = computed(() => form.value.type === "expense");
const isTransfer = computed(() => form.value.type === "transfer");

// Mini Calculator State
const showCalculator = ref(false);
const calcInput = ref("");

function openCalculator() {
  calcInput.value = form.value.amount ? String(form.value.amount) : "";
  showCalculator.value = true;
}

function appendCalc(char: string) {
  calcInput.value += char;
}

function clearCalc() {
  calcInput.value = "";
}

function deleteCalcChar() {
  calcInput.value = calcInput.value.slice(0, -1);
}

function calculateResult() {
  try {
    // Sanitasi hanya angka dan operator matematika dasar
    const sanitized = calcInput.value.replace(/[^0-9+\-*/.]/g, "");
    if (!sanitized) return;
    // Evaluasi rumus sederhana
    const res = Function(`"use strict"; return (${sanitized})`)();
    if (!isNaN(res) && isFinite(res)) {
      form.value.amount = Math.max(0, Math.round(res));
      showCalculator.value = false;
    }
  } catch (e) {
    // Jika ekspresi tidak valid
  }
}

onMounted(async () => {
  if (walletsStore.items.length === 0) {
    await walletsStore.fetchList();
  }
  // Pasang default wallet jika belum dipilih
  if (!form.value.walletId && walletsStore.defaultWallet) {
    form.value.walletId = walletsStore.defaultWallet.id;
  }
  if (isTransfer.value && !form.value.transferToWalletId && walletsStore.items.length > 1) {
    const secondWallet = walletsStore.items.find((w) => w.id !== form.value.walletId);
    if (secondWallet) form.value.transferToWalletId = secondWallet.id;
  }
});

function setType(t: TransactionType) {
  form.value.type = t;
  if (t === "transfer") {
    if (!form.value.transferToWalletId && walletsStore.items.length > 1) {
      const secondWallet = walletsStore.items.find((w) => w.id !== form.value.walletId);
      if (secondWallet) form.value.transferToWalletId = secondWallet.id;
    }
  }
}

function pickSource(id: string) {
  form.value.incomeSourceId = id;
  const src = master.incomeSources.find((s) => s.id === id);
  if (src) form.value.periodType = src.defaultPeriodType;
}

const SOURCE_ICONS: Record<string, string> = {
  Gaji: "💰",
  Freelance: "💼",
  Bonus: "🎁",
  Investasi: "📈",
  Lainnya: "💳",
};

const EXPENSE_ICONS: Record<string, string> = {
  Makanan: "🍔",
  "Makanan & Minuman": "🍔",
  Transportasi: "🚗",
  Belanja: "🛍️",
  Tagihan: "💡",
  Lainnya: "📦",
  Hiburan: "🎬",
  Kesehatan: "💊",
};
</script>

<template>
  <div>
    <!-- Tab Toggle 3 Pilihan: Pemasukan / Pengeluaran / Transfer -->
    <div class="tab-toggle mb-5 grid grid-cols-3 p-1 rounded-2xl bg-surface-2 border border-line">
      <button
        type="button"
        class="tab-btn py-2 text-[13px] font-bold rounded-xl transition-all"
        :class="isIncome ? 'active-income' : ''"
        @click="setType('income')"
      >
        Pemasukan
      </button>
      <button
        type="button"
        class="tab-btn py-2 text-[13px] font-bold rounded-xl transition-all"
        :class="isExpense ? 'active-expense' : ''"
        @click="setType('expense')"
      >
        Pengeluaran
      </button>
      <button
        type="button"
        class="tab-btn py-2 text-[13px] font-bold rounded-xl transition-all"
        :class="isTransfer ? 'active-transfer' : ''"
        @click="setType('transfer')"
      >
        Transfer
      </button>
    </div>

    <!-- ═══ Pilihan Dompet (Untuk Pemasukan / Pengeluaran) ═══ -->
    <div v-if="!isTransfer" class="mb-4">
      <label class="form-label flex items-center justify-between">
        <span>{{ isIncome ? 'Masuk ke akun / dompet' : 'Keluar dari akun / dompet' }}</span>
        <span v-if="form.walletId" class="text-[11px] font-semibold text-primary">
          Saldo: {{ fmt(walletsStore.items.find(w => w.id === form.walletId)?.balance || 0) }}
        </span>
      </label>
      <p class="text-[11px] text-ink-muted mb-2">
        Pilih akun tujuan transaksi. Total saldo beranda adalah jumlah seluruh akun.
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="w in walletsStore.items"
          :key="w.id"
          type="button"
          class="wallet-select-btn"
          :class="{ 'wallet-selected': form.walletId === w.id }"
          @click="form.walletId = w.id"
        >
          <span
            class="w-7 h-7 rounded-lg flex items-center justify-center text-base text-white shrink-0"
            :style="{ background: w.color || '#10b981' }"
          >{{ w.icon || '💵' }}</span>
          <div class="text-left min-w-0 flex-1">
            <p class="text-[12px] font-bold truncate leading-tight">{{ w.name }}</p>
            <p class="text-[10px] text-ink-muted truncate">{{ fmt(w.balance) }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- ═══ Pilihan Transfer Antar Dompet (Jika Transfer) ═══ -->
    <div v-if="isTransfer" class="mb-4 space-y-3 p-3.5 rounded-2xl bg-surface-2 border border-line">
      <div>
        <label class="form-label text-xs">Dari Dompet (Sumber Saldo)</label>
        <select
          v-model="form.walletId"
          class="form-input text-sm font-semibold"
        >
          <option v-for="w in walletsStore.items" :key="w.id" :value="w.id">
            {{ w.icon }} {{ w.name }} (Saldo: {{ fmt(w.balance) }})
          </option>
        </select>
      </div>

      <div class="flex justify-center -my-1">
        <span class="w-7 h-7 rounded-full bg-surface border border-line flex items-center justify-center text-xs text-ink-muted">
          ↓
        </span>
      </div>

      <div>
        <label class="form-label text-xs">Ke Dompet (Tujuan Transfer)</label>
        <select
          v-model="form.transferToWalletId"
          class="form-input text-sm font-semibold"
        >
          <option
            v-for="w in walletsStore.items"
            :key="w.id"
            :value="w.id"
            :disabled="w.id === form.walletId"
          >
            {{ w.icon }} {{ w.name }} (Saldo: {{ fmt(w.balance) }})
          </option>
        </select>
      </div>
    </div>

    <!-- Kategori / Sumber (Hanya Pemasukan & Pengeluaran) -->
    <div v-if="!isTransfer" class="mb-4">
      <label class="form-label">Kategori</label>
      <div class="relative">
        <CategoryPicker
          v-if="isIncome"
          :items="master.incomeSources"
          :model-value="form.incomeSourceId"
          @update:model-value="pickSource"
        />
        <CategoryPicker
          v-else-if="isExpense"
          :items="master.expenseCategories"
          :model-value="form.expenseCategoryId"
          @update:model-value="(id) => (form.expenseCategoryId = id)"
        />
      </div>
    </div>

    <!-- Jumlah Nominal + Kalkulator Built-in -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-1.5">
        <label class="form-label m-0">Jumlah</label>
        <button
          type="button"
          class="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
          @click="openCalculator"
        >
          <span>🧮</span> Kalkulator
        </button>
      </div>

      <div
        class="flex items-center border-[1.5px] rounded-xl overflow-hidden transition-all focus-within:ring-2"
        :style="{
          borderColor: 'var(--line)',
          background: 'var(--surface)',
          '--tw-ring-color': isIncome ? 'var(--income-soft)' : isExpense ? 'var(--expense-soft)' : 'var(--primary-light)',
        }"
        style="border-radius: 12px;"
      >
        <span
          class="shrink-0 px-4 py-[13px] font-bold text-[15px] border-r-[1.5px]"
          style="color: var(--ink-muted); border-color: var(--line); background: var(--surface-2);"
        >Rp</span>
        <RupiahInput
          v-model="form.amount"
          placeholder="0"
          input-class="flex-1 px-4 py-[13px] font-bold text-[18px] outline-none bg-transparent"
        />
      </div>
    </div>

    <!-- Periode — hanya untuk pemasukan -->
    <div v-if="isIncome" class="mb-4">
      <label class="form-label">Periode pemasukan ini</label>
      <div class="flex gap-2">
        <button
          v-for="p in (['daily', 'weekly', 'monthly'] as const)"
          :key="p"
          type="button"
          class="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-all"
          :style="form.periodType === p
            ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }
            : { background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink-muted)' }"
          @click="form.periodType = p"
        >
          {{ PERIOD_LABEL[p] }}
        </button>
      </div>
    </div>

    <!-- Tanggal -->
    <div class="mb-4">
      <label class="form-label">Tanggal</label>
      <div class="relative">
        <input
          v-model="form.occurredAt"
          type="date"
          class="form-input"
        />
        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </span>
      </div>
    </div>

    <!-- Catatan -->
    <div class="mb-4">
      <label class="form-label">Catatan (opsional)</label>
      <input
        v-model="form.note"
        type="text"
        :placeholder="isTransfer ? 'mis. Pindah saldo ke e-wallet' : isIncome ? 'mis. Gaji pokok' : 'mis. Makan siang'"
        class="form-input"
      />
    </div>

    <!-- Quick Add (Hanya jika bukan transfer) -->
    <div
      v-if="!isTransfer && (isIncome ? master.incomeSources.length > 0 : master.expenseCategories.length > 0)"
      class="mb-6"
    >
      <label class="form-label mb-3">Quick Add</label>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="item in (isIncome ? master.incomeSources : master.expenseCategories).slice(0, 8)"
          :key="item.id"
          type="button"
          class="quick-add-item"
          :style="{
            borderColor: (isIncome ? form.incomeSourceId === item.id : form.expenseCategoryId === item.id)
              ? 'var(--primary)' : 'var(--line)',
            background: (isIncome ? form.incomeSourceId === item.id : form.expenseCategoryId === item.id)
              ? 'var(--primary-light)' : 'var(--surface)'
          }"
          @click="isIncome ? pickSource(item.id) : (form.expenseCategoryId = item.id)"
        >
          <div
            class="quick-icon"
            :style="{
              background: (isIncome ? form.incomeSourceId === item.id : form.expenseCategoryId === item.id)
                ? 'var(--primary-light)' : 'var(--surface-2)'
            }"
          >
            <span>{{
              isIncome
                ? (SOURCE_ICONS[item.name] || '💳')
                : (EXPENSE_ICONS[item.name] || '📦')
            }}</span>
          </div>
          <span class="text-[10.5px] text-center leading-tight font-medium" :style="{ color: 'var(--ink-muted)' }">
            {{ item.name }}
          </span>
        </button>
      </div>
    </div>

    <!-- ════ Modal Mini Kalkulator Built-in ════ -->
    <Teleport to="body">
      <div v-if="showCalculator" class="calc-overlay" @click="showCalculator = false">
        <div class="calc-modal" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-line mb-3">
            <h3 class="text-sm font-bold text-ink">Kalkulator Built-in</h3>
            <button class="text-ink-muted text-lg leading-none" @click="showCalculator = false">✕</button>
          </div>

          <!-- Display Kalkulator -->
          <div class="calc-display mb-3 p-3 rounded-xl bg-surface-2 border border-line text-right">
            <p class="text-xs text-ink-muted h-4 m-0">{{ calcInput || '0' }}</p>
            <p class="text-xl font-black text-ink m-0">{{ calcInput || '0' }}</p>
          </div>

          <!-- Tombol Pad -->
          <div class="grid grid-cols-4 gap-2">
            <button type="button" class="calc-btn calc-btn-op" @click="clearCalc">C</button>
            <button type="button" class="calc-btn calc-btn-op" @click="deleteCalcChar">⌫</button>
            <button type="button" class="calc-btn calc-btn-op" @click="appendCalc('/')">÷</button>
            <button type="button" class="calc-btn calc-btn-op" @click="appendCalc('*')">×</button>

            <button type="button" class="calc-btn" @click="appendCalc('7')">7</button>
            <button type="button" class="calc-btn" @click="appendCalc('8')">8</button>
            <button type="button" class="calc-btn" @click="appendCalc('9')">9</button>
            <button type="button" class="calc-btn calc-btn-op" @click="appendCalc('-')">−</button>

            <button type="button" class="calc-btn" @click="appendCalc('4')">4</button>
            <button type="button" class="calc-btn" @click="appendCalc('5')">5</button>
            <button type="button" class="calc-btn" @click="appendCalc('6')">6</button>
            <button type="button" class="calc-btn calc-btn-op" @click="appendCalc('+')">+</button>

            <button type="button" class="calc-btn" @click="appendCalc('1')">1</button>
            <button type="button" class="calc-btn" @click="appendCalc('2')">2</button>
            <button type="button" class="calc-btn" @click="appendCalc('3')">3</button>
            <button type="button" class="calc-btn calc-btn-eq row-span-2" @click="calculateResult">=</button>

            <button type="button" class="calc-btn col-span-2" @click="appendCalc('0')">0</button>
            <button type="button" class="calc-btn" @click="appendCalc('000')">000</button>
          </div>

          <button
            type="button"
            class="btn-primary w-full mt-3 py-2.5 text-xs font-bold"
            @click="calculateResult"
          >
            Terapkan ke Jumlah
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.active-transfer {
  background: var(--surface) !important;
  color: var(--primary) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.wallet-select-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1.5px solid var(--line);
  background: var(--surface);
  cursor: pointer;
  transition: all 0.15s ease;
}
.wallet-select-btn:hover {
  border-color: var(--primary);
  background: var(--primary-light);
}
.wallet-selected {
  border-color: var(--primary) !important;
  background: var(--primary-light) !important;
}

/* Kalkulator Modal */
.calc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.calc-modal {
  width: 100%;
  max-width: 320px;
  background: var(--surface);
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.25);
  border: 1px solid var(--line);
}
.calc-btn {
  padding: 12px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  background: var(--surface-2);
  color: var(--ink);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: opacity 0.15s;
}
.calc-btn:active {
  opacity: 0.7;
}
.calc-btn-op {
  background: var(--surface-3);
  color: var(--primary);
}
.calc-btn-eq {
  background: var(--primary);
  color: white;
}
</style>

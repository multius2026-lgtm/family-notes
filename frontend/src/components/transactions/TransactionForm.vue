<script setup lang="ts">
import { computed } from "vue";
import { useMasterDataStore } from "@/stores/masterData";
import CategoryPicker from "./CategoryPicker.vue";
import type { PeriodType, TransactionType } from "@/types";
import { PERIOD_LABEL } from "@/types";

export interface TxFormState {
  type: TransactionType;
  amount: number | null;
  periodType: PeriodType;
  incomeSourceId: string | null;
  expenseCategoryId: string | null;
  note: string;
  occurredAt: string;
}

const form = defineModel<TxFormState>({ required: true });
const master = useMasterDataStore();

const isIncome = computed(() => form.value.type === "income");

function setType(t: TransactionType) {
  form.value.type = t;
}

function pickSource(id: string) {
  form.value.incomeSourceId = id;
  const src = master.incomeSources.find((s) => s.id === id);
  if (src) form.value.periodType = src.defaultPeriodType;
}

const SOURCE_ICONS: Record<string, string> = {
  "Gaji": "💰",
  "Freelance": "💼",
  "Bonus": "🎁",
  "Investasi": "📈",
  "Lainnya": "💳",
};

const EXPENSE_ICONS: Record<string, string> = {
  "Makanan": "🍔",
  "Makanan & Minuman": "🍔",
  "Transportasi": "🚗",
  "Belanja": "🛍️",
  "Tagihan": "💡",
  "Lainnya": "📦",
  "Hiburan": "🎬",
  "Kesehatan": "💊",
};
</script>

<template>
  <div>
    <!-- Tab Toggle: Pemasukan / Pengeluaran -->
    <div class="tab-toggle mb-5">
      <button
        type="button"
        class="tab-btn"
        :class="isIncome ? 'active-income' : ''"
        @click="setType('income')"
      >
        Pemasukan
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="!isIncome ? 'active-expense' : ''"
        @click="setType('expense')"
      >
        Pengeluaran
      </button>
    </div>

    <!-- Kategori / Sumber -->
    <div class="mb-4">
      <label class="form-label">Kategori</label>
      <div class="relative">
        <CategoryPicker
          v-if="isIncome"
          :items="master.incomeSources"
          :model-value="form.incomeSourceId"
          @update:model-value="pickSource"
        />
        <CategoryPicker
          v-else
          :items="master.expenseCategories"
          :model-value="form.expenseCategoryId"
          @update:model-value="(id) => (form.expenseCategoryId = id)"
        />
      </div>
    </div>

    <!-- Jumlah -->
    <div class="mb-4">
      <label class="form-label">Jumlah</label>
      <div class="relative">
        <span
          class="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink-muted text-[15px]"
        >Rp</span>
        <input
          v-model.number="form.amount"
          type="number"
          inputmode="numeric"
          placeholder="0"
          class="form-input pl-12 font-bold text-[18px]"
          :style="{ color: isIncome ? 'var(--income-text)' : 'var(--expense-text)' }"
        />
      </div>
    </div>

    <!-- Periode — hanya untuk pemasukan -->
    <div v-if="isIncome" class="mb-4">
      <label class="form-label">Periode pemasukan ini</label>
      <div
        class="flex gap-2"
      >
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
        placeholder="mis. Gaji Mei 2024"
        class="form-input"
      />
    </div>

    <!-- Quick Add -->
    <div class="mb-6" v-if="!isIncome ? master.expenseCategories.length > 0 : master.incomeSources.length > 0">
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
  </div>
</template>

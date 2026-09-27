<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDebtsStore } from "@/stores/debts";
import { useCurrency } from "@/composables/useCurrency";
import type { Debt, DebtType } from "@/types";

const debtsStore = useDebtsStore();
const { fmt } = useCurrency();

const filterType = ref<"all" | "debt" | "loan">("all");
const showAddModal = ref(false);
const showPayModal = ref(false);
const activeDebt = ref<Debt | null>(null);

// Form Catat
const formType = ref<DebtType>("debt");
const formPerson = ref("");
const formAmount = ref<number | null>(null);
const formDueDate = ref("");
const formNotes = ref("");

// Form Cicil
const payAmount = ref<number | null>(null);

onMounted(async () => {
  await debtsStore.fetchList();
});

const filteredItems = computed(() => {
  if (filterType.value === "all") return debtsStore.items;
  return debtsStore.items.filter((d) => d.type === filterType.value);
});

function openAddModal(type: DebtType = "debt") {
  formType.value = type;
  formPerson.value = "";
  formAmount.value = null;
  formDueDate.value = "";
  formNotes.value = "";
  showAddModal.value = true;
}

function openPayModal(item: Debt) {
  activeDebt.value = item;
  payAmount.value = item.remainingAmount;
  showPayModal.value = true;
}

async function saveDebt() {
  if (!formPerson.value.trim() || !formAmount.value || formAmount.value <= 0) return;
  await debtsStore.create({
    type: formType.value,
    personName: formPerson.value.trim(),
    amount: formAmount.value,
    dueDate: formDueDate.value || null,
    notes: formNotes.value.trim() || null,
  });
  showAddModal.value = false;
}

async function submitPayment() {
  if (!activeDebt.value || !payAmount.value || payAmount.value <= 0) return;
  await debtsStore.payInstallment(activeDebt.value.id, payAmount.value);
  showPayModal.value = false;
}

async function deleteDebt(id: string) {
  if (!confirm("Hapus catatan ini?")) return;
  await debtsStore.remove(id);
}
</script>

<template>
  <div class="debts-card mb-5">
    <div class="flex items-center justify-between mb-3 px-1">
      <div>
        <h3 class="text-xs font-bold text-ink-muted uppercase tracking-wider m-0">Utang & Piutang</h3>
        <div class="flex items-center gap-3 mt-1">
          <span class="text-xs font-bold" style="color: var(--expense-text)">
            Utang: {{ fmt(debtsStore.totalDebt) }}
          </span>
          <span class="text-xs font-bold" style="color: var(--income-text)">
            Piutang: {{ fmt(debtsStore.totalLoan) }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="btn-add-debt"
        @click="openAddModal('debt')"
      >
        + Catat
      </button>
    </div>

    <!-- Filter chips -->
    <div class="flex gap-1.5 mb-3">
      <button
        type="button"
        class="filter-chip"
        :class="{ active: filterType === 'all' }"
        @click="filterType = 'all'"
      >
        Semua
      </button>
      <button
        type="button"
        class="filter-chip"
        :class="{ active: filterType === 'debt' }"
        @click="filterType = 'debt'"
      >
        Utang Saya
      </button>
      <button
        type="button"
        class="filter-chip"
        :class="{ active: filterType === 'loan' }"
        @click="filterType = 'loan'"
      >
        Piutang
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="filteredItems.length === 0" class="empty-debts-box text-center py-4">
      <p class="text-xs text-ink-muted m-0">Tidak ada data utang atau piutang.</p>
    </div>

    <!-- List Utang / Piutang -->
    <div v-else class="space-y-2.5">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="debt-item-box"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              :style="{
                background: item.type === 'debt' ? 'var(--expense-soft)' : 'var(--income-soft)',
                color: item.type === 'debt' ? 'var(--expense-text)' : 'var(--income-text)'
              }"
            >
              {{ item.type === 'debt' ? 'U' : 'P' }}
            </span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-ink truncate m-0">
                {{ item.personName }}
                <span class="text-[10px] text-ink-muted font-normal ml-1">({{ item.type === 'debt' ? 'Utang saya' : 'Piutang' }})</span>
              </p>
              <p v-if="item.dueDate" class="text-[10px] text-ink-muted m-0">Jatuh tempo: {{ item.dueDate }}</p>
            </div>
          </div>

          <div class="text-right shrink-0">
            <p
              class="text-xs font-black m-0"
              :style="{ color: item.type === 'debt' ? 'var(--expense-text)' : 'var(--income-text)' }"
            >
              {{ fmt(item.remainingAmount) }}
            </p>
            <p v-if="item.remainingAmount !== item.amount" class="text-[10px] text-ink-muted m-0 line-through">
              {{ fmt(item.amount) }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 mt-2 border-t border-line">
          <span
            class="text-[10px] font-bold px-1.5 py-0.5 rounded"
            :class="{
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300': item.status === 'paid',
              'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300': item.status === 'partial',
              'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300': item.status === 'unpaid',
            }"
          >
            {{ item.status === 'paid' ? 'Lunas' : item.status === 'partial' ? 'Dicicil Sebagian' : 'Belum Lunas' }}
          </span>

          <div class="flex items-center gap-2">
            <button
              v-if="item.status !== 'paid'"
              type="button"
              class="btn-cicil"
              @click="openPayModal(item)"
            >
              {{ item.type === 'debt' ? 'Bayar' : 'Terima' }}
            </button>
            <button
              type="button"
              class="text-ink-muted hover:text-rose-500 text-xs px-1"
              @click="deleteDebt(item.id)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ════ Modal Tambah Utang / Piutang ════ -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
        <div class="modal-sheet" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-line mb-3">
            <h3 class="text-sm font-bold text-ink m-0">Catat Utang / Piutang</h3>
            <button class="text-ink-muted text-lg" @click="showAddModal = false">✕</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="form-label text-xs">Jenis Catatan</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="py-2 text-xs font-bold rounded-xl border transition-all"
                  :class="formType === 'debt' ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300' : 'border-line bg-surface-2 text-ink-muted'"
                  @click="formType = 'debt'"
                >
                  Utang (Saya Berutang)
                </button>
                <button
                  type="button"
                  class="py-2 text-xs font-bold rounded-xl border transition-all"
                  :class="formType === 'loan' ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300' : 'border-line bg-surface-2 text-ink-muted'"
                  @click="formType = 'loan'"
                >
                  Piutang (Orang Lain)
                </button>
              </div>
            </div>

            <div>
              <label class="form-label text-xs">Nama Orang / Lembaga</label>
              <input v-model="formPerson" placeholder="mis. Budi, Teman Kantor, Bank" class="form-input text-sm" />
            </div>

            <div>
              <label class="form-label text-xs">Jumlah Nominal (Rp)</label>
              <input v-model.number="formAmount" type="number" placeholder="500000" class="form-input text-sm font-bold" />
            </div>

            <div>
              <label class="form-label text-xs">Jatuh Tempo (Opsional)</label>
              <input v-model="formDueDate" type="date" class="form-input text-sm" />
            </div>

            <div>
              <label class="form-label text-xs">Catatan (Opsional)</label>
              <input v-model="formNotes" placeholder="mis. Pinjaman untuk belanja" class="form-input text-sm" />
            </div>
          </div>

          <button type="button" class="btn-primary w-full mt-4 py-2.5 text-xs font-bold" @click="saveDebt">
            Simpan Catatan
          </button>
        </div>
      </div>
    </Teleport>

    <!-- ════ Modal Bayar / Cicil ════ -->
    <Teleport to="body">
      <div v-if="showPayModal && activeDebt" class="modal-overlay" @click="showPayModal = false">
        <div class="modal-sheet" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-line mb-3">
            <h3 class="text-sm font-bold text-ink m-0">
              {{ activeDebt.type === 'debt' ? 'Bayar Utang' : 'Terima Pembayaran' }}
            </h3>
            <button class="text-ink-muted text-lg" @click="showPayModal = false">✕</button>
          </div>

          <p class="text-xs text-ink-muted mb-2">
            Pihak: <strong>{{ activeDebt.personName }}</strong> • Sisa: <strong>{{ fmt(activeDebt.remainingAmount) }}</strong>
          </p>

          <div class="mb-3">
            <label class="form-label text-xs">Nominal yang Dibayarkan (Rp)</label>
            <input
              v-model.number="payAmount"
              type="number"
              class="form-input text-base font-bold text-primary"
            />
          </div>

          <button type="button" class="btn-primary w-full py-2.5 text-xs font-bold" @click="submitPayment">
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.debts-card {
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.btn-add-debt {
  padding: 5px 10px;
  border-radius: 10px;
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid rgba(5, 150, 105, 0.25);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.filter-chip {
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--ink-muted);
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.15s ease;
}
.filter-chip.active {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary);
}

.debt-item-box {
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.btn-cicil {
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--primary);
  color: white;
  font-size: 10.5px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-sheet {
  width: 100%;
  max-width: 360px;
  background: var(--surface);
  border-radius: 22px;
  padding: 18px;
  border: 1px solid var(--line);
  box-shadow: 0 10px 40px rgba(0,0,0,0.25);
}
</style>

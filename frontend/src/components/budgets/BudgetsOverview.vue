<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBudgetsStore } from "@/stores/budgets";
import { useMasterDataStore } from "@/stores/masterData";
import { useTransactionsStore } from "@/stores/transactions";
import { useCurrency } from "@/composables/useCurrency";
import BudgetCard from "@/components/ui/BudgetCard.vue";
import type { Budget } from "@/types";

const budgetsStore = useBudgetsStore();
const masterStore = useMasterDataStore();
const txStore = useTransactionsStore();
const { fmt } = useCurrency();

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

const activeMonth = ref(currentMonthStr());
const showSetModal = ref(false);
const selectedCategoryId = ref("");
const budgetAmount = ref<number | null>(null);

onMounted(async () => {
  if (masterStore.expenseCategories.length === 0) await masterStore.fetchAll();
  await budgetsStore.fetchList(activeMonth.value);
});

// Hitung total pengeluaran per kategori di bulan ini
const categorySpentMap = computed(() => {
  const map: Record<string, number> = {};
  for (const t of txStore.items) {
    if (t.type === "expense" && t.occurredAt.startsWith(activeMonth.value)) {
      const catId = t.expenseCategoryId;
      if (catId) {
        map[catId] = (map[catId] || 0) + Number(t.amount);
      }
    }
  }
  return map;
});

const enrichedBudgets = computed(() => {
  return budgetsStore.items.map((b) => {
    const spent = categorySpentMap.value[b.categoryId] || 0;
    const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    const remaining = b.amount - spent;
    return {
      ...b,
      spent,
      pct,
      remaining,
    };
  });
});

const totalBudget = computed(() => {
  return enrichedBudgets.value.reduce((sum, b) => sum + b.amount, 0);
});

const totalSpentInBudgets = computed(() => {
  return enrichedBudgets.value.reduce((sum, b) => sum + b.spent, 0);
});

function openSetModal(b?: Budget) {
  if (b) {
    selectedCategoryId.value = b.categoryId;
    budgetAmount.value = b.amount;
  } else {
    selectedCategoryId.value = masterStore.expenseCategories[0]?.id || "";
    budgetAmount.value = 500000;
  }
  showSetModal.value = true;
}

async function saveBudget() {
  if (!selectedCategoryId.value || !budgetAmount.value || budgetAmount.value <= 0) return;
  await budgetsStore.setBudget({
    categoryId: selectedCategoryId.value,
    month: activeMonth.value,
    amount: budgetAmount.value,
  });
  showSetModal.value = false;
}

async function removeBudget(id: string) {
  if (!confirm("Hapus anggaran kategori ini?")) return;
  await budgetsStore.remove(id);
}
</script>

<template>
  <div class="budgets-card mb-5">
    <div class="flex items-center justify-between mb-3 px-1">
      <div>
        <h3 class="text-xs font-bold text-ink-muted uppercase tracking-wider m-0">Anggaran Bulanan</h3>
        <p class="text-[13px] font-bold text-ink mt-0.5 m-0">
          Terpakai {{ fmt(totalSpentInBudgets) }} dari {{ fmt(totalBudget) }}
        </p>
      </div>

      <button
        type="button"
        class="btn-set-budget"
        @click="openSetModal()"
      >
        + Anggaran
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="enrichedBudgets.length === 0" class="empty-budget-box text-center py-4">
      <p class="text-xs text-ink-muted m-0">Belum ada anggaran yang disetel untuk bulan ini.</p>
      <button
        type="button"
        class="text-xs font-bold text-primary hover:underline mt-1.5 inline-block"
        @click="openSetModal()"
      >
        Pasang batas anggaran pengeluaran ↗
      </button>
    </div>

    <!-- List Anggaran -->
    <div v-else class="space-y-2.5">
      <BudgetCard
        v-for="b in enrichedBudgets"
        :key="b.id"
        :categoryName="b.category?.name || 'Kategori'"
        :categoryIcon="b.category?.icon || '📦'"
        :budgetAmount="b.amount"
        :spentAmount="b.spent"
        @click="openSetModal(b)"
      />
    </div>

    <!-- ════ Modal Pasang Anggaran ════ -->
    <Teleport to="body">
      <div v-if="showSetModal" class="modal-overlay" @click="showSetModal = false">
        <div class="modal-sheet" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-line mb-3">
            <h3 class="text-sm font-bold text-ink m-0">Pasang Batas Anggaran</h3>
            <button class="text-ink-muted text-lg" @click="showSetModal = false">✕</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="form-label text-xs">Pilih Kategori Pengeluaran</label>
              <select v-model="selectedCategoryId" class="form-input text-sm font-semibold">
                <option
                  v-for="cat in masterStore.expenseCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.icon }} {{ cat.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="form-label text-xs">Batas Anggaran Bulanan (Rp)</label>
              <input
                v-model.number="budgetAmount"
                type="number"
                placeholder="500000"
                class="form-input text-sm font-bold"
              />
            </div>
          </div>

          <div class="mt-4">
            <button
              type="button"
              class="btn-primary w-full py-2.5 text-xs font-bold"
              @click="saveBudget"
            >
              Simpan Anggaran
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.budgets-card {
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.btn-set-budget {
  padding: 5px 10px;
  border-radius: 10px;
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid rgba(5, 150, 105, 0.25);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.budget-item-box {
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.budget-progress-track {
  width: 100%;
  height: 6px;
  border-radius: 99px;
  background: var(--line);
  overflow: hidden;
}

.budget-progress-bar {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
}

.budget-pill-over {
  font-size: 9.5px;
  font-weight: 800;
  padding: 1.5px 6px;
  border-radius: 6px;
  background: var(--expense-soft);
  color: var(--expense);
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

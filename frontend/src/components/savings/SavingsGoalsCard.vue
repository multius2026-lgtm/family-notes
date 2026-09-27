<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSavingsStore } from "@/stores/savings";
import { useCurrency } from "@/composables/useCurrency";
import type { SavingsGoal } from "@/types";

const savingsStore = useSavingsStore();
const { fmt } = useCurrency();

const showAddModal = ref(false);
const showContributeModal = ref(false);
const activeGoal = ref<SavingsGoal | null>(null);

// Form Target Baru
const formName = ref("");
const formTarget = ref<number | null>(null);
const formInitial = ref<number | null>(null);
const formDeadline = ref("");
const formIcon = ref("🎯");

// Form Nabung
const contributeAmount = ref<number | null>(null);

const GOAL_ICONS = ["🎯", "🚗", "🏠", "💻", "✈️", "💍", "🛡️", "🎓", "📱"];

onMounted(async () => {
  await savingsStore.fetchList();
});

function openAddModal() {
  formName.value = "";
  formTarget.value = null;
  formInitial.value = 0;
  formDeadline.value = "";
  formIcon.value = "🎯";
  showAddModal.value = true;
}

function openContributeModal(goal: SavingsGoal) {
  activeGoal.value = goal;
  contributeAmount.value = null;
  showContributeModal.value = true;
}

async function saveGoal() {
  if (!formName.value.trim() || !formTarget.value || formTarget.value <= 0) return;
  await savingsStore.create({
    name: formName.value.trim(),
    targetAmount: formTarget.value,
    currentAmount: formInitial.value || 0,
    deadline: formDeadline.value || null,
    icon: formIcon.value,
  });
  showAddModal.value = false;
}

async function submitContribution() {
  if (!activeGoal.value || !contributeAmount.value || contributeAmount.value <= 0) return;
  await savingsStore.addContribution(activeGoal.value.id, contributeAmount.value);
  showContributeModal.value = false;
}

async function deleteGoal(id: string) {
  if (!confirm("Hapus target tabungan ini?")) return;
  await savingsStore.remove(id);
}
</script>

<template>
  <div class="savings-card mb-5">
    <div class="flex items-center justify-between mb-3 px-1">
      <div>
        <h3 class="text-xs font-bold text-ink-muted uppercase tracking-wider m-0">Target Tabungan</h3>
        <p class="text-[13px] font-bold text-ink mt-0.5 m-0">
          {{ savingsStore.items.filter(g => !g.isCompleted).length }} Target Aktif
        </p>
      </div>

      <button
        type="button"
        class="btn-add-goal"
        @click="openAddModal"
      >
        + Target
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="savingsStore.items.length === 0" class="empty-savings-box text-center py-4">
      <p class="text-xs text-ink-muted m-0">Belum ada target tabungan yang dibuat.</p>
      <button
        type="button"
        class="text-xs font-bold text-primary hover:underline mt-1.5 inline-block"
        @click="openAddModal"
      >
        Buat target impian (mis. Beli Laptop, Dana Darurat) ↗
      </button>
    </div>

    <!-- List Target Tabungan -->
    <div v-else class="space-y-3">
      <div
        v-for="goal in savingsStore.items"
        :key="goal.id"
        class="goal-item-box"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-sm shadow-sm">
              {{ goal.icon }}
            </span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-ink truncate m-0">{{ goal.name }}</p>
              <p v-if="goal.deadline" class="text-[10px] text-ink-muted m-0">Target: {{ goal.deadline }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              v-if="goal.isCompleted"
              class="badge-completed"
            >
              ✓ Tercapai
            </span>
            <button
              v-else
              type="button"
              class="btn-nabung"
              @click="openContributeModal(goal)"
            >
              + Nabung
            </button>

            <button
              type="button"
              class="text-ink-muted hover:text-rose-500 text-xs px-1"
              @click="deleteGoal(goal.id)"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="goal-progress-track">
          <div
            class="goal-progress-fill"
            :style="{
              width: `${Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))}%`
            }"
          ></div>
        </div>

        <!-- Numbers -->
        <div class="flex items-center justify-between text-[11px] mt-1.5">
          <span class="font-bold text-primary">{{ fmt(goal.currentAmount) }}</span>
          <span class="text-ink-muted">dari {{ fmt(goal.targetAmount) }} ({{ Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) }}%)</span>
        </div>
      </div>
    </div>

    <!-- ════ Modal Tambah Target ════ -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
        <div class="modal-sheet" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-line mb-3">
            <h3 class="text-sm font-bold text-ink m-0">Target Tabungan Baru</h3>
            <button class="text-ink-muted text-lg" @click="showAddModal = false">✕</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="form-label text-xs">Nama Target</label>
              <input v-model="formName" placeholder="mis. Dana Darurat, Beli Laptop" class="form-input text-sm" />
            </div>

            <div>
              <label class="form-label text-xs">Target Dana (Rp)</label>
              <input v-model.number="formTarget" type="number" placeholder="5000000" class="form-input text-sm font-bold" />
            </div>

            <div>
              <label class="form-label text-xs">Dana Awal Sudah Ada (Rp)</label>
              <input v-model.number="formInitial" type="number" placeholder="0" class="form-input text-sm" />
            </div>

            <div>
              <label class="form-label text-xs">Batas Waktu / Deadline (Opsional)</label>
              <input v-model="formDeadline" type="date" class="form-input text-sm" />
            </div>

            <div>
              <label class="form-label text-xs">Pilih Ikon</label>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="ico in GOAL_ICONS"
                  :key="ico"
                  type="button"
                  class="w-8 h-8 rounded-xl border flex items-center justify-center text-sm"
                  :class="formIcon === ico ? 'border-primary bg-primary-light' : 'border-line bg-surface-2'"
                  @click="formIcon = ico"
                >
                  {{ ico }}
                </button>
              </div>
            </div>
          </div>

          <button type="button" class="btn-primary w-full mt-4 py-2.5 text-xs font-bold" @click="saveGoal">
            Simpan Target
          </button>
        </div>
      </div>
    </Teleport>

    <!-- ════ Modal Tambah Tabungan (+ Nabung) ════ -->
    <Teleport to="body">
      <div v-if="showContributeModal && activeGoal" class="modal-overlay" @click="showContributeModal = false">
        <div class="modal-sheet" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-line mb-3">
            <h3 class="text-sm font-bold text-ink m-0">Nabung ke {{ activeGoal.name }}</h3>
            <button class="text-ink-muted text-lg" @click="showContributeModal = false">✕</button>
          </div>

          <div class="mb-3">
            <label class="form-label text-xs">Jumlah yang Ditabung (Rp)</label>
            <input
              v-model.number="contributeAmount"
              type="number"
              placeholder="100000"
              class="form-input text-base font-bold text-primary"
            />
          </div>

          <button type="button" class="btn-primary w-full py-2.5 text-xs font-bold" @click="submitContribution">
            Tambahkan ke Tabungan
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.savings-card {
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.btn-add-goal {
  padding: 5px 10px;
  border-radius: 10px;
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid rgba(5, 150, 105, 0.25);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.goal-item-box {
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.btn-nabung {
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--primary);
  color: white;
  font-size: 10.5px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.badge-completed {
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--income-soft);
  color: var(--income-text);
  font-size: 10px;
  font-weight: 700;
}

.goal-progress-track {
  width: 100%;
  height: 6px;
  border-radius: 99px;
  background: var(--line);
  overflow: hidden;
}

.goal-progress-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--primary-gradient);
  transition: width 0.3s ease;
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

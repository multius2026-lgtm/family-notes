<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useWalletsStore } from "@/stores/wallets";
import { useCurrency } from "@/composables/useCurrency";
import { usePrivacyMode } from "@/composables/usePrivacyMode";
import RupiahInput from "@/components/ui/RupiahInput.vue";
import type { WalletType, Wallet } from "@/types";
import { WALLET_TYPE_LABELS } from "@/types";

const walletsStore = useWalletsStore();
const { fmt } = useCurrency();
const { maskValue } = usePrivacyMode();

const showAddModal = ref(false);
const editingWallet = ref<Wallet | null>(null);

const formName = ref("");
const formType = ref<WalletType>("cash");
const formBalance = ref<number | null>(null);
const formIcon = ref("💵");
const formColor = ref("#10b981");

const WALLET_ICONS = ["💵", "🏦", "📱", "💳", "💰", "🪙", "🏧", "💼"];
const WALLET_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#64748b", "#ef4444"];

const normalizedColor = computed(() => (formColor.value || "#10b981").trim().toLowerCase());

function isColorSelected(col: string) {
  return normalizedColor.value === col.toLowerCase();
}

onMounted(async () => {
  if (walletsStore.items.length === 0) {
    await walletsStore.fetchList();
  }
});

function openAddModal() {
  editingWallet.value = null;
  formName.value = "";
  formType.value = "cash";
  formBalance.value = 0;
  formIcon.value = "💵";
  formColor.value = "#10b981";
  showAddModal.value = true;
}

function openEditModal(wallet: Wallet) {
  editingWallet.value = wallet;
  formName.value = wallet.name;
  formType.value = wallet.type;
  formBalance.value = wallet.balance;
  formIcon.value = wallet.icon || "💵";
  formColor.value = (wallet.color || "#10b981").toLowerCase();
  showAddModal.value = true;
}

function pickColor(col: string) {
  formColor.value = col.toLowerCase();
}

async function saveWallet() {
  if (!formName.value.trim()) return;

  if (editingWallet.value) {
    await walletsStore.update(editingWallet.value.id, {
      name: formName.value.trim(),
      type: formType.value,
      balance: formBalance.value || 0,
      icon: formIcon.value,
      color: formColor.value,
    });
  } else {
    await walletsStore.create({
      name: formName.value.trim(),
      type: formType.value,
      balance: formBalance.value || 0,
      icon: formIcon.value,
      color: formColor.value,
    });
  }

  showAddModal.value = false;
}

async function deleteWallet() {
  if (!editingWallet.value) return;
  if (!confirm(`Hapus akun ${editingWallet.value.name}? Transaksi terkait akan tetap ada.`)) return;
  await walletsStore.remove(editingWallet.value.id);
  showAddModal.value = false;
}
</script>

<template>
  <div class="wallets-card mb-5">
    <div class="flex items-center justify-between mb-3">
      <div>
        <h2 class="text-[14px] font-bold text-ink m-0">Akun &amp; Dompet</h2>
        <p class="text-[11.5px] text-ink-muted m-0 mt-0.5">
          Rincian saldo per akun. Total di kartu atas adalah jumlah semua akun ini.
        </p>
      </div>
      <button type="button" class="btn-wallet-add" @click="openAddModal">
        + Tambah
      </button>
    </div>

    <div v-if="walletsStore.items.length === 0" class="text-center py-6">
      <p class="text-[13px] text-ink-muted mb-3">Belum ada akun. Tambahkan dompet pertama.</p>
      <button type="button" class="btn-wallet-add" @click="openAddModal">Tambah Akun / Dompet</button>
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="w in walletsStore.items"
        :key="w.id"
        type="button"
        class="wallet-row"
        @click="openEditModal(w)"
      >
        <span
          class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 text-white"
          :style="{ background: w.color || '#10b981' }"
        >
          {{ w.icon || "💵" }}
        </span>
        <div class="min-w-0 flex-1 text-left">
          <p class="text-[13px] font-bold text-ink truncate leading-tight">{{ w.name }}</p>
          <p class="text-[11px] text-ink-muted truncate">{{ WALLET_TYPE_LABELS[w.type] || w.type }}</p>
        </div>
        <p class="text-[13px] font-black text-ink shrink-0">{{ maskValue(fmt(w.balance)) }}</p>
      </button>
    </div>

    <!-- ════ Modal Tambah / Edit Dompet ════ -->
    <Teleport to="body">
      <div v-if="showAddModal" class="wallet-modal-overlay" @click.self="showAddModal = false">
        <div class="wallet-modal-sheet" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 class="text-base font-bold text-ink m-0">
              {{ editingWallet ? "Edit Akun / Dompet" : "Tambah Akun / Dompet" }}
            </h3>
            <button type="button" class="text-ink-muted text-lg leading-none" @click="showAddModal = false">✕</button>
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="form-label text-xs">Nama Akun / Dompet</label>
              <input
                v-model="formName"
                placeholder="mis. BCA Utama, GoPay, Tunai Dompet"
                class="form-input text-sm"
              />
            </div>

            <div>
              <label class="form-label text-xs">Tipe Akun</label>
              <select v-model="formType" class="form-input text-sm">
                <option value="cash">Tunai (Cash)</option>
                <option value="bank">Rekening Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="credit_card">Kartu Kredit</option>
              </select>
            </div>

            <div>
              <label class="form-label text-xs">
                {{ editingWallet ? "Saldo Saat Ini (Rp)" : "Saldo Awal (Rp)" }}
              </label>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-ink-muted">Rp</span>
                <RupiahInput
                  v-model="formBalance"
                  placeholder="0"
                  input-class="form-input text-sm font-bold w-full"
                />
              </div>
            </div>

            <div>
              <label class="form-label text-xs">Pilih Ikon</label>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="ico in WALLET_ICONS"
                  :key="ico"
                  type="button"
                  class="w-9 h-9 rounded-xl border flex items-center justify-center text-lg transition-all shrink-0"
                  :class="formIcon === ico ? 'border-primary bg-primary-light scale-105' : 'border-line bg-surface-2'"
                  @click="formIcon = ico"
                >
                  {{ ico }}
                </button>
              </div>
            </div>

            <div>
              <label class="form-label text-xs">Warna Tema</label>
              <div class="flex flex-wrap items-center gap-2.5">
                <button
                  v-for="col in WALLET_COLORS"
                  :key="col"
                  type="button"
                  class="color-swatch"
                  :class="{ 'color-swatch-active': isColorSelected(col) }"
                  :style="{ backgroundColor: col }"
                  :title="col"
                  :aria-pressed="isColorSelected(col)"
                  @click.stop.prevent="pickColor(col)"
                >
                  <span v-if="isColorSelected(col)" class="color-check">✓</span>
                </button>
                <label class="color-swatch color-custom" title="Warna kustom">
                  <input
                    v-model="formColor"
                    type="color"
                    class="color-native"
                    @click.stop
                  />
                  <span class="color-custom-plus">+</span>
                </label>
              </div>
              <p class="text-[11px] text-ink-muted mt-1.5 m-0">
                Terpilih: <span class="font-bold" :style="{ color: formColor }">{{ formColor }}</span>
              </p>
            </div>
          </div>

          <div class="mt-5 space-y-2">
            <button
              type="button"
              class="btn-primary w-full py-3 text-sm font-bold"
              @click="saveWallet"
            >
              {{ editingWallet ? "Simpan Perubahan" : "Buat Akun Dompet" }}
            </button>

            <button
              v-if="editingWallet"
              type="button"
              class="w-full py-2.5 text-xs font-bold text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
              @click="deleteWallet"
            >
              Hapus Akun Ini
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.wallets-card {
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 22px;
  box-shadow: var(--shadow-card);
}

.wallet-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--bg);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.wallet-row:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-card);
  border-color: color-mix(in srgb, var(--pine) 22%, var(--line));
}

.btn-wallet-add {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid rgba(5, 150, 105, 0.25);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 2px solid transparent;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.12);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  position: relative;
  appearance: none;
}
.color-swatch-active {
  border-color: var(--ink);
  transform: scale(1.08);
}
.color-check {
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
  pointer-events: none;
}
.color-custom {
  overflow: hidden;
  background: conic-gradient(from 180deg, #10b981, #3b82f6, #ec4899, #f59e0b, #10b981);
}
.color-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: 0;
  padding: 0;
}
.color-custom-plus {
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
}

.wallet-modal-overlay {
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

.wallet-modal-sheet {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.25);
  border: 1px solid var(--line);
}
</style>

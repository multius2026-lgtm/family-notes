<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useWalletsStore } from "@/stores/wallets";
import { useCurrency } from "@/composables/useCurrency";
import { usePrivacyMode } from "@/composables/usePrivacyMode";
import type { WalletType, Wallet } from "@/types";
import { WALLET_TYPE_LABELS } from "@/types";

const router = useRouter();
const walletsStore = useWalletsStore();
const { fmt } = useCurrency();
const { isPrivacyMode, togglePrivacy, maskValue } = usePrivacyMode();

// Modal state
const showAddModal = ref(false);
const editingWallet = ref<Wallet | null>(null);

const formName = ref("");
const formType = ref<WalletType>("cash");
const formBalance = ref<number | null>(null);
const formIcon = ref("💵");
const formColor = ref("#10b981");

const WALLET_ICONS = ["💵", "🏦", "📱", "💳", "💰", "🪙", "🏧", "💼"];
const WALLET_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#64748b"];

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
  formColor.value = wallet.color || "#10b981";
  showAddModal.value = true;
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
    <!-- Header: Total Saldo + Action -->
    <div class="flex items-center justify-between mb-3 px-1">
      <div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Saldo Dompet</span>
          <button
            type="button"
            class="text-ink-muted hover:text-ink transition-colors text-xs"
            :title="isPrivacyMode ? 'Tampilkan saldo' : 'Sembunyikan saldo'"
            @click="togglePrivacy"
          >
            {{ isPrivacyMode ? "👁️‍🗨️" : "👁️" }}
          </button>
        </div>
        <p class="text-xl font-black text-ink m-0 tracking-tight">
          {{ maskValue(fmt(walletsStore.totalBalance)) }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Tombol Transfer -->
        <button
          type="button"
          class="btn-wallet-action"
          @click="router.push({ name: 'add-transaction', query: { type: 'transfer' } })"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          Transfer
        </button>

        <!-- Tombol Tambah Dompet -->
        <button
          type="button"
          class="btn-wallet-add"
          title="Tambah akun dompet baru"
          @click="openAddModal"
        >
          + Dompet
        </button>
      </div>
    </div>

    <!-- Horizontal Carousel Dompet -->
    <div class="wallets-carousel">
      <div
        v-for="w in walletsStore.items"
        :key="w.id"
        class="wallet-pill-card"
        :style="{ borderColor: w.color ? `${w.color}33` : 'var(--line)' }"
        @click="openEditModal(w)"
      >
        <div class="flex items-center justify-between gap-3 mb-1.5">
          <span
            class="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm"
            :style="{ background: `${w.color}22` }"
          >
            {{ w.icon || '💵' }}
          </span>
          <span
            class="text-[10px] font-bold px-1.5 py-0.5 rounded"
            :style="{ background: `${w.color}15`, color: w.color }"
          >
            {{ WALLET_TYPE_LABELS[w.type] || 'Akun' }}
          </span>
        </div>

        <p class="text-xs font-bold text-ink truncate m-0">{{ w.name }}</p>
        <p class="text-xs font-extrabold text-ink-muted truncate m-0 mt-0.5">
          {{ maskValue(fmt(w.balance)) }}
        </p>
      </div>

      <!-- Tambah Baru Card -->
      <button
        type="button"
        class="wallet-pill-card wallet-card-dashed"
        @click="openAddModal"
      >
        <div class="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center text-sm text-primary mb-1">
          +
        </div>
        <p class="text-[11px] font-bold text-primary m-0">Tambah</p>
        <p class="text-[10px] text-ink-muted m-0">Akun Baru</p>
      </button>
    </div>

    <!-- ════ Modal Tambah / Edit Dompet ════ -->
    <Teleport to="body">
      <div v-if="showAddModal" class="wallet-modal-overlay" @click="showAddModal = false">
        <div class="wallet-modal-sheet" @click.stop>
          <div class="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 class="text-base font-bold text-ink m-0">
              {{ editingWallet ? "Edit Akun / Dompet" : "Tambah Akun / Dompet" }}
            </h3>
            <button class="text-ink-muted text-lg leading-none" @click="showAddModal = false">✕</button>
          </div>

          <div class="space-y-3.5">
            <!-- Nama Dompet -->
            <div>
              <label class="form-label text-xs">Nama Akun / Dompet</label>
              <input
                v-model="formName"
                placeholder="mis. BCA Utama, GoPay, Tunai Dompet"
                class="form-input text-sm"
              />
            </div>

            <!-- Tipe Dompet -->
            <div>
              <label class="form-label text-xs">Tipe Akun</label>
              <select v-model="formType" class="form-input text-sm">
                <option value="cash">Tunai (Cash)</option>
                <option value="bank">Rekening Bank</option>
                <option value="ewallet">E-Wallet</option>
                <option value="credit_card">Kartu Kredit</option>
              </select>
            </div>

            <!-- Saldo Awal -->
            <div>
              <label class="form-label text-xs">
                {{ editingWallet ? "Saldo Saat Ini (Rp)" : "Saldo Awal (Rp)" }}
              </label>
              <input
                v-model.number="formBalance"
                type="number"
                placeholder="0"
                class="form-input text-sm font-bold"
              />
            </div>

            <!-- Pilihan Ikon -->
            <div>
              <label class="form-label text-xs">Pilih Ikon</label>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="ico in WALLET_ICONS"
                  :key="ico"
                  type="button"
                  class="w-9 h-9 rounded-xl border flex items-center justify-center text-lg transition-all"
                  :class="formIcon === ico ? 'border-primary bg-primary-light scale-105' : 'border-line bg-surface-2'"
                  @click="formIcon = ico"
                >
                  {{ ico }}
                </button>
              </div>
            </div>

            <!-- Pilihan Warna -->
            <div>
              <label class="form-label text-xs">Warna Tema</label>
              <div class="flex gap-2">
                <button
                  v-for="col in WALLET_COLORS"
                  :key="col"
                  type="button"
                  class="w-7 h-7 rounded-full border-2 transition-transform"
                  :style="{ background: col, borderColor: formColor === col ? 'var(--ink)' : 'transparent' }"
                  :class="{ 'scale-110': formColor === col }"
                  @click="formColor = col"
                ></button>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
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
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.btn-wallet-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--surface-2);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.25);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-wallet-action:hover {
  background: rgba(99, 102, 241, 0.12);
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

.wallets-carousel {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.wallets-carousel::-webkit-scrollbar {
  display: none;
}

.wallet-pill-card {
  flex-shrink: 0;
  width: 140px;
  padding: 10px 12px;
  background: var(--surface-2);
  border: 1.5px solid var(--line);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.wallet-pill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.wallet-card-dashed {
  border-style: dashed !important;
  background: transparent !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 110px;
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

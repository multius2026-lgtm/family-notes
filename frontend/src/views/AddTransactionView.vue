<script setup lang="ts">
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTransactionsStore } from "@/stores/transactions";
import { useMasterDataStore } from "@/stores/masterData";
import TransactionForm, { type TxFormState } from "@/components/transactions/TransactionForm.vue";
import ReceiptScanner from "@/components/transactions/ReceiptScanner.vue";
import { useCurrency } from "@/composables/useCurrency";
import type { ReceiptItem } from "@/types";

const route = useRoute();
const router = useRouter();
const store = useTransactionsStore();
const master = useMasterDataStore();
const { fmt } = useCurrency();

const editingId = computed(() => route.params.id as string | undefined);
const saving = ref(false);
const errorMsg = ref("");

// OCR modal
const showReceiptScanner = ref(false);
const ocrApplied = ref(false);

// Full image lightbox & item accordion
const showFullImageModal = ref(false);
const receiptItemsDropdownOpen = ref(true);
const showAddSubItem = ref(false);
const newSubItemName = ref("");
const newSubItemPrice = ref<number | null>(null);
const newSubItemQty = ref(1);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const form = reactive<TxFormState>({
  type: "income",
  amount: null,
  periodType: "daily",
  incomeSourceId: null,
  expenseCategoryId: null,
  note: "",
  occurredAt: todayStr(),
  receiptUrl: null,
  isOcr: false,
  receiptItems: [],
});

onMounted(async () => {
  if (master.incomeSources.length === 0) await master.fetchAll();

  if (editingId.value) {
    let tx = store.items.find((t) => t.id === editingId.value);
    if (!tx) {
      await store.fetchList({});
      tx = store.items.find((t) => t.id === editingId.value);
    }
    if (tx) {
      form.type = tx.type;
      form.amount = Number(tx.amount);
      form.periodType = tx.periodType;
      form.incomeSourceId = tx.incomeSourceId;
      form.expenseCategoryId = tx.expenseCategoryId;
      form.note = tx.note || "";
      form.occurredAt = tx.occurredAt;
      form.receiptUrl = tx.receiptUrl || null;
      form.isOcr = Boolean(tx.isOcr);
      form.receiptItems = tx.receiptItems ? [...tx.receiptItems] : [];
      form.walletId = tx.walletId || null;
      form.transferToWalletId = tx.transferToWalletId || null;
    }
  } else {
    const typeParam = route.query.type as string | undefined;
    if (typeParam === "expense") {
      form.type = "expense";
    } else if (typeParam === "transfer") {
      form.type = "transfer";
    }
    const sourceId = route.query.sourceId as string | undefined;
    if (sourceId) {
      form.type = "income";
      form.incomeSourceId = sourceId;
      const src = master.incomeSources.find((s) => s.id === sourceId);
      if (src) form.periodType = src.defaultPeriodType;
    } else if (!form.incomeSourceId && master.incomeSources[0]) {
      form.incomeSourceId = master.incomeSources[0].id;
    }
    if (!form.expenseCategoryId && master.expenseCategories[0]) {
      form.expenseCategoryId = master.expenseCategories[0].id;
    }
  }
});

const itemsSubtotal = computed(() => {
  if (!form.receiptItems || form.receiptItems.length === 0) return 0;
  return form.receiptItems.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 1), 0);
});

function removeSubItem(idx: number) {
  if (!form.receiptItems) return;
  form.receiptItems.splice(idx, 1);
}

function addSubItem() {
  if (!newSubItemName.value.trim()) return;
  if (!form.receiptItems) form.receiptItems = [];
  form.receiptItems.push({
    name: newSubItemName.value.trim(),
    price: newSubItemPrice.value,
    qty: newSubItemQty.value > 1 ? newSubItemQty.value : undefined,
  });
  newSubItemName.value = "";
  newSubItemPrice.value = null;
  newSubItemQty.value = 1;
  showAddSubItem.value = false;
}

function removeReceiptPhoto() {
  if (confirm("Hapus lampiran foto struk dari transaksi ini?")) {
    form.receiptUrl = null;
  }
}

async function save() {
  errorMsg.value = "";
  if (!form.amount || form.amount <= 0) {
    errorMsg.value = "Masukkan jumlah yang valid (lebih dari 0).";
    return;
  }
  if (form.type === "income" && !form.incomeSourceId) {
    errorMsg.value = "Pilih sumber pemasukan terlebih dahulu.";
    return;
  }
  if (form.type === "expense" && !form.expenseCategoryId) {
    errorMsg.value = "Pilih kategori pengeluaran terlebih dahulu.";
    return;
  }
  if (form.type === "transfer") {
    if (!form.walletId) {
      errorMsg.value = "Pilih dompet asal transfer.";
      return;
    }
    if (!form.transferToWalletId) {
      errorMsg.value = "Pilih dompet tujuan transfer.";
      return;
    }
    if (form.walletId === form.transferToWalletId) {
      errorMsg.value = "Dompet asal dan tujuan tidak boleh sama.";
      return;
    }
  }

  saving.value = true;
  try {
    const payload = {
      type: form.type,
      amount: form.amount,
      periodType: form.periodType,
      incomeSourceId: form.type === "income" ? form.incomeSourceId! : undefined,
      expenseCategoryId: form.type === "expense" ? form.expenseCategoryId! : undefined,
      note: form.note || undefined,
      occurredAt: form.occurredAt,
      receiptUrl: form.receiptUrl || null,
      isOcr: Boolean(form.isOcr),
      receiptItems: form.receiptItems && form.receiptItems.length > 0 ? form.receiptItems : null,
      walletId: form.walletId || null,
      transferToWalletId: form.type === "transfer" ? (form.transferToWalletId || null) : null,
    };

    if (editingId.value) {
      await store.update(editingId.value, payload);
    } else {
      await store.create(payload);
    }
    router.back();
  } catch (e: any) {
    errorMsg.value = e?.message || e?.data?.error || "Gagal menyimpan transaksi.";
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!editingId.value) return;
  if (!confirm("Hapus transaksi ini?")) return;
  await store.remove(editingId.value);
  router.back();
}

/** Dipanggil setelah OCR selesai dan user konfirmasi */
function onOcrApply(data: {
  amount: number | null;
  date: string | null;
  note: string;
  receiptUrl: string | null;
  isOcr: boolean;
  items: ReceiptItem[];
}) {
  if (data.amount) form.amount = data.amount;
  if (data.date) form.occurredAt = data.date;
  if (data.note) form.note = data.note;
  if (data.receiptUrl) form.receiptUrl = data.receiptUrl;
  form.isOcr = true;
  form.receiptItems = data.items ? [...data.items] : [];
  // Otomatis set ke expense
  form.type = "expense";
  ocrApplied.value = true;
  showReceiptScanner.value = false;
}
</script>

<template>
  <div class="min-h-screen pb-12" style="background: var(--paper);">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 z-30"
      style="padding-top: calc(16px + env(safe-area-inset-top, 0px)); background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);"
    >
      <button
        class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style="background: var(--surface-2);"
        title="Kembali"
        @click="router.back()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      <div class="text-center">
        <h1 class="text-[16.5px] font-bold text-ink">
          {{ editingId ? "Detail & Edit Transaksi" : "Tambah Transaksi" }}
        </h1>
      </div>

      <!-- Tombol Scan Struk (hanya saat mode tambah baru atau ingin attach struk) -->
      <button
        class="flex items-center gap-1.5 px-3 h-9 rounded-full font-bold text-[12px] transition-all"
        style="background: var(--primary-light); color: var(--primary); border: 1.5px solid var(--primary);"
        title="Scan struk belanja"
        @click="showReceiptScanner = true"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="m9 9 3-3 3 3"/><path d="M12 6v9"/><path d="M9 15h6"/>
        </svg>
        Scan
      </button>
    </div>

    <!-- Badge Metode Transaksi (Struk vs Input Manual) -->
    <div class="px-5 pt-3.5 pb-1 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          v-if="form.type === 'transfer'"
          class="badge-pill-transfer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          Transfer Antar Dompet
        </span>
        <span
          v-else-if="form.isOcr || form.receiptUrl"
          class="badge-pill-receipt"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="m9 9 3-3 3 3"/>
            <path d="M12 6v9"/>
            <path d="M9 15h6"/>
          </svg>
          Transaksi dari Scan Struk
        </span>
        <span
          v-else
          class="badge-pill-manual"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Transaksi Input Manual
        </span>
      </div>
      <span v-if="editingId" class="text-[11px] font-semibold text-ink-muted">Mode Edit</span>
    </div>

    <!-- OCR Applied Notification Banner -->
    <div v-if="ocrApplied" class="mx-5 mt-3 flex items-center gap-2.5 px-4 py-3 rounded-2xl fade-slide-down" style="background: var(--income-soft);">
      <span style="font-size: 18px;">🧾</span>
      <div class="flex-1 min-w-0">
        <p class="text-[13px] font-bold" style="color: var(--income-text); margin: 0;">Data dan foto struk berhasil diisi!</p>
        <p class="text-[11px] font-medium" style="color: var(--income-text); opacity: 0.8; margin: 0;">Foto tersimpan di Supabase dan item rincian sudah diekstrak.</p>
      </div>
      <button @click="ocrApplied = false" style="color: var(--income-text); opacity: 0.6; background: none; border: none; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
    </div>

    <div class="px-5 pt-3">
      <!-- ═════════ SECTION: FOTO / FILE STRUK ═════════ -->
      <div v-if="form.receiptUrl" class="receipt-photo-section mb-4">
        <div class="flex items-center justify-between mb-2">
          <label class="form-label-bold flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Foto Struk (Supabase Storage)
          </label>
          <button
            type="button"
            class="text-[11px] font-semibold text-rose-500 hover:underline"
            @click="removeReceiptPhoto"
          >
            Hapus Foto
          </button>
        </div>

        <div class="receipt-card-wrapper" @click="showFullImageModal = true">
          <img :src="form.receiptUrl" alt="Foto Struk" class="receipt-card-image" />
          <div class="receipt-card-overlay">
            <div class="receipt-view-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Klik untuk Lihat Foto Penuh
            </div>
          </div>
          <span class="supabase-tag">
            ✓ Supabase
          </span>
        </div>
      </div>

      <!-- ═════════ SECTION: DROPDOWN LIST ITEM STRUK ═════════ -->
      <div
        v-if="(form.receiptItems && form.receiptItems.length > 0) || form.isOcr || form.receiptUrl"
        class="receipt-items-accordion mb-4"
      >
        <button
          type="button"
          class="accordion-header"
          @click="receiptItemsDropdownOpen = !receiptItemsDropdownOpen"
        >
          <div class="flex items-center gap-2">
            <span class="text-[15px]">🧾</span>
            <span class="font-bold text-[13.5px] text-ink">Daftar Item Struk</span>
            <span class="items-badge">
              {{ form.receiptItems?.length || 0 }} item
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <span v-if="itemsSubtotal > 0 && !receiptItemsDropdownOpen" class="text-[12px] font-bold text-ink-muted">
              {{ fmt(itemsSubtotal) }}
            </span>
            <svg
              class="chevron"
              :class="{ 'rotate-180': receiptItemsDropdownOpen }"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>

        <!-- Dropdown Body -->
        <div v-if="receiptItemsDropdownOpen" class="accordion-body">
          <div v-if="!form.receiptItems || form.receiptItems.length === 0" class="empty-item-state">
            <p class="text-xs text-ink-muted m-0">Tidak ada rincian item otomatis. Anda dapat menambahkan item manual di bawah.</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(item, idx) in form.receiptItems"
              :key="idx"
              class="item-line"
            >
              <div class="flex-1 min-w-0 pr-2">
                <p class="text-[12.5px] font-bold text-ink truncate m-0">{{ item.name }}</p>
                <p class="text-[11px] text-ink-muted m-0">
                  <span v-if="item.qty && item.qty > 1" class="font-semibold text-primary mr-1">{{ item.qty }}x</span>
                  <span>{{ item.price ? fmt(item.price) : 'Harga belum terisi' }}</span>
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[12.5px] font-bold text-ink">
                  {{ item.price ? fmt((item.price) * (item.qty || 1)) : '-' }}
                </span>
                <button
                  type="button"
                  class="btn-delete-item"
                  title="Hapus item ini"
                  @click="removeSubItem(idx)"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Subtotal Bar -->
            <div class="subtotal-bar flex justify-between items-center pt-2 mt-2 border-t border-line">
              <span class="text-xs font-semibold text-ink-muted">Total Rincian Item:</span>
              <span class="text-xs font-bold text-ink">{{ fmt(itemsSubtotal) }}</span>
            </div>
          </div>

          <!-- Tambah Item Baru Form -->
          <div v-if="showAddSubItem" class="add-item-drawer mt-3 pt-2.5 border-t border-line">
            <div class="grid grid-cols-6 gap-1.5 mb-2">
              <input
                v-model="newSubItemName"
                placeholder="Nama item..."
                class="col-span-3 text-xs p-2 rounded-xl border border-line bg-surface-2 outline-none font-medium"
              />
              <input
                v-model.number="newSubItemQty"
                type="number"
                placeholder="Qty"
                min="1"
                class="col-span-1 text-xs p-2 rounded-xl border border-line bg-surface-2 text-center outline-none font-medium"
              />
              <input
                v-model.number="newSubItemPrice"
                type="number"
                placeholder="Rp"
                class="col-span-2 text-xs p-2 rounded-xl border border-line bg-surface-2 outline-none font-medium"
              />
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn-primary-sm flex-1" @click="addSubItem">Tambahkan</button>
              <button type="button" class="btn-ghost-sm" @click="showAddSubItem = false">Batal</button>
            </div>
          </div>

          <button
            v-else
            type="button"
            class="btn-toggle-add-item mt-2.5"
            @click="showAddSubItem = true"
          >
            + Tambah Item Manual
          </button>
        </div>
      </div>

      <!-- Main Transaction Form -->
      <TransactionForm v-model="form" />

      <!-- Error Message -->
      <p v-if="errorMsg" class="text-[13px] font-semibold mb-3 px-1 flex items-center gap-1.5" style="color: var(--expense);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ errorMsg }}
      </p>

      <!-- Simpan Button -->
      <button
        id="btn-simpan-transaksi"
        :disabled="saving"
        class="btn-primary mt-2"
        @click="save"
      >
        <span v-if="saving" class="save-spinner"></span>
        {{ saving ? "Menyimpan..." : (editingId ? "Simpan Perubahan" : "Simpan Transaksi") }}
      </button>

      <!-- Hapus Button (hanya saat mode edit) -->
      <button
        v-if="editingId"
        class="w-full mt-3 py-3.5 rounded-2xl font-bold text-[14.5px] border-2 transition-colors"
        style="border-color: var(--expense); color: var(--expense); background: transparent;"
        @click="remove"
      >
        Hapus Transaksi
      </button>
    </div>
  </div>

  <!-- ════ Lightbox Zoom Foto Struk Penuh ════ -->
  <Teleport to="body">
    <div v-if="showFullImageModal && form.receiptUrl" class="lightbox-overlay" @click="showFullImageModal = false">
      <div class="lightbox-container" @click.stop>
        <button class="lightbox-btn-close" @click="showFullImageModal = false">✕</button>
        <img :src="form.receiptUrl" class="lightbox-image" alt="Foto Struk Penuh" />
        <div class="lightbox-bar">
          <div>
            <p class="text-xs font-bold text-white m-0">Foto Struk Transaksi</p>
            <p class="text-[11px] text-white opacity-70 m-0">Tersimpan di Supabase Storage</p>
          </div>
          <a
            :href="form.receiptUrl"
            target="_blank"
            rel="noopener"
            class="lightbox-open-ext"
          >
            Buka Tab Baru ↗
          </a>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ════ Modal Scan Struk ════ -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showReceiptScanner"
        class="ocr-overlay"
        @click.self="showReceiptScanner = false"
      >
        <div class="ocr-sheet">
          <div class="ocr-handle"></div>

          <div class="ocr-sheet-header">
            <div>
              <h2 class="ocr-sheet-title">Scan Struk Belanja</h2>
              <p class="ocr-sheet-sub">Kompres otomatis & simpan ke Supabase</p>
            </div>
            <button class="ocr-close" @click="showReceiptScanner = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="ocr-sheet-body">
            <ReceiptScanner
              @apply="onOcrApply"
              @close="showReceiptScanner = false"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Badges */
.badge-pill-receipt {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid rgba(5, 150, 105, 0.25);
  font-size: 11px;
  font-weight: 700;
}

.badge-pill-manual {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 99px;
  background: var(--surface-2);
  color: var(--ink-muted);
  border: 1px solid var(--line);
  font-size: 11px;
  font-weight: 600;
}

.badge-pill-transfer {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 99px;
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.25);
  font-size: 11px;
  font-weight: 700;
}

.form-label-bold {
  font-size: 11.5px;
  font-weight: 800;
  color: var(--ink-muted);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* Receipt Photo Card */
.receipt-card-wrapper {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  border: 1.5px solid var(--line);
  background: var(--surface-2);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.receipt-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}
.receipt-card-wrapper:hover .receipt-card-image {
  transform: scale(1.02);
}

.receipt-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.receipt-card-wrapper:hover .receipt-card-overlay {
  opacity: 1;
}

.receipt-view-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0,0,0,0.75);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.supabase-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(5, 150, 105, 0.9);
  color: white;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

/* Accordion */
.receipt-items-accordion {
  border: 1.5px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  overflow: hidden;
}

.accordion-header {
  width: 100%;
  padding: 12px 14px;
  background: var(--surface-2);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: inherit;
}

.items-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  background: var(--primary-light);
  color: var(--primary);
}

.chevron {
  color: var(--ink-muted);
  transition: transform 0.2s ease;
}
.chevron.rotate-180 {
  transform: rotate(180deg);
}

.accordion-body {
  padding: 12px 14px;
  border-top: 1px solid var(--line);
}

.empty-item-state {
  padding: 4px 0;
}

.item-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px dashed var(--line);
}
.item-line:last-of-type {
  border-bottom: none;
}

.btn-delete-item {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--surface-3);
  border: none;
  color: var(--ink-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
.btn-delete-item:hover {
  background: var(--expense-soft);
  color: var(--expense);
}

.btn-toggle-add-item {
  width: 100%;
  padding: 7px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
.btn-toggle-add-item:hover {
  background: var(--primary-light);
}

.btn-primary-sm {
  padding: 6px 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.btn-ghost-sm {
  padding: 6px 12px;
  background: var(--surface-2);
  color: var(--ink-muted);
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-container {
  position: relative;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.lightbox-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
}

.lightbox-btn-close {
  position: absolute;
  top: -42px;
  right: 0;
  width: 34px; height: 34px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-bar {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lightbox-open-ext {
  color: var(--primary-light);
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
}

/* Saving spinner */
.save-spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  margin-right: 4px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* OCR Modal */
.ocr-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.ocr-sheet {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border-radius: 28px 28px 0 0;
  padding: 8px 0 0;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.2);
  max-height: 92svh;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.ocr-handle {
  width: 36px; height: 4px;
  border-radius: 99px;
  background: var(--line);
  margin: 0 auto 16px;
}

.ocr-sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 20px 16px;
  border-bottom: 1px solid var(--line);
}

.ocr-sheet-title {
  font-size: 17px; font-weight: 800;
  color: var(--ink);
  margin: 0 0 2px;
  letter-spacing: -0.3px;
}

.ocr-sheet-sub {
  font-size: 12px; font-weight: 600;
  color: var(--ink-muted);
  margin: 0;
}

.ocr-close {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: var(--surface-2);
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ocr-sheet-body {
  padding: 20px;
  padding-bottom: max(24px, env(safe-area-inset-bottom, 24px));
}

.modal-enter-active { transition: opacity 0.25s ease; }
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.modal-enter-active .ocr-sheet {
  animation: sheetSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.modal-leave-active .ocr-sheet {
  animation: sheetSlideDown 0.2s ease both;
}

@keyframes sheetSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes sheetSlideDown {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}
</style>

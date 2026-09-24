<script setup lang="ts">
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTransactionsStore } from "@/stores/transactions";
import { useMasterDataStore } from "@/stores/masterData";
import TransactionForm, { type TxFormState } from "@/components/transactions/TransactionForm.vue";
import ReceiptScanner from "@/components/transactions/ReceiptScanner.vue";
import { ICON_MAP } from "@/components/icons";

const route = useRoute();
const router = useRouter();
const store = useTransactionsStore();
const master = useMasterDataStore();

const editingId = computed(() => route.params.id as string | undefined);
const saving = ref(false);
const errorMsg = ref("");

// OCR modal
const showReceiptScanner = ref(false);
const ocrApplied = ref(false);

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
    }
  } else {
    const typeParam = route.query.type as string | undefined;
    if (typeParam === "expense") {
      form.type = "expense";
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
    };
    if (editingId.value) {
      await store.update(editingId.value, payload);
    } else {
      await store.create(payload);
    }
    router.back();
  } catch (e: any) {
    errorMsg.value = e?.data?.error || "Gagal menyimpan transaksi.";
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
function onOcrApply(data: { amount: number | null; date: string | null; note: string }) {
  if (data.amount) form.amount = data.amount;
  if (data.date) form.occurredAt = data.date;
  if (data.note) form.note = data.note;
  // Otomatis set ke expense
  form.type = "expense";
  ocrApplied.value = true;
  showReceiptScanner.value = false;
}
</script>

<template>
  <div class="min-h-screen" style="background: var(--paper);">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-5 py-4 border-b border-line"
      style="padding-top: calc(16px + env(safe-area-inset-top, 0px)); background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);"
    >
      <button
        class="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style="background: var(--surface-2);"
        @click="router.back()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>

      <h1 class="text-[17px] font-bold text-ink">
        {{ editingId ? "Edit Transaksi" : "Tambah Transaksi" }}
      </h1>

      <!-- Tombol Scan Struk (hanya saat mode tambah baru) -->
      <button
        v-if="!editingId"
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
      <div v-else class="w-9 h-9"></div>
    </div>

    <!-- OCR Applied Banner -->
    <div v-if="ocrApplied" class="mx-5 mt-4 flex items-center gap-2.5 px-4 py-3 rounded-2xl fade-slide-down" style="background: var(--income-soft);">
      <span style="font-size: 18px;">🧾</span>
      <div class="flex-1">
        <p class="text-[13px] font-bold" style="color: var(--income-text); margin: 0;">Data struk berhasil diisi!</p>
        <p class="text-[11.5px] font-medium" style="color: var(--income-text); opacity: 0.75; margin: 0;">Periksa kembali sebelum menyimpan.</p>
      </div>
      <button @click="ocrApplied = false" style="color: var(--income-text); opacity: 0.6; background: none; border: none; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
    </div>

    <div class="px-5 pt-5 pb-10">
      <TransactionForm v-model="form" />

      <!-- Error -->
      <p v-if="errorMsg" class="text-[13px] font-semibold mb-3 px-1 flex items-center gap-1.5" style="color: var(--expense);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ errorMsg }}
      </p>

      <!-- Simpan -->
      <button
        id="btn-simpan-transaksi"
        :disabled="saving"
        class="btn-primary mt-2"
        @click="save"
      >
        <span v-if="saving" class="save-spinner"></span>
        {{ saving ? "Menyimpan..." : "Simpan Transaksi" }}
      </button>

      <!-- Hapus -->
      <button
        v-if="editingId"
        class="w-full mt-3 py-4 rounded-2xl font-bold text-[15px] border-2 transition-colors"
        style="border-color: var(--expense); color: var(--expense); background: transparent;"
        @click="remove"
      >
        Hapus Transaksi
      </button>
    </div>
  </div>

  <!-- ════ Modal Scan Struk ════ -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showReceiptScanner"
        class="ocr-overlay"
        @click.self="showReceiptScanner = false"
      >
        <div class="ocr-sheet">
          <!-- Sheet handle -->
          <div class="ocr-handle"></div>

          <!-- Sheet header -->
          <div class="ocr-sheet-header">
            <div>
              <h2 class="ocr-sheet-title">Scan Struk Belanja</h2>
              <p class="ocr-sheet-sub">OCR lokal — tidak perlu internet</p>
            </div>
            <button class="ocr-close" @click="showReceiptScanner = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Scanner content -->
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

/* ── OCR Modal ── */
.ocr-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
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
  display: flex;
  align-items: center;
  gap: 4px;
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
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.ocr-close:hover { background: var(--line); color: var(--ink); }

.ocr-sheet-body {
  padding: 20px;
  padding-bottom: max(24px, env(safe-area-inset-bottom, 24px));
}

/* ── Modal transition ── */
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

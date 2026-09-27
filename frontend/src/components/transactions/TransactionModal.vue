<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useTransactionModal } from "@/composables/useTransactionModal";
import { useTransactionsStore } from "@/stores/transactions";
import { useMasterDataStore } from "@/stores/masterData";
import { useWalletsStore } from "@/stores/wallets";
import { useCurrency } from "@/composables/useCurrency";
import ReceiptScanner from "@/components/transactions/ReceiptScanner.vue";
import type { TransactionType, PeriodType, ReceiptItem } from "@/types";
import {
  X,
  Plus,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet as WalletIcon,
  Receipt,
  Calendar,
  FileText,
  Calculator as CalcIcon,
  Trash2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Tag,
  Check,
  AlertCircle
} from "lucide-vue-next";

const { isOpen, options, closeModal } = useTransactionModal();
const txStore = useTransactionsStore();
const master = useMasterDataStore();
const walletsStore = useWalletsStore();
const { fmt } = useCurrency();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Form State
const form = reactive({
  type: "expense" as TransactionType,
  amount: null as number | null,
  periodType: "daily" as PeriodType,
  incomeSourceId: null as string | null,
  expenseCategoryId: null as string | null,
  note: "",
  occurredAt: todayStr(),
  receiptUrl: null as string | null,
  isOcr: false,
  receiptItems: [] as ReceiptItem[],
  walletId: null as string | null,
  transferToWalletId: null as string | null,
});

const isEditing = computed(() => !!options.value.editingId);
const saving = ref(false);
const errorMsg = ref("");

// Receipt OCR Scanner State
const showScanner = ref(false);
const showFullImage = ref(false);
const receiptItemsDropdownOpen = ref(true);
const showAddSubItem = ref(false);
const newSubItemName = ref("");
const newSubItemPrice = ref<number | null>(null);
const newSubItemQty = ref(1);

// Mini Calculator State
const showCalculator = ref(false);
const calcInput = ref("");

function openCalculator() {
  calcInput.value = form.amount ? String(form.amount) : "";
  showCalculator.value = true;
}

function appendCalc(val: string) {
  calcInput.value += val;
}

function clearCalc() {
  calcInput.value = "";
}

function backspaceCalc() {
  calcInput.value = calcInput.value.slice(0, -1);
}

function evaluateCalc() {
  try {
    const clean = calcInput.value.replace(/[^0-9+\-*/.]/g, "");
    if (!clean) return;
    const res = Function(`"use strict"; return (${clean})`)();
    if (!isNaN(res) && isFinite(res)) {
      form.amount = Math.max(0, Math.round(res));
      showCalculator.value = false;
    }
  } catch {
    // Keep input if invalid
  }
}

// Sub item helpers
const itemsSubtotal = computed(() => {
  if (!form.receiptItems || form.receiptItems.length === 0) return 0;
  return form.receiptItems.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 1), 0);
});

function removeSubItem(index: number) {
  form.receiptItems.splice(index, 1);
}

function addSubItem() {
  if (!newSubItemName.value.trim()) return;
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
    form.isOcr = false;
  }
}

function handleScannerApply(data: {
  amount: number | null;
  date: string | null;
  note: string;
  receiptUrl: string | null;
  isOcr: boolean;
  items: ReceiptItem[];
}) {
  if (data.amount !== null && data.amount > 0) {
    form.amount = data.amount;
  }
  if (data.date) {
    form.occurredAt = data.date;
  }
  if (data.note) {
    form.note = data.note;
  }
  if (data.receiptUrl) {
    form.receiptUrl = data.receiptUrl;
  }
  form.isOcr = data.isOcr;
  if (data.items && data.items.length > 0) {
    form.receiptItems = [...data.items];
  }
  showScanner.value = false;
}

// Initialize form when modal opens
watch(
  () => isOpen.value,
  async (opened) => {
    if (!opened) return;
    errorMsg.value = "";
    showScanner.value = false;
    showCalculator.value = false;

    if (master.incomeSources.length === 0 || master.expenseCategories.length === 0) {
      await master.fetchAll();
    }
    if (walletsStore.items.length === 0) {
      await walletsStore.fetchList();
    }

    if (options.value.editingId) {
      let tx = txStore.items.find((t) => t.id === options.value.editingId);
      if (!tx) {
        await txStore.fetchList({});
        tx = txStore.items.find((t) => t.id === options.value.editingId);
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
        return;
      }
    }

    // New transaction defaults
    form.type = options.value.type || "expense";
    form.amount = null;
    form.periodType = "daily";
    form.note = "";
    form.occurredAt = todayStr();
    form.receiptUrl = null;
    form.isOcr = false;
    form.receiptItems = [];

    // Wallet defaults
    form.walletId = options.value.walletId || walletsStore.defaultWallet?.id || walletsStore.items[0]?.id || null;
    if (form.type === "transfer" && walletsStore.items.length > 1) {
      const secondWallet = walletsStore.items.find((w) => w.id !== form.walletId);
      form.transferToWalletId = secondWallet?.id || null;
    } else {
      form.transferToWalletId = null;
    }

    // Category / Source defaults
    if (options.value.sourceId) {
      form.type = "income";
      form.incomeSourceId = options.value.sourceId;
    } else {
      form.incomeSourceId = master.incomeSources[0]?.id || null;
    }
    form.expenseCategoryId = master.expenseCategories[0]?.id || null;
  },
  { immediate: true }
);

function setType(type: TransactionType) {
  form.type = type;
  if (type === "transfer") {
    if (!form.transferToWalletId && walletsStore.items.length > 1) {
      const secondWallet = walletsStore.items.find((w) => w.id !== form.walletId);
      form.transferToWalletId = secondWallet?.id || null;
    }
  }
}

async function handleSubmit() {
  errorMsg.value = "";
  if (!form.amount || form.amount <= 0) {
    errorMsg.value = "Nominal transaksi harus lebih dari 0.";
    return;
  }
  if (!form.occurredAt) {
    errorMsg.value = "Tanggal transaksi harus diisi.";
    return;
  }

  if (form.type === "transfer") {
    if (!form.walletId) {
      errorMsg.value = "Pilih dompet asal untuk transfer.";
      return;
    }
    if (!form.transferToWalletId) {
      errorMsg.value = "Pilih dompet tujuan untuk transfer.";
      return;
    }
    if (form.walletId === form.transferToWalletId) {
      errorMsg.value = "Dompet asal dan dompet tujuan tidak boleh sama.";
      return;
    }
  }

  saving.value = true;
  try {
    const payload = {
      type: form.type,
      amount: form.amount,
      periodType: form.periodType,
      incomeSourceId: form.type === "income" ? form.incomeSourceId : null,
      expenseCategoryId: form.type === "expense" ? form.expenseCategoryId : null,
      note: form.note.trim() || undefined,
      occurredAt: form.occurredAt,
      receiptUrl: form.receiptUrl || undefined,
      isOcr: form.isOcr,
      receiptItems: form.receiptItems.length > 0 ? form.receiptItems : undefined,
      walletId: form.walletId || undefined,
      transferToWalletId: form.type === "transfer" ? form.transferToWalletId || undefined : undefined,
    };

    if (isEditing.value && options.value.editingId) {
      await txStore.update(options.value.editingId, payload);
    } else {
      await txStore.create(payload);
    }

    closeModal();
  } catch (err: any) {
    errorMsg.value = err.message || "Gagal menyimpan transaksi. Coba lagi.";
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!options.value.editingId) return;
  if (!confirm("Hapus transaksi ini secara permanen?")) return;
  saving.value = true;
  try {
    await txStore.remove(options.value.editingId);
    closeModal();
  } catch (err: any) {
    errorMsg.value = err.message || "Gagal menghapus transaksi.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop & Container -->
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <!-- Modal Card / Bottom Sheet -->
        <div
          class="modal-sheet w-full sm:max-w-lg bg-surface flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden"
          :class="[
            'border border-line',
            'rounded-t-[26px] sm:rounded-[22px]',
            'shadow-[0_1px_2px_rgba(18,25,21,0.04),0_6px_20px_rgba(18,25,21,0.06)]'
          ]"
        >
          <!-- Mobile Handle Bar -->
          <div class="sm:hidden flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 bg-line rounded-full"></div>
          </div>

          <!-- Header -->
          <div class="px-5 py-3.5 border-b border-line-soft flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-[16px] font-[800] text-ink leading-tight font-ui">
                {{ isEditing ? "Edit Transaksi" : "Tambah Transaksi" }}
              </h2>
              <p class="text-[11px] font-[600] text-ink-soft leading-none mt-0.5">
                {{ form.type === 'income' ? 'Catat penerimaan uang' : form.type === 'transfer' ? 'Pindah saldo antar dompet' : 'Catat pengeluaran harian' }}
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-bg transition-colors"
              @click="closeModal"
              aria-label="Tutup modal"
            >
              <X :size="18" :stroke-width="1.8" />
            </button>
          </div>

          <!-- Body Scrollable -->
          <div class="p-5 overflow-y-auto space-y-4 flex-1">
            <!-- Alert Error -->
            <div
              v-if="errorMsg"
              class="p-3 rounded-[10px] bg-expense/10 text-expense text-xs font-[600] flex items-center gap-2"
            >
              <AlertCircle :size="16" />
              <span>{{ errorMsg }}</span>
            </div>

            <!-- Segmented Control Toggle Jenis Transaksi -->
            <div class="p-1 rounded-[12px] bg-bg border border-line grid grid-cols-3 gap-1">
              <button
                type="button"
                class="py-2 text-[13px] font-[700] rounded-[10px] transition-all flex items-center justify-center gap-1.5"
                :class="form.type === 'expense' ? 'bg-expense text-white shadow-sm' : 'text-ink-soft hover:text-ink'"
                @click="setType('expense')"
              >
                <ArrowDownLeft :size="15" :stroke-width="2" />
                <span>Pengeluaran</span>
              </button>

              <button
                type="button"
                class="py-2 text-[13px] font-[700] rounded-[10px] transition-all flex items-center justify-center gap-1.5"
                :class="form.type === 'income' ? 'bg-income text-white shadow-sm' : 'text-ink-soft hover:text-ink'"
                @click="setType('income')"
              >
                <ArrowUpRight :size="15" :stroke-width="2" />
                <span>Pemasukan</span>
              </button>

              <button
                type="button"
                class="py-2 text-[13px] font-[700] rounded-[10px] transition-all flex items-center justify-center gap-1.5"
                :class="form.type === 'transfer' ? 'bg-pine text-white shadow-sm' : 'text-ink-soft hover:text-ink'"
                @click="setType('transfer')"
              >
                <ArrowLeftRight :size="15" :stroke-width="2" />
                <span>Transfer</span>
              </button>
            </div>

            <!-- Nominal Input Card with Fraunces font & Calculator -->
            <div class="p-3.5 rounded-[14px] bg-bg border border-line">
              <div class="flex items-center justify-between mb-1">
                <label class="text-[11px] font-[700] text-ink-soft uppercase tracking-wider">
                  Nominal (Rp)
                </label>
                <button
                  type="button"
                  class="text-[11px] font-[700] text-pine flex items-center gap-1 hover:underline"
                  @click="openCalculator"
                >
                  <CalcIcon :size="13" :stroke-width="1.8" />
                  <span>Kalkulator</span>
                </button>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-xl font-[500] text-ink-soft font-display italic">Rp</span>
                <input
                  v-model.number="form.amount"
                  type="number"
                  inputmode="numeric"
                  placeholder="0"
                  class="w-full bg-transparent text-[28px] sm:text-[32px] font-[500] font-display text-ink outline-none tracking-tight placeholder:text-ink-faint"
                />
              </div>

              <!-- Inline Quick Calculator Popover -->
              <div
                v-if="showCalculator"
                class="mt-3 pt-3 border-t border-line"
              >
                <div class="flex items-center gap-2 mb-2 bg-surface p-2 rounded-[10px] border border-line">
                  <input
                    v-model="calcInput"
                    type="text"
                    readonly
                    placeholder="Hitung..."
                    class="w-full bg-transparent font-mono text-sm font-[700] text-ink outline-none"
                  />
                  <button
                    type="button"
                    class="text-[11px] text-ink-soft hover:text-ink font-bold px-1.5"
                    @click="backspaceCalc"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    class="text-[11px] text-expense hover:text-expense font-bold px-1.5"
                    @click="clearCalc"
                  >
                    C
                  </button>
                </div>
                <div class="grid grid-cols-4 gap-1.5 text-xs font-[700]">
                  <button
                    v-for="btn in ['7','8','9','/','4','5','6','*','1','2','3','-','0','00','.','+']"
                    :key="btn"
                    type="button"
                    class="py-2 rounded-[8px] bg-surface border border-line text-ink hover:bg-pine-tint hover:border-pine/30 transition-colors"
                    @click="appendCalc(btn)"
                  >
                    {{ btn }}
                  </button>
                  <button
                    type="button"
                    class="col-span-4 py-2 mt-1 rounded-[8px] bg-pine text-white text-xs font-[700] hover:bg-pine-2 transition-all flex items-center justify-center gap-1"
                    @click="evaluateCalc"
                  >
                    <Check :size="14" />
                    <span>Terapkan Hasil Hitungan</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Dompet Selection -->
            <div>
              <label class="text-[11.5px] font-[700] text-ink-soft uppercase tracking-wider block mb-1.5">
                {{ form.type === 'transfer' ? 'Dari Dompet (Sumber Saldo)' : 'Akun / Dompet' }}
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="w in walletsStore.items"
                  :key="w.id"
                  type="button"
                  class="p-2.5 rounded-[12px] border text-left flex items-center gap-2 transition-all"
                  :class="form.walletId === w.id ? 'border-pine bg-pine-tint shadow-sm text-pine' : 'border-line bg-surface hover:bg-bg text-ink'"
                  @click="form.walletId = w.id"
                >
                  <span class="w-7 h-7 rounded-[8px] bg-surface flex items-center justify-center text-sm shadow-xs border border-line-soft">
                    {{ w.icon || '💵' }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-[12px] font-[700] truncate leading-tight">{{ w.name }}</p>
                    <p class="text-[10px] text-ink-soft font-[600] truncate">{{ fmt(w.balance) }}</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Ke Dompet (Jika Transfer) -->
            <div v-if="form.type === 'transfer'" class="p-3 rounded-[14px] bg-bg border border-line space-y-2">
              <label class="text-[11.5px] font-[700] text-ink-soft uppercase tracking-wider block">
                Ke Dompet (Tujuan Transfer)
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="w in walletsStore.items.filter(w => w.id !== form.walletId)"
                  :key="w.id"
                  type="button"
                  class="p-2.5 rounded-[12px] border text-left flex items-center gap-2 transition-all"
                  :class="form.transferToWalletId === w.id ? 'border-pine bg-pine-tint shadow-sm text-pine' : 'border-line bg-surface hover:bg-bg text-ink'"
                  @click="form.transferToWalletId = w.id"
                >
                  <span class="w-7 h-7 rounded-[8px] bg-surface flex items-center justify-center text-sm shadow-xs border border-line-soft">
                    {{ w.icon || '💵' }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-[12px] font-[700] truncate leading-tight">{{ w.name }}</p>
                    <p class="text-[10px] text-ink-soft font-[600] truncate">{{ fmt(w.balance) }}</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Kategori Pengeluaran (Jika Pengeluaran) -->
            <div v-if="form.type === 'expense'">
              <label class="text-[11.5px] font-[700] text-ink-soft uppercase tracking-wider block mb-1.5">
                Kategori Pengeluaran
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  v-for="cat in master.expenseCategories"
                  :key="cat.id"
                  type="button"
                  class="p-2 rounded-[10px] border text-left flex items-center gap-2 transition-all"
                  :class="form.expenseCategoryId === cat.id ? 'border-expense bg-expense-tint text-expense font-[700]' : 'border-line bg-surface hover:bg-bg text-ink font-[600]'"
                  @click="form.expenseCategoryId = cat.id"
                >
                  <span class="w-6 h-6 rounded-[6px] bg-surface flex items-center justify-center text-xs border border-line-soft">
                    {{ cat.icon || '🏷️' }}
                  </span>
                  <span class="text-[12px] truncate">{{ cat.name }}</span>
                </button>
              </div>
            </div>

            <!-- Sumber Pemasukan (Jika Pemasukan) -->
            <div v-if="form.type === 'income'">
              <label class="text-[11.5px] font-[700] text-ink-soft uppercase tracking-wider block mb-1.5">
                Sumber Pemasukan
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="src in master.incomeSources"
                  :key="src.id"
                  type="button"
                  class="p-2 rounded-[10px] border text-left flex items-center gap-2 transition-all"
                  :class="form.incomeSourceId === src.id ? 'border-income bg-income-tint text-income font-[700]' : 'border-line bg-surface hover:bg-bg text-ink font-[600]'"
                  @click="form.incomeSourceId = src.id; form.periodType = src.defaultPeriodType"
                >
                  <span class="w-6 h-6 rounded-[6px] bg-surface flex items-center justify-center text-xs border border-line-soft">
                    {{ src.icon || '💰' }}
                  </span>
                  <span class="text-[12px] truncate">{{ src.name }}</span>
                </button>
              </div>
            </div>

            <!-- Scan Struk & Foto Lampiran Section (Pengeluaran & Pemasukan) -->
            <div v-if="form.type !== 'transfer'" class="p-3.5 rounded-[14px] bg-bg border border-line space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Receipt :size="16" class="text-pine" />
                  <span class="text-[12px] font-[700] text-ink">Lampiran & Scan Struk</span>
                </div>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-[8px] bg-pine-tint text-pine hover:bg-pine hover:text-white text-[11px] font-[700] flex items-center gap-1 transition-all"
                  @click="showScanner = true"
                >
                  <Plus :size="13" />
                  <span>Scan Struk</span>
                </button>
              </div>

              <!-- Preview Foto Struk jika ada -->
              <div v-if="form.receiptUrl" class="flex items-center gap-3 p-2 rounded-[10px] bg-surface border border-line">
                <img
                  :src="form.receiptUrl"
                  alt="Struk"
                  class="w-12 h-12 object-cover rounded-[8px] border border-line cursor-pointer hover:opacity-90 transition-opacity"
                  @click="showFullImage = true"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 rounded text-[9.5px] font-[700] bg-pine-tint text-pine">
                      Struk Terlampir
                    </span>
                    <span v-if="form.isOcr" class="text-[10px] text-ink-soft font-[600]">
                      &middot; OCR Aktif
                    </span>
                  </div>
                  <button
                    type="button"
                    class="text-[11px] text-pine font-[600] hover:underline flex items-center gap-0.5 mt-0.5"
                    @click="showFullImage = true"
                  >
                    <Maximize2 :size="10" />
                    <span>Lihat Foto Struk</span>
                  </button>
                </div>
                <button
                  type="button"
                  class="p-1.5 rounded-full text-ink-soft hover:text-expense hover:bg-bg transition-colors"
                  title="Hapus foto struk"
                  @click="removeReceiptPhoto"
                >
                  <Trash2 :size="15" />
                </button>
              </div>

              <!-- Rincian Item Struk -->
              <div v-if="form.receiptItems && form.receiptItems.length > 0" class="border border-line rounded-[10px] overflow-hidden bg-surface">
                <button
                  type="button"
                  class="w-full px-3 py-2 flex items-center justify-between text-[11.5px] font-[700] text-ink bg-bg/50 border-b border-line hover:bg-bg transition-colors"
                  @click="receiptItemsDropdownOpen = !receiptItemsDropdownOpen"
                >
                  <span>Daftar Item Struk ({{ form.receiptItems.length }} barang)</span>
                  <div class="flex items-center gap-1 text-ink-soft">
                    <span>{{ fmt(itemsSubtotal) }}</span>
                    <component :is="receiptItemsDropdownOpen ? ChevronUp : ChevronDown" :size="14" />
                  </div>
                </button>

                <div v-if="receiptItemsDropdownOpen" class="p-2 space-y-1.5">
                  <div
                    v-for="(it, idx) in form.receiptItems"
                    :key="idx"
                    class="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-bg"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="font-[600] text-ink truncate">{{ it.name }}</p>
                      <p v-if="it.qty && it.qty > 1" class="text-[10px] text-ink-soft">Qty: {{ it.qty }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-[700] text-ink">{{ it.price ? fmt(it.price * (it.qty || 1)) : '-' }}</span>
                      <button
                        type="button"
                        class="text-ink-soft hover:text-expense"
                        @click="removeSubItem(idx)"
                      >
                        <X :size="13" />
                      </button>
                    </div>
                  </div>

                  <!-- Tambah Sub Item Manual -->
                  <div v-if="showAddSubItem" class="pt-2 border-t border-line space-y-1.5">
                    <input
                      v-model="newSubItemName"
                      type="text"
                      placeholder="Nama barang..."
                      class="w-full text-xs p-1.5 rounded border border-line outline-none"
                    />
                    <div class="flex gap-1.5">
                      <input
                        v-model.number="newSubItemPrice"
                        type="number"
                        placeholder="Harga (Rp)..."
                        class="flex-1 text-xs p-1.5 rounded border border-line outline-none"
                      />
                      <input
                        v-model.number="newSubItemQty"
                        type="number"
                        min="1"
                        placeholder="Qty"
                        class="w-16 text-xs p-1.5 rounded border border-line outline-none text-center"
                      />
                    </div>
                    <div class="flex justify-end gap-1.5">
                      <button
                        type="button"
                        class="px-2 py-1 text-[11px] rounded border border-line text-ink-soft"
                        @click="showAddSubItem = false"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        class="px-2.5 py-1 text-[11px] font-[700] rounded bg-pine text-white"
                        @click="addSubItem"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>

                  <button
                    v-else
                    type="button"
                    class="w-full py-1 text-center text-[11px] font-[700] text-pine hover:underline"
                    @click="showAddSubItem = true"
                  >
                    + Tambah Item Struk
                  </button>
                </div>
              </div>
            </div>

            <!-- Tanggal & Catatan -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[11.5px] font-[700] text-ink-soft uppercase tracking-wider block mb-1">
                  Tanggal
                </label>
                <div class="relative">
                  <input
                    v-model="form.occurredAt"
                    type="date"
                    class="w-full p-2.5 rounded-[10px] border border-line bg-surface text-xs font-[700] text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="text-[11.5px] font-[700] text-ink-soft uppercase tracking-wider block mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  v-model="form.note"
                  type="text"
                  placeholder="Keterangan..."
                  class="w-full p-2.5 rounded-[10px] border border-line bg-surface text-xs font-[600] text-ink outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="p-4 border-t border-line-soft bg-surface flex items-center justify-between gap-3 flex-shrink-0">
            <button
              v-if="isEditing"
              type="button"
              class="px-3.5 py-2.5 rounded-[14px] text-xs font-[700] text-expense hover:bg-expense-tint transition-all flex items-center gap-1"
              :disabled="saving"
              @click="handleDelete"
            >
              <Trash2 :size="15" />
              <span>Hapus</span>
            </button>

            <button
              v-else
              type="button"
              class="px-4 py-2.5 rounded-[14px] text-xs font-[700] text-ink-soft hover:text-ink hover:bg-bg transition-all"
              @click="closeModal"
            >
              Batal
            </button>

            <!-- Single Primary Pine Button per Design System -->
            <button
              type="button"
              class="flex-1 py-3 rounded-[14px] bg-pine hover:bg-pine-2 text-white font-[700] text-[13.5px] font-ui shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
              :disabled="saving"
              @click="handleSubmit"
            >
              <Check :size="16" :stroke-width="2.2" />
              <span>{{ saving ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan Transaksi" }}</span>
            </button>
          </div>
        </div>

        <!-- Receipt Scanner Modal Overlay -->
        <ReceiptScanner
          v-if="showScanner"
          @apply="handleScannerApply"
          @close="showScanner = false"
        />

        <!-- Lightbox Zoom Foto Struk -->
        <div
          v-if="showFullImage && form.receiptUrl"
          class="fixed inset-0 z-60 bg-ink/80 backdrop-blur-md flex items-center justify-center p-4"
          @click.self="showFullImage = false"
        >
          <div class="relative max-w-lg w-full bg-surface rounded-[22px] overflow-hidden shadow-2xl p-2">
            <button
              type="button"
              class="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink/70 text-white flex items-center justify-center hover:bg-ink transition-colors"
              @click="showFullImage = false"
            >
              <X :size="16" />
            </button>
            <img
              :src="form.receiptUrl"
              alt="Foto Struk Penuh"
              class="w-full max-h-[80vh] object-contain rounded-[16px]"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Transition styling */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 250ms ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-sheet,
.modal-fade-leave-active .modal-sheet {
  transition: transform 250ms ease, opacity 250ms ease;
}

@media (max-width: 639px) {
  .modal-fade-enter-from .modal-sheet,
  .modal-fade-leave-to .modal-sheet {
    transform: translateY(100%);
  }
}

@media (min-width: 640px) {
  .modal-fade-enter-from .modal-sheet,
  .modal-fade-leave-to .modal-sheet {
    transform: scale(0.95);
    opacity: 0;
  }
}
</style>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMasterDataStore } from "@/stores/masterData";
import { useWalletsStore } from "@/stores/wallets";
import { useTransactionsStore } from "@/stores/transactions";
import { useCurrency } from "@/composables/useCurrency";
import { usePrivacyMode } from "@/composables/usePrivacyMode";
import { useTheme, AVAILABLE_THEMES } from "@/composables/useTheme";
import type { Wallet, WalletType, IncomeSource, ExpenseCategory, PeriodType } from "@/types";
import { WALLET_TYPE_LABELS } from "@/types";
import {
  Wallet as WalletIcon,
  LayoutGrid,
  Globe,
  Eye,
  Download,
  Sun,
  Moon,
  ChevronRight,
  MoreHorizontal,
  LogOut,
  X,
  Check,
  Plus,
  Edit3,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from "lucide-vue-next";

const auth = useAuthStore();
const master = useMasterDataStore();
const walletsStore = useWalletsStore();
const txStore = useTransactionsStore();
const router = useRouter();
const { fmt } = useCurrency();
const { isPrivacyMode, togglePrivacy, maskValue } = usePrivacyMode();
const { currentTheme, setTheme } = useTheme();

// Profile initials (e.g. "Dinda Nuraini" -> "DN")
const initials = computed(() => {
  const name = auth.user?.name || auth.user?.email || "User";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

// Modals state
const showEditProfileModal = ref(false);
const showWalletsModal = ref(false);
const showCategoriesModal = ref(false);
const showCurrencyLangModal = ref(false);
const showExportModal = ref(false);
const showThemeModal = ref(false);

// Edit Profile Form
const editProfileName = ref("");
const savingProfile = ref(false);

function openEditProfile() {
  editProfileName.value = auth.user?.name || "";
  showEditProfileModal.value = true;
}

async function saveProfile() {
  if (!editProfileName.value.trim()) return;
  savingProfile.value = true;
  try {
    await auth.updateProfile({ name: editProfileName.value.trim() });
    showEditProfileModal.value = false;
  } catch (e: any) {
    alert("Gagal menyimpan profil: " + e.message);
  } finally {
    savingProfile.value = false;
  }
}

// ══════════════════════════════════════════════════════
// 1. KELOLA DOMPET
// ══════════════════════════════════════════════════════
const showAddWalletForm = ref(false);
const editingWallet = ref<Wallet | null>(null);
const walletFormName = ref("");
const walletFormType = ref<WalletType>("cash");
const walletFormBalance = ref<number | null>(0);
const walletFormIcon = ref("💵");
const walletFormColor = ref("#10b981");

const WALLET_ICONS = ["💵", "🏦", "📱", "💳", "💰", "🪙", "🏧", "💼"];
const WALLET_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#64748b"];

function openNewWallet() {
  editingWallet.value = null;
  walletFormName.value = "";
  walletFormType.value = "cash";
  walletFormBalance.value = 0;
  walletFormIcon.value = "💵";
  walletFormColor.value = "#10b981";
  showAddWalletForm.value = true;
}

function openEditWallet(w: Wallet) {
  editingWallet.value = w;
  walletFormName.value = w.name;
  walletFormType.value = w.type;
  walletFormBalance.value = w.balance;
  walletFormIcon.value = w.icon || "💵";
  walletFormColor.value = w.color || "#10b981";
  showAddWalletForm.value = true;
}

async function saveWalletItem() {
  if (!walletFormName.value.trim()) return;
  if (editingWallet.value) {
    await walletsStore.update(editingWallet.value.id, {
      name: walletFormName.value.trim(),
      type: walletFormType.value,
      balance: walletFormBalance.value || 0,
      icon: walletFormIcon.value,
      color: walletFormColor.value,
    });
  } else {
    await walletsStore.create({
      name: walletFormName.value.trim(),
      type: walletFormType.value,
      balance: walletFormBalance.value || 0,
      icon: walletFormIcon.value,
      color: walletFormColor.value,
    });
  }
  showAddWalletForm.value = false;
}

async function deleteWalletItem(id: string) {
  if (!confirm("Hapus akun dompet ini?")) return;
  await walletsStore.remove(id);
  showAddWalletForm.value = false;
}

// ══════════════════════════════════════════════════════
// 2. KELOLA KATEGORI
// ══════════════════════════════════════════════════════
const categoryTab = ref<"expense" | "income">("expense");
const newCatName = ref("");
const newSourcePeriod = ref<PeriodType>("daily");
const editingCat = ref<ExpenseCategory | null>(null);
const editingSource = ref<IncomeSource | null>(null);
const editCategoryName = ref("");

async function addCategory() {
  const name = newCatName.value.trim();
  if (!name) return;
  if (categoryTab.value === "expense") {
    await master.addExpenseCategory(name);
  } else {
    await master.addIncomeSource(name, newSourcePeriod.value);
  }
  newCatName.value = "";
}

function startEditCategory(c: ExpenseCategory) {
  editingCat.value = c;
  editCategoryName.value = c.name;
}

async function saveEditCategory() {
  if (!editingCat.value || !editCategoryName.value.trim()) return;
  await master.updateExpenseCategory(editingCat.value.id, { name: editCategoryName.value.trim() });
  editingCat.value = null;
}

async function deleteCategory(id: string) {
  if (!confirm("Hapus kategori ini?")) return;
  await master.removeExpenseCategory(id);
}

function startEditSource(s: IncomeSource) {
  editingSource.value = s;
  editCategoryName.value = s.name;
}

async function saveEditSource() {
  if (!editingSource.value || !editCategoryName.value.trim()) return;
  await master.updateIncomeSource(editingSource.value.id, {
    name: editCategoryName.value.trim(),
    defaultPeriodType: editingSource.value.defaultPeriodType,
  });
  editingSource.value = null;
}

async function deleteSource(id: string) {
  if (!confirm("Hapus sumber pemasukan ini?")) return;
  await master.removeIncomeSource(id);
}

// ══════════════════════════════════════════════════════
// 3. MATA UANG & BAHASA
// ══════════════════════════════════════════════════════
const selectedCurrency = ref("IDR");
const selectedLanguage = ref("id");

const CURRENCIES = [
  { code: "IDR", symbol: "Rp", name: "Rupiah Indonesia" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
];

const LANGUAGES = [
  { code: "id", name: "Bahasa Indonesia", native: "Bahasa Indonesia" },
  { code: "en", name: "English", native: "English (US)" },
];

// ══════════════════════════════════════════════════════
// 5. EKSPOR DATA
// ══════════════════════════════════════════════════════
const exportDateRange = ref<"all" | "30d" | "this_month">("all");
const exportFormat = ref<"csv" | "json">("csv");
const exporting = ref(false);

function triggerExport() {
  exporting.value = true;
  try {
    const items = txStore.items;
    if (items.length === 0) {
      alert("Belum ada data transaksi untuk diekspor.");
      return;
    }

    if (exportFormat.value === "csv") {
      const headers = ["Tanggal", "Jenis", "Kategori/Sumber", "Jumlah (Rp)", "Dompet", "Catatan", "Metode Input"];
      const rows = items.map((t) => [
        t.occurredAt,
        t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer",
        t.type === "income"
          ? (t.incomeSource?.name || "Lainnya")
          : t.type === "expense"
          ? (t.expenseCategory?.name || "Lainnya")
          : `${t.wallet?.name || "Dompet"} -> ${t.transferToWallet?.name || "Tujuan"}`,
        t.amount,
        t.wallet?.name || "-",
        `"${(t.note || "").replace(/"/g, '""')}"`,
        t.isOcr || t.receiptUrl ? "Scan Struk" : "Manual",
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `transaksi_ekspor_${new Date().toISOString().slice(0, 10)}.csv`);
    } else {
      const jsonContent = JSON.stringify(items, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
      downloadBlob(blob, `transaksi_ekspor_${new Date().toISOString().slice(0, 10)}.json`);
    }

    showExportModal.value = false;
  } finally {
    exporting.value = false;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════
// 6. LOGOUT
// ══════════════════════════════════════════════════════
async function handleLogout() {
  if (!confirm("Apakah Anda yakin ingin keluar dari akun?")) return;
  await auth.logout();
  router.push({ name: "login" });
}

onMounted(async () => {
  if (walletsStore.items.length === 0) await walletsStore.fetchList();
  if (master.expenseCategories.length === 0) await master.fetchAll();
  if (txStore.items.length === 0) await txStore.fetchList({});
});
</script>

<template>
  <div class="min-h-screen pb-24 bg-bg font-ui text-ink flex justify-center">
    <div class="w-full max-w-md px-5 pt-4 pb-8 sm:px-6">

      <!-- Top Bar: Title "Profil" on left, "..." on right per Mockup -->
      <div class="flex items-center justify-between pt-2 pb-4">
        <h1 class="text-[22px] font-[800] text-ink tracking-tight font-ui leading-none m-0">
          Profil
        </h1>

        <button
          type="button"
          class="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-surface transition-colors"
          title="Opsi profil"
          @click="openEditProfile"
        >
          <MoreHorizontal :size="20" :stroke-width="2" />
        </button>
      </div>

      <!-- Avatar & User Info Section (Centered per Mockup) -->
      <div class="flex flex-col items-center justify-center py-4 mb-3">
        <!-- Circular Avatar with soft sage/pine tint and dark green text -->
        <div
          class="w-[78px] h-[78px] rounded-full flex items-center justify-center text-[24px] font-[800] tracking-wider mb-3 select-none transition-transform hover:scale-105 cursor-pointer shadow-xs"
          style="background-color: var(--pine-tint); color: var(--pine);"
          @click="openEditProfile"
          title="Klik untuk ubah nama profil"
        >
          {{ initials }}
        </div>

        <!-- User Name -->
        <h2 class="text-[18px] font-[800] text-ink leading-tight m-0 font-ui text-center">
          {{ auth.user?.name || "Pengguna" }}
        </h2>

        <!-- User Email -->
        <p class="text-[12.5px] font-[500] text-ink-soft mt-1 m-0 text-center">
          {{ auth.user?.email || "email@user.com" }}
        </p>
      </div>

      <!-- Settings Menu List (Cards with exact icons & labels from mockup) -->
      <div class="card bg-surface rounded-[22px] border border-line divide-y divide-line-soft overflow-hidden mb-6">

        <!-- 1. Kelola dompet -->
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/40 transition-colors select-none"
          @click="showWalletsModal = true"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-[40px] h-[40px] rounded-[12px] bg-bg flex items-center justify-center text-ink flex-shrink-0">
              <WalletIcon :size="18" :stroke-width="1.8" />
            </div>
            <span class="text-[14px] font-[700] text-ink font-ui">
              Kelola dompet
            </span>
          </div>
          <ChevronRight :size="17" :stroke-width="1.8" class="text-ink-faint flex-shrink-0" />
        </div>

        <!-- 2. Kelola kategori -->
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/40 transition-colors select-none"
          @click="showCategoriesModal = true"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-[40px] h-[40px] rounded-[12px] bg-bg flex items-center justify-center text-ink flex-shrink-0">
              <LayoutGrid :size="18" :stroke-width="1.8" />
            </div>
            <span class="text-[14px] font-[700] text-ink font-ui">
              Kelola kategori
            </span>
          </div>
          <ChevronRight :size="17" :stroke-width="1.8" class="text-ink-faint flex-shrink-0" />
        </div>

        <!-- 3. Mata uang & bahasa -->
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/40 transition-colors select-none"
          @click="showCurrencyLangModal = true"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-[40px] h-[40px] rounded-[12px] bg-bg flex items-center justify-center text-ink flex-shrink-0">
              <Globe :size="18" :stroke-width="1.8" />
            </div>
            <span class="text-[14px] font-[700] text-ink font-ui">
              Mata uang & bahasa
            </span>
          </div>
          <ChevronRight :size="17" :stroke-width="1.8" class="text-ink-faint flex-shrink-0" />
        </div>

        <!-- 4. Mode privasi -->
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/40 transition-colors select-none"
          @click="togglePrivacy"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-[40px] h-[40px] rounded-[12px] bg-bg flex items-center justify-center text-ink flex-shrink-0">
              <Eye :size="18" :stroke-width="1.8" />
            </div>
            <span class="text-[14px] font-[700] text-ink font-ui">
              Mode privasi
            </span>
          </div>

          <!-- iOS-style toggle switch -->
          <div
            class="w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0"
            :class="isPrivacyMode ? 'bg-pine' : 'bg-line'"
          >
            <div
              class="w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform"
              :class="isPrivacyMode ? 'translate-x-5' : 'translate-x-0'"
            ></div>
          </div>
        </div>

        <!-- 5. Ekspor data -->
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/40 transition-colors select-none"
          @click="showExportModal = true"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-[40px] h-[40px] rounded-[12px] bg-bg flex items-center justify-center text-ink flex-shrink-0">
              <Download :size="18" :stroke-width="1.8" />
            </div>
            <span class="text-[14px] font-[700] text-ink font-ui">
              Ekspor data
            </span>
          </div>
          <ChevronRight :size="17" :stroke-width="1.8" class="text-ink-faint flex-shrink-0" />
        </div>

        <!-- 6. Tema gelap/terang -->
        <div
          class="flex items-center justify-between p-4 cursor-pointer hover:bg-bg/40 transition-colors select-none"
          @click="showThemeModal = true"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-[40px] h-[40px] rounded-[12px] bg-bg flex items-center justify-center text-ink flex-shrink-0">
              <component :is="currentTheme === 'dark' ? Moon : Sun" :size="18" :stroke-width="1.8" />
            </div>
            <span class="text-[14px] font-[700] text-ink font-ui">
              Tema gelap/terang
            </span>
          </div>
          <ChevronRight :size="17" :stroke-width="1.8" class="text-ink-faint flex-shrink-0" />
        </div>

      </div>

      <!-- Logout Action & Version Info -->
      <div class="space-y-3 pt-1 text-center">
        <button
          type="button"
          class="w-full py-3 px-4 rounded-[14px] border border-expense/25 text-expense hover:bg-expense-tint text-[13.5px] font-[700] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          @click="handleLogout"
        >
          <LogOut :size="16" :stroke-width="2" />
          <span>Keluar dari Akun</span>
        </button>

        <p class="text-[11px] font-[500] text-ink-faint tracking-wide">
          Family Notes &middot; v1.0.0
        </p>
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL 0: EDIT PROFIL -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showEditProfileModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        @click.self="showEditProfileModal = false"
      >
        <div class="w-full max-w-sm bg-surface rounded-[22px] border border-line p-5 shadow-card">
          <div class="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 class="text-[16px] font-[800] text-ink">Ubah Nama Profil</h3>
            <button class="text-ink-soft hover:text-ink" @click="showEditProfileModal = false">
              <X :size="18" />
            </button>
          </div>

          <div class="space-y-3 mb-4">
            <div>
              <label class="text-[11px] font-[700] text-ink-soft uppercase tracking-wider block mb-1">
                Nama Lengkap
              </label>
              <input
                v-model="editProfileName"
                type="text"
                placeholder="Contoh: Dinda Nuraini"
                class="w-full p-2.5 rounded-[10px] border border-line bg-surface text-sm font-[600] text-ink outline-none"
              />
            </div>
            <div>
              <label class="text-[11px] font-[700] text-ink-soft uppercase tracking-wider block mb-1">
                Email
              </label>
              <input
                :value="auth.user?.email"
                disabled
                class="w-full p-2.5 rounded-[10px] border border-line bg-bg text-sm font-[500] text-ink-soft outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 py-2.5 rounded-[12px] border border-line text-xs font-[700] text-ink-soft hover:bg-bg"
              @click="showEditProfileModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="flex-1 py-2.5 rounded-[12px] bg-pine hover:bg-pine-2 text-white text-xs font-[700]"
              :disabled="savingProfile"
              @click="saveProfile"
            >
              {{ savingProfile ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL 1: KELOLA DOMPET -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showWalletsModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        @click.self="showWalletsModal = false"
      >
        <div class="w-full max-w-md bg-surface rounded-[22px] border border-line p-5 shadow-card max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-line mb-3 flex-shrink-0">
            <div>
              <h3 class="text-[16px] font-[800] text-ink">Kelola Dompet</h3>
              <p class="text-[11px] text-ink-soft font-[500]">Daftar akun & saldo keuangan Anda</p>
            </div>
            <button class="text-ink-soft hover:text-ink" @click="showWalletsModal = false">
              <X :size="18" />
            </button>
          </div>

          <!-- List Wallets -->
          <div class="overflow-y-auto flex-1 space-y-2 py-1 pr-1">
            <div
              v-for="w in walletsStore.items"
              :key="w.id"
              class="flex items-center justify-between p-3 rounded-[14px] border border-line bg-bg hover:bg-bg/80 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-9 h-9 rounded-[10px] bg-surface flex items-center justify-center text-lg border border-line-soft">
                  {{ w.icon || '💵' }}
                </span>
                <div class="min-w-0">
                  <p class="text-[13px] font-[700] text-ink truncate leading-tight">{{ w.name }}</p>
                  <p class="text-[11px] font-[600] text-ink-soft truncate">{{ maskValue(fmt(w.balance)) }}</p>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  class="p-1.5 rounded-[8px] hover:bg-surface text-ink-soft hover:text-ink"
                  title="Edit dompet"
                  @click="openEditWallet(w)"
                >
                  <Edit3 :size="15" />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-[8px] hover:bg-expense-tint text-ink-soft hover:text-expense"
                  title="Hapus dompet"
                  @click="deleteWalletItem(w.id)"
                >
                  <Trash2 :size="15" />
                </button>
              </div>
            </div>
          </div>

          <!-- Add Wallet Button -->
          <div class="pt-3 border-t border-line flex-shrink-0">
            <button
              type="button"
              class="w-full py-2.5 rounded-[12px] bg-pine hover:bg-pine-2 text-white text-xs font-[700] flex items-center justify-center gap-1.5"
              @click="openNewWallet"
            >
              <Plus :size="15" />
              <span>Tambah Akun Dompet</span>
            </button>
          </div>
        </div>

        <!-- Form Tambah / Edit Dompet Modal -->
        <div
          v-if="showAddWalletForm"
          class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
          @click.self="showAddWalletForm = false"
        >
          <div class="w-full max-w-sm bg-surface rounded-[20px] border border-line p-5 shadow-2xl">
            <h4 class="text-sm font-[800] text-ink mb-3">
              {{ editingWallet ? "Edit Dompet" : "Tambah Dompet Baru" }}
            </h4>

            <div class="space-y-3 mb-4">
              <div>
                <label class="text-[11px] font-[700] text-ink-soft uppercase block mb-1">Nama Dompet</label>
                <input
                  v-model="walletFormName"
                  type="text"
                  placeholder="Misal: BCA, Dompet Fisik, GoPay"
                  class="w-full p-2 rounded-[8px] border border-line text-xs font-[600] outline-none"
                />
              </div>

              <div>
                <label class="text-[11px] font-[700] text-ink-soft uppercase block mb-1">Tipe Akun</label>
                <select
                  v-model="walletFormType"
                  class="w-full p-2 rounded-[8px] border border-line text-xs font-[600] outline-none bg-surface"
                >
                  <option value="cash">Tunai (Cash)</option>
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="credit_card">Kartu Kredit</option>
                </select>
              </div>

              <div>
                <label class="text-[11px] font-[700] text-ink-soft uppercase block mb-1">Saldo Awal (Rp)</label>
                <input
                  v-model.number="walletFormBalance"
                  type="number"
                  class="w-full p-2 rounded-[8px] border border-line text-xs font-[600] outline-none"
                />
              </div>

              <div>
                <label class="text-[11px] font-[700] text-ink-soft uppercase block mb-1">Ikon</label>
                <div class="flex gap-2">
                  <button
                    v-for="ic in WALLET_ICONS"
                    :key="ic"
                    type="button"
                    class="w-8 h-8 rounded-[8px] border flex items-center justify-center text-sm"
                    :class="walletFormIcon === ic ? 'border-pine bg-pine-tint' : 'border-line'"
                    @click="walletFormIcon = ic"
                  >
                    {{ ic }}
                  </button>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 py-2 rounded-[10px] border border-line text-xs font-[700] text-ink-soft"
                @click="showAddWalletForm = false"
              >
                Batal
              </button>
              <button
                type="button"
                class="flex-1 py-2 rounded-[10px] bg-pine text-white text-xs font-[700]"
                @click="saveWalletItem"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL 2: KELOLA KATEGORI -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showCategoriesModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        @click.self="showCategoriesModal = false"
      >
        <div class="w-full max-w-md bg-surface rounded-[22px] border border-line p-5 shadow-card max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-line mb-3 flex-shrink-0">
            <div>
              <h3 class="text-[16px] font-[800] text-ink">Kelola Kategori</h3>
              <p class="text-[11px] text-ink-soft font-[500]">Sesuaikan label pengeluaran & sumber uang</p>
            </div>
            <button class="text-ink-soft hover:text-ink" @click="showCategoriesModal = false">
              <X :size="18" />
            </button>
          </div>

          <!-- Segmented Tab: Pengeluaran vs Pemasukan -->
          <div class="p-1 rounded-[10px] bg-bg border border-line grid grid-cols-2 gap-1 mb-3 flex-shrink-0">
            <button
              type="button"
              class="py-1.5 text-xs font-[700] rounded-[8px] transition-all"
              :class="categoryTab === 'expense' ? 'bg-expense text-white shadow-xs' : 'text-ink-soft hover:text-ink'"
              @click="categoryTab = 'expense'"
            >
              Pengeluaran
            </button>
            <button
              type="button"
              class="py-1.5 text-xs font-[700] rounded-[8px] transition-all"
              :class="categoryTab === 'income' ? 'bg-income text-white shadow-xs' : 'text-ink-soft hover:text-ink'"
              @click="categoryTab = 'income'"
            >
              Pemasukan
            </button>
          </div>

          <!-- List Items -->
          <div class="overflow-y-auto flex-1 space-y-1.5 pr-1 mb-3">
            <!-- Expense categories -->
            <template v-if="categoryTab === 'expense'">
              <div
                v-for="cat in master.expenseCategories"
                :key="cat.id"
                class="flex items-center justify-between p-2.5 rounded-[12px] border border-line bg-bg"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="text-base">{{ cat.icon || '🏷️' }}</span>
                  <span class="text-xs font-[700] text-ink truncate">{{ cat.name }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="p-1 text-ink-soft hover:text-ink"
                    @click="startEditCategory(cat)"
                  >
                    <Edit3 :size="14" />
                  </button>
                  <button
                    type="button"
                    class="p-1 text-ink-soft hover:text-expense"
                    @click="deleteCategory(cat.id)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </template>

            <!-- Income sources -->
            <template v-else>
              <div
                v-for="src in master.incomeSources"
                :key="src.id"
                class="flex items-center justify-between p-2.5 rounded-[12px] border border-line bg-bg"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="text-base">{{ src.icon || '💰' }}</span>
                  <span class="text-xs font-[700] text-ink truncate">{{ src.name }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="p-1 text-ink-soft hover:text-ink"
                    @click="startEditSource(src)"
                  >
                    <Edit3 :size="14" />
                  </button>
                  <button
                    type="button"
                    class="p-1 text-ink-soft hover:text-expense"
                    @click="deleteSource(src.id)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </template>
          </div>

          <!-- Add Category Input Bar -->
          <div class="pt-3 border-t border-line flex gap-2 flex-shrink-0">
            <input
              v-model="newCatName"
              type="text"
              :placeholder="categoryTab === 'expense' ? 'Nama kategori baru...' : 'Nama sumber pemasukan baru...'"
              class="flex-1 p-2 rounded-[10px] border border-line text-xs font-[600] outline-none"
              @keyup.enter="addCategory"
            />
            <button
              type="button"
              class="px-3.5 py-2 rounded-[10px] bg-pine hover:bg-pine-2 text-white text-xs font-[700] flex items-center gap-1"
              @click="addCategory"
            >
              <Plus :size="14" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL 3: MATA UANG & BAHASA -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showCurrencyLangModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        @click.self="showCurrencyLangModal = false"
      >
        <div class="w-full max-w-sm bg-surface rounded-[22px] border border-line p-5 shadow-card">
          <div class="flex items-center justify-between pb-3 border-b border-line mb-4">
            <h3 class="text-[16px] font-[800] text-ink">Mata Uang & Bahasa</h3>
            <button class="text-ink-soft hover:text-ink" @click="showCurrencyLangModal = false">
              <X :size="18" />
            </button>
          </div>

          <div class="space-y-4 mb-4">
            <div>
              <label class="text-[11px] font-[700] text-ink-soft uppercase tracking-wider block mb-1.5">
                Mata Uang Standar
              </label>
              <div class="space-y-1.5">
                <button
                  v-for="c in CURRENCIES"
                  :key="c.code"
                  type="button"
                  class="w-full flex items-center justify-between p-2.5 rounded-[10px] border text-left transition-all"
                  :class="selectedCurrency === c.code ? 'border-pine bg-pine-tint text-pine font-[700]' : 'border-line bg-surface text-ink font-[600]'"
                  @click="selectedCurrency = c.code"
                >
                  <span class="text-xs">{{ c.name }} ({{ c.symbol }})</span>
                  <Check v-if="selectedCurrency === c.code" :size="14" />
                </button>
              </div>
            </div>

            <div>
              <label class="text-[11px] font-[700] text-ink-soft uppercase tracking-wider block mb-1.5">
                Bahasa Tampilan
              </label>
              <div class="space-y-1.5">
                <button
                  v-for="lang in LANGUAGES"
                  :key="lang.code"
                  type="button"
                  class="w-full flex items-center justify-between p-2.5 rounded-[10px] border text-left transition-all"
                  :class="selectedLanguage === lang.code ? 'border-pine bg-pine-tint text-pine font-[700]' : 'border-line bg-surface text-ink font-[600]'"
                  @click="selectedLanguage = lang.code"
                >
                  <span class="text-xs">{{ lang.name }}</span>
                  <Check v-if="selectedLanguage === lang.code" :size="14" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="w-full py-2.5 rounded-[12px] bg-pine hover:bg-pine-2 text-white text-xs font-[700]"
            @click="showCurrencyLangModal = false"
          >
            Selesai
          </button>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL 5: EKSPOR DATA -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showExportModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        @click.self="showExportModal = false"
      >
        <div class="w-full max-w-sm bg-surface rounded-[22px] border border-line p-5 shadow-card">
          <div class="flex items-center justify-between pb-3 border-b border-line mb-4">
            <div>
              <h3 class="text-[16px] font-[800] text-ink">Ekspor Data Keuangan</h3>
              <p class="text-[11px] text-ink-soft font-[500]">Download riwayat transaksi Anda</p>
            </div>
            <button class="text-ink-soft hover:text-ink" @click="showExportModal = false">
              <X :size="18" />
            </button>
          </div>

          <div class="space-y-3 mb-5">
            <div>
              <label class="text-[11px] font-[700] text-ink-soft uppercase tracking-wider block mb-1">
                Format Berkas
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="p-2.5 rounded-[10px] border text-left flex items-center gap-2"
                  :class="exportFormat === 'csv' ? 'border-pine bg-pine-tint text-pine font-[700]' : 'border-line text-ink'"
                  @click="exportFormat = 'csv'"
                >
                  <FileSpreadsheet :size="16" />
                  <span class="text-xs">CSV (Excel)</span>
                </button>
                <button
                  type="button"
                  class="p-2.5 rounded-[10px] border text-left flex items-center gap-2"
                  :class="exportFormat === 'json' ? 'border-pine bg-pine-tint text-pine font-[700]' : 'border-line text-ink'"
                  @click="exportFormat = 'json'"
                >
                  <Download :size="16" />
                  <span class="text-xs">JSON</span>
                </button>
              </div>
            </div>

            <p class="text-[11.5px] text-ink-soft">
              Total {{ txStore.items.length }} transaksi siap untuk diunduh ke perangkat Anda.
            </p>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 py-2.5 rounded-[12px] border border-line text-xs font-[700] text-ink-soft hover:bg-bg"
              @click="showExportModal = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="flex-1 py-2.5 rounded-[12px] bg-pine hover:bg-pine-2 text-white text-xs font-[700] flex items-center justify-center gap-1.5"
              :disabled="exporting"
              @click="triggerExport"
            >
              <Download :size="14" />
              <span>{{ exporting ? "Mengekspor..." : "Unduh File" }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL 6: TEMA GELAP/TERANG -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showThemeModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        @click.self="showThemeModal = false"
      >
        <div class="w-full max-w-md bg-surface rounded-[22px] border border-line p-5 shadow-card">
          <div class="flex items-center justify-between pb-3 border-b border-line mb-4">
            <div>
              <h3 class="text-[16px] font-[800] text-ink">Tema & Tampilan</h3>
              <p class="text-[11px] text-ink-soft font-[500]">Pilih nuansa warna tampilan aplikasi</p>
            </div>
            <button class="text-ink-soft hover:text-ink" @click="showThemeModal = false">
              <X :size="18" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2.5 mb-4">
            <button
              v-for="t in AVAILABLE_THEMES"
              :key="t.id"
              type="button"
              class="flex items-center gap-3 p-3 rounded-[14px] border text-left transition-all"
              :class="currentTheme === t.id ? 'border-pine bg-pine-tint text-pine font-[700]' : 'border-line bg-surface text-ink'"
              @click="setTheme(t.id)"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-white"
                :style="{ background: t.gradient }"
              >
                <Check v-if="currentTheme === t.id" :size="14" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-[700] truncate leading-tight">{{ t.name }}</p>
                <p class="text-[10px] text-ink-soft truncate mt-0.5">{{ t.isDark ? 'Mode Gelap' : 'Terang' }}</p>
              </div>
            </button>
          </div>

          <button
            type="button"
            class="w-full py-2.5 rounded-[12px] bg-pine hover:bg-pine-2 text-white text-xs font-[700]"
            @click="showThemeModal = false"
          >
            Terapkan
          </button>
        </div>
      </div>
    </Teleport>

  </div>
</template>
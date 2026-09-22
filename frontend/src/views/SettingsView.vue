<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMasterDataStore } from "@/stores/masterData";
import { PERIOD_LABEL } from "@/types";
import type { PeriodType, IncomeSource, ExpenseCategory } from "@/types";
import ThemePicker from "@/components/ui/ThemePicker.vue";

const auth = useAuthStore();
const master = useMasterDataStore();
const router = useRouter();

const profile = reactive({ name: "", weeklyTarget: "" as string | number });
const saved = ref(false);

// Loading state awal (hanya kosmetik, tidak mengubah logika fetch)
const initialLoading = ref(true);

// State kolaps/expand section (default tertutup)
const showIncomeSources = ref(false);
const showExpenseCategories = ref(false);

// Fokus input target mingguan (untuk format tampilan Rupiah)
const weeklyTargetFocused = ref(false);
function formatRupiah(val: string | number) {
  if (val === "" || val === null || val === undefined) return "";
  const n = Number(val);
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat("id-ID").format(n);
}
function onWeeklyTargetInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
  profile.weeklyTarget = raw;
  scheduleSave();
}

// Toast sederhana pengganti alert()
const toast = reactive({ show: false, message: "", tone: "error" as "error" | "success" });
let toastTimeout: ReturnType<typeof setTimeout>;
function showToast(message: string, tone: "error" | "success" = "error") {
  clearTimeout(toastTimeout);
  toast.message = message;
  toast.tone = tone;
  toast.show = true;
  toastTimeout = setTimeout(() => (toast.show = false), 3000);
}

// Modal konfirmasi generik pengganti confirm()
const confirmDialog = reactive<{
  show: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
}>({ show: false, title: "", message: "", onConfirm: null });
function askConfirm(title: string, message: string, onConfirm: () => void) {
  confirmDialog.title = title;
  confirmDialog.message = message;
  confirmDialog.onConfirm = onConfirm;
  confirmDialog.show = true;
}
function handleConfirmYes() {
  const fn = confirmDialog.onConfirm;
  confirmDialog.show = false;
  confirmDialog.onConfirm = null;
  if (fn) fn();
}
function handleConfirmNo() {
  confirmDialog.show = false;
  confirmDialog.onConfirm = null;
}

// State form tambah baru
const newSourceName = ref("");
const newSourcePeriod = ref<PeriodType>("daily");
const isAddingSource = ref(false);

const newCatName = ref("");
const isAddingCat = ref(false);

// State modal edit sumber pemasukan
const editSourceModal = ref(false);
const editingSource = reactive<{ id: string; name: string; periodType: PeriodType }>({
  id: "",
  name: "",
  periodType: "daily",
});
const savingSource = ref(false);

// State modal edit kategori pengeluaran
const editCatModal = ref(false);
const editingCat = reactive<{ id: string; name: string }>({
  id: "",
  name: "",
});
const savingCat = ref(false);

function syncProfileFromAuth() {
  if (auth.user) {
    profile.name = auth.user.name || "";
    profile.weeklyTarget = auth.user.weeklyTarget || "";
  }
}

watch(() => auth.user, syncProfileFromAuth, { immediate: true });

onMounted(async () => {
  try {
    await master.fetchAll();
  } finally {
    initialLoading.value = false;
  }
  syncProfileFromAuth();
});

let saveTimeout: ReturnType<typeof setTimeout>;
function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      await auth.updateProfile({
        name: profile.name,
        weeklyTarget: profile.weeklyTarget ? Number(profile.weeklyTarget) : null,
      });
      saved.value = true;
      setTimeout(() => (saved.value = false), 1500);
    } catch (err) {
      console.error("Gagal menyimpan profil:", err);
      showToast("Gagal menyimpan profil");
    }
  }, 500);
}

// Handler Sumber Pemasukan
async function handleAddSource() {
  const v = newSourceName.value.trim();
  if (!v) return;
  try {
    isAddingSource.value = true;
    await master.addIncomeSource(v, newSourcePeriod.value);
    newSourceName.value = "";
    newSourcePeriod.value = "daily";
  } catch (err) {
    showToast("Gagal menambah sumber pemasukan: " + (err as any)?.message);
  } finally {
    isAddingSource.value = false;
  }
}

function openEditSource(s: IncomeSource) {
  editingSource.id = s.id;
  editingSource.name = s.name;
  editingSource.periodType = s.defaultPeriodType;
  editSourceModal.value = true;
}

async function handleSaveEditSource() {
  if (!editingSource.name.trim()) return;
  try {
    savingSource.value = true;
    await master.updateIncomeSource(editingSource.id, {
      name: editingSource.name.trim(),
      defaultPeriodType: editingSource.periodType,
    });
    editSourceModal.value = false;
  } catch (err) {
    showToast("Gagal memperbarui sumber: " + (err as any)?.message);
  } finally {
    savingSource.value = false;
  }
}

function handleDeleteSource(s: IncomeSource) {
  askConfirm(
    "Hapus Sumber Pemasukan",
    `Yakin ingin menghapus sumber pemasukan "${s.name}"? Tindakan ini tidak dapat dibatalkan.`,
    async () => {
      try {
        await master.removeIncomeSource(s.id);
      } catch (err) {
        showToast("Gagal menghapus: " + (err as any)?.message);
      }
    }
  );
}

// Handler Kategori Pengeluaran
async function handleAddCategory() {
  const v = newCatName.value.trim();
  if (!v) return;
  try {
    isAddingCat.value = true;
    await master.addExpenseCategory(v);
    newCatName.value = "";
  } catch (err) {
    showToast("Gagal menambah kategori: " + (err as any)?.message);
  } finally {
    isAddingCat.value = false;
  }
}

function openEditCat(c: ExpenseCategory) {
  editingCat.id = c.id;
  editingCat.name = c.name;
  editCatModal.value = true;
}

async function handleSaveEditCat() {
  if (!editingCat.name.trim()) return;
  try {
    savingCat.value = true;
    await master.updateExpenseCategory(editingCat.id, {
      name: editingCat.name.trim(),
    });
    editCatModal.value = false;
  } catch (err) {
    showToast("Gagal memperbarui kategori: " + (err as any)?.message);
  } finally {
    savingCat.value = false;
  }
}

function handleDeleteCategory(c: ExpenseCategory) {
  askConfirm(
    "Hapus Kategori Pengeluaran",
    `Yakin ingin menghapus kategori "${c.name}"? Tindakan ini tidak dapat dibatalkan.`,
    async () => {
      try {
        await master.removeExpenseCategory(c.id);
      } catch (err) {
        showToast("Gagal menghapus: " + (err as any)?.message);
      }
    }
  );
}

async function doLogout() {
  await auth.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="pb-24">
    <!-- Header -->
    <div
      class="bg-surface border-b border-line px-5 pb-5"
      style="padding-top: calc(20px + env(safe-area-inset-top, 0px))"
    >
      <h1 class="text-[22px] font-bold text-ink mb-1">Pengaturan Akun</h1>
      <p class="text-[13px] text-ink-muted">Kelola profil, sumber pemasukan, dan preferensi kamu</p>
    </div>

    <!-- Profile avatar -->
    <div class="flex flex-col items-center py-7 bg-surface border-b border-line">
      <div
        class="w-18 h-18 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3 shadow-md"
        style="background: var(--primary-gradient); width: 72px; height: 72px;"
      >
        {{ (profile.name || auth.user?.name || "?").charAt(0).toUpperCase() }}
      </div>
      <p class="font-bold text-[18px] text-ink">{{ profile.name || auth.user?.name }}</p>
      <p class="text-[13px] text-ink-muted">{{ auth.user?.email }}</p>
    </div>

    <div class="px-5 pt-5 space-y-6">
      <!-- Profil -->
      <section>
        <h2 class="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-2 px-1">Profil Pengguna</h2>
        <div class="card overflow-hidden divide-y divide-line">
          <div class="flex items-center justify-between px-4 py-3.5">
            <span class="text-[14px] text-ink-muted font-medium">Nama</span>
            <input
              v-model="profile.name"
              type="text"
              aria-label="Nama pengguna"
              class="bg-transparent text-right text-[14px] font-semibold text-ink focus:outline-none flex-1 ml-4"
              @input="scheduleSave"
            />
          </div>
          <div class="flex items-center justify-between px-4 py-3.5">
            <span class="text-[14px] text-ink-muted font-medium">Target Mingguan (Rp)</span>
            <input
              :value="weeklyTargetFocused ? profile.weeklyTarget : formatRupiah(profile.weeklyTarget)"
              type="text"
              inputmode="numeric"
              placeholder="opsional"
              aria-label="Target mingguan dalam Rupiah"
              class="bg-transparent text-right text-[14px] font-semibold text-ink focus:outline-none flex-1 ml-4"
              @focus="weeklyTargetFocused = true"
              @blur="weeklyTargetFocused = false"
              @input="onWeeklyTargetInput"
            />
          </div>
        </div>
        <transition name="fade">
          <div class="flex items-center gap-1.5 mt-2 px-1" v-if="saved">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <p class="text-[12px] font-semibold" style="color: var(--primary)">Perubahan profil tersimpan</p>
          </div>
        </transition>
      </section>

      <!-- Tema & Tampilan -->
      <section>
        <h2 class="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-2 px-1">Tema & Tampilan</h2>
        <div class="card p-3">
          <ThemePicker />
        </div>
      </section>

      <!-- Sumber Pemasukan (dropdown, tertutup default) -->
      <section>
        <button
          type="button"
          class="w-full flex items-center justify-between mb-2 px-1"
          :aria-expanded="showIncomeSources"
          @click="showIncomeSources = !showIncomeSources"
        >
          <h2 class="text-[12px] font-bold text-ink-muted uppercase tracking-wider">Sumber Pemasukan</h2>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full" style="background: var(--primary-light); color: var(--primary-dark)">
              {{ master.incomeSources.length }} Sumber
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              class="text-ink-muted transition-transform duration-200"
              :style="{ transform: showIncomeSources ? 'rotate(180deg)' : 'rotate(0deg)' }"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>

        <transition name="collapse">
          <div v-if="showIncomeSources" class="card p-4 space-y-4">
            <!-- Skeleton loading -->
            <div v-if="initialLoading" class="space-y-2">
              <div class="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"></div>
              <div class="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"></div>
            </div>

            <!-- Daftar Sumber -->
            <div v-else-if="master.incomeSources.length === 0" class="py-6 text-center text-ink-muted text-[13px]">
              <p>Belum ada sumber pemasukan terdaftar.</p>
              <button
                class="mt-2 text-[12px] font-bold underline text-primary"
                @click="master.fetchAll()"
              >
                Muat ulang sumber bawaan
              </button>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="s in master.incomeSources"
                :key="s.id"
                class="flex items-center justify-between p-3 rounded-xl border border-line bg-surface hover:border-primary hover:shadow-sm transition-all"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[14px]"
                    style="background: var(--primary-light); color: var(--primary)"
                  >
                    💰
                  </div>
                  <div>
                    <p class="text-[14px] font-bold text-ink leading-tight">{{ s.name }}</p>
                    <span class="inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-md" style="background: var(--primary-light); color: var(--primary-dark)">
                      Periode: {{ PERIOD_LABEL[s.defaultPeriodType] }}
                    </span>
                  </div>
                </div>

                <!-- Tombol Aksi Edit & Hapus -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    title="Edit Sumber"
                    :aria-label="`Edit sumber pemasukan ${s.name}`"
                    class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-ink-muted hover:text-ink transition-colors"
                    @click="openEditSource(s)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Hapus Sumber"
                    :aria-label="`Hapus sumber pemasukan ${s.name}`"
                    class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-ink-muted hover:text-red-500 transition-colors"
                    @click="handleDeleteSource(s)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Form Tambah Sumber Baru -->
            <div class="pt-3 border-t border-line">
              <label class="block text-[12px] font-bold text-ink mb-1.5">Tambah Sumber Baru</label>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="newSourceName"
                  type="text"
                  placeholder="Contoh: Gaji, Toko, Gojek..."
                  aria-label="Nama sumber pemasukan baru"
                  class="form-input flex-1 py-2.5 text-[13px]"
                  @keyup.enter="handleAddSource"
                />
                <div class="flex gap-2">
                  <select
                    v-model="newSourcePeriod"
                    aria-label="Periode sumber pemasukan baru"
                    class="form-input py-2.5 text-[13px] px-3 font-medium flex-1 sm:flex-initial"
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                  <button
                    type="button"
                    :disabled="isAddingSource || !newSourceName.trim()"
                    class="px-4 py-2.5 rounded-xl font-bold text-[13px] text-white flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                    style="background: var(--primary)"
                    @click="handleAddSource"
                  >
                    <span v-if="isAddingSource">...</span>
                    <span v-else>+ Tambah</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </section>

      <!-- Kategori Pengeluaran (dropdown, tertutup default) -->
      <section>
        <button
          type="button"
          class="w-full flex items-center justify-between mb-2 px-1"
          :aria-expanded="showExpenseCategories"
          @click="showExpenseCategories = !showExpenseCategories"
        >
          <h2 class="text-[12px] font-bold text-ink-muted uppercase tracking-wider">Kategori Pengeluaran</h2>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full" style="background: var(--expense-soft); color: var(--expense-text)">
              {{ master.expenseCategories.length }} Kategori
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              class="text-ink-muted transition-transform duration-200"
              :style="{ transform: showExpenseCategories ? 'rotate(180deg)' : 'rotate(0deg)' }"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>

        <transition name="collapse">
          <div v-if="showExpenseCategories" class="card p-4 space-y-4">
            <!-- Skeleton loading -->
            <div v-if="initialLoading" class="space-y-2">
              <div class="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"></div>
              <div class="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"></div>
            </div>

            <!-- Daftar Kategori -->
            <div v-else-if="master.expenseCategories.length === 0" class="py-6 text-center text-ink-muted text-[13px]">
              <p>Belum ada kategori pengeluaran.</p>
              <button
                class="mt-2 text-[12px] font-bold underline text-primary"
                @click="master.fetchAll()"
              >
                Muat ulang kategori bawaan
              </button>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="c in master.expenseCategories"
                :key="c.id"
                class="flex items-center justify-between p-3 rounded-xl border border-line bg-surface hover:border-red-400 hover:shadow-sm transition-all"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[14px]"
                    style="background: var(--expense-soft); color: var(--expense)"
                  >
                    🛒
                  </div>
                  <p class="text-[14px] font-bold text-ink">{{ c.name }}</p>
                </div>

                <!-- Tombol Aksi Edit & Hapus -->
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    title="Edit Kategori"
                    :aria-label="`Edit kategori ${c.name}`"
                    class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-ink-muted hover:text-ink transition-colors"
                    @click="openEditCat(c)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Hapus Kategori"
                    :aria-label="`Hapus kategori ${c.name}`"
                    class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-ink-muted hover:text-red-500 transition-colors"
                    @click="handleDeleteCategory(c)"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Form Tambah Kategori Baru -->
            <div class="pt-3 border-t border-line">
              <label class="block text-[12px] font-bold text-ink mb-1.5">Tambah Kategori Baru</label>
              <div class="flex gap-2">
                <input
                  v-model="newCatName"
                  type="text"
                  placeholder="Contoh: Belanja, Bensin, Cicilan..."
                  aria-label="Nama kategori pengeluaran baru"
                  class="form-input flex-1 py-2.5 text-[13px]"
                  @keyup.enter="handleAddCategory"
                />
                <button
                  type="button"
                  :disabled="isAddingCat || !newCatName.trim()"
                  class="px-4 py-2.5 rounded-xl font-bold text-[13px] text-white flex-shrink-0 shadow-sm transition-all disabled:opacity-50"
                  style="background: var(--expense)"
                  @click="handleAddCategory"
                >
                  <span v-if="isAddingCat">...</span>
                  <span v-else>+ Tambah</span>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </section>

      <!-- Zona Berbahaya -->
      <section class="pt-2">
        <h2 class="text-[12px] font-bold uppercase tracking-wider mb-2 px-1" style="color: var(--expense)">Zona Berbahaya</h2>
        <button
          id="btn-logout"
          class="w-full py-3.5 rounded-2xl font-bold text-[14px] border-2 transition-all flex items-center justify-center gap-2"
          style="border-color: var(--expense); color: var(--expense); background: transparent;"
          @click="doLogout"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Keluar dari Akun
        </button>
      </section>
    </div>

    <!-- MODAL EDIT SUMBER PEMASUKAN -->
    <div
      v-if="editSourceModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="editSourceModal = false"
    >
      <div class="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-line space-y-4">
        <div class="flex items-center justify-between border-b border-line pb-3">
          <h3 class="font-bold text-[16px] text-ink">Edit Sumber Pemasukan</h3>
          <button class="text-ink-muted hover:text-ink text-xl font-bold" aria-label="Tutup" @click="editSourceModal = false">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-[12px] font-bold text-ink-muted mb-1">Nama Sumber</label>
            <input
              v-model="editingSource.name"
              type="text"
              class="form-input w-full py-2.5 text-[14px]"
              @keyup.enter="handleSaveEditSource"
            />
          </div>
          <div>
            <label class="block text-[12px] font-bold text-ink-muted mb-1">Periode Pemasukan</label>
            <select
              v-model="editingSource.periodType"
              class="form-input w-full py-2.5 text-[14px]"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-[13px] font-semibold text-ink-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
            @click="editSourceModal = false"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="savingSource || !editingSource.name.trim()"
            class="px-5 py-2 rounded-xl text-[13px] font-bold text-white shadow-md disabled:opacity-50"
            style="background: var(--primary)"
            @click="handleSaveEditSource"
          >
            {{ savingSource ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL EDIT KATEGORI PENGELUARAN -->
    <div
      v-if="editCatModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="editCatModal = false"
    >
      <div class="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-line space-y-4">
        <div class="flex items-center justify-between border-b border-line pb-3">
          <h3 class="font-bold text-[16px] text-ink">Edit Kategori Pengeluaran</h3>
          <button class="text-ink-muted hover:text-ink text-xl font-bold" aria-label="Tutup" @click="editCatModal = false">✕</button>
        </div>

        <div>
          <label class="block text-[12px] font-bold text-ink-muted mb-1">Nama Kategori</label>
          <input
            v-model="editingCat.name"
            type="text"
            class="form-input w-full py-2.5 text-[14px]"
            @keyup.enter="handleSaveEditCat"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-[13px] font-semibold text-ink-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
            @click="editCatModal = false"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="savingCat || !editingCat.name.trim()"
            class="px-5 py-2 rounded-xl text-[13px] font-bold text-white shadow-md disabled:opacity-50"
            style="background: var(--expense)"
            @click="handleSaveEditCat"
          >
            {{ savingCat ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI (pengganti confirm() browser) -->
    <div
      v-if="confirmDialog.show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="handleConfirmNo"
    >
      <div class="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-line space-y-4">
        <h3 class="font-bold text-[16px] text-ink">{{ confirmDialog.title }}</h3>
        <p class="text-[13px] text-ink-muted leading-relaxed">{{ confirmDialog.message }}</p>
        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-[13px] font-semibold text-ink-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
            @click="handleConfirmNo"
          >
            Batal
          </button>
          <button
            type="button"
            class="px-5 py-2 rounded-xl text-[13px] font-bold text-white shadow-md"
            style="background: var(--expense)"
            @click="handleConfirmYes"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST (pengganti alert()) -->
    <transition name="fade">
      <div
        v-if="toast.show"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold text-white max-w-[90vw]"
        :style="{ background: toast.tone === 'error' ? 'var(--expense)' : 'var(--primary)' }"
        role="status"
      >
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
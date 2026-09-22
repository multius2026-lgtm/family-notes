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
  await master.fetchAll();
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
    alert("Gagal menambah sumber pemasukan: " + (err as any)?.message);
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
    alert("Gagal memperbarui sumber: " + (err as any)?.message);
  } finally {
    savingSource.value = false;
  }
}

async function handleDeleteSource(s: IncomeSource) {
  if (confirm(`Yakin ingin menghapus sumber pemasukan "${s.name}"?`)) {
    try {
      await master.removeIncomeSource(s.id);
    } catch (err) {
      alert("Gagal menghapus: " + (err as any)?.message);
    }
  }
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
    alert("Gagal menambah kategori: " + (err as any)?.message);
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
    alert("Gagal memperbarui kategori: " + (err as any)?.message);
  } finally {
    savingCat.value = false;
  }
}

async function handleDeleteCategory(c: ExpenseCategory) {
  if (confirm(`Yakin ingin menghapus kategori "${c.name}"?`)) {
    try {
      await master.removeExpenseCategory(c.id);
    } catch (err) {
      alert("Gagal menghapus: " + (err as any)?.message);
    }
  }
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
              class="bg-transparent text-right text-[14px] font-semibold text-ink focus:outline-none flex-1 ml-4"
              @input="scheduleSave"
            />
          </div>
          <div class="flex items-center justify-between px-4 py-3.5">
            <span class="text-[14px] text-ink-muted font-medium">Target Mingguan (Rp)</span>
            <input
              v-model="profile.weeklyTarget"
              type="number"
              placeholder="opsional"
              class="bg-transparent text-right text-[14px] font-semibold text-ink focus:outline-none flex-1 ml-4"
              @input="scheduleSave"
            />
          </div>
        </div>
        <div class="flex items-center gap-1.5 mt-2 px-1" v-if="saved">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <p class="text-[12px] font-semibold" style="color: var(--primary)">Perubahan profil tersimpan</p>
        </div>
      </section>

      <!-- Tema & Tampilan -->
      <section>
        <h2 class="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-2 px-1">Tema & Tampilan</h2>
        <div class="card p-3">
          <ThemePicker />
        </div>
      </section>

      <!-- Sumber Pemasukan -->
      <section>
        <div class="flex items-center justify-between mb-2 px-1">
          <h2 class="text-[12px] font-bold text-ink-muted uppercase tracking-wider">Sumber Pemasukan</h2>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full" style="background: var(--primary-light); color: var(--primary-dark)">
            {{ master.incomeSources.length }} Sumber
          </span>
        </div>

        <div class="card p-4 space-y-4">
          <!-- Daftar Sumber -->
          <div v-if="master.incomeSources.length === 0" class="py-6 text-center text-ink-muted text-[13px]">
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
              class="flex items-center justify-between p-3 rounded-xl border border-line bg-surface hover:border-primary transition-all"
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
                class="form-input flex-1 py-2.5 text-[13px]"
                @keyup.enter="handleAddSource"
              />
              <div class="flex gap-2">
                <select
                  v-model="newSourcePeriod"
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
      </section>

      <!-- Kategori Pengeluaran -->
      <section>
        <div class="flex items-center justify-between mb-2 px-1">
          <h2 class="text-[12px] font-bold text-ink-muted uppercase tracking-wider">Kategori Pengeluaran</h2>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full" style="background: var(--expense-soft); color: var(--expense-text)">
            {{ master.expenseCategories.length }} Kategori
          </span>
        </div>

        <div class="card p-4 space-y-4">
          <!-- Daftar Kategori -->
          <div v-if="master.expenseCategories.length === 0" class="py-6 text-center text-ink-muted text-[13px]">
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
              class="flex items-center justify-between p-3 rounded-xl border border-line bg-surface hover:border-red-400 transition-all"
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
      </section>

      <!-- Tombol Keluar -->
      <section class="pt-4">
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
          <button class="text-ink-muted hover:text-ink text-xl font-bold" @click="editSourceModal = false">✕</button>
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
          <button class="text-ink-muted hover:text-ink text-xl font-bold" @click="editCatModal = false">✕</button>
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
  </div>
</template>

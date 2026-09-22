<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMasterDataStore } from "@/stores/masterData";
import { PERIOD_LABEL } from "@/types";
import type { PeriodType } from "@/types";
import ThemePicker from "@/components/ui/ThemePicker.vue";

const auth = useAuthStore();
const master = useMasterDataStore();
const router = useRouter();

const profile = reactive({ name: "", weeklyTarget: "" as string | number });
const newSourceName = ref("");
const newSourcePeriod = ref<PeriodType>("daily");
const newCatName = ref("");
const saved = ref(false);

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

async function addSource() {
  const v = newSourceName.value.trim();
  if (!v) return;
  await master.addIncomeSource(v, newSourcePeriod.value);
  newSourceName.value = "";
}
async function addCategory() {
  const v = newCatName.value.trim();
  if (!v) return;
  await master.addExpenseCategory(v);
  newCatName.value = "";
}

async function doLogout() {
  await auth.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div>
    <!-- Header -->
    <div
      class="bg-surface border-b border-line px-5 pb-5"
      style="padding-top: calc(20px + env(safe-area-inset-top, 0px))"
    >
      <h1 class="text-[22px] font-bold text-ink mb-1">Akun</h1>
      <p class="text-[13px] text-ink-muted">Kelola profil dan preferensi kamu</p>
    </div>

    <!-- Profile avatar -->
    <div class="flex flex-col items-center py-8 bg-surface border-b border-line">
      <div
        class="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3"
        style="background: var(--primary-gradient)"
      >
        {{ (profile.name || auth.user?.name || "?").charAt(0).toUpperCase() }}
      </div>
      <p class="font-bold text-[17px] text-ink">{{ profile.name || auth.user?.name }}</p>
      <p class="text-[13px] text-ink-muted">{{ auth.user?.email }}</p>
    </div>

    <div class="px-5 pt-5 pb-10">
      <!-- Profil -->
      <h2 class="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-2">Profil</h2>
      <div class="card mb-5 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-4 border-b border-line">
          <span class="text-[14px] text-ink-muted font-medium">Nama</span>
          <input
            v-model="profile.name"
            type="text"
            class="bg-transparent text-right text-[14px] font-semibold text-ink w-36 focus:outline-none"
            @input="scheduleSave"
          />
        </div>
        <div class="flex items-center justify-between px-4 py-4">
          <span class="text-[14px] text-ink-muted font-medium">Target mingguan (Rp)</span>
          <input
            v-model="profile.weeklyTarget"
            type="number"
            placeholder="opsional"
            class="bg-transparent text-right text-[14px] font-semibold text-ink w-36 focus:outline-none"
            @input="scheduleSave"
          />
        </div>
      </div>
      <div class="flex items-center gap-2 -mt-3 mb-5" v-if="saved">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <p class="text-[12px] font-semibold" style="color: var(--primary)">Tersimpan</p>
      </div>

      <!-- Tema & Warna Aplikasi -->
      <h2 class="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-2">Tema & Warna</h2>
      <div class="card p-3 mb-5">
        <ThemePicker />
      </div>

      <!-- Sumber Pemasukan -->
      <h2 class="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-2">Sumber Pemasukan</h2>
      <div class="card px-4 py-4 mb-5">
        <div class="flex flex-wrap gap-2 mb-3">
          <div
            v-for="s in master.incomeSources"
            :key="s.id"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium"
            style="background: var(--primary-light); color: var(--primary-dark)"
          >
            <span>{{ s.name }}</span>
            <span class="text-[10px] opacity-60">· {{ PERIOD_LABEL[s.defaultPeriodType] }}</span>
            <button
              v-if="!s.isDefault"
              class="ml-0.5 opacity-50 hover:opacity-100"
              @click="master.removeIncomeSource(s.id)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newSourceName"
            type="text"
            placeholder="Tambah sumber baru…"
            class="form-input flex-1 py-2.5 text-[13px]"
            style="font-size: 13px"
          />
          <select
            v-model="newSourcePeriod"
            class="form-input w-24 py-2.5 text-[13px]"
            style="font-size: 12px; padding-left: 8px; padding-right: 8px;"
          >
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
          </select>
          <button
            class="px-4 py-2.5 rounded-xl font-bold text-[13px] text-white flex-shrink-0"
            style="background: var(--primary)"
            @click="addSource"
          >
            +
          </button>
        </div>
      </div>

      <!-- Kategori Pengeluaran -->
      <h2 class="text-[13px] font-bold text-ink-muted uppercase tracking-wider mb-2">Kategori Pengeluaran</h2>
      <div class="card px-4 py-4 mb-5">
        <div class="flex flex-wrap gap-2 mb-3">
          <div
            v-for="c in master.expenseCategories"
            :key="c.id"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium"
            style="background: var(--expense-soft); color: var(--expense-text)"
          >
            <span>{{ c.name }}</span>
            <button
              v-if="!c.isDefault"
              class="ml-0.5 opacity-50 hover:opacity-100"
              @click="master.removeExpenseCategory(c.id)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newCatName"
            type="text"
            placeholder="Tambah kategori baru…"
            class="form-input flex-1 py-2.5 text-[13px]"
            style="font-size: 13px"
          />
          <button
            class="px-4 py-2.5 rounded-xl font-bold text-[13px] text-white flex-shrink-0"
            style="background: var(--expense)"
            @click="addCategory"
          >
            +
          </button>
        </div>
      </div>

      <!-- Keluar -->
      <button
        id="btn-logout"
        class="w-full py-4 rounded-2xl font-bold text-[15px] border-2 transition-colors"
        style="border-color: var(--expense); color: var(--expense); background: transparent;"
        @click="doLogout"
      >
        Keluar dari Akun
      </button>

      <p class="text-center text-[11.5px] text-ink-muted mt-6 leading-relaxed">
        Keuangan Pribadi — Kelola keuangan harian dengan mudah
      </p>
    </div>
  </div>
</template>

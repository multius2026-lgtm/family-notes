<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

const router = useRouter();
const newPassword = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

async function handleResetPassword() {
  errorMsg.value = "";
  successMsg.value = "";

  if (newPassword.value.length < 8) {
    errorMsg.value = "Password baru minimal harus 8 karakter.";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = "Konfirmasi password tidak cocok.";
    return;
  }

  loading.value = true;
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    });

    if (error) throw error;

    successMsg.value = "Password berhasil diperbarui! Mengalihkan ke dashboard...";
    setTimeout(() => {
      router.push({ name: "dashboard" });
    }, 2000);
  } catch (err: any) {
    errorMsg.value = err?.message || "Gagal mengatur ulang password. Silakan coba lagi.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <!-- Header decoration -->
    <div
      class="hero-card rounded-b-[32px] pt-16 pb-12 px-6"
      style="padding-top: calc(52px + env(safe-area-inset-top, 0px)); border-radius: 0 0 32px 32px;"
    >
      <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h1 class="text-white text-[26px] font-bold leading-tight mb-2">Password Baru 🔒</h1>
      <p class="text-white/70 text-[14px]">Masukkan password baru untuk akun kamu</p>
    </div>

    <!-- Form -->
    <div class="flex-1 px-6 pt-8 pb-8 max-w-md w-full mx-auto">
      <form class="space-y-4" @submit.prevent="handleResetPassword">
        <!-- Password Baru -->
        <div>
          <label class="form-label">Password Baru</label>
          <div class="relative">
            <input
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              placeholder="Minimal 8 karakter"
              class="form-input pr-11"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-1"
              title="Tampilkan / Sembunyikan Password"
              @click="showPassword = !showPassword"
            >
              <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Konfirmasi Password -->
        <div>
          <label class="form-label">Konfirmasi Password Baru</label>
          <div class="relative">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              minlength="8"
              placeholder="Ulangi password baru"
              class="form-input pr-11"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-1"
              title="Tampilkan / Sembunyikan Password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg v-if="showConfirmPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="p-3 rounded-xl text-[13px] font-medium bg-red-50 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-900">
          {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="p-3 rounded-xl text-[13px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-900">
          {{ successMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading || !newPassword || !confirmPassword"
          class="btn-primary mt-2 shadow-md disabled:opacity-50"
        >
          {{ loading ? "Menyimpan Password..." : "Simpan Password Baru" }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <router-link
          :to="{ name: 'login' }"
          class="text-[13px] font-bold text-ink-muted hover:text-ink"
        >
          ← Kembali ke Halaman Masuk
        </router-link>
      </div>
    </div>
  </div>
</template>

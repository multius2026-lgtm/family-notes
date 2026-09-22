<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const name = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const loading = ref(false);
const auth = useAuthStore();
const router = useRouter();

async function submit() {
  error.value = "";
  if (password.value.length < 8) {
    error.value = "Password minimal harus 8 karakter.";
    return;
  }
  loading.value = true;
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value });
    router.push({ name: "dashboard" });
  } catch (e: any) {
    error.value = e?.message || e?.data?.error || "Gagal mendaftar. Coba email lain atau periksa koneksi kamu.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <!-- Top green decoration -->
    <div
      class="hero-card rounded-b-[32px] pt-16 pb-12 px-6"
      style="padding-top: calc(52px + env(safe-area-inset-top, 0px)); border-radius: 0 0 32px 32px;"
    >
      <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
      </div>
      <h1 class="text-white text-[26px] font-bold leading-tight mb-2">Buat akun baru ✨</h1>
      <p class="text-white/70 text-[14px]">Mulai kelola keuangan pribadimu</p>
    </div>

    <!-- Form -->
    <div class="flex-1 px-6 pt-8 pb-8 max-w-md w-full mx-auto">
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="form-label">Nama panggilan</label>
          <input
            id="register-name"
            v-model="name"
            type="text"
            required
            placeholder="Nama kamu"
            class="form-input"
          />
        </div>

        <div>
          <label class="form-label">Email</label>
          <input
            id="register-email"
            v-model="email"
            type="email"
            required
            placeholder="nama@email.com"
            class="form-input"
          />
        </div>

        <div>
          <label class="form-label">Password</label>
          <div class="relative">
            <input
              id="register-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              minlength="8"
              required
              placeholder="Minimal 8 karakter"
              class="form-input pr-11"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-1"
              title="Tampilkan / Sembunyikan Password"
              @click="showPassword = !showPassword"
            >
              <!-- Eye open = password visible -->
              <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <!-- Eye off = password hidden -->
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            </button>
          </div>
          <p class="mt-1 text-[11px] text-ink-muted">Minimal 8 karakter</p>
        </div>

        <p v-if="error" class="text-[13px] font-medium" style="color: var(--expense)">{{ error }}</p>

        <button
          id="btn-register"
          type="submit"
          :disabled="loading"
          class="btn-primary mt-2 shadow-md disabled:opacity-50"
        >
          {{ loading ? "Memproses..." : "Daftar sekarang" }}
        </button>
      </form>

      <p class="text-center text-[14px] text-ink-muted mt-6">
        Sudah punya akun?
        <router-link :to="{ name: 'login' }" class="font-bold" style="color: var(--primary)">
          Masuk
        </router-link>
      </p>
    </div>
  </div>
</template>

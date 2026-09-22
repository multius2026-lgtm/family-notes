<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const auth = useAuthStore();
const router = useRouter();

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value });
    router.push({ name: "dashboard" });
  } catch (e: any) {
    error.value = e?.data?.error || "Gagal mendaftar. Coba email lain atau periksa koneksi kamu.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <!-- Top green decoration -->
    <div class="hero-card rounded-b-[32px] pt-16 pb-12 px-6" style="padding-top: calc(52px + env(safe-area-inset-top, 0px)); border-radius: 0 0 32px 32px;">
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
    <div class="flex-1 px-6 pt-8 pb-8">
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
          <input
            id="register-password"
            v-model="password"
            type="password"
            minlength="8"
            required
            placeholder="Minimal 8 karakter"
            class="form-input"
          />
        </div>

        <p v-if="error" class="text-[13px] font-medium" style="color: var(--expense)">{{ error }}</p>

        <button
          id="btn-register"
          type="submit"
          :disabled="loading"
          class="btn-primary mt-2"
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

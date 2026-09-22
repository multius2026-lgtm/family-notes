<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

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
    await auth.login({ email: email.value, password: password.value });
    router.push({ name: "dashboard" });
  } catch (e: any) {
    error.value = e?.data?.error || "Gagal masuk. Periksa kembali email dan password kamu.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <!-- Top green decoration -->
    <div class="hero-card rounded-b-[32px] pt-16 pb-12 px-6 mb-0" style="padding-top: calc(52px + env(safe-area-inset-top, 0px)); border-radius: 0 0 32px 32px;">
      <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/>
          <polyline points="12,8 21,8 21,16 12,16" fill="white"/>
          <circle cx="16.5" cy="12" r="1.5" fill="white"/>
        </svg>
      </div>
      <h1 class="text-white text-[26px] font-bold leading-tight mb-2">Selamat datang<br/>kembali 👋</h1>
      <p class="text-white/70 text-[14px]">Masuk ke akun Keuangan Pribadi</p>
    </div>

    <!-- Form -->
    <div class="flex-1 px-6 pt-8 pb-8">
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="form-label">Email</label>
          <input
            id="login-email"
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
            id="login-password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="form-input"
          />
        </div>

        <p v-if="error" class="text-[13px] font-medium" style="color: var(--expense)">{{ error }}</p>

        <button
          id="btn-login"
          type="submit"
          :disabled="loading"
          class="btn-primary mt-2"
        >
          {{ loading ? "Memproses..." : "Masuk" }}
        </button>
      </form>

      <p class="text-center text-[14px] text-ink-muted mt-6">
        Belum punya akun?
        <router-link
          :to="{ name: 'register' }"
          class="font-bold"
          style="color: var(--primary)"
        >
          Daftar sekarang
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const loading = ref(false);
const auth = useAuthStore();
const router = useRouter();

// State Modal Lupa Password
const showForgotModal = ref(false);
const forgotEmail = ref("");
const forgotLoading = ref(false);
const forgotSuccess = ref(false);
const forgotError = ref("");

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await auth.login({ email: email.value, password: password.value });
    router.push({ name: "dashboard" });
  } catch (e: any) {
    error.value = e?.message || e?.data?.error || "Gagal masuk. Periksa kembali email dan password kamu.";
  } finally {
    loading.value = false;
  }
}

function openForgotModal() {
  forgotEmail.value = email.value || "";
  forgotSuccess.value = false;
  forgotError.value = "";
  showForgotModal.value = true;
}

async function handleForgotPassword() {
  const targetEmail = forgotEmail.value.trim();
  if (!targetEmail) return;

  forgotError.value = "";
  forgotLoading.value = true;
  try {
    // Redirect link mengarah ke hash router #/reset-password di GitHub Pages
    const redirectUrl = window.location.origin + window.location.pathname + "#/reset-password";
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: redirectUrl,
    });

    if (resetErr) throw resetErr;
    forgotSuccess.value = true;
  } catch (err: any) {
    forgotError.value = err?.message || "Gagal mengirim link reset password. Pastikan email terdaftar.";
  } finally {
    forgotLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: var(--paper)">
    <!-- Top green decoration -->
    <div
      class="hero-card rounded-b-[32px] pt-16 pb-12 px-6 mb-0"
      style="padding-top: calc(52px + env(safe-area-inset-top, 0px)); border-radius: 0 0 32px 32px;"
    >
      <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/>
          <polyline points="12,8 21,8 21,16 12,16" fill="white"/>
          <circle cx="16.5" cy="12" r="1.5" fill="white"/>
        </svg>
      </div>
      <h1 class="text-white text-[26px] font-bold leading-tight mb-2">Selamat datang<br/>kembali 👋</h1>
      <p class="text-white/70 text-[14px]">Masuk ke akun Family Notes kamu</p>
    </div>

    <!-- Form -->
    <div class="flex-1 px-6 pt-8 pb-8 max-w-md w-full mx-auto">
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
          <div class="flex items-center justify-between mb-1">
            <label class="form-label mb-0">Password</label>
            <button
              type="button"
              class="text-[12px] font-bold transition-colors"
              style="color: var(--primary)"
              @click="openForgotModal"
            >
              Lupa password?
            </button>
          </div>

          <!-- Password input with eye toggle -->
          <div class="relative">
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••••"
              class="form-input pr-11"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-1"
              title="Tampilkan / Sembunyikan Password"
              @click="showPassword = !showPassword"
            >
              <!-- Eye open -->
              <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <!-- Eye off (crossed out) -->
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            </button>
          </div>
        </div>

        <p v-if="error" class="text-[13px] font-medium" style="color: var(--expense)">{{ error }}</p>

        <button
          id="btn-login"
          type="submit"
          :disabled="loading"
          class="btn-primary mt-2 shadow-md disabled:opacity-50"
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

    <!-- MODAL LUPA PASSWORD -->
    <div
      v-if="showForgotModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="showForgotModal = false"
    >
      <div class="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-line space-y-4">
        <div class="flex items-center justify-between border-b border-line pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">🔑</span>
            <h3 class="font-bold text-[16px] text-ink">Lupa Password</h3>
          </div>
          <button class="text-ink-muted hover:text-ink text-xl font-bold" @click="showForgotModal = false">✕</button>
        </div>

        <div v-if="forgotSuccess" class="space-y-3 py-2">
          <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-[13px] leading-relaxed border border-emerald-200 dark:border-emerald-800">
            <p class="font-bold mb-1">✉️ Link Terkirim!</p>
            Petunjuk reset password telah dikirim ke email <strong>{{ forgotEmail }}</strong>. Silakan periksa inbox atau folder spam kamu.
          </div>
          <button
            type="button"
            class="btn-primary w-full py-2.5 text-[13px]"
            @click="showForgotModal = false"
          >
            Tutup
          </button>
        </div>

        <form v-else class="space-y-3" @submit.prevent="handleForgotPassword">
          <p class="text-[13px] text-ink-muted leading-relaxed">
            Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang password akun kamu.
          </p>
          <div>
            <label class="form-label">Email Akun</label>
            <input
              v-model="forgotEmail"
              type="email"
              required
              placeholder="nama@email.com"
              class="form-input"
            />
          </div>

          <p v-if="forgotError" class="text-[12px] font-medium" style="color: var(--expense)">
            {{ forgotError }}
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl text-[13px] font-semibold text-ink-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
              @click="showForgotModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="forgotLoading || !forgotEmail.trim()"
              class="px-5 py-2 rounded-xl text-[13px] font-bold text-white shadow-md disabled:opacity-50"
              style="background: var(--primary)"
            >
              {{ forgotLoading ? 'Mengirim...' : 'Kirim Link Reset' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

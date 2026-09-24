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

// Lupa Password
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
  } catch (e) {
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
    const redirectUrl = window.location.origin + window.location.pathname + "#/reset-password";
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo: redirectUrl });
    if (resetErr) throw resetErr;
    forgotSuccess.value = true;
  } catch (err) {
    forgotError.value = err?.message || "Gagal mengirim link reset password.";
  } finally {
    forgotLoading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Animated background -->
    <div class="auth-bg">
      <div class="auth-orb auth-orb-1"></div>
      <div class="auth-orb auth-orb-2"></div>
      <div class="auth-orb auth-orb-3"></div>
    </div>

    <div class="auth-card fade-slide-up">
      <!-- Logo & Header -->
      <div class="auth-header">
        <div class="auth-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/>
            <polyline points="12,8 21,8 21,16 12,16" fill="rgba(255,255,255,0.3)"/>
            <circle cx="16.5" cy="12" r="1.5" fill="white"/>
          </svg>
        </div>
        <div class="auth-badge">Family Notes</div>
        <h1 class="auth-title">Selamat Datang</h1>
        <p class="auth-subtitle">Masuk untuk mengelola keuangan keluargamu</p>
      </div>

      <!-- Form -->
      <form class="auth-form" @submit.prevent="submit">
        <!-- Email -->
        <div class="auth-field">
          <label class="auth-label">Email</label>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              id="login-email"
              v-model="email"
              type="email"
              required
              placeholder="nama@email.com"
              class="auth-input"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="auth-field">
          <div class="auth-label-row">
            <label class="auth-label">Password</label>
            <button type="button" class="auth-link-sm" @click="openForgotModal">Lupa password?</button>
          </div>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••••"
              class="auth-input"
            />
            <button type="button" class="auth-eye-btn" @click="showPassword = !showPassword">
              <svg v-if="showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="auth-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <!-- Submit -->
        <button id="btn-login" type="submit" :disabled="loading" class="auth-btn-primary">
          <span v-if="loading" class="auth-spinner"></span>
          <span>{{ loading ? "Memproses..." : "Masuk" }}</span>
        </button>
      </form>

      <!-- Footer -->
      <p class="auth-footer">
        Belum punya akun?
        <router-link :to="{ name: 'register' }" class="auth-link-bold">Daftar sekarang</router-link>
      </p>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotModal" class="auth-modal-overlay" @click.self="showForgotModal = false">
      <div class="auth-modal scale-in">
        <div class="auth-modal-header">
          <h3>Reset Password</h3>
          <button class="auth-modal-close" @click="showForgotModal = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div v-if="forgotSuccess" class="auth-modal-success">
          <div class="auth-success-icon">✉️</div>
          <p class="font-bold text-[15px] mb-1">Link Terkirim!</p>
          <p class="text-[13px] text-ink-muted">Cek inbox atau spam untuk <strong>{{ forgotEmail }}</strong>.</p>
          <button type="button" class="auth-btn-primary mt-4" @click="showForgotModal = false">Tutup</button>
        </div>

        <form v-else class="space-y-4" @submit.prevent="handleForgotPassword">
          <p class="text-[13px] text-ink-muted leading-relaxed">Masukkan email terdaftar, kami akan kirimkan link reset password.</p>
          <div class="auth-field">
            <label class="auth-label">Email Akun</label>
            <div class="auth-input-wrap">
              <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <input v-model="forgotEmail" type="email" required placeholder="nama@email.com" class="auth-input" />
            </div>
          </div>
          <p v-if="forgotError" class="auth-error">{{ forgotError }}</p>
          <div class="flex gap-2">
            <button type="button" class="auth-btn-ghost flex-1" @click="showForgotModal = false">Batal</button>
            <button type="submit" :disabled="forgotLoading || !forgotEmail.trim()" class="auth-btn-primary flex-1 disabled:opacity-50">
              {{ forgotLoading ? "Mengirim..." : "Kirim Link" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  background: var(--paper);
  position: relative;
  overflow: hidden;
}

/* Animated orbs */
.auth-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.25;
  animation: float 8s ease-in-out infinite;
}
.auth-orb-1 {
  width: 300px; height: 300px;
  top: -80px; right: -60px;
  background: var(--primary);
  animation-delay: 0s;
}
.auth-orb-2 {
  width: 200px; height: 200px;
  bottom: 60px; left: -60px;
  background: var(--primary-dark);
  animation-delay: 2s;
  opacity: 0.15;
}
.auth-orb-3 {
  width: 160px; height: 160px;
  bottom: -40px; right: 30%;
  background: var(--income);
  animation-delay: 4s;
  opacity: 0.12;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border-radius: 28px;
  padding: 36px 28px 28px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.10), 0 0 0 1px var(--line);
  position: relative;
  z-index: 1;
}

.auth-header { text-align: center; margin-bottom: 32px; }

.auth-logo {
  width: 56px; height: 56px;
  border-radius: 18px;
  background: var(--primary-gradient);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: var(--primary-glow);
}

.auth-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: var(--primary-light);
  color: var(--primary);
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.auth-title {
  font-size: 28px;
  font-weight: 900;
  color: var(--ink);
  margin: 0 0 6px;
  letter-spacing: -0.7px;
}

.auth-subtitle {
  font-size: 14px;
  color: var(--ink-muted);
  margin: 0;
  line-height: 1.5;
}

.auth-form { display: flex; flex-direction: column; gap: 18px; }
.auth-field { display: flex; flex-direction: column; gap: 8px; }

.auth-label {
  font-size: 12px;
  font-weight: 800;
  color: var(--ink-muted);
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.auth-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auth-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.auth-input-icon {
  position: absolute;
  left: 14px;
  color: var(--ink-light);
  pointer-events: none;
}

.auth-input {
  width: 100%;
  padding: 14px 14px 14px 42px;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: var(--surface-2);
  color: var(--ink);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  appearance: none;
}
.auth-input:focus {
  border-color: var(--primary);
  background: var(--surface);
  box-shadow: 0 0 0 4px var(--primary-light);
}
.auth-input::placeholder { color: var(--ink-light); font-weight: 400; }

.auth-eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.auth-eye-btn:hover { color: var(--ink); }

.auth-error {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--expense-text);
  background: var(--expense-soft);
  border-radius: 12px;
  padding: 12px 14px;
  margin: 0;
}

.auth-btn-primary {
  width: 100%;
  padding: 15px;
  border-radius: 16px;
  background: var(--primary-gradient);
  color: white;
  font-weight: 800;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: var(--shadow-btn);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 0.2px;
}
.auth-btn-primary:hover { box-shadow: 0 8px 28px rgba(5, 150, 105, 0.5); }
.auth-btn-primary:active { opacity: 0.9; transform: scale(0.98); }
.auth-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

.auth-btn-ghost {
  padding: 13px;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  background: transparent;
  color: var(--ink-muted);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.auth-btn-ghost:hover { background: var(--surface-2); }

.auth-link-sm {
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.15s;
  font-family: inherit;
}
.auth-link-sm:hover { opacity: 0.7; }

.auth-link-bold {
  font-weight: 800;
  color: var(--primary);
  text-decoration: none;
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: var(--ink-muted);
  margin-top: 22px;
  margin-bottom: 0;
}

.auth-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal */
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
}
.auth-modal {
  background: var(--surface);
  border-radius: 24px;
  padding: 24px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  border: 1px solid var(--line);
}
.auth-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.auth-modal-header h3 {
  font-size: 18px; font-weight: 800;
  color: var(--ink);
  margin: 0;
}
.auth-modal-close {
  background: var(--surface-2);
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  width: 34px; height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.auth-modal-close:hover { background: var(--line); color: var(--ink); }
.auth-modal-success { text-align: center; padding: 8px 0; }
.auth-success-icon { font-size: 44px; margin-bottom: 12px; }
</style>

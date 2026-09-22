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
    const redirectUrl = window.location.origin + window.location.pathname + "#/reset-password";
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo: redirectUrl });
    if (resetErr) throw resetErr;
    forgotSuccess.value = true;
  } catch (err: any) {
    forgotError.value = err?.message || "Gagal mengirim link reset password.";
  } finally {
    forgotLoading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Background Blobs -->
    <div class="auth-blob auth-blob-1"></div>
    <div class="auth-blob auth-blob-2"></div>

    <div class="auth-card">
      <!-- Header -->
      <div class="auth-header">
        <div class="auth-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1"/>
            <polyline points="12,8 21,8 21,16 12,16" fill="rgba(255,255,255,0.3)"/>
            <circle cx="16.5" cy="12" r="1.5" fill="white"/>
          </svg>
        </div>
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Masuk ke akun Family Notes kamu</p>
      </div>

      <!-- Form -->
      <form class="auth-form" @submit.prevent="submit">
        <!-- Email -->
        <div class="auth-field">
          <label class="auth-label">Email Address</label>
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
            <button type="button" class="auth-link-sm" @click="openForgotModal">Forgot Password?</button>
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
        <p v-if="error" class="auth-error">{{ error }}</p>

        <!-- Submit -->
        <button id="btn-login" type="submit" :disabled="loading" class="auth-btn-primary">
          <span v-if="loading" class="auth-spinner"></span>
          {{ loading ? "Memproses..." : "Sign In" }}
        </button>
      </form>

      <!-- Footer -->
      <p class="auth-footer">
        Don't have an account?
        <router-link :to="{ name: 'register' }" class="auth-link-bold">Sign Up</router-link>
      </p>
    </div>

    <!-- Modal Lupa Password -->
    <div v-if="showForgotModal" class="auth-modal-overlay" @click.self="showForgotModal = false">
      <div class="auth-modal">
        <div class="auth-modal-header">
          <h3>Reset Password</h3>
          <button class="auth-modal-close" @click="showForgotModal = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div v-if="forgotSuccess" class="auth-modal-success">
          <div class="auth-success-icon">✉️</div>
          <p class="font-bold text-[15px] mb-1">Link Terkirim!</p>
          <p class="text-[13px] text-ink-muted">Petunjuk reset telah dikirim ke <strong>{{ forgotEmail }}</strong>. Cek inbox atau spam kamu.</p>
          <button type="button" class="auth-btn-primary mt-4" @click="showForgotModal = false">Tutup</button>
        </div>

        <form v-else class="space-y-4" @submit.prevent="handleForgotPassword">
          <p class="text-[13px] text-ink-muted">Masukkan email yang terdaftar, kami akan mengirimkan link reset password.</p>
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
              {{ forgotLoading ? 'Mengirim...' : 'Kirim Link' }}
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

/* Decorative blobs */
.auth-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  pointer-events: none;
}
.auth-blob-1 {
  width: 260px; height: 260px;
  top: -80px; right: -60px;
  background: var(--primary);
}
.auth-blob-2 {
  width: 180px; height: 180px;
  bottom: 40px; left: -60px;
  background: var(--primary-dark);
  opacity: 0.2;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border-radius: 24px;
  padding: 36px 28px 28px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.10);
  position: relative;
  z-index: 1;
  animation: authCardIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes authCardIn {
  from { opacity: 0; transform: translateY(28px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.auth-header { text-align: center; margin-bottom: 28px; }

.auth-logo {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: var(--primary-gradient);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.auth-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--ink);
  margin: 0 0 6px;
  letter-spacing: -0.5px;
}

.auth-subtitle {
  font-size: 14px;
  color: var(--ink-muted);
  margin: 0;
}

.auth-form { display: flex; flex-direction: column; gap: 16px; }

.auth-field { display: flex; flex-direction: column; gap: 6px; }

.auth-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-muted);
  letter-spacing: 0.3px;
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
  color: var(--ink-muted);
  pointer-events: none;
}

.auth-input {
  width: 100%;
  padding: 13px 14px 13px 40px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--ink);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  appearance: none;
}
.auth-input:focus {
  border-color: var(--primary);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--income-soft);
}
.auth-input::placeholder { color: var(--ink-light); }

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
  font-size: 12.5px;
  font-weight: 600;
  color: var(--expense);
  background: var(--expense-soft);
  border-radius: 10px;
  padding: 10px 14px;
  margin: 0;
}

.auth-btn-primary {
  width: 100%;
  padding: 15px;
  border-radius: 14px;
  background: var(--primary-gradient);
  color: white;
  font-weight: 700;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: var(--shadow-btn);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.auth-btn-primary:active { opacity: 0.9; transform: scale(0.98); }
.auth-btn-primary:disabled { opacity: 0.6; }

.auth-btn-ghost {
  padding: 13px;
  border-radius: 12px;
  border: 1.5px solid var(--line);
  background: transparent;
  color: var(--ink-muted);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
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
}
.auth-link-sm:hover { opacity: 0.75; }

.auth-link-bold {
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: var(--ink-muted);
  margin-top: 20px;
  margin-bottom: 0;
}

.auth-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
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
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
}
.auth-modal {
  background: var(--surface);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: authCardIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.auth-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.auth-modal-header h3 {
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
  margin: 0;
}
.auth-modal-close {
  background: var(--surface-2);
  border: none;
  cursor: pointer;
  color: var(--ink-muted);
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.auth-modal-close:hover { background: var(--line); }
.auth-modal-success { text-align: center; padding: 8px 0; }
.auth-success-icon { font-size: 40px; margin-bottom: 12px; }
</style>

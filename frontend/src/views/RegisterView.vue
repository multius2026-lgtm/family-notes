<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const name = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const emailAlreadyExists = ref(false);
const loading = ref(false);
const auth = useAuthStore();
const router = useRouter();

function isEmailTakenError(msg: string) {
  const lower = msg.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists") ||
    lower.includes("email address is already") ||
    lower.includes("duplicate") ||
    lower.includes("email sudah") ||
    lower.includes("email_exists")
  );
}

async function submit() {
  error.value = "";
  emailAlreadyExists.value = false;
  if (password.value.length < 8) {
    error.value = "Password minimal harus 8 karakter.";
    return;
  }
  loading.value = true;
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value });
    router.push({ name: "dashboard" });
  } catch (e: any) {
    const msg = e?.message || e?.data?.error || "";
    if (isEmailTakenError(msg)) {
      emailAlreadyExists.value = true;
    } else {
      error.value = msg || "Gagal mendaftar. Periksa koneksi kamu dan coba lagi.";
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-blob auth-blob-1"></div>
    <div class="auth-blob auth-blob-2"></div>

    <div class="auth-card">
      <!-- Header -->
      <div class="auth-header">
        <div class="auth-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </div>
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Mulai kelola keuangan pribadimu</p>
      </div>

      <!-- Form -->
      <form class="auth-form" @submit.prevent="submit">
        <!-- Nama -->
        <div class="auth-field">
          <label class="auth-label">Full Name</label>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <input id="register-name" v-model="name" type="text" required placeholder="Nama kamu" class="auth-input" />
          </div>
        </div>

        <!-- Email -->
        <div class="auth-field">
          <label class="auth-label">Email Address</label>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input id="register-email" v-model="email" type="email" required placeholder="nama@email.com" class="auth-input" />
          </div>
        </div>

        <!-- Password -->
        <div class="auth-field">
          <label class="auth-label">Password</label>
          <div class="auth-input-wrap">
            <svg class="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="register-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              minlength="8"
              required
              placeholder="Minimal 8 karakter"
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
          <p class="text-[11px]" style="color: var(--ink-muted); margin-top: 4px;">Minimal 8 karakter</p>
        </div>

        <!-- Email sudah ada -->
        <div v-if="emailAlreadyExists" class="auth-email-exists">
          <div class="flex items-center gap-2 font-bold text-[13px] mb-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Email sudah terdaftar
          </div>
          <p class="text-[12px] mb-3">Alamat email <strong>{{ email }}</strong> sudah memiliki akun.</p>
          <div class="flex gap-2">
            <router-link :to="{ name: 'login' }" class="auth-btn-primary flex-1 text-center text-[13px] no-underline" style="padding: 10px 14px;">
              Masuk sekarang
            </router-link>
            <button type="button" class="auth-btn-ghost flex-1 text-[13px]" style="padding: 10px;" @click="emailAlreadyExists = false; email = ''">
              Ganti email
            </button>
          </div>
        </div>

        <!-- Error -->
        <p v-if="error" class="auth-error">{{ error }}</p>

        <!-- Submit -->
        <button id="btn-register" type="submit" :disabled="loading" class="auth-btn-primary">
          <span v-if="loading" class="auth-spinner"></span>
          {{ loading ? "Memproses..." : "Sign Up" }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account?
        <router-link :to="{ name: 'login' }" class="auth-link-bold">Sign In</router-link>
      </p>
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

.auth-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  pointer-events: none;
}
.auth-blob-1 {
  width: 260px; height: 260px;
  top: -80px; left: -60px;
  background: var(--primary);
}
.auth-blob-2 {
  width: 180px; height: 180px;
  bottom: 40px; right: -60px;
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

.auth-email-exists {
  background: #fff7ed;
  border: 1.5px solid #fdba74;
  color: #c2410c;
  border-radius: 14px;
  padding: 14px;
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
  text-decoration: none;
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
</style>

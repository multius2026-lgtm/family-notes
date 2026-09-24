<script setup lang="ts">
import { ref, computed } from "vue";
import { useReceiptOcr, type OcrResult } from "@/composables/useReceiptOcr";

const emit = defineEmits<{
  apply: [data: { amount: number | null; date: string | null; note: string }];
  close: [];
}>();

const { scanning, progress, progressLabel, error, scanReceipt, reset } = useReceiptOcr();

// State UI
const phase = ref<"idle" | "scanning" | "review" | "manual">("idle");
const previewUrl = ref<string | null>(null);
const ocrResult = ref<OcrResult | null>(null);

// Editable result fields (untuk fase review/manual)
const editTotal = ref<number | null>(null);
const editDate = ref<string>("");
const editStore = ref<string>("");
const rawTextExpanded = ref(false);

// Tombol kamera/file terpisah (kamera langsung vs galeri)
const cameraInput = ref<HTMLInputElement | null>(null);
const galleryInput = ref<HTMLInputElement | null>(null);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function openCamera() {
  if (cameraInput.value) {
    cameraInput.value.value = "";
    cameraInput.value.click();
  }
}

function openGallery() {
  if (galleryInput.value) {
    galleryInput.value.value = "";
    galleryInput.value.click();
  }
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // Preview
  const reader = new FileReader();
  reader.onload = (ev) => { previewUrl.value = ev.target?.result as string; };
  reader.readAsDataURL(file);

  phase.value = "scanning";

  const result = await scanReceipt(file);

  if (!result) {
    phase.value = "idle";
    return;
  }

  ocrResult.value = result;

  // Isi editor dengan hasil OCR
  editTotal.value = result.total;
  editDate.value = result.date || todayStr();
  editStore.value = result.storeName || "";

  // Putuskan phase berikutnya
  if (result.isConfident) {
    phase.value = "review";      // Hasil bagus → tampilkan konfirmasi
  } else {
    phase.value = "manual";      // Hasil kurang jelas → tampilkan editor manual
  }
}

function applyResult() {
  const note = editStore.value ? `Struk: ${editStore.value}` : "Dari struk OCR";
  emit("apply", {
    amount: editTotal.value,
    date: editDate.value || todayStr(),
    note,
  });
}

function retake() {
  reset();
  phase.value = "idle";
  previewUrl.value = null;
  ocrResult.value = null;
  editTotal.value = null;
  editDate.value = "";
  editStore.value = "";
  rawTextExpanded.value = false;
  if (cameraInput.value) cameraInput.value.value = "";
  if (galleryInput.value) galleryInput.value.value = "";
}

const confidenceColor = computed(() => {
  const c = ocrResult.value?.confidence ?? 0;
  if (c >= 70) return "var(--income-text)";
  if (c >= 50) return "var(--gold)";
  return "var(--expense-text)";
});

const confidenceBg = computed(() => {
  const c = ocrResult.value?.confidence ?? 0;
  if (c >= 70) return "var(--income-soft)";
  if (c >= 50) return "var(--gold-soft)";
  return "var(--expense-soft)";
});

function formatRupiah(val: number | null) {
  if (!val) return "";
  return new Intl.NumberFormat("id-ID").format(val);
}

function onTotalInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
  editTotal.value = raw ? parseInt(raw) : null;
}
</script>

<template>
  <!-- Hidden file input: Kamera langsung (capture environment) -->
  <input
    ref="cameraInput"
    type="file"
    accept="image/*"
    capture="environment"
    class="hidden"
    @change="onFileChange"
  />

  <!-- Hidden file input: Galeri / File picker (tanpa capture agar buka galeri/file) -->
  <input
    ref="galleryInput"
    type="file"
    accept="image/*"
    class="hidden"
    @change="onFileChange"
  />

  <!-- ═══ PHASE: IDLE ═══ -->
  <div v-if="phase === 'idle'" class="scanner-idle fade-slide-up">
    <div class="scanner-icon-wrap">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="m9 9 3-3 3 3"/>
        <path d="M12 6v9"/>
        <path d="M9 15h6"/>
      </svg>
    </div>
    <h3 class="scanner-title">Scan Struk</h3>
    <p class="scanner-desc">Pilih metode pengambilan gambar untuk membaca total, tanggal, dan nama toko secara otomatis.</p>

    <div class="scanner-tips">
      <div class="tip-item">
        <span class="tip-dot" style="background: var(--income-soft); color: var(--income-text);">📷</span>
        <span>Foto dari atas, posisi lurus</span>
      </div>
      <div class="tip-item">
        <span class="tip-dot" style="background: var(--gold-soft); color: var(--gold);">💡</span>
        <span>Pastikan pencahayaan cukup</span>
      </div>
      <div class="tip-item">
        <span class="tip-dot" style="background: var(--primary-light); color: var(--primary);">🔍</span>
        <span>Teks harus terlihat jelas</span>
      </div>
    </div>

    <div class="scanner-actions">
      <!-- Opsi 1: Kamera langsung -->
      <button class="scan-btn-primary" @click="openCamera">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Ambil Foto (Kamera)
      </button>

      <!-- Opsi 2: Galeri / File -->
      <button class="scan-btn-secondary" @click="openGallery">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        Pilih dari Galeri
      </button>

      <button class="scan-btn-ghost" @click="emit('close')">Batal</button>
    </div>
  </div>

  <!-- ═══ PHASE: SCANNING ═══ -->
  <div v-else-if="phase === 'scanning'" class="scanner-scanning">
    <!-- Preview thumbnail -->
    <div class="scan-preview-wrap">
      <img v-if="previewUrl" :src="previewUrl" class="scan-preview-img" alt="Struk" />
      <div class="scan-preview-overlay">
        <div class="scan-line"></div>
      </div>
    </div>

    <!-- Progress -->
    <div class="scan-progress-wrap">
      <div class="scan-progress-bar">
        <div class="scan-progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="scan-progress-label">{{ progressLabel }}</p>
      <p class="scan-progress-pct">{{ progress }}%</p>
    </div>

    <p class="scan-note">Sedang memproses secara lokal di perangkat kamu...</p>
  </div>

  <!-- ═══ PHASE: REVIEW (confident) ═══ -->
  <div v-else-if="phase === 'review'" class="scanner-result fade-slide-up">
    <div class="result-header">
      <div class="result-success-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Struk terbaca dengan baik
      </div>
      <span class="result-confidence" :style="{ color: confidenceColor, background: confidenceBg }">
        {{ ocrResult?.confidence }}% akurasi
      </span>
    </div>

    <!-- Preview kecil -->
    <img v-if="previewUrl" :src="previewUrl" class="result-thumb" alt="Struk" />

    <!-- Fields yang bisa diedit -->
    <div class="result-fields">
      <!-- Total -->
      <div class="result-field">
        <label class="result-field-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Total
        </label>
        <div class="result-input-wrap">
          <span class="result-input-prefix">Rp</span>
          <input
            type="text"
            inputmode="numeric"
            :value="formatRupiah(editTotal)"
            class="result-input"
            placeholder="0"
            @input="onTotalInput"
          />
        </div>
      </div>

      <!-- Tanggal -->
      <div class="result-field">
        <label class="result-field-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
          Tanggal
        </label>
        <input v-model="editDate" type="date" class="result-input-date" />
      </div>

      <!-- Toko -->
      <div class="result-field">
        <label class="result-field-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>
          Nama Toko
        </label>
        <input v-model="editStore" type="text" class="result-input-text" placeholder="mis. Indomaret, Alfamart..." />
      </div>
    </div>

    <div class="result-actions">
      <button class="scan-btn-primary" @click="applyResult">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Gunakan Data Ini
      </button>
      <button class="scan-btn-ghost" @click="retake">📷 Scan Ulang</button>
    </div>
  </div>

  <!-- ═══ PHASE: MANUAL (not confident) ═══ -->
  <div v-else-if="phase === 'manual'" class="scanner-result fade-slide-up">
    <div class="result-header">
      <div class="result-warn-badge">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Perlu koreksi manual
      </div>
      <span class="result-confidence" :style="{ color: confidenceColor, background: confidenceBg }">
        {{ ocrResult?.confidence }}% akurasi
      </span>
    </div>

    <p class="manual-hint">
      Hasil OCR kurang jelas. Periksa dan perbaiki data di bawah ini, atau scan ulang dengan foto yang lebih terang.
    </p>

    <!-- Preview kecil -->
    <img v-if="previewUrl" :src="previewUrl" class="result-thumb" alt="Struk" />

    <!-- Fields editable -->
    <div class="result-fields">
      <div class="result-field">
        <label class="result-field-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Total <span class="field-required">*</span>
        </label>
        <div class="result-input-wrap">
          <span class="result-input-prefix">Rp</span>
          <input
            type="text"
            inputmode="numeric"
            :value="formatRupiah(editTotal)"
            class="result-input"
            :class="{ 'result-input--warn': !editTotal }"
            placeholder="Isi manual..."
            @input="onTotalInput"
          />
        </div>
        <p v-if="!editTotal" class="field-hint">Total tidak terdeteksi — isi manual</p>
      </div>

      <div class="result-field">
        <label class="result-field-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Tanggal
        </label>
        <input v-model="editDate" type="date" class="result-input-date" />
      </div>

      <div class="result-field">
        <label class="result-field-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>
          Nama Toko
        </label>
        <input v-model="editStore" type="text" class="result-input-text" placeholder="mis. Indomaret, Alfamart..." />
      </div>
    </div>

    <!-- Raw text collapsible -->
    <div class="raw-text-section">
      <button class="raw-text-toggle" @click="rawTextExpanded = !rawTextExpanded">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline :points="rawTextExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
        </svg>
        {{ rawTextExpanded ? "Sembunyikan" : "Lihat" }} teks hasil scan
      </button>
      <div v-if="rawTextExpanded" class="raw-text-box">
        <pre class="raw-text">{{ ocrResult?.rawText }}</pre>
      </div>
    </div>

    <div class="result-actions">
      <button class="scan-btn-primary" :disabled="!editTotal" @click="applyResult">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Gunakan Data Ini
      </button>
      <button class="scan-btn-ghost" @click="retake">📷 Scan Ulang</button>
    </div>
  </div>

  <!-- Error -->
  <div v-if="error" class="scanner-error">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {{ error }}
    <button class="error-retry" @click="retake">Coba Lagi</button>
  </div>
</template>

<style scoped>
/* ── Idle state ── */
.scanner-idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0;
}

.scanner-icon-wrap {
  width: 72px; height: 72px;
  border-radius: 22px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(5,150,105,0.15);
}

.scanner-title {
  font-size: 18px; font-weight: 800;
  color: var(--ink);
  margin: 0 0 8px;
  letter-spacing: -0.3px;
}

.scanner-desc {
  font-size: 13.5px;
  color: var(--ink-muted);
  line-height: 1.55;
  margin: 0 0 20px;
  max-width: 280px;
}

.scanner-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-bottom: 24px;
  text-align: left;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-muted);
}

.tip-dot {
  width: 30px; height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

/* ── Buttons ── */
.scanner-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.scan-btn-primary {
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--primary-gradient);
  color: white;
  font-weight: 800; font-size: 15px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: var(--shadow-btn);
  font-family: inherit;
}
.scan-btn-primary:hover { opacity: 0.9; }
.scan-btn-primary:active { transform: scale(0.98); }
.scan-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.scan-btn-secondary {
  width: 100%;
  padding: 13px 16px;
  border-radius: 16px;
  border: 1.5px solid var(--line);
  background: var(--surface-2);
  color: var(--primary);
  font-weight: 700;
  font-size: 14.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-family: inherit;
}
.scan-btn-secondary:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}
.scan-btn-secondary:active {
  transform: scale(0.98);
}

.scan-btn-ghost {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  background: transparent;
  color: var(--ink-muted);
  font-weight: 700; font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}
.scan-btn-ghost:hover { background: var(--surface-2); }

/* ── Scanning phase ── */
.scanner-scanning {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.scan-preview-wrap {
  width: 100%;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  background: var(--surface-2);
}

.scan-preview-img {
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.7;
}

.scan-preview-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* Animasi scan line */
.scan-line {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  animation: scanLine 1.5s ease-in-out infinite;
  box-shadow: 0 0 12px var(--primary);
}

@keyframes scanLine {
  0% { top: 0; }
  100% { top: 100%; }
}

.scan-progress-wrap {
  width: 100%;
}

.scan-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--line);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 8px;
}

.scan-progress-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 99px;
  transition: width 0.3s ease;
}

.scan-progress-label {
  font-size: 13px; font-weight: 600;
  color: var(--ink-muted);
  margin: 0 0 2px;
  text-align: center;
}

.scan-progress-pct {
  font-size: 24px; font-weight: 900;
  color: var(--primary);
  margin: 0;
  text-align: center;
  letter-spacing: -1px;
}

.scan-note {
  font-size: 11.5px;
  color: var(--ink-light);
  text-align: center;
  margin: 0;
}

/* ── Result phase ── */
.scanner-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.result-success-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  background: var(--income-soft);
  color: var(--income-text);
  font-size: 12px; font-weight: 800;
}

.result-warn-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  background: var(--gold-soft);
  color: var(--gold);
  font-size: 12px; font-weight: 800;
}

.result-confidence {
  font-size: 11.5px; font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
}

.result-thumb {
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-radius: 12px;
  opacity: 0.85;
}

.manual-hint {
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.5;
  margin: 0;
  padding: 10px 14px;
  background: var(--gold-soft);
  border-radius: 12px;
}

.result-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-field-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px; font-weight: 800;
  color: var(--ink-muted);
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.field-required { color: var(--expense); }

.result-input-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: var(--surface-2);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.result-input-wrap:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.result-input-prefix {
  padding: 12px 12px;
  font-weight: 800; font-size: 14px;
  color: var(--ink-muted);
  background: var(--surface-3);
  border-right: 1.5px solid var(--line);
  flex-shrink: 0;
}

.result-input {
  flex: 1;
  padding: 12px 14px;
  border: none;
  background: transparent;
  font-size: 16px; font-weight: 800;
  color: var(--expense-text);
  font-family: inherit;
  outline: none;
}

.result-input--warn {
  color: var(--ink-muted);
}

.result-input-date,
.result-input-text {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: var(--surface-2);
  color: var(--ink);
  font-size: 14px; font-weight: 600;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
}
.result-input-date:focus,
.result-input-text:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.field-hint {
  font-size: 11px;
  color: var(--expense-text);
  margin: 0;
  padding: 0 4px;
  font-weight: 600;
}

/* ── Raw text ── */
.raw-text-section {
  border: 1.5px dashed var(--line);
  border-radius: 14px;
  overflow: hidden;
}

.raw-text-toggle {
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12.5px; font-weight: 700;
  color: var(--ink-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  transition: background 0.15s;
}
.raw-text-toggle:hover { background: var(--surface-2); }

.raw-text-box {
  max-height: 140px;
  overflow-y: auto;
  border-top: 1.5px dashed var(--line);
  padding: 10px 14px;
}

.raw-text {
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--ink-muted);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: 'Courier New', monospace;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

/* ── Error ── */
.scanner-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--expense-soft);
  color: var(--expense-text);
  font-size: 13px; font-weight: 600;
  margin-top: 8px;
}

.error-retry {
  margin-left: auto;
  background: none;
  border: 1px solid currentColor;
  color: inherit;
  font-size: 12px; font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
}
</style>

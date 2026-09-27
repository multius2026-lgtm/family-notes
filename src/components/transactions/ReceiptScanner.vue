<script setup lang="ts">
import { ref, computed } from "vue";
import { useReceiptOcr, type OcrResult, type ReceiptItem } from "@/composables/useReceiptOcr";
import { compressImage, uploadReceiptToStorage, formatBytes } from "@/composables/useImageCompressor";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const emit = defineEmits<{
  apply: [data: {
    amount: number | null;
    date: string | null;
    note: string;
    receiptUrl: string | null;
    isOcr: boolean;
    items: ReceiptItem[];
  }];
  close: [];
}>();

const auth = useAuthStore();
const { scanning, progress, progressLabel, error, scanReceipt, reset } = useReceiptOcr();

// State UI
const phase = ref<"idle" | "scanning" | "review" | "manual">("idle");
const previewUrl = ref<string | null>(null);
const ocrResult = ref<OcrResult | null>(null);

// Supabase Storage & Kompresi
const uploadedReceiptUrl = ref<string | null>(null);
const uploadingStorage = ref(false);
const uploadStorageError = ref<string | null>(null);
const compressionStats = ref<{
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
} | null>(null);

// Editable result fields
const editTotal = ref<number | null>(null);
const editDate = ref<string>("");
const editStore = ref<string>("");
const receiptItems = ref<ReceiptItem[]>([]);
const itemsDropdownOpen = ref(true);
const rawTextExpanded = ref(false);
const showImageModal = ref(false);

// New item input in dropdown
const showAddItemRow = ref(false);
const newItemName = ref("");
const newItemPrice = ref<number | null>(null);
const newItemQty = ref<number>(1);

// Hidden inputs
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

  // Local preview
  const reader = new FileReader();
  reader.onload = (ev) => { previewUrl.value = ev.target?.result as string; };
  reader.readAsDataURL(file);

  phase.value = "scanning";
  uploadingStorage.value = true;
  uploadStorageError.value = null;

  try {
    // 1. Kompresi gambar lebih dulu ke ukuran kecil (Canvas JPEG 72%, max 1024px)
    const comp = await compressImage(file, { maxSize: 1024, quality: 0.72 });
    compressionStats.value = {
      originalSize: comp.originalSize,
      compressedSize: comp.compressedSize,
      savedPercent: comp.savedPercent,
    };

    // 2. Upload file terkompresi ke Supabase Storage (bucket receipt-images)
    const userId = auth.user?.id || (await supabase.auth.getUser()).data.user?.id || "anon";
    const uploadRes = await uploadReceiptToStorage(supabase, comp.blob, userId);
    if (uploadRes.url) {
      uploadedReceiptUrl.value = uploadRes.url;
    } else {
      uploadStorageError.value = uploadRes.error || "Gagal mengunggah foto ke storage";
    }
  } catch (err: any) {
    console.error("Gagal kompres/upload:", err);
    uploadStorageError.value = err?.message || "Gagal memproses gambar";
  } finally {
    uploadingStorage.value = false;
  }

  // 3. Scan OCR Tesseract
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
  receiptItems.value = result.items ? [...result.items] : [];

  // Jika item terdeteksi tapi total null, hitung total dari items
  if (!editTotal.value && receiptItems.value.length > 0) {
    const sum = receiptItems.value.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 1), 0);
    if (sum > 0) editTotal.value = sum;
  }

  // Putuskan phase berikutnya
  if (result.isConfident) {
    phase.value = "review";
  } else {
    phase.value = "manual";
  }
}

function removeItem(index: number) {
  receiptItems.value.splice(index, 1);
}

function addItem() {
  if (!newItemName.value.trim()) return;
  receiptItems.value.push({
    name: newItemName.value.trim(),
    price: newItemPrice.value,
    qty: newItemQty.value > 1 ? newItemQty.value : undefined,
  });
  newItemName.value = "";
  newItemPrice.value = null;
  newItemQty.value = 1;
  showAddItemRow.value = false;
}

const itemsSubtotal = computed(() => {
  return receiptItems.value.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
});

function applyResult() {
  const note = editStore.value ? `Struk: ${editStore.value}` : "Dari scan struk";
  emit("apply", {
    amount: editTotal.value,
    date: editDate.value || todayStr(),
    note,
    receiptUrl: uploadedReceiptUrl.value,
    isOcr: true,
    items: receiptItems.value,
  });
}

function retake() {
  reset();
  phase.value = "idle";
  previewUrl.value = null;
  ocrResult.value = null;
  uploadedReceiptUrl.value = null;
  compressionStats.value = null;
  editTotal.value = null;
  editDate.value = "";
  editStore.value = "";
  receiptItems.value = [];
  rawTextExpanded.value = false;
  showImageModal.value = false;
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

function formatRupiah(val: number | null | undefined) {
  if (!val) return "0";
  return new Intl.NumberFormat("id-ID").format(val);
}

function onTotalInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
  editTotal.value = raw ? parseInt(raw) : null;
}
</script>

<template>
  <!-- Hidden file inputs -->
  <input
    ref="cameraInput"
    type="file"
    accept="image/*"
    capture="environment"
    class="hidden"
    @change="onFileChange"
  />
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
    <h3 class="scanner-title">Scan Struk Belanja</h3>
    <p class="scanner-desc">
      Foto struk akan otomatis dikonversi ke ukuran kecil, diunggah ke server Supabase, lalu diekstrak nominal dan daftar itemnya.
    </p>

    <div class="scanner-tips">
      <div class="tip-item">
        <span class="tip-dot" style="background: var(--income-soft); color: var(--income-text);">📷</span>
        <span>Foto struk tegak lurus dan jelas</span>
      </div>
      <div class="tip-item">
        <span class="tip-dot" style="background: var(--primary-light); color: var(--primary);">🗜️</span>
        <span>Ukuran gambar otomatis diperkecil agar hemat kuota</span>
      </div>
      <div class="tip-item">
        <span class="tip-dot" style="background: var(--gold-soft); color: var(--gold);">🧾</span>
        <span>Item dan harga diekstrak secara otomatis</span>
      </div>
    </div>

    <div class="scanner-actions">
      <button class="scan-btn-primary" @click="openCamera">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Ambil Foto (Kamera)
      </button>

      <button class="scan-btn-secondary" @click="openGallery">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        Pilih dari Galeri / File
      </button>

      <button class="scan-btn-ghost" @click="emit('close')">Batal</button>
    </div>
  </div>

  <!-- ═══ PHASE: SCANNING ═══ -->
  <div v-else-if="phase === 'scanning'" class="scanner-scanning">
    <div class="scan-preview-wrap">
      <img v-if="previewUrl" :src="previewUrl" class="scan-preview-img" alt="Struk" />
      <div class="scan-preview-overlay">
        <div class="scan-line"></div>
      </div>
    </div>

    <div class="scan-progress-wrap">
      <div class="scan-progress-bar">
        <div class="scan-progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="scan-progress-label">{{ progressLabel }}</p>
      <p class="scan-progress-pct">{{ progress }}%</p>
    </div>

    <!-- Status upload & kompresi -->
    <div class="scan-status-pill">
      <span v-if="uploadingStorage" class="flex items-center gap-1.5 text-xs text-ink-muted">
        <span class="inline-block w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
        Mengompresi & mengunggah ke Supabase...
      </span>
      <span v-else-if="uploadedReceiptUrl" class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
        ✓ Tersimpan di Supabase
        <span v-if="compressionStats">({{ formatBytes(compressionStats.compressedSize) }})</span>
      </span>
      <span v-else class="text-xs text-ink-light">Memproses secara lokal di browser...</span>
    </div>
  </div>

  <!-- ═══ PHASE: REVIEW & MANUAL ═══ -->
  <div v-else-if="phase === 'review' || phase === 'manual'" class="scanner-result fade-slide-up">
    <!-- Header Status -->
    <div class="result-header">
      <div v-if="phase === 'review'" class="result-success-badge">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Struk terbaca dengan baik
      </div>
      <div v-else class="result-warn-badge">
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

    <!-- Banner Info Upload Supabase & Kompresi -->
    <div class="storage-info-box">
      <div class="flex items-center gap-2">
        <span class="storage-icon">☁️</span>
        <div class="flex-1 min-w-0">
          <p class="text-[12px] font-bold text-ink truncate">
            <span v-if="uploadedReceiptUrl">Tersimpan di Supabase Storage</span>
            <span v-else-if="uploadStorageError" class="text-rose-500">Storage Offline (Lokal)</span>
            <span v-else>Memproses Unggahan...</span>
          </p>
          <p class="text-[11px] text-ink-muted">
            <span v-if="compressionStats">
              {{ formatBytes(compressionStats.originalSize) }} → <strong>{{ formatBytes(compressionStats.compressedSize) }}</strong>
              (hemat {{ compressionStats.savedPercent }}%)
            </span>
            <span v-else>Format gambar dioptimalkan</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Preview thumbnail dengan tombol perbesar -->
    <div class="photo-preview-card" @click="showImageModal = true">
      <img v-if="previewUrl" :src="previewUrl" class="photo-preview-thumb" alt="Foto Struk" />
      <div class="photo-preview-overlay">
        <span class="photo-preview-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          Perbesar Foto
        </span>
      </div>
    </div>

    <!-- Input Form Fields -->
    <div class="result-fields">
      <!-- Total -->
      <div class="result-field">
        <label class="result-field-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Total Transaksi <span class="field-required">*</span>
        </label>
        <div class="result-input-wrap">
          <span class="result-input-prefix">Rp</span>
          <input
            type="text"
            inputmode="numeric"
            :value="formatRupiah(editTotal)"
            class="result-input"
            :class="{ 'result-input--warn': !editTotal }"
            placeholder="0"
            @input="onTotalInput"
          />
        </div>
        <p v-if="!editTotal" class="field-hint">Total belum terisi — masukkan nominal yang benar</p>
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>
          Nama Toko / Sumber Struk
        </label>
        <input v-model="editStore" type="text" class="result-input-text" placeholder="mis. Indomaret, SPBU, Alfamart..." />
      </div>
    </div>

    <!-- ═══ ACCORDION / DROPDOWN LIST ITEM STRUK ═══ -->
    <div class="items-dropdown-card">
      <button
        type="button"
        class="items-dropdown-toggle"
        @click="itemsDropdownOpen = !itemsDropdownOpen"
      >
        <div class="flex items-center gap-2">
          <span class="text-base">🧾</span>
          <span class="font-bold text-[13px] text-ink">Daftar Item Struk</span>
          <span class="items-count-badge">{{ receiptItems.length }} item</span>
        </div>
        <svg
          class="chevron-icon"
          :class="{ 'rotate-180': itemsDropdownOpen }"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <!-- Isi Dropdown -->
      <div v-if="itemsDropdownOpen" class="items-dropdown-content">
        <div v-if="receiptItems.length === 0" class="empty-items-text">
          Tidak ada item satuan yang terbaca otomatis dari struk. Anda dapat menambahkan item manual di bawah.
        </div>

        <div v-else class="receipt-items-list">
          <div
            v-for="(item, idx) in receiptItems"
            :key="idx"
            class="receipt-item-row"
          >
            <div class="flex-1 min-w-0 pr-2 space-y-1.5">
              <input
                v-model="item.name"
                type="text"
                class="w-full text-xs font-semibold text-ink bg-surface-2 border border-line rounded-md px-2 py-1.5 outline-none focus:border-primary"
                placeholder="Nama item"
              />
              <div class="flex items-center gap-1.5">
                <input
                  v-model.number="item.qty"
                  type="number"
                  min="1"
                  class="w-16 text-xs p-1.5 rounded-md border border-line bg-surface-2 text-center outline-none focus:border-primary"
                  placeholder="Qty"
                />
                <span class="text-[10px] text-ink-muted">x</span>
                <input
                  v-model.number="item.price"
                  type="number"
                  min="0"
                  step="100"
                  class="flex-1 text-xs p-1.5 rounded-md border border-line bg-surface-2 outline-none focus:border-primary"
                  placeholder="Harga"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="receipt-item-price">
                Rp {{ formatRupiah((item.price || 0) * (item.qty || 1)) }}
              </span>
              <button
                type="button"
                class="item-delete-btn"
                title="Hapus baris item"
                @click="removeItem(idx)"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Total kalkulasi item -->
          <div class="items-summary-bar">
            <span class="text-xs text-ink-muted">Subtotal {{ receiptItems.length }} Item:</span>
            <span class="text-xs font-bold text-ink">Rp {{ formatRupiah(itemsSubtotal) }}</span>
          </div>
        </div>

        <!-- Row Tambah Item Manual -->
        <div v-if="showAddItemRow" class="add-item-form mt-2 pt-2 border-t border-line">
          <div class="grid grid-cols-6 gap-1.5 mb-2">
            <input
              v-model="newItemName"
              placeholder="Nama barang..."
              class="col-span-3 text-xs p-2 rounded-lg border border-line bg-surface-2"
            />
            <input
              v-model.number="newItemQty"
              type="number"
              placeholder="Qty"
              min="1"
              class="col-span-1 text-xs p-2 rounded-lg border border-line bg-surface-2 text-center"
            />
            <input
              v-model.number="newItemPrice"
              type="number"
              placeholder="Harga (Rp)"
              class="col-span-2 text-xs p-2 rounded-lg border border-line bg-surface-2"
            />
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn-sm-primary flex-1" @click="addItem">Simpan Item</button>
            <button type="button" class="btn-sm-ghost" @click="showAddItemRow = false">Batal</button>
          </div>
        </div>

        <button
          v-else
          type="button"
          class="btn-add-item-toggle"
          @click="showAddItemRow = true"
        >
          + Tambah Item Manual
        </button>
      </div>
    </div>

    <!-- Raw text collapsible -->
    <div class="raw-text-section">
      <button class="raw-text-toggle" @click="rawTextExpanded = !rawTextExpanded">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline :points="rawTextExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
        </svg>
        {{ rawTextExpanded ? "Sembunyikan" : "Lihat" }} teks mentah OCR
      </button>
      <div v-if="rawTextExpanded" class="raw-text-box">
        <pre class="raw-text">{{ ocrResult?.rawText }}</pre>
      </div>
    </div>

    <!-- Action Buttons -->
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

  <!-- Error display -->
  <div v-if="error" class="scanner-error">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {{ error }}
    <button class="error-retry" @click="retake">Coba Lagi</button>
  </div>

  <!-- Modal Lightbox Zoom Foto -->
  <Teleport to="body">
    <div v-if="showImageModal" class="lightbox-overlay" @click="showImageModal = false">
      <div class="lightbox-content" @click.stop>
        <button class="lightbox-close" @click="showImageModal = false">✕</button>
        <img :src="uploadedReceiptUrl || previewUrl || ''" class="lightbox-img" alt="Foto Struk Penuh" />
        <div class="lightbox-footer">
          <p class="text-xs text-white opacity-80">Foto Struk Belanja</p>
          <a
            v-if="uploadedReceiptUrl"
            :href="uploadedReceiptUrl"
            target="_blank"
            rel="noopener"
            class="lightbox-link"
          >
            Buka File Asli ↗
          </a>
        </div>
      </div>
    </div>
  </Teleport>
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
  width: 68px; height: 68px;
  border-radius: 20px;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 4px 16px rgba(5,150,105,0.15);
}

.scanner-title {
  font-size: 18px; font-weight: 800;
  color: var(--ink);
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}

.scanner-desc {
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.5;
  margin: 0 0 18px;
  max-width: 320px;
}

.scanner-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-bottom: 20px;
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
  padding: 13px 16px;
  border-radius: 14px;
  background: var(--primary-gradient);
  color: white;
  font-weight: 800; font-size: 14.5px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: var(--shadow-btn);
  font-family: inherit;
  transition: opacity 0.2s, transform 0.15s;
}
.scan-btn-primary:hover { opacity: 0.92; }
.scan-btn-primary:active { transform: scale(0.98); }
.scan-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.scan-btn-secondary {
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  background: var(--surface-2);
  color: var(--primary);
  font-weight: 700; font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  transition: all 0.2s ease;
}
.scan-btn-secondary:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.scan-btn-ghost {
  width: 100%;
  padding: 11px;
  border-radius: 12px;
  border: 1.5px solid var(--line);
  background: transparent;
  color: var(--ink-muted);
  font-weight: 700; font-size: 13.5px;
  cursor: pointer;
  font-family: inherit;
}

/* ── Scanning phase ── */
.scanner-scanning {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 6px 0;
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
  opacity: 0.75;
}

.scan-preview-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  left: 0; right: 0;
  height: 2.5px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  animation: scanLine 1.5s ease-in-out infinite;
  box-shadow: 0 0 14px var(--primary);
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
  margin-bottom: 6px;
}

.scan-progress-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 99px;
  transition: width 0.3s ease;
}

.scan-progress-label {
  font-size: 12.5px; font-weight: 600;
  color: var(--ink-muted);
  margin: 0 0 2px;
  text-align: center;
}

.scan-progress-pct {
  font-size: 22px; font-weight: 900;
  color: var(--primary);
  margin: 0;
  text-align: center;
  letter-spacing: -0.5px;
}

.scan-status-pill {
  padding: 4px 12px;
  border-radius: 99px;
  background: var(--surface-2);
  border: 1px solid var(--line);
}

/* ── Result phase ── */
.scanner-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--income-soft);
  color: var(--income-text);
  font-size: 11.5px; font-weight: 800;
}

.result-warn-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--gold-soft);
  color: var(--gold);
  font-size: 11.5px; font-weight: 800;
}

.result-confidence {
  font-size: 11px; font-weight: 800;
  padding: 3px 8px;
  border-radius: 20px;
}

.storage-info-box {
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 8px 12px;
}

.storage-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.photo-preview-card {
  position: relative;
  width: 100%;
  height: 110px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--line);
  background: var(--surface-2);
}

.photo-preview-thumb {
  width: 100%; height: 100%;
  object-fit: cover;
}

.photo-preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.photo-preview-card:hover .photo-preview-overlay { opacity: 1; }

.photo-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.result-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.result-field-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px; font-weight: 800;
  color: var(--ink-muted);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.field-required { color: var(--expense); }

.result-input-wrap {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--surface-2);
  overflow: hidden;
}
.result-input-wrap:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.result-input-prefix {
  padding: 10px 12px;
  font-weight: 800; font-size: 13.5px;
  color: var(--ink-muted);
  background: var(--surface-3);
  border-right: 1.5px solid var(--line);
}

.result-input {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  font-size: 16px; font-weight: 800;
  color: var(--expense-text);
  outline: none;
  font-family: inherit;
}

.result-input--warn { color: var(--ink-muted); }

.result-input-date,
.result-input-text {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--line);
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--ink);
  font-size: 13.5px; font-weight: 600;
  outline: none;
  font-family: inherit;
}
.result-input-date:focus,
.result-input-text:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.field-hint {
  font-size: 11px; color: var(--expense-text);
  margin: 0; font-weight: 600;
}

/* ── Accordion Item Struk ── */
.items-dropdown-card {
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  overflow: hidden;
}

.items-dropdown-toggle {
  width: 100%;
  padding: 12px 14px;
  background: var(--surface-2);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: inherit;
}

.items-count-badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 99px;
  background: var(--primary-light);
  color: var(--primary);
}

.chevron-icon {
  color: var(--ink-muted);
  transition: transform 0.2s ease;
}
.chevron-icon.rotate-180 {
  transform: rotate(180deg);
}

.items-dropdown-content {
  padding: 12px 14px;
  border-top: 1px solid var(--line);
}

.empty-items-text {
  font-size: 12px;
  color: var(--ink-muted);
  line-height: 1.45;
  padding: 4px 0;
}

.receipt-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.receipt-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed var(--line);
}
.receipt-item-row:last-of-type {
  border-bottom: none;
}

.receipt-item-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}

.receipt-item-sub {
  font-size: 11px;
  color: var(--ink-muted);
  margin: 0;
}

.receipt-item-price {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
}

.item-delete-btn {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: none;
  background: var(--surface-3);
  color: var(--ink-muted);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-delete-btn:hover { background: var(--expense-soft); color: var(--expense); }

.items-summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1.5px solid var(--line);
}

.btn-add-item-toggle {
  width: 100%;
  padding: 6px;
  margin-top: 8px;
  border: 1px dashed var(--line);
  background: transparent;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
  font-family: inherit;
}
.btn-add-item-toggle:hover {
  background: var(--primary-light);
}

.btn-sm-primary {
  padding: 6px 10px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}
.btn-sm-ghost {
  padding: 6px 10px;
  background: var(--surface-2);
  color: var(--ink-muted);
  border: 1px solid var(--line);
  border-radius: 6px;
  font-size: 11.5px;
  cursor: pointer;
}

/* ── Raw Text ── */
.raw-text-section {
  border: 1.5px dashed var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.raw-text-toggle {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px; font-weight: 700;
  color: var(--ink-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
}

.raw-text-box {
  max-height: 120px;
  overflow-y: auto;
  border-top: 1.5px dashed var(--line);
  padding: 8px 12px;
}

.raw-text {
  font-size: 10px;
  line-height: 1.45;
  color: var(--ink-muted);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: monospace;
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
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--expense-soft);
  color: var(--expense-text);
  font-size: 12.5px; font-weight: 600;
  margin-top: 12px;
}

.error-retry {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--expense);
  color: white;
  border: none;
  font-size: 11.5px; font-weight: 700;
  cursor: pointer;
}

/* ── Lightbox Modal ── */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.88);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(6px);
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lightbox-img {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.lightbox-link {
  font-size: 11.5px;
  color: var(--primary-light);
  text-decoration: underline;
}
</style>

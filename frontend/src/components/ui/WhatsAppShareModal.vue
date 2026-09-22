<script setup lang="ts">
import { ref, computed } from "vue";
import type { MonthlySummary, Transaction } from "@/types";
import {
  generateDetailedWhatsAppReport,
  generateSimpleWhatsAppReport,
  buildWhatsAppUrl,
  sanitizePhoneNumber,
} from "@/utils/whatsappReport";

const props = defineProps<{
  show: boolean;
  userName?: string;
  monthLabel: string;
  summary: MonthlySummary | null;
  topExpenses?: Transaction[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const reportMode = ref<"detailed" | "simple">("detailed");
const targetPhone = ref("");
const copied = ref(false);

const generatedMessage = computed(() => {
  if (!props.summary) return "";
  const opts = {
    userName: props.userName,
    monthLabel: props.monthLabel,
    summary: props.summary,
    topExpenses: props.topExpenses || [],
  };
  return reportMode.value === "detailed"
    ? generateDetailedWhatsAppReport(opts)
    : generateSimpleWhatsAppReport(opts);
});

async function copyToClipboard() {
  if (!generatedMessage.value) return;
  try {
    await navigator.clipboard.writeText(generatedMessage.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2500);
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = generatedMessage.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2500);
  }
}

function sendToWhatsApp() {
  if (!generatedMessage.value) return;
  const url = buildWhatsAppUrl(generatedMessage.value, targetPhone.value);
  window.open(url, "_blank");
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-[520px] bg-surface rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-line animate-slide-up overflow-hidden"
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 border-b border-line flex items-center justify-between bg-surface sticky top-0 z-10">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
            <!-- WhatsApp Icon -->
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.787-3.119-2.73-3.214-2.857-.095-.128-.771-1.025-.771-1.954 0-.928.487-1.385.66-1.574.173-.189.378-.236.504-.236.126 0 .252.001.362.007.116.006.27-.044.423.323.16.38.544 1.325.592 1.422.048.096.08.209.016.335-.064.126-.096.205-.192.316-.096.112-.202.25-.288.336-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.332.734.655 1.353.858 1.545.954.192.096.305.08.417-.048.112-.128.481-.56.609-.752.128-.192.256-.16.433-.096.176.064 1.122.529 1.314.625.192.096.32.144.368.224.048.08.048.464-.096.869z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.468-1.28l-.32-.2-2.956.776.789-2.883-.21-.334A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.522 0 8.2 3.679 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-[16px] text-ink">Kirim Laporan via WhatsApp</h3>
            <p class="text-[12px] text-ink-muted">Format pesan rapi dan siap bagikan</p>
          </div>
        </div>
        <button
          class="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
          @click="emit('close')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="p-5 overflow-y-auto space-y-4 flex-1">
        <!-- Opsi Format Pesan -->
        <div>
          <label class="text-[12px] font-semibold text-ink-muted block mb-2">PILIH FORMAT LAPORAN</label>
          <div class="grid grid-cols-2 gap-2 p-1 bg-surface-2 rounded-xl border border-line">
            <button
              class="py-2 px-3 rounded-lg text-[13px] font-semibold transition-all text-center flex items-center justify-center gap-1.5"
              :class="reportMode === 'detailed' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'"
              @click="reportMode = 'detailed'"
            >
              <span>📑</span> Laporan Lengkap
            </button>
            <button
              class="py-2 px-3 rounded-lg text-[13px] font-semibold transition-all text-center flex items-center justify-center gap-1.5"
              :class="reportMode === 'simple' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'"
              @click="reportMode = 'simple'"
            >
              <span>⚡</span> Ringkasan Cepat
            </button>
          </div>
        </div>

        <!-- Nomor WhatsApp Tujuan (Opsional) -->
        <div>
          <label class="text-[12px] font-semibold text-ink-muted block mb-1.5">
            NOMOR TUJUAN <span class="font-normal text-ink-muted/70">(Opsional)</span>
          </label>
          <div class="relative">
            <input
              v-model="targetPhone"
              type="tel"
              placeholder="Contoh: 081234567890 (kosongkan untuk pilih kontak)"
              class="w-full text-[13px] bg-surface-2 border border-line rounded-xl px-3.5 py-2.5 text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-primary transition-colors"
            />
            <span v-if="targetPhone" class="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] px-2 py-0.5 rounded bg-surface border border-line text-ink-muted">
              +{{ sanitizePhoneNumber(targetPhone) }}
            </span>
          </div>
          <p class="text-[11px] text-ink-muted mt-1">
            Jika dikosongkan, WhatsApp akan meminta Anda memilih kontak tujuan saat terbuka.
          </p>
        </div>

        <!-- WhatsApp Chat Bubble Simulation Preview -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[12px] font-semibold text-ink-muted">PRATINJAU PESAN WHATSAPP</label>
            <span class="text-[11px] text-ink-muted">Format WhatsApp Markdown</span>
          </div>

          <!-- WhatsApp Chat Box Style -->
          <div
            class="rounded-2xl p-4 border border-[#25D366]/20 relative overflow-hidden"
            style="background: #efeae2;"
          >
            <!-- Pattern wallpaper subtle tint -->
            <div
              class="bg-white rounded-xl p-3.5 shadow-sm text-[12.5px] leading-relaxed text-[#111b21] max-h-[220px] overflow-y-auto whitespace-pre-wrap font-sans select-text border border-black/5"
              style="border-top-left-radius: 4px;"
            >
              {{ generatedMessage }}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer (Actions) -->
      <div class="p-4 border-t border-line bg-surface flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          class="flex-1 py-3 px-4 rounded-xl border border-line font-bold text-[13.5px] text-ink bg-surface-2 hover:bg-surface transition-all flex items-center justify-center gap-2"
          @click="copyToClipboard"
        >
          <svg v-if="!copied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dbe7e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span :class="copied ? 'text-[#2dbe7e]' : ''">
            {{ copied ? 'Tersalin ke Clipboard!' : 'Salin Teks Laporan' }}
          </span>
        </button>

        <button
          type="button"
          class="flex-1 py-3 px-4 rounded-xl font-bold text-[13.5px] text-white shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          style="background: #25D366;"
          @click="sendToWhatsApp"
        >
          <!-- WhatsApp Icon -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.18-.544-1.898-.787-3.119-2.73-3.214-2.857-.095-.128-.771-1.025-.771-1.954 0-.928.487-1.385.66-1.574.173-.189.378-.236.504-.236.126 0 .252.001.362.007.116.006.27-.044.423.323.16.38.544 1.325.592 1.422.048.096.08.209.016.335-.064.126-.096.205-.192.316-.096.112-.202.25-.288.336-.096.096-.197.2-.085.392.112.193.498.822 1.069 1.332.734.655 1.353.858 1.545.954.192.096.305.08.417-.048.112-.128.481-.56.609-.752.128-.192.256-.16.433-.096.176.064 1.122.529 1.314.625.192.096.32.144.368.224.048.08.048.464-.096.869z"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.468-1.28l-.32-.2-2.956.776.789-2.883-.21-.334A8.163 8.163 0 0 1 3.8 12c0-4.521 3.679-8.2 8.2-8.2 4.522 0 8.2 3.679 8.2 8.2 0 4.522-3.678 8.2-8.2 8.2z"/>
          </svg>
          Buka di WhatsApp
        </button>
      </div>
    </div>
  </div>
</template>

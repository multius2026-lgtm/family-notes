/**
 * useReceiptOcr.ts
 * Composable untuk OCR struk belanja menggunakan Tesseract.js (lokal, gratis)
 * 
 * Flow:
 *  1. Foto/upload gambar struk
 *  2. Pre-process gambar (grayscale, contrast boost)
 *  3. Tesseract OCR → teks mentah
 *  4. Parse: total, tanggal, nama toko
 *  5. Confidence check → jelas (auto-fill) atau tidak jelas (tampilkan ke user)
 */

import { ref } from "vue";
import Tesseract from "tesseract.js";

export interface OcrResult {
  rawText: string;
  storeName: string | null;
  total: number | null;
  date: string | null;        // format YYYY-MM-DD
  confidence: number;         // 0–100
  isConfident: boolean;       // true jika confidence >= threshold
}

const CONFIDENCE_THRESHOLD = 55; // % minimum untuk auto-fill

/** Pre-process gambar: grayscale + contrast untuk meningkatkan akurasi OCR */
function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1800;
        let w = img.width;
        let h = img.height;
        // Resize jika terlalu besar
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
          else { w = Math.round((w * MAX) / h); h = MAX; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, w, h);

        // Grayscale + contrast boost
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale (luminance)
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Contrast: stretch ke 0–255 dengan faktor 1.4
          const contrast = Math.min(255, Math.max(0, (lum - 128) * 1.4 + 128));
          data[i] = data[i + 1] = data[i + 2] = contrast;
          // alpha tetap
        }
        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Cari total/grand total dari teks struk */
function parseTotal(text: string): number | null {
  // Pattern yang umum di struk Indonesia:
  // "TOTAL", "GRAND TOTAL", "JUMLAH", "TOTAL BAYAR", "SUBTOTAL", "TAGIHAN"
  const patterns = [
    /(?:grand\s*total|total\s*bayar|total\s*tagihan|total\s*pembayaran|total\s*belanja|total)\s*[:\s|]*(?:rp\.?\s*)?([\d.,]+)/gi,
    /(?:jumlah|tagihan|bayar)\s*[:\s|]*(?:rp\.?\s*)?([\d.,]+)/gi,
    /(?:rp|idr)\s*([\d.,]{4,})/gi,
  ];

  let bestAmount: number | null = null;
  let bestLen = 0;

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[1].replace(/\./g, "").replace(/,/g, "");
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 100 && num < 100_000_000) {
        // Ambil yang paling besar (kemungkinan grand total)
        if (num > bestLen) {
          bestLen = num;
          bestAmount = num;
        }
      }
    }
  }

  return bestAmount;
}

/** Cari tanggal dari teks struk */
function parseDate(text: string): string | null {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Format: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
    /(\d{1,2})\s+(?:jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)[a-z]*\.?\s+(\d{4})/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      try {
        let year: number, month: number, day: number;
        if (p.source.startsWith("(\\d{4})")) {
          // YYYY-MM-DD
          year = parseInt(m[1]); month = parseInt(m[2]); day = parseInt(m[3]);
        } else if (m[3] && m[3].length === 4) {
          // DD/MM/YYYY
          day = parseInt(m[1]); month = parseInt(m[2]); year = parseInt(m[3]);
        } else {
          // DD MMM YYYY
          day = parseInt(m[1]);
          const monthNames: Record<string, number> = {
            jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6,
            jul: 7, agu: 8, sep: 9, okt: 10, nov: 11, des: 12
          };
          const mName = m[0].match(/[a-z]+/i)?.[0]?.toLowerCase().slice(0, 3) || "";
          month = monthNames[mName] || 0;
          year = parseInt(m[2]);
        }
        if (year < 2000 || year > 2099) continue;
        if (month < 1 || month > 12) continue;
        if (day < 1 || day > 31) continue;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        // Jangan return tanggal masa depan
        if (dateStr <= todayStr) return dateStr;
      } catch {
        continue;
      }
    }
  }

  return null;
}

/** Cari nama toko dari teks struk */
function parseStoreName(text: string): string | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 60);

  if (lines.length === 0) return null;

  // Baris pertama 1-3 baris biasanya nama toko
  // Filter baris yang tidak mengandung angka atau keyword kasir
  const skipWords = /total|jumlah|bayar|kasir|kwitansi|nota|receipt|invoice|struk|rp|idr|\d{5,}/i;
  const candidates = lines.slice(0, 5).filter((l) => !skipWords.test(l));

  if (candidates.length > 0) {
    // Ambil baris yang paling mungkin nama toko (panjang 3-40 karakter)
    const best = candidates.find((l) => l.length >= 3 && l.length <= 40);
    return best ? best.replace(/[^a-zA-Z0-9\s\-&.']/g, "").trim() : null;
  }

  return null;
}

export function useReceiptOcr() {
  const scanning = ref(false);
  const progress = ref(0);
  const progressLabel = ref("");
  const error = ref<string | null>(null);
  const result = ref<OcrResult | null>(null);

  async function scanReceipt(file: File): Promise<OcrResult | null> {
    scanning.value = true;
    progress.value = 0;
    progressLabel.value = "Mempersiapkan gambar...";
    error.value = null;
    result.value = null;

    try {
      // Step 1: Pre-process gambar
      progressLabel.value = "Memproses gambar...";
      progress.value = 10;
      const processedDataUrl = await preprocessImage(file);

      // Step 2: OCR dengan Tesseract
      progressLabel.value = "Mengenali teks...";
      progress.value = 20;

      const ocrResult = await Tesseract.recognize(processedDataUrl, "ind+eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            progress.value = 20 + Math.round(m.progress * 70);
            progressLabel.value = `Menganalisis teks... ${Math.round(m.progress * 100)}%`;
          }
        },
      });

      progress.value = 90;
      progressLabel.value = "Mengekstrak data...";

      const rawText = ocrResult.data.text;
      const confidence = Math.round(ocrResult.data.confidence);

      // Step 3: Parse
      const total = parseTotal(rawText);
      const date = parseDate(rawText);
      const storeName = parseStoreName(rawText);

      // Step 4: Hitung apakah confident
      // Confident = Tesseract confidence >= threshold DAN total berhasil ditemukan
      const isConfident = confidence >= CONFIDENCE_THRESHOLD && total !== null;

      const ocrResultObj: OcrResult = {
        rawText,
        storeName,
        total,
        date,
        confidence,
        isConfident,
      };

      progress.value = 100;
      progressLabel.value = "Selesai!";
      result.value = ocrResultObj;

      return ocrResultObj;
    } catch (e: any) {
      error.value = e?.message || "Gagal memproses gambar struk.";
      return null;
    } finally {
      scanning.value = false;
    }
  }

  function reset() {
    scanning.value = false;
    progress.value = 0;
    progressLabel.value = "";
    error.value = null;
    result.value = null;
  }

  return {
    scanning,
    progress,
    progressLabel,
    error,
    result,
    scanReceipt,
    reset,
  };
}

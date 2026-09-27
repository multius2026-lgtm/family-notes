/**
 * useReceiptOcr.ts
 * Composable untuk OCR struk belanja menggunakan Tesseract.js (lokal, gratis)
 *
 * Flow:
 *  1. Foto/upload gambar struk
 *  2. Pre-process gambar (grayscale, contrast boost)
 *  3. Tesseract OCR → teks mentah
 *  4. Parse: total, tanggal, nama toko, item, diskon
 *  5. Confidence check → jelas (auto-fill) atau tidak jelas (tampilkan ke user)
 *
 * PERBAIKAN dari versi sebelumnya:
 *  - ReceiptItem sekarang punya `price` (subtotal baris = qty x satuan) DAN
 *    `unitPrice` (harga satuan) terpisah. Sebelumnya `price` diisi dari
 *    harga TOTAL baris tapi ditampilkan seolah-olah harga satuan, sehingga
 *    "qty x harga" yang muncul di UI salah (menampilkan qty x total, bukan
 *    qty x satuan).
 *  - Baris diskon/potongan (format "NAMA ... (10,000)") yang sebelumnya
 *    dibuang begitu saja sekarang ditangkap sebagai `discounts[]` terpisah,
 *    lengkap dengan `subtotal` (HARGA JUAL) sebelum diskon.
 *  - `parseQtyUnitTotalLine` dibuat lebih toleran terhadap noise OCR
 *    (misal tanda baca ganda / spasi ganda dari hasil scan yang kurang bersih).
 */

import { ref } from "vue";
import Tesseract from "tesseract.js";

export interface ReceiptItem {
  name: string;
  /** Subtotal baris (qty x unitPrice), ATAU harga item jika qty tidak terdeteksi */
  price: number | null;
  /** Harga satuan per item. Gunakan ini untuk menampilkan "qty x harga satuan" */
  unitPrice?: number | null;
  qty?: number;
}

export interface ReceiptDiscount {
  label: string;
  /** Nilai diskon dalam bentuk positif (mengurangi subtotal) */
  amount: number;
}

export interface OcrResult {
  rawText: string;
  storeName: string | null;
  /** Subtotal sebelum diskon (baris "HARGA JUAL"), jika ada */
  subtotal: number | null;
  discounts: ReceiptDiscount[];
  total: number | null;
  date: string | null; // format YYYY-MM-DD
  confidence: number; // 0–100
  isConfident: boolean; // true jika confidence >= threshold
  items: ReceiptItem[]; // daftar rincian item struk
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
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
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

function parseMoneyToken(raw: string): number | null {
  const token = raw.trim().replace(/[()]/g, "");
  if (!token) return null;
  // 22.600 / 22,600 / 22.600,00 → ribuan Indonesia
  if (/^\d{1,3}([.,]\d{3})+$/.test(token)) {
    const num = parseInt(token.replace(/[.,]/g, ""), 10);
    return Number.isFinite(num) ? num : null;
  }
  const digits = token.replace(/[^\d]/g, "");
  if (!digits) return null;
  const num = parseInt(digits, 10);
  return Number.isFinite(num) ? num : null;
}

/** Cari total/grand total dari teks struk */
function parseTotal(text: string): number | null {
  const preferred = [
    /(?:grand\s*total|total\s*bayar|total\s*tagihan|total\s*pembayaran|total\s*belanja)\s*[:\s|=]*(?:rp\.?\s*)?([\d.,]+)/gi,
    /(?:^|\n)\s*total\s*[:\s|=]+(?:rp\.?\s*)?([\d.,]+)/gim,
  ];
  for (const pattern of preferred) {
    let match: RegExpExecArray | null;
    let last: number | null = null;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseMoneyToken(match[1]);
      if (num && num > 100 && num < 100_000_000) last = num;
    }
    if (last) return last;
  }

  const fallback = [/(?:jumlah|tagihan|bayar)\s*[:\s|=]*(?:rp\.?\s*)?([\d.,]+)/gi];
  let bestAmount: number | null = null;
  for (const pattern of fallback) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const num = parseMoneyToken(match[1]);
      if (num && num > 100 && num < 100_000_000) {
        if (bestAmount === null || num > bestAmount) bestAmount = num;
      }
    }
  }
  return bestAmount;
}

/** Cari subtotal ("HARGA JUAL") sebelum diskon, jika struk mencantumkannya */
function parseSubtotal(text: string): number | null {
  const pattern = /harga\s*jual\s*[:\s|=]*(?:rp\.?\s*)?([\d.,]+)/i;
  const m = text.match(pattern);
  if (!m) return null;
  return parseMoneyToken(m[1]);
}

/**
 * Cari baris diskon/potongan, format umum di struk minimarket:
 *   "V/C BABY HAPY PANTS 30/L/SAYAP   (10,000)"
 * yaitu label diikuti angka negatif dalam kurung.
 * Diambil dari area antara "HARGA JUAL" dan "TOTAL".
 */
function parseDiscounts(text: string): ReceiptDiscount[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const startIdx = lines.findIndex((l) => /harga\s*jual/i.test(l));
  let endIdx = lines.findIndex(
    (l, idx) => idx > (startIdx < 0 ? 0 : startIdx) && /^\s*total\b/i.test(l)
  );
  if (startIdx < 0) return [];
  if (endIdx < 0) endIdx = lines.length;

  const section = lines.slice(startIdx + 1, endIdx);
  const discounts: ReceiptDiscount[] = [];

  const discountLineRe = /^(.*?)[:\s]+\(\s*([\d.,]+)\s*\)\s*$/;
  for (const line of section) {
    const m = line.match(discountLineRe);
    if (!m) continue;
    const amount = parseMoneyToken(m[2]);
    if (amount == null || amount <= 0) continue;
    const label = m[1].replace(/[^a-zA-Z0-9\s\-&./%']/g, " ").replace(/\s+/g, " ").trim();
    if (!label) continue;
    discounts.push({ label, amount });
  }
  return discounts;
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
          year = parseInt(m[1]);
          month = parseInt(m[2]);
          day = parseInt(m[3]);
        } else if (m[3] && m[3].length === 4) {
          // DD/MM/YYYY
          day = parseInt(m[1]);
          month = parseInt(m[2]);
          year = parseInt(m[3]);
        } else {
          // DD MMM YYYY
          day = parseInt(m[1]);
          const monthNames: Record<string, number> = {
            jan: 1,
            feb: 2,
            mar: 3,
            apr: 4,
            mei: 5,
            jun: 6,
            jul: 7,
            agu: 8,
            sep: 9,
            okt: 10,
            nov: 11,
            des: 12,
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

const ITEM_STOP_RE =
  /^(harga\s*jual|grand\s*total|total\s*bayar|total\s*tagihan|total\s*pembayaran|total\s*belanja|\s*total\b|subtotal|tunai|kembali|kembalian|anda\s*hemat|ppn\b|dpp\b)/i;

const LOCATION_HINT_RE =
  /\b(kel\.?|kec\.?|kab\.?|kota|desa|jl\.?|jalan|alamat|kode\s*pos|rt\.?\/?rw\.?|madiun|ponorogo|pagotan|geger|uteran|jakarta|surabaya|bandung|semarang|yogya|yogyakarta|malang|bekasi|depok|tangerang|bogor|medan|makassar|denpasar|palembang)\b/i;

const NON_PRODUCT_NAME_RE =
  /^(npwp|pkp|ppn|dpp|total|tunai|kembali|kasir|member|struk|nota|invoice|kwitansi|indomaret|alfamart|indogrosir|superindo|sms|call|kontak|layanan|konsumen|whatsapp|pagotan|madiun|ponorogo)\b/i;

function isReceiptMetaLine(line: string): boolean {
  const lower = line.toLowerCase().replace(/\s+/g, " ").trim();
  if (!lower) return true;
  if (/^[=\-_*.:#\s]{3,}$/.test(line)) return true;

  const metaSnippets = [
    "grand total",
    "total bayar",
    "harga jual",
    "subtotal",
    "sub total",
    "kembalian",
    "kembali",
    "tunai",
    "cash",
    "debit",
    "kredit",
    "credit",
    "anda hemat",
    "hemat",
    "diskon",
    "discount",
    "potongan",
    "promo",
    "voucher",
    "poin",
    "ppn",
    "dpp",
    "pajak",
    "tax",
    "pb1",
    "biaya layanan",
    "kasir",
    "cashier",
    "operator",
    "struk",
    "receipt",
    "nota",
    "invoice",
    "kwitansi",
    "tanggal",
    "waktu",
    "jam ",
    "member",
    "npwp",
    "pkp",
    "terima kasih",
    "thank you",
    "selamat datang",
    "welcome",
    "layanan konsumen",
    "call center",
    "call ",
    "kontak",
    "hotline",
    "whatsapp",
    "website",
    "http",
    "www.",
    ".co.id",
    ".com",
    "@",
    "kode pos",
    "kelurahan",
    "kecamatan",
    "kabupaten",
    "terminal",
    "merchant",
    "cabang",
  ];
  if (metaSnippets.some((kw) => lower.includes(kw))) return true;
  if (LOCATION_HINT_RE.test(line)) return true;
  if (/\bno\.?\s*\d/i.test(line) && /\b(jl\.?|jalan|kel|kec|kab)\b/i.test(line)) return true;
  if (/\b(utara|selatan|timur|barat|tengah)\b/i.test(line) && line.split(/\s+/).length <= 4 && !/\d{4,}/.test(line)) {
    return true;
  }

  // Satu token 10+ digit = NPWP / telepon / ID, bukan harga item
  const longIdToken = line.split(/\s+/).some((tok) => tok.replace(/\D/g, "").length >= 10);
  if (longIdToken) return true;

  if (/\b0\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,6}\b/.test(line)) return true;
  if (/\b(?:62)?8\d{7,11}\b/.test(line.replace(/[\s.-]/g, ""))) return true;
  if (/\b15\d{2}[\s.-]?\d{3,4}\b/.test(line)) return true;
  if (/\b0?3\d{8,10}\b/.test(line.replace(/[\s.-]/g, ""))) return true;
  if (/\bsms\b/i.test(line)) return true;

  if (/\d{1,2}[./]\d{1,2}[./]\d{2,4}.*\d{1,2}:\d{2}/.test(line)) return true;
  if ((line.match(/\//g) || []).length >= 2 && /\d/.test(line)) return true;
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(line)) return true;

  return false;
}

function isGarbagePrice(price: number): boolean {
  if (!Number.isFinite(price) || price < 100) return true;
  if (price >= 100_000_000) return true;
  return String(Math.round(price)).length >= 9;
}

function isLikelyProductName(name: string): boolean {
  const n = name.replace(/\s+/g, " ").trim();
  if (n.length < 3 || n.length > 80) return false;
  if (!/[a-zA-Z]{3,}/.test(n)) return false;
  if (NON_PRODUCT_NAME_RE.test(n) || LOCATION_HINT_RE.test(n)) return false;
  if (isReceiptMetaLine(n)) return false;
  const letters = (n.match(/[a-zA-Z]/g) || []).length;
  const digits = (n.match(/\d/g) || []).length;
  if (digits > letters * 2 && letters < 6) return false;
  return true;
}

function looksLikePostalCodePrice(name: string, price: number): boolean {
  const s = String(Math.round(price));
  if (!/^[1-9]\d{4}$/.test(s)) return false;
  if (LOCATION_HINT_RE.test(name)) return true;
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length <= 2 && !/\d/.test(name) && name.length <= 24) return true;
  return false;
}

/**
 * Parsing baris format "qty x harga_satuan = harga_total" ala Indomaret/Alfamart:
 *   "MOGU MOGU CCONUT 320   2   11300   22.600"
 * PENTING: `price` di ReceiptItem yang dikembalikan = subtotal (qty x satuan),
 * dan `unitPrice` = harga satuan asli. Sebelumnya field `unitPrice` tidak ada
 * sehingga UI yang menampilkan "qty x price" salah menampilkan qty x subtotal.
 */
function parseQtyUnitTotalLine(line: string): ReceiptItem | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 4) return null;

  const totalTok = tokens[tokens.length - 1].replace(/[()]/g, "");
  const unitTok = tokens[tokens.length - 2].replace(/[()]/g, "");
  const qtyTok = tokens[tokens.length - 3];
  if (!/^\d{1,3}$/.test(qtyTok)) return null;

  const qty = parseInt(qtyTok, 10);
  const unit = parseMoneyToken(unitTok);
  const total = parseMoneyToken(totalTok);
  if (qty < 1 || qty > 99 || unit == null || total == null) return null;
  if (isGarbagePrice(unit) || isGarbagePrice(total)) return null;
  if (unit < 100 || total < 100 || total > 50_000_000) return null;

  const expected = qty * unit;
  if (Math.abs(expected - total) > Math.max(200, Math.round(unit * 0.05))) return null;

  const name = tokens
    .slice(0, -3)
    .join(" ")
    .replace(/[^a-zA-Z0-9\s\-&./+%']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!isLikelyProductName(name)) return null;

  return {
    name,
    price: total, // subtotal baris (qty x satuan)
    unitPrice: unit, // harga satuan — gunakan ini untuk tampilan "qty x harga"
    qty: qty > 1 ? qty : undefined,
  };
}

function isLooseProductPriceLine(line: string): boolean {
  const priceMatch = line.match(/^(.*?)(?:[\s:|=]+)(?:rp\.?\s*)?([\d.,]{3,})$/i);
  if (!priceMatch) return false;
  const rawName = priceMatch[1].replace(/^[0-9\s\-.*#]+/, "").trim();
  const priceNum = parseMoneyToken(priceMatch[2]);
  return (
    isLikelyProductName(rawName) &&
    priceNum != null &&
    !isGarbagePrice(priceNum) &&
    !looksLikePostalCodePrice(rawName, priceNum)
  );
}

/** Cari daftar rincian barang/item belanja dari teks struk */
export function parseReceiptItems(text: string): ReceiptItem[] {
  const allLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);

  let start = allLines.findIndex((l) => /^[=\-_*]{4,}/.test(l) || /^-+$/.test(l));
  if (start < 0) start = 0;
  else start += 1;

  let end = allLines.findIndex((l, idx) => idx >= start && ITEM_STOP_RE.test(l));
  if (end < 0) end = allLines.length;

  const windowLines = allLines.slice(start, end);
  const firstProduct = windowLines.findIndex(
    (l) => !isReceiptMetaLine(l) && (parseQtyUnitTotalLine(l) != null || isLooseProductPriceLine(l))
  );
  const lines = firstProduct >= 0 ? windowLines.slice(firstProduct) : [];

  const items: ReceiptItem[] = [];
  const seen = new Set<string>();

  function pushItem(item: ReceiptItem) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return;
    if (!isLikelyProductName(item.name)) return;
    if (item.price != null && (isGarbagePrice(item.price) || looksLikePostalCodePrice(item.name, item.price))) return;
    seen.add(key);
    items.push(item);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isReceiptMetaLine(line)) continue;
    if (/^\(.*\)$/.test(line) || /\(\s*[\d.,]+\s*\)/.test(line)) continue; // baris diskon ditangani parseDiscounts()
    if (/^c\s+/i.test(line) && /\d/.test(line)) continue;

    const structured = parseQtyUnitTotalLine(line);
    if (structured) {
      pushItem(structured);
      continue;
    }

    let qty: number | undefined;
    let cleanLine = line;
    const qtyMatch = cleanLine.match(/^(\d{1,2})\s*(?:x|pcs|bh|btl|ptg|pack)\s+(.*)/i);
    if (qtyMatch) {
      const q = parseInt(qtyMatch[1], 10);
      if (q > 0 && q <= 99) {
        qty = q;
        cleanLine = qtyMatch[2].trim();
      }
    }

    const priceMatch = cleanLine.match(/^(.*?)(?:[\s:|=]+)(?:rp\.?\s*)?([\d.,]{3,})$/i);
    if (priceMatch) {
      const rawName = priceMatch[1].replace(/^[0-9\s\-.*#]+/, "").trim();
      const priceNum = parseMoneyToken(priceMatch[2]);
      if (
        isLikelyProductName(rawName) &&
        priceNum != null &&
        !isGarbagePrice(priceNum) &&
        priceNum >= 500 &&
        priceNum <= 50_000_000 &&
        !looksLikePostalCodePrice(rawName, priceNum)
      ) {
        const cleanName = rawName.replace(/[^a-zA-Z0-9\s\-&./+%']/g, " ").replace(/\s+/g, " ").trim();
        if (cleanName) {
          // Baris tanpa qty eksplisit: total baris == harga satuan (qty dianggap 1)
          pushItem({
            name: cleanName,
            price: priceNum,
            unitPrice: qty && qty > 1 ? Math.round(priceNum / qty) : priceNum,
            qty: qty && qty > 1 ? qty : undefined,
          });
          continue;
        }
      }
    }

    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (isReceiptMetaLine(nextLine)) continue;
      const subPriceMatch = nextLine.match(/^(?:(\d{1,2})\s*(?:x|pcs)\s*)?(?:rp\.?\s*)?([\d.,]{3,})$/i);
      if (subPriceMatch && isLikelyProductName(line)) {
        const nextPrice = parseMoneyToken(subPriceMatch[2]);
        if (nextPrice != null && !isGarbagePrice(nextPrice) && nextPrice >= 500 && nextPrice <= 50_000_000) {
          const cleanName = line.replace(/[^a-zA-Z0-9\s\-&./+%']/g, " ").replace(/\s+/g, " ").trim();
          if (cleanName && !looksLikePostalCodePrice(cleanName, nextPrice)) {
            const nextQty = subPriceMatch[1] ? parseInt(subPriceMatch[1], 10) : undefined;
            pushItem({
              name: cleanName,
              price: nextPrice,
              unitPrice: nextQty && nextQty > 1 ? Math.round(nextPrice / nextQty) : nextPrice,
              qty: nextQty && nextQty > 1 ? nextQty : undefined,
            });
            i++;
          }
        }
      }
    }
  }

  return items;
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
      const subtotal = parseSubtotal(rawText);
      const discounts = parseDiscounts(rawText);
      const date = parseDate(rawText);
      const storeName = parseStoreName(rawText);
      const items = parseReceiptItems(rawText);

      // Step 4: Hitung apakah confident
      // Confident = Tesseract confidence >= threshold DAN total berhasil ditemukan
      const isConfident = confidence >= CONFIDENCE_THRESHOLD && total !== null;

      const ocrResultObj: OcrResult = {
        rawText,
        storeName,
        subtotal,
        discounts,
        total,
        date,
        confidence,
        isConfident,
        items,
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
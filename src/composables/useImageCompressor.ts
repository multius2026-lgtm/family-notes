/**
 * useImageCompressor.ts
 * Kompresi gambar lokal menggunakan Canvas API (tanpa library eksternal, hemat memori).
 * Mengubah gambar kamera/galeri resolusi tinggi menjadi JPEG kecil berkualitas optimal
 * sebelum di-upload ke Supabase Storage.
 */

export interface CompressOptions {
  /** Lebar/tinggi maksimum (px). Default 1024 */
  maxSize?: number;
  /** Kualitas JPEG (0–1). Default 0.72 */
  quality?: number;
  /** Output format. Default image/jpeg */
  mimeType?: "image/jpeg" | "image/webp";
}

export interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  dataUrl: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Kompres File/Blob/DataURL gambar menjadi Blob kecil.
 * Resize otomatis jika melebihi maxSize, lalu re-encode dengan kompresi JPEG.
 */
export async function compressImage(
  source: File | Blob | string,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const { maxSize = 1024, quality = 0.72, mimeType = "image/jpeg" } = options;

  let originalSize = 0;
  let sourceUrl = "";
  let shouldRevoke = false;

  if (typeof source === "string") {
    sourceUrl = source;
    // Estimasi ukuran dari base64
    originalSize = Math.round((source.length * 3) / 4);
  } else {
    originalSize = source.size;
    sourceUrl = URL.createObjectURL(source);
    shouldRevoke = true;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        // Hitung rasio resize jika lebih besar dari maxSize
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = Math.round((h * maxSize) / w);
            w = maxSize;
          } else {
            w = Math.round((w * maxSize) / h);
            h = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          if (shouldRevoke) URL.revokeObjectURL(sourceUrl);
          return reject(new Error("Canvas 2D context tidak tersedia"));
        }

        // Gambar ulang dengan kualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (shouldRevoke) URL.revokeObjectURL(sourceUrl);
            if (!blob) return reject(new Error("Gagal membuat blob gambar terkompresi"));

            const compressedSize = blob.size;
            const savedPercent = originalSize > 0
              ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
              : 0;

            resolve({
              blob,
              originalSize,
              compressedSize,
              savedPercent,
              dataUrl,
            });
          },
          mimeType,
          quality
        );
      } catch (err) {
        if (shouldRevoke) URL.revokeObjectURL(sourceUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      if (shouldRevoke) URL.revokeObjectURL(sourceUrl);
      reject(new Error("Gagal memuat gambar untuk kompresi"));
    };

    img.src = sourceUrl;
  });
}

export interface UploadReceiptResult {
  url: string | null;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
  savedPercent?: number;
}

/**
 * Upload gambar struk ke Supabase Storage (bucket 'receipt-images')
 * secara otomatis mengompresi gambar terlebih dahulu agar ukurannya kecil.
 */
export async function uploadReceiptToStorage(
  supabase: any,
  file: File | Blob,
  userId: string
): Promise<UploadReceiptResult> {
  try {
    // 1. Kompres gambar (target ≤ 1024px, JPEG 72%)
    const compressed = await compressImage(file, { maxSize: 1024, quality: 0.72 });

    // 2. Buat nama file unik: userId/timestamp_random.jpg
    const ext = "jpg";
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${userId}/${Date.now()}_${randomSuffix}.${ext}`;

    // 3. Upload file yang sudah dikompresi ke Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("receipt-images")
      .upload(fileName, compressed.blob, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadReceipt] Supabase storage upload error:", uploadError.message);
      return {
        url: null,
        error: uploadError.message,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
      };
    }

    // 4. Dapatkan URL publik file
    const { data } = supabase.storage
      .from("receipt-images")
      .getPublicUrl(fileName);

    return {
      url: data?.publicUrl ?? null,
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
      savedPercent: compressed.savedPercent,
    };
  } catch (e: any) {
    console.error("[uploadReceipt] Exception:", e?.message);
    return {
      url: null,
      error: e?.message || "Terjadi kesalahan saat memproses gambar",
    };
  }
}

import { Elysia } from "elysia";

// Error handler terpusat: memastikan semua error (validasi Zod, error
// manual `throw new Error(...)`, error tak terduga) selalu keluar sebagai
// JSON konsisten `{ error: string }`, bukan HTML default atau stack trace
// yang bocor ke client.
export const errorMiddleware = new Elysia({ name: "error-middleware" }).onError(({ code, error, set }) => {
  if (code === "VALIDATION") {
    set.status = 400;
    return { error: "Data yang dikirim tidak valid.", details: error.message };
  }

  if (code === "NOT_FOUND") {
    set.status = 404;
    return { error: "Data tidak ditemukan." };
  }

  // set.status sudah di-set manual (mis. 401 di auth middleware) sebelum throw
  const status = typeof set.status === "number" ? set.status : 500;
  if (status === 500) {
    console.error("Unhandled error:", error);
  }

  return { error: error instanceof Error ? error.message : "Terjadi kesalahan pada server." };
});

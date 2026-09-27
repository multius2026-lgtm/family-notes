import { z } from "zod";

// Validasi environment variables sekali di awal startup, biar error konfigurasi
// ketahuan langsung saat boot, bukan nyelip jadi bug di tengah request.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET terlalu pendek"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET terlalu pendek"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().default(30),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment variables tidak valid:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());

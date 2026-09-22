import { Elysia } from "elysia";
import { verifyAccessToken } from "@/utils/jwt";

// Plugin Elysia yang dipakai `.use(authMiddleware)` di setiap route module
// yang butuh proteksi. Menyediakan `userId` di context lewat `resolve`.
export const authMiddleware = new Elysia({ name: "auth-middleware" }).derive(
  { as: "scoped" },
  ({ headers, set }) => {
    const authHeader = headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Token akses tidak ditemukan. Silakan login kembali.");
    }

    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAccessToken(token);

    if (!payload) {
      set.status = 401;
      throw new Error("Token akses tidak valid atau sudah kedaluwarsa.");
    }

    return { userId: payload.sub as string };
  }
);

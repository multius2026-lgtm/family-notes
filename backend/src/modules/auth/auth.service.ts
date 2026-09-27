import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { users, refreshTokens } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, newTokenId } from "@/utils/jwt";
import { seedDefaultsForUser } from "@/db/seed-defaults";
import { env } from "@/config/env";
import type { RegisterInput, LoginInput } from "./auth.schema";

async function issueTokenPair(userId: string) {
  const accessToken = signAccessToken(userId);
  const tokenId = newTokenId();
  const refreshToken = signRefreshToken(userId, tokenId);

  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 86400 * 1000);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) {
    throw new Error("Email sudah terdaftar. Silakan login.");
  }

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({ name: input.name, email: input.email, passwordHash })
    .returning({ id: users.id, name: users.name, email: users.email });

  await seedDefaultsForUser(user.id);
  const tokens = await issueTokenPair(user.id);

  return { user, ...tokens };
}

export async function loginUser(input: LoginInput) {
  const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (!user) {
    throw new Error("Email atau password salah.");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Email atau password salah.");
  }

  const tokens = await issueTokenPair(user.id);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    ...tokens,
  };
}

export async function refreshTokenPair(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error("Refresh token tidak valid atau sudah kedaluwarsa.");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await db.query.refreshTokens.findFirst({
    where: and(eq(refreshTokens.userId, payload.sub), eq(refreshTokens.tokenHash, tokenHash)),
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new Error("Refresh token tidak dikenali atau sudah di-revoke. Silakan login kembali.");
  }

  // Rotasi: revoke token lama, terbitkan pasangan baru (mencegah replay).
  await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id));
  return issueTokenPair(payload.sub);
}

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
  return { success: true };
}

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { env } from "@/config/env";

// Implementasi JWT (HS256) minimal tanpa dependency eksternal — dipakai di
// service layer (login/refresh/logout) di luar konteks request Elysia.
// Untuk verifikasi token di tiap request lihat middleware/auth.middleware.ts.

type JwtPayload = Record<string, unknown> & { sub: string };

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(input: string): Buffer {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64");
}

function sign(payload: JwtPayload, secret: string, expiresInSeconds: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(fullPayload));
  const signature = createHmac("sha256", secret).update(`${headerPart}.${payloadPart}`).digest();
  const signaturePart = base64url(signature);

  return `${headerPart}.${payloadPart}.${signaturePart}`;
}

function verify<T extends JwtPayload = JwtPayload>(token: string, secret: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;

  const expectedSig = createHmac("sha256", secret).update(`${headerPart}.${payloadPart}`).digest();
  const actualSig = base64urlDecode(signaturePart);

  if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(payloadPart).toString("utf8")) as T & { exp: number };
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

function parseExpiryToSeconds(expr: string): number {
  // dukung format sederhana seperti "15m", "1h", "7d"
  const match = /^(\d+)([smhd])$/.exec(expr);
  if (!match) return 900; // default 15 menit
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 60;
  return value * multiplier;
}

export function signAccessToken(userId: string) {
  return sign({ sub: userId }, env.JWT_ACCESS_SECRET, parseExpiryToSeconds(env.JWT_ACCESS_EXPIRES_IN));
}

export function verifyAccessToken(token: string) {
  return verify<{ sub: string }>(token, env.JWT_ACCESS_SECRET);
}

export function signRefreshToken(userId: string, tokenId: string) {
  return sign(
    { sub: userId, jti: tokenId },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN_DAYS * 86400
  );
}

export function verifyRefreshToken(token: string) {
  return verify<{ sub: string; jti: string }>(token, env.JWT_REFRESH_SECRET);
}

export function newTokenId() {
  return randomBytes(16).toString("hex");
}

// Refresh token disimpan hash-nya di DB (bukan plaintext), supaya kalau DB
// bocor, token lama tidak bisa langsung dipakai ulang.
export function hashToken(token: string) {
  return createHmac("sha256", env.JWT_REFRESH_SECRET).update(token).digest("hex");
}

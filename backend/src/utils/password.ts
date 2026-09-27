// Bun punya Bun.password bawaan (bcrypt-based), jadi tidak perlu dependency
// tambahan seperti bcryptjs.
export async function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, { algorithm: "bcrypt", cost: 10 });
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return Bun.password.verify(plain, hash);
}

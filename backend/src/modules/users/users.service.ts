import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function getProfile(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, email: true, weeklyTarget: true, createdAt: true },
  });
  if (!user) throw new Error("User tidak ditemukan.");
  return user;
}

export async function updateProfile(userId: string, input: { name?: string; weeklyTarget?: number | null }) {
  const [row] = await db
    .update(users)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.weeklyTarget !== undefined && { weeklyTarget: input.weeklyTarget === null ? null : input.weeklyTarget.toString() }),
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id, name: users.name, email: users.email, weeklyTarget: users.weeklyTarget });
  return row;
}

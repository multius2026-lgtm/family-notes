import { db } from "./client";
import { incomeSources, expenseCategories } from "./schema";

// Dipanggil sekali saat user baru register (lihat auth.service.ts), supaya
// user langsung punya opsi umum tanpa harus setup manual dulu.
export async function seedDefaultsForUser(userId: string) {
  await db.insert(incomeSources).values([
    { userId, name: "Gojek", icon: "scooter", defaultPeriodType: "daily", isDefault: true },
    { userId, name: "Grab", icon: "scooter", defaultPeriodType: "daily", isDefault: true },
    { userId, name: "Freelance", icon: "briefcase", defaultPeriodType: "weekly", isDefault: true },
    { userId, name: "Lainnya", icon: "dots", defaultPeriodType: "daily", isDefault: true },
  ]);

  await db.insert(expenseCategories).values([
    { userId, name: "Bensin", icon: "fuel", isDefault: true },
    { userId, name: "Makan", icon: "food", isDefault: true },
    { userId, name: "Servis", icon: "wrench", isDefault: true },
    { userId, name: "Lainnya", icon: "dots", isDefault: true },
  ]);
}

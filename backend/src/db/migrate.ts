import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";

// Script terpisah untuk menjalankan migrasi (bun run src/db/migrate.ts atau
// `bun run db:migrate`). Dipisah dari client.ts karena butuh koneksi
// single-connection khusus migrasi.
async function main() {
  const sqlClient = postgres(env.DATABASE_URL, { max: 1, ssl: "require" });
  const db = drizzle(sqlClient);

  console.log("⏳ Menjalankan migrasi database...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("✅ Migrasi selesai.");

  await sqlClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migrasi gagal:", err);
  process.exit(1);
});

import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const res = await db.execute(sql`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    console.log("RLS status:", res);
  } catch (err) {
    console.error("DB error:", err);
  } finally {
    process.exit(0);
  }
}

main();

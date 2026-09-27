import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const res = await db.execute(sql`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `);
    console.log("Policies:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("DB error:", err);
  } finally {
    process.exit(0);
  }
}

main();

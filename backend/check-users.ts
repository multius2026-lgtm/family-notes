import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const authUsers = await db.execute(sql`SELECT id, email, email_confirmed_at, last_sign_in_at FROM auth.users;`);
    console.log("Supabase auth.users:", authUsers);

    const publicUsers = await db.execute(sql`SELECT id, email, name FROM public.users;`);
    console.log("public.users:", publicUsers);

    const inc = await db.execute(sql`SELECT id, name, user_id, is_default FROM income_sources;`);
    console.log("income_sources rows:", inc);

    const exp = await db.execute(sql`SELECT id, name, user_id, is_default FROM expense_categories;`);
    console.log("expense_categories rows:", exp);
  } catch (err) {
    console.error("Error checking users:", err);
  } finally {
    process.exit(0);
  }
}
main();

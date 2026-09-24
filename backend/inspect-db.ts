import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const tables = await db.execute(sql`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log("Tables in public schema:");
  for (const t of tables as any[]) {
    console.log(`- ${t.table_name}`);
  }

  const txCount = await db.execute(sql`SELECT count(*) FROM public.transactions;`);
  console.log("\nTotal transactions in transactions table:", txCount);

  const users = await db.execute(sql`SELECT id, email, name FROM public.users;`);
  console.log("\nUsers in public.users:", users);

  const authUsers = await db.execute(sql`SELECT id, email, created_at FROM auth.users;`);
  console.log("\nUsers in auth.users:", authUsers);

  const allTx = await db.execute(sql`
    SELECT t.id, t.user_id, u.email, t.amount, t.type, t.note, t.occurred_at 
    FROM public.transactions t
    LEFT JOIN public.users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
    LIMIT 10;
  `);
  console.log("\nRecent transactions in DB:", allTx);

  const inc = await db.execute(sql`SELECT count(*), user_id FROM public.income_sources GROUP BY user_id;`);
  console.log("\nIncome sources grouped by user_id:", inc);

  const exp = await db.execute(sql`SELECT count(*), user_id FROM public.expense_categories GROUP BY user_id;`);
  console.log("\nExpense categories grouped by user_id:", exp);

  process.exit(0);
}

main().catch(console.error);

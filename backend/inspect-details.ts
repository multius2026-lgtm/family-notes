import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const tx = await db.execute(sql`
    SELECT id, user_id, amount, note, income_source_id, expense_category_id 
    FROM public.transactions;
  `);
  console.log("Transactions:", tx);

  const inc = await db.execute(sql`
    SELECT id, user_id, name, is_default FROM public.income_sources;
  `);
  console.log("Income sources:", inc);

  const exp = await db.execute(sql`
    SELECT id, user_id, name, is_default FROM public.expense_categories;
  `);
  console.log("Expense categories:", exp);

  process.exit(0);
}

main().catch(console.error);

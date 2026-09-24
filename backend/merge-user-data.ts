import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const oldUserId = "7ea5f341-8f29-4132-a458-d8bce3621a37"; // natsu.2132@gmail.com
  const newUserId = "46bab65e-b69a-4bc1-b7f0-9fcfdc80d285"; // azizzz.2132@gmail.com

  console.log("🔄 Memindahkan data dari user lama ke user aktif...");

  // 1. Pindahkan transaksi lama ke newUserId
  const updateTx = await db.execute(sql`
    UPDATE public.transactions 
    SET user_id = ${newUserId}
    WHERE user_id = ${oldUserId};
  `);
  console.log("✅ Transaksi dipindahkan:", updateTx);

  // 2. Pindahkan income sources lama ("Shopee Foods", "jualan", dll) ke newUserId
  // Jika nama sudah ada, update atau biarkan
  const oldSources = await db.execute(sql`
    SELECT id, name, icon, default_period_type FROM public.income_sources WHERE user_id = ${oldUserId};
  `);

  for (const s of oldSources as any[]) {
    await db.execute(sql`
      INSERT INTO public.income_sources (user_id, name, icon, default_period_type, is_default)
      VALUES (${newUserId}, ${s.name}, ${s.icon}, ${s.default_period_type}, false)
      ON CONFLICT DO NOTHING;
    `);
  }
  console.log("✅ Income sources lama digabungkan ke user aktif!");

  // 3. Pindahkan expense categories lama ke newUserId
  const oldCats = await db.execute(sql`
    SELECT id, name, icon FROM public.expense_categories WHERE user_id = ${oldUserId};
  `);

  for (const c of oldCats as any[]) {
    await db.execute(sql`
      INSERT INTO public.expense_categories (user_id, name, icon, is_default)
      VALUES (${newUserId}, ${c.name}, ${c.icon}, false)
      ON CONFLICT DO NOTHING;
    `);
  }
  console.log("✅ Expense categories lama digabungkan ke user aktif!");

  // 4. Update transaksi yang categories-nya merujuk ke kategori oldUserId
  // agar merujuk ke kategori milik newUserId yang namanya cocok
  const newCats = await db.execute(sql`
    SELECT id, name FROM public.expense_categories WHERE user_id = ${newUserId};
  `);
  const catMap = new Map((newCats as any[]).map(c => [c.name.toLowerCase(), c.id]));

  for (const oldCat of oldCats as any[]) {
    const matchingNewId = catMap.get(oldCat.name.toLowerCase());
    if (matchingNewId) {
      await db.execute(sql`
        UPDATE public.transactions 
        SET expense_category_id = ${matchingNewId}
        WHERE expense_category_id = ${oldCat.id};
      `);
    }
  }

  // 5. Verifikasi transaksi milik newUserId
  const finalTx = await db.execute(sql`
    SELECT t.id, t.amount, t.type, t.note, c.name as category_name
    FROM public.transactions t
    LEFT JOIN public.expense_categories c ON t.expense_category_id = c.id
    WHERE t.user_id = ${newUserId};
  `);
  console.log("\n🎉 Transaksi aktif untuk user azizzz.2132@gmail.com:", finalTx);

  process.exit(0);
}

main().catch(console.error);

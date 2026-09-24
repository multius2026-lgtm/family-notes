import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const userId = "46bab65e-b69a-4bc1-b7f0-9fcfdc80d285";

  // Check existing income sources for this user
  const existing = await db.execute(sql`
    SELECT id, name FROM income_sources WHERE user_id = ${userId};
  `);
  console.log("Existing income sources for user:", existing);

  if (existing.length === 0) {
    await db.execute(sql`
      INSERT INTO income_sources (user_id, name, icon, default_period_type, is_default)
      VALUES 
        (${userId}, 'Gaji Utama', 'briefcase', 'monthly', false),
        (${userId}, 'Gojek / Grab', 'scooter', 'daily', false),
        (${userId}, 'Freelance / Proyek', 'laptop', 'weekly', false),
        (${userId}, 'Jualan / Bisnis', 'store', 'daily', false),
        (${userId}, 'Lainnya', 'dots', 'daily', false);
    `);
    console.log("Seeded income sources for user!");
  }

  // Check expense categories for this user
  const existingCats = await db.execute(sql`
    SELECT id, name FROM expense_categories WHERE user_id = ${userId};
  `);
  console.log("Existing expense categories for user:", existingCats);

  if (existingCats.length <= 1) { // maybe user only added "Gaji" by mistake to expenses
    await db.execute(sql`
      INSERT INTO expense_categories (user_id, name, icon, is_default)
      VALUES 
        (${userId}, 'Makan & Minum', 'food', false),
        (${userId}, 'Bensin & Transport', 'fuel', false),
        (${userId}, 'Belanja Harian', 'cart', false),
        (${userId}, 'Tagihan & Listrik', 'bolt', false),
        (${userId}, 'Servis Kendaraan', 'wrench', false),
        (${userId}, 'Lainnya', 'dots', false);
    `);
    console.log("Seeded expense categories for user!");
  }

  process.exit(0);
}

main().catch(console.error);

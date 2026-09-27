import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function createPolicy(table: string, policyName: string, forClause: string, usingClause: string, withCheckClause?: string) {
  try {
    // Drop existing policy if exists first (idempotent)
    await db.execute(sql.raw(`DROP POLICY IF EXISTS "${policyName}" ON public.${table};`));
    const withCheck = withCheckClause ? `WITH CHECK (${withCheckClause})` : "";
    await db.execute(sql.raw(
      `CREATE POLICY "${policyName}" ON public.${table} ${forClause} TO authenticated USING (${usingClause}) ${withCheck};`
    ));
    console.log(`✅ ${table}: "${policyName}" diterapkan`);
  } catch (err: any) {
    console.error(`❌ ${table}: ${err?.message}`);
  }
}

async function createInsertPolicy(table: string, policyName: string, withCheckClause: string) {
  try {
    await db.execute(sql.raw(`DROP POLICY IF EXISTS "${policyName}" ON public.${table};`));
    await db.execute(sql.raw(
      `CREATE POLICY "${policyName}" ON public.${table} FOR INSERT TO authenticated WITH CHECK (${withCheckClause});`
    ));
    console.log(`✅ ${table}: "${policyName}" diterapkan`);
  } catch (err: any) {
    console.error(`❌ ${table}: ${err?.message}`);
  }
}

async function applyRLSPolicies() {
  console.log("🔒 Menerapkan RLS policies untuk arsitektur serverless...\n");

  try {
    // income_sources
    await createPolicy(
      "income_sources",
      "Users can manage own income sources",
      "FOR ALL",
      "user_id = auth.uid()",
      "user_id = auth.uid()"
    );

    // expense_categories
    await createPolicy(
      "expense_categories",
      "Users can manage own expense categories",
      "FOR ALL",
      "user_id = auth.uid()",
      "user_id = auth.uid()"
    );

    // transactions
    await createPolicy(
      "transactions",
      "Users can manage own transactions",
      "FOR ALL",
      "user_id = auth.uid()",
      "user_id = auth.uid()"
    );

    // refresh_tokens
    await createPolicy(
      "refresh_tokens",
      "Users can manage own refresh tokens",
      "FOR ALL",
      "user_id = auth.uid()",
      "user_id = auth.uid()"
    );

    // users INSERT
    await createInsertPolicy(
      "users",
      "Users can insert their own row",
      "(SELECT auth.uid() AS uid) = id"
    );

    console.log("\n🎉 Semua RLS policies berhasil diterapkan!");
  } catch (err: any) {
    console.error("❌ Error global:", err?.message || err);
  } finally {
    process.exit(0);
  }
}

applyRLSPolicies();

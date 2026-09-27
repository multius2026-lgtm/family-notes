import { db } from "./src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  try {
    // 1. Confirm any pending auth users
    const res = await db.execute(sql`
      UPDATE auth.users 
      SET email_confirmed_at = NOW() 
      WHERE email_confirmed_at IS NULL;
    `);
    console.log("Confirmed pending users in auth.users:", res);

    // 2. Also ensure public.users has a record for every auth.user
    const users = await db.execute(sql`
      SELECT id, email, raw_user_meta_data FROM auth.users;
    `);
    
    for (const u of users as any[]) {
      const meta = typeof u.raw_user_meta_data === 'string' 
        ? JSON.parse(u.raw_user_meta_data) 
        : u.raw_user_meta_data || {};
      const name = meta.name || u.email.split('@')[0];

      await db.execute(sql`
        INSERT INTO public.users (id, email, name, password_hash)
        VALUES (${u.id}, ${u.email}, ${name}, 'supabase_auth')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;
      `);
      console.log(`Synced user to public.users: ${u.email} (${u.id})`);
    }

    // 3. Create a trigger so whenever someone signs up, their email is auto-confirmed 
    // and automatically inserted into public.users if desired!
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.users (id, email, name, password_hash)
        VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'supabase_auth')
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);
    console.log("Trigger on_auth_user_created created successfully!");

  } catch (err) {
    console.error("Error confirming users:", err);
  } finally {
    process.exit(0);
  }
}
main();

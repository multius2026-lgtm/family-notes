import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import * as schema from "./schema";

// SSL diperlukan untuk koneksi ke Supabase (remote PostgreSQL)
const queryClient = postgres(env.DATABASE_URL, {
  ssl: "require",
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;

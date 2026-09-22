import { pgTable, uuid, text, numeric, boolean, timestamp, date, pgEnum, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

// type transaksi
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);

// PENTING: gig worker kadang dibayar harian (ojol harian, jualan harian),
// kadang mingguan (setoran mingguan, proyek lepas mingguan), kadang bulanan
// (gaji paruh waktu, retainer bulanan). `period_type` menyimpan periode mana
// yang direpresentasikan oleh satu baris income ini, supaya dashboard bisa
// menghitung "setara harian" secara adil (bukan menganggap gajian bulanan
// sebagai lonjakan pemasukan satu hari).
export const periodTypeEnum = pgEnum("period_type", ["daily", "weekly", "monthly"]);

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  weeklyTarget: numeric("weekly_target", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ---------------------------------------------------------------------------
// income_sources — sumber pemasukan yang bisa dikustomisasi user
// (Gojek, Grab, Freelance, dll). `default_period_type` dipakai untuk
// mengisi otomatis pilihan periode saat user menambah transaksi dari
// sumber ini (mis. "Gaji Kantor" biasanya bulanan, "Gojek" biasanya harian).
// ---------------------------------------------------------------------------
export const incomeSources = pgTable("income_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  icon: text("icon"),
  defaultPeriodType: periodTypeEnum("default_period_type").default("daily"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ---------------------------------------------------------------------------
// expense_categories
// ---------------------------------------------------------------------------
export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  icon: text("icon"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ---------------------------------------------------------------------------
// transactions
// ---------------------------------------------------------------------------
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    type: transactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    // periode yang direpresentasikan nilai `amount` ini. Untuk expense biasanya
    // selalu 'daily' (dibelanjakan hari itu juga), tapi kolom tetap generik
    // supaya skema tidak perlu berubah kalau nanti ada expense berkala juga.
    periodType: periodTypeEnum("period_type").default("daily").notNull(),
    category: text("category"), // untuk expense: 'bensin', 'makan', 'servis', dll — nama bebas kalau tidak pakai relasi expense_categories
    incomeSourceId: uuid("income_source_id").references(() => incomeSources.id, { onDelete: "set null" }),
    expenseCategoryId: uuid("expense_category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
    note: text("note"),
    occurredAt: date("occurred_at").notNull(), // tanggal transaksi dicatat/diterima (bisa input mundur)
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userDateIdx: index("idx_transactions_user_date").on(table.userId, table.occurredAt),
  })
);

// ---------------------------------------------------------------------------
// refresh_tokens — untuk revoke saat logout / rotasi token
// ---------------------------------------------------------------------------
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (opsional, memudahkan query nested lewat Drizzle relational API)
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  incomeSources: many(incomeSources),
  expenseCategories: many(expenseCategories),
  transactions: many(transactions),
  refreshTokens: many(refreshTokens),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  incomeSource: one(incomeSources, { fields: [transactions.incomeSourceId], references: [incomeSources.id] }),
  expenseCategory: one(expenseCategories, { fields: [transactions.expenseCategoryId], references: [expenseCategories.id] }),
}));

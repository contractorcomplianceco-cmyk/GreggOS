import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

// Profit Sharing projections. AWARENESS / PROJECTION ONLY. The officer role does
// NOT, by itself, create ownership, equity, voting rights, or profit
// participation; any such arrangement must be documented separately through
// company governance documents. These rows are illustrative planning figures,
// never entitlements. Amounts stored as integer cents; exposed as dollars.
export const profitShareProjectionsTable = pgTable("profit_share_projections", {
  id: uuid("id").primaryKey().defaultRandom(),
  periodLabel: text("period_label").notNull().default(""),
  basis: text("basis").notNull().default(""),
  projectedAmountCents: integer("projected_amount_cents").notNull().default(0),
  // illustrative | under_discussion | documented
  status: text("status").notNull().default("illustrative"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ProfitShareProjection =
  typeof profitShareProjectionsTable.$inferSelect;
export type InsertProfitShareProjection =
  typeof profitShareProjectionsTable.$inferInsert;

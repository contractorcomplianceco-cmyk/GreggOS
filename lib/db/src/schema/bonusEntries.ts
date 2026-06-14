import { pgTable, text, integer, date, timestamp, uuid } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

// Bonus Tracker. Tracks bonus-eligible events against the executive proposal's
// bonus categories. Amounts stored as integer cents; exposed as dollars over the
// API. Advisory/tracking only — eligibility and payout require approval and
// documentation; nothing here authorizes a payment.
export const bonusEntriesTable = pgTable("bonus_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  // placement_coordination | expansion_addon | monitoring_conversion |
  // client_save | high_value_stability | clean_placement
  category: text("category").notNull().default("expansion_addon"),
  title: text("title").notNull().default(""),
  clientId: uuid("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  amountCents: integer("amount_cents").notNull().default(0),
  // eligible | pending_approval | approved | paid
  status: text("status").notNull().default("eligible"),
  periodLabel: text("period_label").notNull().default(""),
  documentation: text("documentation").notNull().default(""),
  notes: text("notes").notNull().default(""),
  occurredOn: date("occurred_on", { mode: "string" }),
  createdByUserId: uuid("created_by_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdByLabel: text("created_by_label").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type BonusEntry = typeof bonusEntriesTable.$inferSelect;
export type InsertBonusEntry = typeof bonusEntriesTable.$inferInsert;

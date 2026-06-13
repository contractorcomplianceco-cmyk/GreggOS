import { date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

// GreggOS Expense & Executive Activity Tracker (Module 6). Tracks travel,
// client-visit, relationship-building and event costs. Amount is stored in
// whole cents to avoid float drift; the API exposes/accepts dollars.
export const expensesTable = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Travel | Client Visit | Relationship | Event | Other
  category: text("category").notNull().default("Other"),
  description: text("description").notNull().default(""),
  amountCents: integer("amount_cents").notNull().default(0),
  clientId: uuid("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  spentOn: date("spent_on", { mode: "string" }),
  notes: text("notes").notNull().default(""),
  ownerLabel: text("owner_label").notNull().default("Gregg"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Expense = typeof expensesTable.$inferSelect;
export type InsertExpense = typeof expensesTable.$inferInsert;

import { pgTable, text, boolean, integer, timestamp, uuid } from "drizzle-orm/pg-core";

// 90/180-Day Success Plan. Onboarding success measures from the executive
// proposal, tracked as a completion checklist with optional notes.
export const successPlanItemsTable = pgTable("success_plan_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  // first_90 | first_180
  phase: text("phase").notNull().default("first_90"),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SuccessPlanItem = typeof successPlanItemsTable.$inferSelect;
export type InsertSuccessPlanItem = typeof successPlanItemsTable.$inferInsert;

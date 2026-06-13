import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// GreggOS Training & Leveling System (Module 8). Gamified executive development.
// Each module carries XP and a completion flag; the level is derived from the
// total XP of completed modules (computed server-side / in the UI).
export const trainingModulesTable = pgTable("training_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default(""),
  // Compliance | Zoho CRM | AI & Automation | Internal Systems | Client Strategy | Executive Communication
  category: text("category").notNull().default(""),
  description: text("description").notNull().default(""),
  // Awareness | Operator | Strategic | Executive | Command (suggested tier)
  tier: text("tier").notNull().default("Awareness"),
  xp: integer("xp").notNull().default(100),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TrainingModule = typeof trainingModulesTable.$inferSelect;
export type InsertTrainingModule = typeof trainingModulesTable.$inferInsert;

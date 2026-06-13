import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

// GreggOS Feedback Center (Module 11). Internal feedback: client issues noticed,
// system improvement ideas, risk-pattern observations, operational gaps.
export const feedbackTable = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  // risk | opportunity | system
  type: text("type").notNull().default("system"),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  // open | reviewed | actioned | archived
  status: text("status").notNull().default("open"),
  // Optional association with a client.
  clientId: uuid("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  submittedByUserId: uuid("submitted_by_user_id").references(
    () => usersTable.id,
    { onDelete: "set null" },
  ),
  submittedByLabel: text("submitted_by_label").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Feedback = typeof feedbackTable.$inferSelect;
export type InsertFeedback = typeof feedbackTable.$inferInsert;

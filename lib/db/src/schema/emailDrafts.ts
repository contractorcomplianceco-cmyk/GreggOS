import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Standalone Email Builder — a simpler, client-context-free counterpart to the
// Communication Draft Builder. Gregg supplies purpose/audience/key points and
// gets a generated email (AI with deterministic template fallback). Draft-only:
// there is NO send path; "used" means Gregg copied it to send himself.
export const emailDraftsTable = pgTable("email_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  purpose: text("purpose").notNull().default(""),
  audience: text("audience").notNull().default(""),
  tone: text("tone").notNull().default(""),
  keyPoints: text("key_points").notNull().default(""),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull().default(""),
  // ai | template
  source: text("source").notNull().default("template"),
  // draft | edited | used | discarded
  status: text("status").notNull().default("draft"),
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

export type EmailDraft = typeof emailDraftsTable.$inferSelect;
export type InsertEmailDraft = typeof emailDraftsTable.$inferInsert;

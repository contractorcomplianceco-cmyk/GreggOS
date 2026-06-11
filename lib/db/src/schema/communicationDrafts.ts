import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

// Gregg's client-facing communication drafts. DRAFT-ONLY: the app composes and
// organizes; it never sends anything. Each draft is generated from the client's
// live context, either AI-written (Replit-managed OpenAI integration) or via a
// deterministic template fallback when AI is unavailable.
export const communicationDraftsTable = pgTable("communication_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  // follow_up | check_in | escalation_ack | expansion_outreach | renewal | other
  intent: text("intent").notNull(),
  // email | text | call_script
  channel: text("channel").notNull().default("email"),
  // professional | warm | concise | reassuring (free-form, optional)
  tone: text("tone").notNull().default(""),
  // extra notes Gregg supplies to steer the draft
  instructions: text("instructions").notNull().default(""),
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

export type CommunicationDraft = typeof communicationDraftsTable.$inferSelect;
export type InsertCommunicationDraft =
  typeof communicationDraftsTable.$inferInsert;

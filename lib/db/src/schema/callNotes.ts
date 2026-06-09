import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

export const callNotesTable = pgTable("call_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  callDate: date("call_date", { mode: "string" }).notNull(),
  caller: text("caller").notNull().default(""),
  callType: text("call_type").notNull(),
  rawRingCentralNote: text("raw_ring_central_note").notNull().default(""),
  cleanSummary: text("clean_summary").notNull().default(""),
  clientConcern: text("client_concern").notNull().default(""),
  commitmentsMade: text("commitments_made").notNull().default(""),
  missingInformation: text("missing_information").notNull().default(""),
  nextActions: text("next_actions").notNull().default(""),
  opportunitySignals: text("opportunity_signals").notNull().default(""),
  escalationFlags: text("escalation_flags").notNull().default(""),
  routingStatus: text("routing_status").notNull(),
  crmReadyNote: text("crm_ready_note").notNull().default(""),
  clientFollowUpDraft: text("client_follow_up_draft").notNull().default(""),
  taskList: text("task_list").notNull().default(""),
  crmRecordId: text("crm_record_id"),
  createdByUserId: uuid("created_by_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type CallNote = typeof callNotesTable.$inferSelect;
export type InsertCallNote = typeof callNotesTable.$inferInsert;

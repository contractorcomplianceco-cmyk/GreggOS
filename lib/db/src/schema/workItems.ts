import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { callNotesTable } from "./callNotes";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

export const tasksTable = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  sourceCallNoteId: uuid("source_call_note_id").references(
    () => callNotesTable.id,
    { onDelete: "set null" },
  ),
  title: text("title").notNull(),
  ownerUserId: uuid("owner_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  ownerLabel: text("owner_label").notNull().default(""),
  dueDate: date("due_date", { mode: "string" }),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  escalationFlag: boolean("escalation_flag").notNull().default(false),
  notes: text("notes").notNull().default(""),
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

export const opportunitySignalsTable = pgTable("opportunity_signals", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  sourceCallNoteId: uuid("source_call_note_id").references(
    () => callNotesTable.id,
    { onDelete: "set null" },
  ),
  type: text("type").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull(),
  routedToUserId: uuid("routed_to_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  routedToLabel: text("routed_to_label").notNull().default(""),
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

export const escalationsTable = pgTable("escalations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  sourceCallNoteId: uuid("source_call_note_id").references(
    () => callNotesTable.id,
    { onDelete: "set null" },
  ),
  reason: text("reason").notNull(),
  riskLevel: text("risk_level").notNull(),
  routedToUserId: uuid("routed_to_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  routedToLabel: text("routed_to_label").notNull().default(""),
  decisionNeeded: text("decision_needed").notNull().default(""),
  deadline: date("deadline", { mode: "string" }),
  status: text("status").notNull(),
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

export type Task = typeof tasksTable.$inferSelect;
export type InsertTask = typeof tasksTable.$inferInsert;
export type OpportunitySignal = typeof opportunitySignalsTable.$inferSelect;
export type InsertOpportunitySignal =
  typeof opportunitySignalsTable.$inferInsert;
export type Escalation = typeof escalationsTable.$inferSelect;
export type InsertEscalation = typeof escalationsTable.$inferInsert;

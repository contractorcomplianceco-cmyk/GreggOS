import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

export type RiskFactor = {
  label: string;
  score: number;
  weight: number;
  trend: string;
};

export type AuditScoreItem = {
  category: string;
  score: number;
  weight: number;
  notes: string;
};

export const clientProcessesTable = pgTable("client_processes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").notNull().default(0),
  ownerUserId: uuid("owner_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  ownerLabel: text("owner_label").notNull().default(""),
  startedAt: date("started_at", { mode: "string" }),
  dueDate: date("due_date", { mode: "string" }),
  blockedReason: text("blocked_reason").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const clientRiskProfilesTable = pgTable("client_risk_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .unique()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull().default(0),
  trend: text("trend").notNull().default("Stable"),
  factors: jsonb("factors").$type<RiskFactor[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const clientAuditsTable = pgTable("client_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .unique()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  auditType: text("audit_type").notNull().default(""),
  auditor: text("auditor").notNull().default(""),
  lastAuditDate: date("last_audit_date", { mode: "string" }),
  nextAuditDate: date("next_audit_date", { mode: "string" }),
  overallScore: integer("overall_score").notNull().default(0),
  scoresheet: jsonb("scoresheet")
    .$type<AuditScoreItem[]>()
    .notNull()
    .default([]),
});

export const auditLinksTable = pgTable("audit_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .unique()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  portalAuditId: integer("portal_audit_id"),
  portalClientName: text("portal_client_name").notNull().default(""),
  matchMethod: text("match_method").notNull().default("manual"),
  confirmedByUserId: uuid("confirmed_by_user_id").references(
    () => usersTable.id,
    { onDelete: "set null" },
  ),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const expansionMilestonesTable = pgTable("expansion_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  stage: text("stage").notNull(),
  status: text("status").notNull().default("Open"),
  potentialValue: integer("potential_value").notNull().default(0),
  targetDate: date("target_date", { mode: "string" }),
  description: text("description").notNull().default(""),
  ownerUserId: uuid("owner_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  ownerLabel: text("owner_label").notNull().default(""),
  pinned: boolean("pinned").notNull().default(false),
  priorityBoost: integer("priority_boost").notNull().default(0),
  lastMovementAt: timestamp("last_movement_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invoicesTable = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull(),
  amount: integer("amount").notNull().default(0),
  amountPaid: integer("amount_paid").notNull().default(0),
  issueDate: date("issue_date", { mode: "string" }),
  dueDate: date("due_date", { mode: "string" }),
  status: text("status").notNull(),
});

export const slasTable = pgTable("slas", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  dueDate: date("due_date", { mode: "string" }),
  status: text("status").notNull(),
  ownerUserId: uuid("owner_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  ownerLabel: text("owner_label").notNull().default(""),
});

export const scheduledEventsTable = pgTable("scheduled_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(),
  date: date("date", { mode: "string" }),
  time: time("time"),
  attendees: text("attendees").notNull().default(""),
  withClient: boolean("with_client").notNull().default(false),
  status: text("status").notNull().default("Planned"),
  ownerLabel: text("owner_label").notNull().default(""),
});

export const contactLogTable = pgTable("contact_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }),
  channel: text("channel").notNull(),
  internalPerson: text("internal_person").notNull().default(""),
  direction: text("direction").notNull().default(""),
  summary: text("summary").notNull().default(""),
});

export type ClientProcess = typeof clientProcessesTable.$inferSelect;
export type ClientRiskProfile = typeof clientRiskProfilesTable.$inferSelect;
export type ClientAudit = typeof clientAuditsTable.$inferSelect;
export type AuditLink = typeof auditLinksTable.$inferSelect;
export type ExpansionMilestone = typeof expansionMilestonesTable.$inferSelect;
export type Invoice = typeof invoicesTable.$inferSelect;
export type SLA = typeof slasTable.$inferSelect;
export type ScheduledEvent = typeof scheduledEventsTable.$inferSelect;
export type ContactLogEntry = typeof contactLogTable.$inferSelect;

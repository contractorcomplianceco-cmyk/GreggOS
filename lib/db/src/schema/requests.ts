import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

// Requests Hub — internal operational requests of any kind (purchase, travel,
// help, equipment, other) with a status lifecycle. Tracking + routing only:
// moving a request to "approved" records that leadership signed off, it does
// not itself authorize spend or commitments.
export const requestsTable = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  // purchase | travel | help | equipment | other
  type: text("type").notNull().default("other"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  // submitted | in_review | approved | denied | fulfilled | cancelled
  status: text("status").notNull().default("submitted"),
  // Low | Medium | High | Urgent
  priority: text("priority").notNull().default("Medium"),
  // Optional estimated cost in integer cents (mainly purchase/equipment).
  amountCents: integer("amount_cents"),
  clientId: uuid("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  neededBy: date("needed_by", { mode: "string" }),
  requestedByUserId: uuid("requested_by_user_id").references(
    () => usersTable.id,
    { onDelete: "set null" },
  ),
  requestedByLabel: text("requested_by_label").notNull().default(""),
  assignedToLabel: text("assigned_to_label").notNull().default(""),
  resolutionNotes: text("resolution_notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Request = typeof requestsTable.$inferSelect;
export type InsertRequest = typeof requestsTable.$inferInsert;

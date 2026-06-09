import { date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const clientsTable = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientName: text("client_name").notNull(),
  companyName: text("company_name").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  clientStatus: text("client_status").notNull(),
  greggPriority: text("gregg_priority").notNull(),
  riskLevel: text("risk_level").notNull(),
  lastMeaningfulContact: date("last_meaningful_contact", { mode: "string" }),
  nextAction: text("next_action").notNull().default(""),
  nextOwnerUserId: uuid("next_owner_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  nextOwnerLabel: text("next_owner_label").notNull().default(""),
  coOwnerUserId: uuid("co_owner_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  coOwnerLabel: text("co_owner_label").notNull().default(""),
  involvementState: text("involvement_state").notNull().default(""),
  touchCadenceDays: integer("touch_cadence_days").notNull().default(30),
  dueDate: date("due_date", { mode: "string" }),
  missingInformation: text("missing_information").notNull().default("None"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Client = typeof clientsTable.$inferSelect;
export type InsertClient = typeof clientsTable.$inferInsert;

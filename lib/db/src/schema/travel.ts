import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

// GreggOS Travel & Client Relationship Expansion (Module 5). A strategic visit
// planner: which clients are worth an in-person visit and the ROI justification.
export const travelPlansTable = pgTable("travel_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Optional: a trip can be tied to a client or be region/event-level.
  clientId: uuid("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  location: text("location").notNull().default(""),
  // High-value retention risk | Expansion opportunity | Strategic partnership growth | other
  reason: text("reason").notNull().default(""),
  // ROI justification for the travel spend.
  roiReason: text("roi_reason").notNull().default(""),
  // Proposed | Planned | Booked | Completed | Cancelled
  status: text("status").notNull().default("Proposed"),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  notes: text("notes").notNull().default(""),
  ownerLabel: text("owner_label").notNull().default("Gregg"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TravelPlan = typeof travelPlansTable.$inferSelect;
export type InsertTravelPlan = typeof travelPlansTable.$inferInsert;

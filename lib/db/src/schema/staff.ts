import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Staff Overview — a light, editable profile layer over the people who own work
// in the cockpit. Productivity / stuck / burnout signals are DERIVED at read
// time from real tables (tasks, escalations, clients, expansion) keyed by the
// owner label, so this table only stores the editable bits: title, capacity,
// focus. Advisory only — signals support a conversation, they are not a verdict
// on anyone's performance.
export const staffProfilesTable = pgTable("staff_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  // The owner label this profile tracks (matches tasks.owner_label etc.).
  name: text("name").notNull(),
  userId: uuid("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull().default(""),
  focusArea: text("focus_area").notNull().default(""),
  weeklyCapacityHours: integer("weekly_capacity_hours").notNull().default(40),
  active: boolean("active").notNull().default(true),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type StaffProfile = typeof staffProfilesTable.$inferSelect;
export type InsertStaffProfile = typeof staffProfilesTable.$inferInsert;

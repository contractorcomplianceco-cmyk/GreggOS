import { pgTable, text, date, timestamp, uuid } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

// Licensed Qualifier Network — qualifier intake/profiles. Placement coordination
// is documentation and routing only; no row here approves a placement, which
// requires leadership/legal review per the governance boundaries.
export const qualifiersTable = pgTable("qualifiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default(""),
  licenseType: text("license_type").notNull().default(""),
  state: text("state").notNull().default(""),
  tradeClassification: text("trade_classification").notNull().default(""),
  // available | engaged | unavailable
  availability: text("availability").notNull().default("available"),
  // prospect | intake | verified | active | inactive
  status: text("status").notNull().default("prospect"),
  contact: text("contact").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Qualifier = typeof qualifiersTable.$inferSelect;
export type InsertQualifier = typeof qualifiersTable.$inferInsert;

// Placement lifecycle tracker (interest -> fit_review -> internal_review ->
// placed -> renewal -> replacement). Tracks needs, missing info, and risk flags.
export const placementsTable = pgTable("placements", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
  qualifierId: uuid("qualifier_id").references(() => qualifiersTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull().default(""),
  licenseType: text("license_type").notNull().default(""),
  state: text("state").notNull().default(""),
  tradeClassification: text("trade_classification").notNull().default(""),
  // interest | fit_review | internal_review | placed | renewal | replacement
  stage: text("stage").notNull().default("interest"),
  // open | on_hold | placed | closed
  status: text("status").notNull().default("open"),
  timeline: text("timeline").notNull().default(""),
  budget: text("budget").notNull().default(""),
  expectations: text("expectations").notNull().default(""),
  riskFlags: text("risk_flags").notNull().default(""),
  nextStep: text("next_step").notNull().default(""),
  missingInfo: text("missing_info").notNull().default(""),
  targetDate: date("target_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Placement = typeof placementsTable.$inferSelect;
export type InsertPlacement = typeof placementsTable.$inferInsert;

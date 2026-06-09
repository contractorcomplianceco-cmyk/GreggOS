import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Generalized CRM (Zoho) traceability. One link per source entity tracks the
// export -> approve -> push lifecycle and the Zoho record id once captured.
// Export-only for now: nothing here pushes to Zoho automatically.
export const crmLinksTable = pgTable(
  "crm_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // call_note | expansion_milestone | task | contact_log | handoff
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    // denormalized for filtering / reporting; nullable
    clientId: uuid("client_id"),
    // Zoho module: Deals | Notes | Tasks | Contacts
    crmModule: text("crm_module").notNull(),
    // Zoho record id, captured on "Mark pushed to CRM"
    crmRecordId: text("crm_record_id"),
    // draft | approved | pushed | failed
    syncStatus: text("sync_status").notNull().default("approved"),
    syncDirection: text("sync_direction").notNull().default("outbound"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastPushedByUserId: uuid("last_pushed_by_user_id").references(
      () => usersTable.id,
      { onDelete: "set null" },
    ),
    errorMessage: text("error_message").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [unique("crm_links_entity_unique").on(t.entityType, t.entityId)],
);

export type CrmLink = typeof crmLinksTable.$inferSelect;
export type InsertCrmLink = typeof crmLinksTable.$inferInsert;

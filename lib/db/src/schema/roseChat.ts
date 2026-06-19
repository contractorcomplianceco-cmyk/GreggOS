import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

// RoseOS Assistant — saved AI chat sessions. A session is a single conversation
// in one of the supported modes. Draft/advisory only: nothing here authorizes a
// decision; it organizes thinking and produces text Gregg reviews himself.
export const roseChatSessionsTable = pgTable("rose_chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("New conversation"),
  // brainstorm | help_with_client | how_to | general
  mode: text("mode").notNull().default("general"),
  // Optional client focus (used mainly by help_with_client).
  clientId: uuid("client_id").references(() => clientsTable.id, {
    onDelete: "set null",
  }),
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

export const roseChatMessagesTable = pgTable("rose_chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => roseChatSessionsTable.id, { onDelete: "cascade" }),
  // user | assistant
  role: text("role").notNull(),
  content: text("content").notNull().default(""),
  // For assistant turns: ai | template (deterministic fallback). Empty for user.
  source: text("source").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RoseChatSession = typeof roseChatSessionsTable.$inferSelect;
export type InsertRoseChatSession = typeof roseChatSessionsTable.$inferInsert;
export type RoseChatMessage = typeof roseChatMessagesTable.$inferSelect;
export type InsertRoseChatMessage = typeof roseChatMessagesTable.$inferInsert;

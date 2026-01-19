import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const weights = sqliteTable("weights", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weight: real("weight").notNull(),
  unit: text("unit", { enum: ["lb", "kg"] }).notNull().default("lb"),
  imageUrl: text("image_url"),
  note: text("note"),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredUnit: text("preferred_unit", { enum: ["lb", "kg"] })
    .notNull()
    .default("lb"),
  goalWeight: real("goal_weight"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Weight = typeof weights.$inferSelect;
export type NewWeight = typeof weights.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;

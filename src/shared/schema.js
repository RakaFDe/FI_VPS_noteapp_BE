// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
/**
 * USERS TABLE
 */
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
});
/**
 * NOTES TABLE
 */
export const notes = pgTable("notes", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id),
    title: text("title").notNull(),
    content: text("content").notNull(),
    isPinned: boolean("is_pinned").default(false),
    color: text("color").default("default"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow(),
});
/**
 * ZOD SCHEMAS
 */
export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
});
export const insertNoteSchema = createInsertSchema(notes).omit({
    id: true,
    userId: true,
    createdAt: true,
});

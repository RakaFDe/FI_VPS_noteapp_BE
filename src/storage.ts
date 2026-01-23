import {
  users,
  notes,
  type User,
  type InsertUser,
  type Note,
  type InsertNote,
} from "./shared/schema.js";

import { db } from "./db.js";
import { eq, and, desc } from "drizzle-orm";

/* =====================================================
 * Storage Contract
 * ===================================================== */

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getNotesByUser(userId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  createNote(userId: number, note: InsertNote): Promise<Note>;

  updateNote(
    userId: number,
    noteId: number,
    updates: Partial<InsertNote>
  ): Promise<Note | undefined>;

  deleteNote(userId: number, noteId: number): Promise<boolean>;
}

/* =====================================================
 * Database Storage
 * ===================================================== */

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getNotesByUser(userId: number): Promise<Note[]> {
    return db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.isPinned), desc(notes.createdAt));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(userId: number, note: InsertNote): Promise<Note> {
    const [created] = await db
      .insert(notes)
      .values({ ...note, userId })
      .returning();
    return created;
  }

  async updateNote(
    userId: number,
    noteId: number,
    updates: Partial<InsertNote>
  ): Promise<Note | undefined> {
    const [updated] = await db
      .update(notes)
      .set(updates)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    return updated;
  }

  async deleteNote(userId: number, noteId: number): Promise<boolean> {
    const result = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    return (result.rowCount ?? 0) > 0;
  }
}

/* =====================================================
 * Singleton
 * ===================================================== */

export const storage = new DatabaseStorage();

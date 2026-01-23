// backend/src/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// ===== ENV VALIDATION =====
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const DB_POOL_MAX = Number(process.env.DB_POOL_MAX ?? 5);

// ===== POSTGRES POOL =====
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// ===== DRIZZLE INSTANCE =====
export const db = drizzle(pool);

// ===== GRACEFUL SHUTDOWN =====
export async function closeDatabase() {
  console.log("[db] closing database pool...");
  await pool.end();
  console.log("[db] database pool closed");
}

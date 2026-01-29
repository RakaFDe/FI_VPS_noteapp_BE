// backend/src/index.ts
import app from "./app.js";
import { closeDatabase } from "./db.js";

/* ================= ENV ================= */

const REQUIRED_ENVS = ["PORT", "DATABASE_URL", "SESSION_SECRET"] as const;

for (const key of REQUIRED_ENVS) {
  if (!process.env[key]) {
    throw new Error(`Missing env: ${key}`);
  }
}

const PORT = Number(process.env.PORT);

/* ================= START ================= */

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] running on :${PORT}`);
});

/* ================= SHUTDOWN ================= */

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function shutdown() {
  console.log("[server] shutting down...");
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

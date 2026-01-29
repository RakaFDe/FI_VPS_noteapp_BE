// backend/src/index.ts
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import pgSession from "connect-pg-simple";

import { pool, closeDatabase } from "./db.js";
import router from "./routes/index.js";
import "./passport.js";
import { httpCounter } from "./shared/metrics.js";
import metricsRoutes from "./routes/metrics.js";


/* ================= ENV ================= */

const REQUIRED_ENVS = ["PORT", "DATABASE_URL", "SESSION_SECRET"] as const;
for (const key of REQUIRED_ENVS) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}

const NODE_ENV = process.env.NODE_ENV ?? "development";
const PORT = Number(process.env.PORT);
const SESSION_SECRET = process.env.SESSION_SECRET!;
const SESSION_NAME = process.env.SESSION_NAME ?? "finote.sid";

/* CORS ORIGIN */
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

/* ================= APP ================= */

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(express.json());

/* ================= CORS ================= */

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (CORS_ORIGINS.length === 0 || CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ================= SESSION ================= */

const PgSessionStore = pgSession(session);

app.use(
  session({
    name: SESSION_NAME,
    proxy: true,
    store: new PgSessionStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

/* ================= PASSPORT ================= */

app.use(passport.initialize());
app.use(passport.session());

/* ================ status =============== */

app.use((req, res, next) => {
  res.on("finish", () => {
    httpCounter.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
  });
  next();
});

/* ================= ROUTES ================= */
/* ================ DATA METRICS ========== */
app.use(metricsRoutes); // ⬅️ INI PENTING
app.use("/api", router);

// health
app.get("/healthz", (_, res) => res.json({ status: "ok" }));

//ready
app.get("/readyz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ready" });
  } catch (_) {
    res.status(503).json({ status: "not-ready" });
  }
});


/* ================= START ================= */

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] running on :${PORT}`);
});

/* ================= SHUTDOWN ================= */

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function shutdown() {
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

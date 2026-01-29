// backend/src/app.ts
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import pgSession from "connect-pg-simple";

import { pool } from "./db.js";
import router from "./routes/index.js";
import "./passport.js";
import { httpCounter } from "./shared/metrics.js";
import metricsRoutes from "./routes/metrics.js";

/* ================= APP ================= */

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json());

/* ================= CORS ================= */

const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

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
    name: process.env.SESSION_NAME ?? "finote.sid",
    proxy: true,
    store: new PgSessionStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET ?? "test-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

/* ================= PASSPORT ================= */

app.use(passport.initialize());
app.use(passport.session());

/* ================= METRICS ================= */

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

app.use(metricsRoutes);
app.use("/api", router);

// health (CI-safe, no DB)
app.get("/healthz", (_, res) => res.json({ status: "ok" }));

// ready (DB dependent)
app.get("/readyz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not-ready" });
  }
});

export default app;

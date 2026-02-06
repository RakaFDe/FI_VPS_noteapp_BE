import { Router } from "express";
import devRoutes from "./dev.js";
import authRoutes from "./auth.js";
import healthRoutes from "./health.js";
import metricsRoutes from "./metrics.js";

const router = Router();

/* PUBLIC (NO AUTH, NO PREFIX) */
router.use(healthRoutes);
router.use(metricsRoutes);

/* APP ROUTES */
if (process.env.NODE_ENV === "development") {
  console.warn("[routes] DEV MODE (no auth)");
  router.use(devRoutes);
} else {
  router.use(authRoutes);
}

export default router;
console.log("NODE_ENV =", process.env.NODE_ENV);

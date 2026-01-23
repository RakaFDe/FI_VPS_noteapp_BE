import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { storage } from "../storage.js";

const router = Router();

/* AUTH GUARD */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "unauthorized" });
  }
  next();
}

/* AUTH */
router.post(
  "/auth/login",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      (
        err: unknown,
        user: Express.User | false,
        info?: { message?: string } | string
      ) => {
        if (err) {
          return res.status(500).json({ message: "authentication_failed" });
        }

        if (!user) {
          const message =
            typeof info === "string"
              ? info
              : info?.message ?? "invalid_credentials";

          return res.status(401).json({ message });
        }

        req.logIn(user, err => {
          if (err) {
            return res.status(500).json({ message: "login_failed" });
          }

          res.json(user);
        });
      }
    )(req, res, next);
  }
);


router.post("/auth/logout", (req, res) => {
  req.logout(() => res.json({ success: true }));
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username_and_password_required" });
  }

  const existing = await storage.getUserByUsername(username);
  if (existing) {
    return res.status(409).json({ message: "username_already_exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await storage.createUser({ username, password: hashed });

  res.status(201).json({ id: user.id, username: user.username });
});

/* NOTES */
router.get("/notes", requireAuth, async (req, res) => {
  const user = req.user as { id: number };
  res.json(await storage.getNotesByUser(user.id));
});

router.post("/notes", requireAuth, async (req, res) => {
  const user = req.user as { id: number };
  res.status(201).json(await storage.createNote(user.id, req.body));
});

router.put("/notes/:id", requireAuth, async (req, res) => {
  const user = req.user as { id: number };
  const id = Number(req.params.id);

  const updated = await storage.updateNote(user.id, id, req.body);
  if (!updated) return res.status(404).json({ message: "note_not_found" });

  res.json(updated);
});

router.delete("/notes/:id", requireAuth, async (req, res) => {
  const user = req.user as { id: number };
  const id = Number(req.params.id);

  const ok = await storage.deleteNote(user.id, id);
  if (!ok) return res.status(404).json({ message: "note_not_found" });

  res.status(204).end();
});

export default router;

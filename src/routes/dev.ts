import { Router, Request, Response } from "express";
import { storage } from "../storage.js";

const router = Router();

/* DEV USER */
const DEV_USER_ID = 1;

router.get("/notes", async (_req: Request, res: Response) => {
  try {
    const notes = await storage.getNotesByUser(DEV_USER_ID);
    res.json(notes);
  } catch (err) {
    console.error("[dev:notes:list]", err);
    res.status(500).json({ message: "failed_to_fetch_notes" });
  }
});

router.post("/notes", async (req: Request, res: Response) => {
  try {
    const note = await storage.createNote(DEV_USER_ID, req.body);
    res.status(201).json(note);
  } catch (err) {
    console.error("[dev:notes:create]", err);
    res.status(500).json({ message: "failed_to_create_note" });
  }
});

router.put("/notes/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await storage.updateNote(DEV_USER_ID, id, req.body);

    if (!updated) {
      return res.status(404).json({ message: "note_not_found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("[dev:notes:update]", err);
    res.status(500).json({ message: "failed_to_update_note" });
  }
});

router.delete("/notes/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const ok = await storage.deleteNote(DEV_USER_ID, id);

    if (!ok) {
      return res.status(404).json({ message: "note_not_found" });
    }

    res.status(204).end();
  } catch (err) {
    console.error("[dev:notes:delete]", err);
    res.status(500).json({ message: "failed_to_delete_note" });
  }
});

export default router;

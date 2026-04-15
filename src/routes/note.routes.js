import express from "express";
import {
    createProjectNote,
    deleteProjectNote,
    getProjectNotes,
    getProjectNotesById,
    updateProjectNote
} from "#controllers/note.controllers.js";

import { validate } from "#middlewares/validator.middleware.js";
import { createNoteValidator, updateNoteValidator } from "#validators/index.js";
import { allowAdmin, verifyJWT } from "#middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

// 📌 Get all notes (role-based)
router.get("/:projectId", getProjectNotes);

// 📌 Create note (Admin only)
router.post("/:projectId", allowAdmin, createNoteValidator(), validate, createProjectNote);


// 📌 Get single note
router.get("/:projectId/n/:noteId", getProjectNotesById);

// 📌 Update note (Admin or owner)
router.put(
    "/:projectId/n/:noteId",
    updateNoteValidator(),
    validate,
    updateProjectNote
);

// 📌 Delete note (Admin or owner)
router.delete("/:projectId/n/:noteId", deleteProjectNote);

export default router;
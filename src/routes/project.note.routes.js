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
import { verifyJWT } from "#middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post(
    "/:projectId",
    createNoteValidator(),
    validate,
    createProjectNote
);

router.patch(
    "/:projectNoteId",
    updateNoteValidator(),
    validate,
    updateProjectNote
);

router.delete("/:projectNoteId", deleteProjectNote);

router.get("/project/:projectId", getProjectNotes);

router.get("/:projectNoteId", getProjectNotesById);

export default router;
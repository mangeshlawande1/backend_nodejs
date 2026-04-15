import { Router } from "express";

import { getProjectDashboard } from "#controllers/dashboard.controller.js";
import { verifyJWT, validateProjectPermission } from "#middlewares/auth.middleware.js";
import { validate } from "#middlewares/validator.middleware.js";
import { AvailableUserRole } from "#utils/constants.js";
import { projectIdValidator } from "#validators/index.js";

const router = Router();

// 🔐 All routes require authentication
router.use(verifyJWT);

//
// 📊 PROJECT DASHBOARD
//

// GET /api/dashboard/:projectId
router.get(
    "/:projectId",
    projectIdValidator(),                 // validate projectId
    validate,                             // check validation errors
    validateProjectPermission(AvailableUserRole), // any project member
    getProjectDashboard                   // controller
);

export default router;
import express from "express";
import {
    createTask,
    updateTask,
    deleteTask,
    getTasks,
    getTaskById
} from "#controllers/task.controllers.js";

import {
    createSubTask,
    updateSubTask,
    deleteSubTask
} from "#controllers/subtask.controllers.js";

import {
    createTaskValidator,
    updateTaskValidator,
    getTaskValidator,
    getTasksValidator
} from "#validators/task.validators.js";

import {
    createSubTaskValidator,
    updateSubTaskValidator,
    deleteSubTaskValidator
} from "#validators/subtask.validators.js";

import { validate } from "#middlewares/validator.middleware.js";
import { verifyJWT, allowAdmin } from "#middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

//
// 🔹 TASK ROUTES
//

// 📌 Get all tasks
router.get(
    "/:projectId",
    getTasksValidator(),
    validate,
    getTasks
);

// 📌 Create task
router.post(
    "/:projectId",
    allowAdmin,
    createTaskValidator(),
    validate,
    createTask
);

// 📌 Get single task
router.get(
    "/:projectId/t/:taskId",
    getTaskValidator(),
    validate,
    getTaskById
);

// 📌 Update task
router.put(
    "/:projectId/t/:taskId",
    allowAdmin,
    updateTaskValidator(),
    validate,
    updateTask
);

// 📌 Delete task
router.delete(
    "/:projectId/t/:taskId",
    allowAdmin,
    getTaskValidator(),
    validate,
    deleteTask
);


//
// 🔹 SUBTASK ROUTES
//

// 📌 Create subtask
router.post(
    "/:projectId/t/:taskId/subtasks",
    allowAdmin,
    createSubTaskValidator(),
    validate,
    createSubTask
);

// 📌 Update subtask
router.put(
    "/:projectId/st/:subTaskId",
    updateSubTaskValidator(),
    validate,
    updateSubTask
);

// 📌 Delete subtask
router.delete(
    "/:projectId/st/:subTaskId",
    allowAdmin,
    deleteSubTaskValidator(),
    validate,
    deleteSubTask
);

export default router;
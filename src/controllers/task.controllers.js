import { Project } from "#models/project.models.js";
import { SubTask } from "#models/subtask.models.js";
import { Task } from "#models/task.models.js";
import { ApiError } from "#utils/ApiError.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { UserRoleEnum } from "#utils/constants.js";
import mongoose from "mongoose";

//
// 📌 GET ALL TASKS
//
const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid projectId");
    }

    const project = await Project.exists({ _id: projectId });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const tasks = await Task.find({ project: projectId })
        .populate("assignedTo", "avatar username fullname");

    return res.status(200).json(
        new ApiResponse(200, tasks, "Tasks fetched successfully")
    );
});

//
// 📌 CREATE TASK
//
const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid projectId");
    }

    const project = await Project.exists({ _id: projectId });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    if (!title || !title.trim()) {
        throw new ApiError(400, "Title is required");
    }

    // safer file handling
    const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files || {}).flat();

    const baseUrl =
        process.env.SERVER_URL ||
        `${req.protocol}://${req.get("host")}`;

    const attachments = files.map((file) => ({
        url: `${baseUrl}/images/${file.filename}`,
        mimetype: file.mimetype,
    }));

    const task = await Task.create({
        title: title.trim(),
        description,
        project: projectId,
        assignedTo: assignedTo || undefined,
        status,
        assignedBy: req.user._id,
        attachments,
    });

    return res.status(201).json(
        new ApiResponse(201, task, "Task created successfully")
    );
});

//
// 📌 GET TASK BY ID
//
const getTaskById = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(projectId) ||
        !mongoose.Types.ObjectId.isValid(taskId)
    ) {
        throw new ApiError(400, "Invalid IDs");
    }

    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId),
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "subtasks", // ⚠️ ensure this matches your DB collection name
                localField: "_id",
                foreignField: "task",
                as: "subTasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            createdBy: {
                                $arrayElemAt: ["$createdBy", 0],
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                assignedTo: {
                    $arrayElemAt: ["$assignedTo", 0],
                },
            },
        },
    ]);

    if (!task.length) {
        throw new ApiError(404, "Task not found");
    }

    return res.status(200).json(
        new ApiResponse(200, task[0], "Task fetched successfully")
    );
});

//
// 📌 UPDATE TASK
//
const updateTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;
    const { title, description, status, assignedTo } = req.body;

    if (
        !mongoose.Types.ObjectId.isValid(projectId) ||
        !mongoose.Types.ObjectId.isValid(taskId)
    ) {
        throw new ApiError(400, "Invalid IDs");
    }

    const task = await Task.findOne({
        _id: taskId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found in this project");
    }

    // Authorization
    if (
        (!task.assignedBy ||
            task.assignedBy.toString() !== req.user._id.toString()) &&
        req.user.role !== UserRoleEnum.ADMIN
    ) {
        throw new ApiError(403, "Not allowed to update this task");
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    await task.save();

    return res.status(200).json(
        new ApiResponse(200, task, "Task updated successfully")
    );
});

//
// 📌 DELETE TASK
//
const deleteTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    if (
        !mongoose.Types.ObjectId.isValid(projectId) ||
        !mongoose.Types.ObjectId.isValid(taskId)
    ) {
        throw new ApiError(400, "Invalid IDs");
    }

    const task = await Task.findOne({
        _id: taskId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found in this project");
    }

    if (
        (!task.assignedBy ||
            task.assignedBy.toString() !== req.user._id.toString()) &&
        req.user.role !== UserRoleEnum.ADMIN
    ) {
        throw new ApiError(403, "Not allowed to delete this task");
    }

    await task.deleteOne();
    await SubTask.deleteMany({ task: taskId });

    return res.status(200).json(
        new ApiResponse(200, {}, "Task deleted successfully")
    );
});

export {
    createTask,
    updateTask,
    deleteTask,
    getTasks,
    getTaskById,
};
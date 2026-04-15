import { SubTask } from "#models/subtask.models.js";
import { Task } from "#models/task.models.js";
import { ApiError } from "#utils/ApiError.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { UserRoleEnum } from "#utils/constants.js";




const getSubTasks = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const subTasks = await SubTask.find({ task: taskId })
        .populate("createdBy", "username fullname avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, subTasks, "Subtasks fetched successfully")
    );
});




const getSubTaskById = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;

    const subTask = await SubTask.findById(subTaskId)
        .populate("createdBy", "username fullname avatar")
        .populate("task", "title");

    if (!subTask) {
        throw new ApiError(404, "Subtask not found");
    }

    return res.status(200).json(
        new ApiResponse(200, subTask, "Subtask fetched successfully")
    );
});




const createSubTask = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const { taskId } = req.params;

    if (!title || !title.trim()) {
        throw new ApiError(400, "Title is required");
    }

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const subTask = await SubTask.create({
        title: title.trim(),
        task: taskId,
        createdBy: req.user._id,
    });

    return res.status(201).json(
        new ApiResponse(201, subTask, "Subtask created successfully")
    );
});


const updateSubTask = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;
    const { title, isCompleted } = req.body;

    const subTask = await SubTask.findById(subTaskId);

    if (!subTask) {
        throw new ApiError(404, "Subtask not found");
    }

    // Authorization
    if (
        subTask.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== UserRoleEnum.ADMIN
    ) {
        throw new ApiError(403, "Not allowed to update this subtask");
    }

    if (title !== undefined) {
        if (!title.trim()) {
            throw new ApiError(400, "Title cannot be empty");
        }
        subTask.title = title.trim();
    }

    if (isCompleted !== undefined) {
        subTask.isCompleted = isCompleted;
    }

    await subTask.save();

    return res.status(200).json(
        new ApiResponse(200, subTask, "Subtask updated successfully")
    );
});



const deleteSubTask = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;

    const subTask = await SubTask.findById(subTaskId);

    if (!subTask) {
        throw new ApiError(404, "Subtask not found");
    }

    if (
        subTask.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== UserRoleEnum.ADMIN
    ) {
        throw new ApiError(403, "Not allowed to delete this subtask");
    }

    await subTask.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Subtask deleted successfully")
    );
});


export {
    createSubTask,
    updateSubTask,
    deleteSubTask,
    getSubTasks,
    getSubTaskById,
};

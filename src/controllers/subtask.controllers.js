import mongoose from 'mongoose';
import { SubTask } from '#models/subtask.models.js';
import { Task } from '#models/task.models.js';
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';
import { UserRoleEnum } from '#utils/constants.js';

//
// 📌 CREATE SUBTASK
//
const createSubTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(taskId)
  ) {
    throw new ApiError(400, 'Invalid IDs');
  }

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Title is required');
  }

  const task = await Task.findOne({
    _id: taskId,
    project: projectId,
  });

  if (!task) {
    throw new ApiError(404, 'Task not found in this project');
  }

  const subTask = await SubTask.create({
    title: title.trim(),
    task: taskId,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subTask, 'Subtask created successfully'));
});

//
// 📌 UPDATE SUBTASK
//
const updateSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  const { title, isCompleted } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(subTaskId)
  ) {
    throw new ApiError(400, 'Invalid IDs');
  }

  const subTask = await SubTask.findById(subTaskId).populate('task');

  if (
    !subTask ||
    !subTask.task ||
    subTask.task.project.toString() !== projectId
  ) {
    throw new ApiError(404, 'Subtask not found in this project');
  }

  if (
    (!subTask.createdBy ||
      subTask.createdBy.toString() !== req.user._id.toString()) &&
    req.user.role !== UserRoleEnum.ADMIN
  ) {
    throw new ApiError(403, 'Not allowed to update this subtask');
  }

  if (title !== undefined) {
    if (!title.trim()) {
      throw new ApiError(400, 'Title cannot be empty');
    }
    subTask.title = title.trim();
  }

  if (isCompleted !== undefined) {
    if (typeof isCompleted !== 'boolean') {
      throw new ApiError(400, 'isCompleted must be boolean');
    }
    subTask.isCompleted = isCompleted;
  }

  await subTask.save();

  return res
    .status(200)
    .json(new ApiResponse(200, subTask, 'Subtask updated successfully'));
});

//
// 📌 DELETE SUBTASK
//
const deleteSubTask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(subTaskId)
  ) {
    throw new ApiError(400, 'Invalid IDs');
  }

  const subTask = await SubTask.findById(subTaskId).populate('task');

  if (
    !subTask ||
    !subTask.task ||
    subTask.task.project.toString() !== projectId
  ) {
    throw new ApiError(404, 'Subtask not found in this project');
  }

  if (
    (!subTask.createdBy ||
      subTask.createdBy.toString() !== req.user._id.toString()) &&
    req.user.role !== UserRoleEnum.ADMIN
  ) {
    throw new ApiError(403, 'Not allowed to delete this subtask');
  }

  await subTask.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Subtask deleted successfully'));
});

export { createSubTask, updateSubTask, deleteSubTask };

import { Project } from "#models/project.models.js";
import { SubTask } from "#models/substask.models.js";
import { Task } from "#models/task.models.js";
import { User } from "#models/user.models.js";
import { ApiError } from "#utils/ApiError.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { AvailableUserRole, UserRoleEnum } from "#utils/constants.js";
import mongoose from "mongoose";

const getTasks = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});


const createTask = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});


const getTaskById = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});


const updateTask = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});



const deleteTask = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});



const getSubTasks = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});


const getSubTaskById = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});


const createSubTask = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});


const updateSubTask = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});


const deleteSubTask = asyncHandler(async (requestAnimationFrame, res) => {
    // test
});


export {
    createTask,
    updateTask,
    deleteTask,
    getTasks,
    getTaskById,
    createSubTask,
    updateSubTask,
    deleteSubTask,
    getSubTasks,
    getSubTaskById
}
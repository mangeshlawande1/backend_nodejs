import { Project } from "#models/project.models.js";
import { SubTask } from "#models/substask.models.js";
import { Task } from "#models/task.models.js";
import { ApiError } from "#utils/ApiError.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { UserRoleEnum } from "#utils/constants.js";
import mongoose from "mongoose";

const getTasks = asyncHandler(async (req, res) => {
    // test
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    const tasks = await Task.find({
        project: projectId,
    }).populate("assignedTo", "avatar username fullname")

    return res
        .status(200)
        .json(new ApiResponse(
            201, tasks, "tasks fetched successfully !!"
        ));

});


const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;
    const { projectId } = req.params;

    const project = Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found")
    }
    // mimetype :: extension of file like .pdf , .csv etc
    const files = req.files || [];
    const attachments = files.map((file) => {
        return {
            url: `${process.env.SERVER_URL}/images/${file.filename}`,
            mimetype: file.mimetype,

        }
    });

    const task = await Task.create({
        title,
        description,
        project: projectId,
        assignedTo: assignedTo || undefined,
        status,
        assignedBy: req.user._id,
        attachments,
    });

    return res
        .status(201)
        .json(new ApiResponse(
            201, task, "task created successfully !!"
        ));

});




const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(taskId) }
        },
        {
            //assignedTo
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
                            avatar: 1
                        }
                    },

                ]
            }
        },
        {
            $lookup: {
                from: "subTasks",
                localField: "_id",
                foreignField: "task",
                as: "subTasks",
                // assigned some user 
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            // what information you looking up for 
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            createdBy: {
                                $arrayElemAt: ["$createdBy", 0]
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                assignedTo: {
                    $arrayElemAt: ["$assignedTo", 0]
                }
            }
        }

    ]);

    if (!task || task.length === 0) {
        throw new ApiError(404, "Task not found !")
    }
    return res
        .status(200).json(new ApiResponse(200, task[0], "Tasks fetched Successfully !!"))
});


const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, assignedTo } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    // Authorization (admin or creator)
    if (
        task.assignedBy.toString() !== req.user._id.toString() &&
        req.user.role !== UserRoleEnum.ADMIN
    ) {
        throw new ApiError(403, "Not allowed to update this task");
    }

    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.status = status ?? task.status;
    task.assignedTo = assignedTo ?? task.assignedTo;

    await task.save();

    return res.status(200).json(
        new ApiResponse(200, task, "Task updated successfully")
    );
});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    if (
        task.assignedBy.toString() !== req.user._id.toString() &&
        req.user.role !== UserRoleEnum.ADMIN
    ) {
        throw new ApiError(403, "Not allowed to delete this task");
    }

    await task.deleteOne();

    // optional: delete subtasks
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
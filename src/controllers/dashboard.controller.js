import mongoose from "mongoose";
import { Task } from "#models/task.models.js";
import { ProjectMember } from "#models/projectmember.models.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { ApiError } from "#utils/ApiError.js";
import { asyncHandler } from "#utils/asyncHandler.js";

const getProjectDashboard = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid projectId");
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // 🔹 Parallel queries for performance
    const [
        taskStats,
        memberCount,
        tasksPerUser,
        recentTasks
    ] = await Promise.all([

        // 📊 Task stats
        Task.aggregate([
            { $match: { project: projectObjectId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]),

        // 👥 Member count
        ProjectMember.countDocuments({ project: projectId }),

        // 📈 Tasks per user
        Task.aggregate([
            { $match: { project: projectObjectId } },
            {
                $group: {
                    _id: "$assignedTo",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $addFields: {
                    user: { $arrayElemAt: ["$user", 0] }
                }
            },
            {
                $project: {
                    count: 1,
                    "user.username": 1,
                    "user.avatar": 1
                }
            }
        ]),

        // 🕒 Recent tasks
        Task.find({ project: projectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("title status createdAt")
    ]);

    // 🔹 Normalize task stats
    const statsMap = {
        TODO: 0,
        IN_PROGRESS: 0,
        DONE: 0
    };

    taskStats.forEach(stat => {
        statsMap[stat._id] = stat.count;
    });

    const totalTasks =
        statsMap.TODO +
        statsMap.IN_PROGRESS +
        statsMap.DONE;

    return res.status(200).json(
        new ApiResponse(200, {
            summary: {
                totalTasks,
                completed: statsMap.DONE,
                inProgress: statsMap.IN_PROGRESS,
                todo: statsMap.TODO,
                members: memberCount
            },
            charts: {
                tasksByStatus: statsMap,
                tasksPerUser
            },
            recentTasks
        }, "Dashboard data fetched successfully")
    );
});

export { getProjectDashboard };
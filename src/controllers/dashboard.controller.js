import mongoose from 'mongoose';

import { Task } from '#models/task.models.js';
import { Project } from '#models/project.models.js';
import { ProjectMember } from '#models/projectmember.models.js';

import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';
import { TaskStatusEnum } from '#utils/constants.js';

/* =========================================================
   GET PROJECT DASHBOARD
========================================================= */

const getProjectDashboard = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  /* =========================================================
     VALIDATE PROJECT ID
  ========================================================= */

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid project id');
  }

  const projectObjectId =
    new mongoose.Types.ObjectId(projectId);

  /* =========================================================
     CHECK PROJECT EXISTS
  ========================================================= */

  const project = await Project.exists({
    _id: projectObjectId,
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  /* =========================================================
     CHECK USER ACCESS
  ========================================================= */

  const isProjectMember =
    await ProjectMember.exists({
      project: projectObjectId,
      user: req.user._id,
    });

  if (!isProjectMember) {
    throw new ApiError(
      403,
      'You do not have access to this project dashboard',
    );
  }

  /* =========================================================
     RUN DASHBOARD QUERIES IN PARALLEL
  ========================================================= */

  const [
    taskStats,
    memberCount,
    tasksPerUser,
    recentTasks,
  ] = await Promise.all([
    /* =========================================================
       TASK STATS
    ========================================================= */

    Task.aggregate([
      {
        $match: {
          project: projectObjectId,
        },
      },
      {
        $group: {
          _id: '$status',
          count: {
            $sum: 1,
          },
        },
      },
    ]),

    /* =========================================================
       MEMBER COUNT
    ========================================================= */

    ProjectMember.countDocuments({
      project: projectObjectId,
    }),

    /* =========================================================
       TASKS PER USER
    ========================================================= */

    Task.aggregate([
      {
        $match: {
          project: projectObjectId,
          assignedTo: {
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: '$assignedTo',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
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
          user: {
            $arrayElemAt: ['$user', 0],
          },
        },
      },
      {
        $project: {
          _id: 0,
          count: 1,
          user: 1,
        },
      },
    ]),

    /* =========================================================
       RECENT TASKS
    ========================================================= */

    Task.find({
      project: projectObjectId,
    })
      .populate(
        'assignedTo',
        'username fullname avatar',
      )
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .select(
        'title status assignedTo createdAt',
      )
      .lean(),
  ]);

  /* =========================================================
     NORMALIZE TASK STATS
  ========================================================= */

  const statsMap = {
    [TaskStatusEnum.TODO]: 0,
    [TaskStatusEnum.IN_PROGRESS]: 0,
    [TaskStatusEnum.DONE]: 0,
  };

  taskStats.forEach((stat) => {
    statsMap[stat._id] = stat.count;
  });

  const totalTasks =
    statsMap[TaskStatusEnum.TODO] +
    statsMap[TaskStatusEnum.IN_PROGRESS] +
    statsMap[TaskStatusEnum.DONE];

  /* =========================================================
     RESPONSE
  ========================================================= */

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          totalTasks,
          completed:
            statsMap[TaskStatusEnum.DONE],

          inProgress:
            statsMap[
            TaskStatusEnum.IN_PROGRESS
            ],

          todo:
            statsMap[TaskStatusEnum.TODO],

          members: memberCount,
        },

        charts: {
          tasksByStatus: statsMap,
          tasksPerUser,
        },

        recentTasks,
      },
      'Dashboard data fetched successfully',
    ),
  );
});

export { getProjectDashboard };
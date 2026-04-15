import mongoose from "mongoose";
import { User } from "#models/user.models.js";
import { Project } from "#models/project.models.js";
import { ProjectMember } from "#models/projectmember.models.js";

import { ApiResponse } from "#utils/ApiResponse.js";
import { ApiError } from "#utils/ApiError.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { AvailableUserRole, UserRoleEnum } from "#utils/constants.js";

//
// 🔐 Helper: Check Admin
//
const checkAdmin = async (projectId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid projectId");
    }

    const isAdmin = await ProjectMember.exists({
        project: projectId,
        user: userId,
        role: UserRoleEnum.ADMIN,
    });

    if (!isAdmin) {
        throw new ApiError(403, "Admin access required");
    }
};

//
// 📌 GET ALL PROJECTS
//
const getProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmembers",
                            localField: "_id",
                            foreignField: "project",
                            as: "membersList",
                        },
                    },
                    {
                        $addFields: {
                            members: { $size: "$membersList" },
                        },
                    },
                ],
            },
        },
        { $unwind: "$project" },
        {
            $project: {
                _id: 0,
                role: 1,
                project: {
                    _id: "$project._id",
                    name: "$project.name",
                    description: "$project.description",
                    members: "$project.members",
                    createdAt: "$project.createdAt",
                    createdBy: "$project.createdBy",
                },
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, projects, "Projects fetched successfully")
    );
});

//
// 📌 GET PROJECT BY ID
//
const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid projectId");
    }

    const member = await ProjectMember.exists({
        project: projectId,
        user: req.user._id,
    });

    if (!member) {
        throw new ApiError(403, "Access denied");
    }

    const project = await Project.findById(projectId).lean();

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res.status(200).json(
        new ApiResponse(200, project, "Project retrieved successfully")
    );
});

//
// 📌 CREATE PROJECT
//
const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(400, "Project name is required");
    }

    const project = await Project.create({
        name: name.trim(),
        description,
        createdBy: req.user._id,
    });

    await ProjectMember.create({
        user: req.user._id,
        project: project._id,
        role: UserRoleEnum.ADMIN,
    });

    return res.status(201).json(
        new ApiResponse(201, project, "Project created successfully")
    );
});

//
// 📌 UPDATE PROJECT
//
const updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description } = req.body;

    await checkAdmin(projectId, req.user._id);

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    const project = await Project.findByIdAndUpdate(
        projectId,
        updateData,
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res.status(200).json(
        new ApiResponse(200, project, "Project updated successfully")
    );
});

//
// 📌 DELETE PROJECT
//
const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    await checkAdmin(projectId, req.user._id);

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // cleanup related data
    await ProjectMember.deleteMany({ project: projectId });

    return res.status(200).json(
        new ApiResponse(200, {}, "Project deleted successfully")
    );
});

//
// 📌 ADD / UPDATE MEMBER
//
const addMembersToProject = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const { projectId } = req.params;

    await checkAdmin(projectId, req.user._id);

    if (!AvailableUserRole.includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    const user = await User.findOne({
        email: email.toLowerCase().trim(),
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const projectMember = await ProjectMember.findOneAndUpdate(
        {
            user: user._id,
            project: projectId,
        },
        {
            user: user._id,
            project: projectId,
            role,
        },
        {
            new: true,
            upsert: true,
        }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { projectMember, user },
            "Member added/updated successfully"
        )
    );
});

//
// 📌 GET PROJECT MEMBERS
//
const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid projectId");
    }

    const members = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
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
                user: { $arrayElemAt: ["$user", 0] },
            },
        },
        {
            $project: {
                _id: 0,
                user: 1,
                role: 1,
                createdAt: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, members, "Project members fetched")
    );
});

//
// 📌 UPDATE MEMBER ROLE
//
const updateMemberRole = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    await checkAdmin(projectId, req.user._id);

    if (!AvailableUserRole.includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    const projectMember = await ProjectMember.findOneAndUpdate(
        {
            project: projectId,
            user: userId,
        },
        { role },
        { new: true }
    );

    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }

    return res.status(200).json(
        new ApiResponse(200, projectMember, "Role updated successfully")
    );
});

//
// 📌 DELETE MEMBER
//
const deleteMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;

    await checkAdmin(projectId, req.user._id);

    const projectMember = await ProjectMember.findOneAndDelete({
        project: projectId,
        user: userId,
    });

    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Member removed successfully")
    );
});

export {
    createProject,
    getProjects,
    updateProject,
    deleteProject,
    getProjectById,
    addMembersToProject,
    getProjectMembers,
    deleteMember,
    updateMemberRole,
};
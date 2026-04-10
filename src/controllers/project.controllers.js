import { User } from "#models/user.models.js";
import { Project, Project } from "#models/project.models.js";
import { ProjectMember } from "#models/projectmember.models.js";

import { ApiResponse } from "#utils/ApiResponse.js"
import { ApiError } from "#utils/ApiError.js"
import { asyncHandler, } from "#utils/asyncHandler.js";
import mongoose from "mongoose";
import { UserRoleEnum } from "#utils/constants.js";

const getProjects = asyncHandler(async (req, res) => {
    try {

        const projects = await ProjectMember.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user?._id),
                }
            },
            {
                $lookup: {
                    from: "projects",
                    localField: "projects",
                    foreignField: "_id",
                    as: "projects",
                    pipeline: [
                        {
                            $lookup: {
                                from: "projectmembers",
                                localField: "_id",
                                foreignField: "projects",
                                as: "projectmembers",
                            }
                        },
                        {
                            $addFields: {
                                members: {
                                    $size: "$projectmembers",
                                }
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$project"
            }, {
                $project: {
                    project: {
                        _id: "$projects._id",
                        name: "$projects.name",
                        description: "$projects.description",
                        members: "$projects.members",
                        createdAt: "$projects.createdAt",
                        createdBy: "$projects.createdBy",
                    },
                    role: 1,
                    _id: 0,
                }
            }
        ]);

        return res
            .status(201)
            .json(
                new ApiResponse(200, projects,
                    "Projects fetched successfully ."
                )
            );


    } catch (error) {
        throw new ApiError(501, error);
    }


});//y


const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId);

        if (!project) {
            throw new ApiError(404, "Project Not Found !")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, project, "Project Retrieved Successfully!")
            )
    } catch (error) {
        throw new ApiError(503, error)
    }

});//y


const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    try {
        const project = await Project.create({
            name,
            description,
            createdBy: new mongoose.Types.ObjectId(req.user?._id)
        });

        await ProjectMember.create({
            user: new mongoose.Types.ObjectId(req.user?._id),
            project: new mongoose.Types.ObjectId(project._id),
            role: UserRoleEnum.ADMIN,
        });

        return res
            .status(201)
            .json(
                new ApiResponse(
                    200, "Project Created Successfully !"
                )
            );
    } catch (error) {
        throw new ApiError(501, error)
    };



});//y


const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { projectId } = req.params;

    try {
        const project = await Project.findByIdAndUpdate(
            projectId,
            {
                name,
                description
            },
            {
                new: true,
            }
        );

        if (!project) {
            throw new ApiError(404, "Project Not found ! ")
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    project,
                    "Project Updated successfully !"
                )
            );

    } catch (error) {
        throw new ApiError(503, error)
    }

});//y


const deleteProject = asyncHandler(async (req, res) => {
    // test 
    const { projectId } = req.params

    try {
        const project = await Project.findByIdAndDelete(projectId);

        if (!project) {
            throw new ApiError(404, "Project Not found ! ")
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    project,
                    "Project deleted successfully !"
                )
            );
    } catch (error) {
        throw new ApiError(508, error)
    }
});//y


const addMembersToProject = asyncHandler(async (req, res) => {
    /**
     projectId, email, role

     User
  → Find memberships
      → Get project details
          → Count members in each project
              → Return clean response


     
     */

    const { email, role } = req.body;
    const { projectId } = req.params;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            throw new ApiError(404, "User Not found !!");
        };

        const project = await ProjectMember.findByIdAndUpdate(
            {
                user: new mongoose.Types.ObjectId(user._id),
                project: new mongoose.Types.ObjectId(projectId)
            },
            {
                user: new mongoose.Types.ObjectId(user._id),
                project: new mongoose.Types.ObjectId(projectId),
                role: role
            },
            {
                new: true,
                upsert: true // create one if not exists 
            }
        );
        if (!project) {
            throw new ApiError(404, "Project Not found !!");
        };

        return res
            .status(201)
            .json(
                new ApiResponse(200, { project: project, user: user }, "Member add to Project successfully !!")
            )
    } catch (error) {
        throw new ApiError(505, error)
    }

});//y

const getProjectMembers = asyncHandler(async (req, res) => {
    /**

     * ProjectMembers
        → Filter by project
            → Join Users
                → Flatten user
                    → Return clean data
     */

    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);

        if (!project) {
            throw new ApiError(404, "Project Not Found");
        };

        const projectMembers = await ProjectMember.aggregate([
            {
                $match: {
                    project: new mongoose.Types.ObjectId(projectId)
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
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    user: {
                        $arrayElemAt: ["$user", 0]
                    }
                }
            },
            {
                $project: {
                    project: 1,
                    user: 1,
                    role: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    _id: 0
                }
            }
        ]);

        if (!projectMembers.length) {
            throw new ApiError(404, "Members not Found !!");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200, projectMembers,
                    "Project Members fetched "
                )
            )


    } catch (error) {
        throw new ApiError(500, error.message)
    }
}); //y


const updateMemberRole = asyncHandler(async (req, res) => {
    // test 
    

});


const deleteMember = asyncHandler(async (req, res) => {
    // test 

});


export {
    addMembersToProject,
    createProject,
    deleteMember,
    getProjects,
    getProjectById,
    getProjectMembers,
    updateProject,
    updateMemberRole,
    deleteProject,
}
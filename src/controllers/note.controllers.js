import { ProjectNote } from "#models/note.models.js";
import { Project } from "#models/project.models.js";
import { ApiError } from "#utils/ApiError.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import { UserRoleEnum } from "#utils/constants.js";




/**
 create note user //create
update notes by Admin or user //update  
get all notes by project //read
get note by id  // 
delete note admin or createdBy //delete


*/

const createProjectNote = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { content } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project Not Found !!");
    };
    if (!content || !content.trim()) {
        throw new ApiError(400, "content is required !!");
    };

    const projectNote = await ProjectNote.create({
        project: projectId,
        createdBy: req.user._id,
        content: content,
    });

    if (!projectNote) {
        throw new ApiError(400, "Error occured while creating project note ! ")
    };

    return res
        .status(201)
        .json(new ApiResponse(200, projectNote, "Project note created successfully"))

});


const updateProjectNote = asyncHandler(async (req, res) => {
    const { projectNoteId } = req.params;
    const { content } = req.body;

    const projectNote = await ProjectNote.findById(projectNoteId);

    if (!projectNote) {
        throw new ApiError(404, " Project Note not found !")
    };

    if (!content || !content.trim()) {
        throw new ApiError(400, "content is required !!");
    };

    //authorization check 
    if (
        projectNote.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== UserRoleEnum.ADMIN
    ) {
        throw new ApiError(403, "You are not allowed to update this note!")
    };

    projectNote.content = content;
    await projectNote.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, projectNote, "Project note updated successfully")
    );

});


const deleteProjectNote = asyncHandler(async (req, res) => {

    const { projectNoteId } = req.params;

    const note = await ProjectNote.findById(projectNoteId);

    if (!note) {
        throw new ApiError(404, "Project Note not found !! ");
    };

    if (
        note.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== UserRoleEnum.ADMIN
    ) {
        throw new ApiError(403, "You are not allowed to delete this note!");
    };

    await note.deleteOne();

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Project note deleted successfully")
        );

});


const getProjectNotes = asyncHandler(async (req, res) => {
    //📖 3. Get All Notes by Project
    const { page = 1, limit = 10 } = req.query;

    const { projectId } = req.params;

    const pageNumber = Math.max(parseInt(page) || 1, 1); const limitNumber = Math.min(parseInt(limit) || 10, 50);

    const skip = (pageNumber - 1) * limitNumber;

    const notes = await ProjectNote.find({
        project: projectId,
    })
        .populate("createdBy", "name email")
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 }); // optional (latest first)

    const totalNotes = await ProjectNote.countDocuments({
        project: projectId,
    });

    return res.status(200).json(
        new ApiResponse(200, {
            notes,
            pagination: {
                total: totalNotes,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalNotes / limitNumber),
            },
        },
            "Project notes fetched successfully")
    );
});


const getProjectNotesById = asyncHandler(async (req, res) => {
    //Get Note by ID
    const { projectNoteId } = req.params;

    const note = await ProjectNote
        .findById(projectNoteId)
        .populate("createdBy", "name email ")
        .populate("project", "name");


    if (!note) {
        throw new ApiError(404, "Project Note not found!");
    }

    return res.status(201).json(
        new ApiResponse(200, note, "Project note fetched successfully")
    );



});

export {
    createProjectNote,
    updateProjectNote,
    deleteProjectNote,
    getProjectNotes,
    getProjectNotesById,
};

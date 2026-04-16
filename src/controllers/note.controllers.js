import { ProjectNote } from '#models/note.models.js';
import { Project } from '#models/project.models.js';
import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';
import { UserRoleEnum } from '#utils/constants.js';

const createProjectNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  const project = await Project.exists({ _id: projectId });

  if (!project) {
    throw new ApiError(404, 'Project Not Found !!');
  }
  if (!content || !content.trim()) {
    throw new ApiError(400, 'content is required !!');
  }

  const projectNote = await ProjectNote.create({
    project: projectId,
    createdBy: req.user._id,
    content,
  });

  if (!projectNote) {
    throw new ApiError(400, 'Error occured while creating project note ! ');
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, projectNote, 'Project note created successfully'),
    );
});

const updateProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content } = req.body;

  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  });

  if (!note) {
    throw new ApiError(404, 'Note not found in this project!');
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Content is required!');
  }

  // Authorization
  if (
    note.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== UserRoleEnum.ADMIN
  ) {
    throw new ApiError(403, 'Not allowed to update this note!');
  }

  note.content = content;
  await note.save();

  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note updated successfully'));
});

const deleteProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  });

  if (!note) {
    throw new ApiError(404, 'Note not found in this project!');
  }

  // Authorization
  if (
    note.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== UserRoleEnum.ADMIN
  ) {
    throw new ApiError(403, 'Not allowed to delete this note!');
  }

  await note.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Note deleted successfully'));
});

const getProjectNotes = asyncHandler(async (req, res) => {
  //📖 3. Get All Notes by Project
  const { projectId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Number(limit) || 10, 50);

  const skip = (pageNumber - 1) * limitNumber;

  const notes = await ProjectNote.find({
    project: projectId,
  })
    .populate('createdBy', 'name email')
    .skip(skip)
    .limit(limitNumber)
    .sort({ createdAt: -1 }); // optional (latest first)

  const totalNotes = await ProjectNote.countDocuments({
    project: projectId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notes,
        pagination: {
          total: totalNotes,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(totalNotes / limitNumber),
        },
      },
      'Project notes fetched successfully',
    ),
  );
});

const getProjectNotesById = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  })
    .populate('createdBy', 'name email')
    .populate('project', 'name');

  if (!note) {
    throw new ApiError(404, 'Note not found in this project!');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note fetched successfully'));
});

export {
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  getProjectNotes,
  getProjectNotesById,
};

import mongoose from 'mongoose';

import { Project } from '#models/project.models.js';
import { ProjectNote } from '#models/note.models.js';

import { ApiError } from '#utils/ApiError.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { asyncHandler } from '#utils/asyncHandler.js';
import { UserRoleEnum } from '#utils/constants.js';

/* =========================================================
   CREATE PROJECT NOTE
========================================================= */

const createProjectNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid project id');
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Content is required');
  }

  const project = await Project.exists({
    _id: projectId,
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const note = await ProjectNote.create({
    project: projectId,
    createdBy: req.user._id,
    content: content.trim(),
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      note,
      'Project note created successfully',
    ),
  );
});

/* =========================================================
   UPDATE PROJECT NOTE
========================================================= */

const updateProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content, isPinned } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(noteId)
  ) {
    throw new ApiError(400, 'Invalid ids');
  }

  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  });

  if (!note) {
    throw new ApiError(
      404,
      'Project note not found',
    );
  }

  // authorization
  const isOwner =
    note.createdBy.toString() ===
    req.user._id.toString();

  const isAdmin =
    req.user.role === UserRoleEnum.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(
      403,
      'You are not allowed to update this note',
    );
  }

  if (content !== undefined) {
    if (!content.trim()) {
      throw new ApiError(
        400,
        'Content cannot be empty',
      );
    }

    note.content = content.trim();
  }

  if (typeof isPinned === 'boolean') {
    note.isPinned = isPinned;
  }

  await note.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      note,
      'Project note updated successfully',
    ),
  );
});

/* =========================================================
   DELETE PROJECT NOTE
========================================================= */

const deleteProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(noteId)
  ) {
    throw new ApiError(400, 'Invalid ids');
  }

  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  });

  if (!note) {
    throw new ApiError(
      404,
      'Project note not found',
    );
  }

  // authorization
  const isOwner =
    note.createdBy.toString() ===
    req.user._id.toString();

  const isAdmin =
    req.user.role === UserRoleEnum.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(
      403,
      'You are not allowed to delete this note',
    );
  }

  await note.deleteOne();

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      'Project note deleted successfully',
    ),
  );
});

/* =========================================================
   GET ALL PROJECT NOTES
========================================================= */

const getProjectNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const page = Math.max(
    parseInt(req.query.page) || 1,
    1,
  );

  const limit = Math.min(
    parseInt(req.query.limit) || 10,
    50,
  );

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, 'Invalid project id');
  }

  const project = await Project.exists({
    _id: projectId,
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const skip = (page - 1) * limit;

  const notes = await ProjectNote.find({
    project: projectId,
  })
    .populate(
      'createdBy',
      'username fullname email avatar',
    )
    .sort({
      isPinned: -1,
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalNotes =
    await ProjectNote.countDocuments({
      project: projectId,
    });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notes,
        pagination: {
          total: totalNotes,
          page,
          limit,
          totalPages: Math.ceil(
            totalNotes / limit,
          ),
        },
      },
      'Project notes fetched successfully',
    ),
  );
});

/* =========================================================
   GET PROJECT NOTE BY ID
========================================================= */

const getProjectNoteById = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(noteId)
  ) {
    throw new ApiError(400, 'Invalid ids');
  }

  const note = await ProjectNote.findOne({
    _id: noteId,
    project: projectId,
  })
    .populate(
      'createdBy',
      'username fullname email avatar',
    )
    .populate(
      'project',
      'name description',
    )
    .lean();

  if (!note) {
    throw new ApiError(
      404,
      'Project note not found',
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      note,
      'Project note fetched successfully',
    ),
  );
});

export {
  createProjectNote,
  updateProjectNote,
  deleteProjectNote,
  getProjectNotes,
  getProjectNoteById,
};
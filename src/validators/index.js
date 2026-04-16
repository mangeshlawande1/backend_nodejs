import { AvailableUserRole, AvailableTaskStatues } from '#utils/constants.js';
import { body, param } from 'express-validator';

//
// 🔹 COMMON VALIDATORS
//

const mongoIdParam = (field) =>
  param(field).isMongoId().withMessage(`Invalid ${field}`);

const projectIdValidator = () => {
  return [mongoIdParam('projectId')];
};

//
// 🔹 USER VALIDATORS
//

const userRegisterValidator = () => [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is Required')
    .isEmail()
    .withMessage('Invalid Email'),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLowercase()
    .withMessage('Username must be lowercase')
    .isLength({ min: 3 })
    .withMessage('Min 3 chars required'),

  body('password').trim().notEmpty().withMessage('Password is required'),

  body('fullname').optional().trim(),
];

const userLoginValidator = () => [
  body().custom((_, { req }) => {
    if (!req.body.email && !req.body.username) {
      throw new Error('Email or username required');
    }
    return true;
  }),

  body('email').optional().isEmail(),
  body('username').optional().notEmpty(),
  body('password').notEmpty().isLength({ min: 6 }),
];

const userChangeCurrentPasswordValidator = () => [
  body('oldPassword').notEmpty(),
  body('newPassword').notEmpty(),
];

const userForgotPasswordValidator = () => [body('email').notEmpty().isEmail()];

const userResetForgotPasswordValidator = () => [body('newPassword').notEmpty()];

//
// 🔹 PROJECT VALIDATORS
//

const createProjectValidator = () => [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional(),
];

const updateProjectValidator = () => [
  mongoIdParam('projectId'),

  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),

  body('description').optional(),
];

const addMemberToProjectValidator = () => [
  mongoIdParam('projectId'),

  body('email').trim().notEmpty().isEmail().withMessage('Valid email required'),

  body('role').notEmpty().isIn(AvailableUserRole).withMessage('Invalid role'),
];

//
// 🔹 NOTE VALIDATORS
//

const createNoteValidator = () => [
  mongoIdParam('projectId'),
  body('content').trim().notEmpty().withMessage('Content required'),
];

const updateNoteValidator = () => [
  mongoIdParam('projectId'),
  mongoIdParam('noteId'),
  body('content').trim().notEmpty().withMessage('Content required'),
];

//
// 🔹 TASK VALIDATORS
//

const createTaskValidator = () => [
  mongoIdParam('projectId'),

  body('title').trim().notEmpty().withMessage('Title required'),

  body('description').optional().isString(),

  body('assignedTo').optional().isMongoId(),

  body('status').optional().isIn(AvailableTaskStatues),
];

const updateTaskValidator = () => [
  mongoIdParam('projectId'),
  mongoIdParam('taskId'),

  body('title').optional().trim().notEmpty(),

  body('description').optional().isString(),

  body('assignedTo').optional().isMongoId(),

  body('status').optional().isIn(AvailableTaskStatues),
];

const getTaskValidator = () => [
  mongoIdParam('projectId'),
  mongoIdParam('taskId'),
];

const getTasksValidator = () => [mongoIdParam('projectId')];

//
// 🔹 SUBTASK VALIDATORS
//

const createSubTaskValidator = () => [
  mongoIdParam('projectId'),
  mongoIdParam('taskId'),

  body('title').trim().notEmpty().withMessage('Title required'),
];

const updateSubTaskValidator = () => [
  mongoIdParam('projectId'),
  mongoIdParam('subTaskId'),

  body('title').optional().trim().notEmpty(),

  body('isCompleted').optional().isBoolean(),
];

const deleteSubTaskValidator = () => [
  mongoIdParam('projectId'),
  mongoIdParam('subTaskId'),
];

//
// 🔹 EXPORTS
//

export {
  createProjectValidator,
  updateProjectValidator,
  addMemberToProjectValidator,
  projectIdValidator,
  userRegisterValidator,
  userLoginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  createNoteValidator,
  updateNoteValidator,
  createTaskValidator,
  updateTaskValidator,
  getTaskValidator,
  getTasksValidator,
  createSubTaskValidator,
  updateSubTaskValidator,
  deleteSubTaskValidator,
};

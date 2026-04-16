import {
  addMembersToProject,
  createProject,
  deleteMember,
  getProjects,
  getProjectById,
  getProjectMembers,
  updateProject,
  updateMemberRole,
  deleteProject,
} from '#controllers/project.controllers.js';

import {
  validateProjectPermission,
  verifyJWT,
} from '#middlewares/auth.middleware.js';
import { validate } from '#middlewares/validator.middleware.js';
import { AvailableUserRole, UserRoleEnum } from '#utils/constants.js';

import {
  createProjectValidator,
  updateProjectValidator,
  addMemberToProjectValidator,
  projectIdValidator,
} from '#validators/index.js';

import { Router } from 'express';

const router = Router();

router.use(verifyJWT);

//
// 📌 PROJECT ROUTES
//

router
  .route('/')
  .get(getProjects)
  .post(createProjectValidator(), validate, createProject);

router
  .route('/:projectId')
  .get(
    projectIdValidator(),
    validate,
    validateProjectPermission(AvailableUserRole),
    getProjectById,
  )
  .put(
    updateProjectValidator(),
    validate,
    validateProjectPermission([UserRoleEnum.ADMIN]),
    updateProject,
  )
  .delete(
    projectIdValidator(),
    validate,
    validateProjectPermission([UserRoleEnum.ADMIN]),
    deleteProject,
  );

//
// 📌 MEMBERS ROUTES
//

router
  .route('/:projectId/members')
  .get(
    projectIdValidator(),
    validate,
    validateProjectPermission(AvailableUserRole),
    getProjectMembers,
  )
  .post(
    addMemberToProjectValidator(),
    validate,
    validateProjectPermission([UserRoleEnum.ADMIN]),
    addMembersToProject,
  );

router
  .route('/:projectId/members/:userId')
  .put(
    projectIdValidator(),
    validate,
    validateProjectPermission([UserRoleEnum.ADMIN]),
    updateMemberRole,
  )
  .delete(
    projectIdValidator(),
    validate,
    validateProjectPermission([UserRoleEnum.ADMIN]),
    deleteMember,
  );

export default router;

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
} from "#controllers/project.controllers.js";
import { validateProjectPermission, verifyJWT } from "#middlewares/auth.middleware.js";
import { validate } from "#middlewares/validator.middleware.js";
import { AvailableUserRole, UserRoleEnum } from "#utils/constants.js";
import {
    createProjectValidator,
    addMemberToProjectValidator
} from "#validators/index.js";
import { Router } from "express";


const router = Router();

router.use(verifyJWT,)


router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validate, createProject);


router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUserRole), getProjectById)
    .put(validateProjectPermission([UserRoleEnum.ADMIN,]),
        createProjectValidator(),
        validate,
        updateProject
    )
    .delete(
        validateProjectPermission([UserRoleEnum.ADMIN]),
        deleteProject,
    );
// put a ":" it will considered as params else not  
router
    .route('/:projectId/members')
    .get(getProjectMembers)
    .post(
        validateProjectPermission([UserRoleEnum.ADMIN,]),
        addMemberToProjectValidator(),
        validate,
        addMembersToProject
    );

router
    .route("/:projectId/members/:userId")
    .put(validateProjectPermission([UserRoleEnum.ADMIN,]),
        updateMemberRole)
    .delete(validateProjectPermission([UserRoleEnum.ADMIN]),
        deleteMember)




export default router;

import { ProjectMember } from "#models/projectmember.models.js";
import { User } from "#models/user.models.js";
import { ApiError } from "#utils/ApiError.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import jwt from "jsonwebtoken";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    // req.cookies?.accessToken
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError(401, "Unauthorized request")
    };

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
        );

        if (!user) {
            throw new ApiError(401, "Invalid access token")
        };

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(508, error || "Invalid Access Token")
    };
});

export const allowAdmin = (req, _, next) => {
    if (req.user.role !== UserRoleEnum.ADMIN) {
        throw new ApiError(403, "Admin only access");
    }
    next();
};

export const validateProjectPermission = (roles = []) => {
    return asyncHandler(async (req, _, next) => {
        const { projectId } = req.params;

        if (!projectId) {
            throw new ApiError(400, "Project Id not Found !!");
        }

        let project = await ProjectMember.findOne({
            project: projectId,
            user: req.user._id,
        });

        if (!project) {
            throw new ApiError(400, "Project not Found !!");
        }

        const givenRole = project?.role;
        req.user.role = givenRole;

        if (!roles.includes(givenRole)) {
            throw new ApiError(
                403,
                "You do not have Permission to perform this action !"
            );
        }

        next();
    });
};

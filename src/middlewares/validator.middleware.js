import { ApiError } from "#utils/ApiError.js";
import { validationResult } from "express-validator";

export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) return next();

    const extractedErrors = errors.array().map((err) => ({
        [err.path]: err.msg,
    }));

    throw new ApiError(400, "Invalid request data", extractedErrors);
};
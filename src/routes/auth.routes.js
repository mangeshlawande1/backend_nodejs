import { registerUser } from "#controllers/auth.controllers.js";
import { validate } from "#validators/validator.middleware.js";
import { userRegisterValidator } from "#validators/index.js";
import { Router } from "express";


const router = Router();

/**
 userRegisterValidator --> a function 
 validator --> middlware 
 
 */
router.route("/register").post(userRegisterValidator(),validate, registerUser);

export default router;

import { login, logoutUser, registerUser } from "#controllers/auth.controllers.js";
import { verifyJWT } from "#middlewares/auth.middleware.js";
import { validate } from "#middlewares/validator.middleware.js";
import { userLoginValidator, userRegisterValidator } from "#validators/index.js";
import { Router } from "express";


const router = Router();

/**
 userRegisterValidator --> a function 
 validator --> middlware 
 
 */
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, login);

// private routes 
router.route("/logout").post(verifyJWT,  logoutUser);



export default router;

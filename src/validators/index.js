import { AvailableUserRole } from "#utils/constants.js";
import { body } from "express-validator";



/**
 *  validation --> attach to route.
 * 
 
 userRegistration   
    method runs --> return array 
    body have multiple fields 
    --> put validation on each requird fields 
 */


const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is Required !").
            isEmail()
            .withMessage("Email is Invalid "),

        body("username")
            .trim()
            .isEmpty()
            .withMessage("username is required !")
            .isLowercase()
            .withMessage("username must be be in lowercase !")
            .isLength({ min: 3 })
            .withMessage("username must be at least 3 character long !"),

        body("password")
            .trim()
            .isEmpty()
            .withMessage("password is required !")
        ,
        body("fullname").
            optional()
            .trim()
        ,

    ];

};

const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .trim()
            .isEmail()
            .withMessage("Invalid Email !"),
        body("username")
            .optional()
            .trim()
            .isEmpty()
            .withMessage("username is required !"),

        body("password")
            .trim()
            .isEmpty()
            .withMessage("Password is Requird")

    ]
};

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword").isEmpty().withMessage("Old Password required "),
        body("newPassword").isEmpty().withMessage("new Password required ")
    ]
}

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .isEmpty()
            .withMessage("Email is Required")
            .isEmail()
            .withMessage("Email is Invalid")

    ]
};

const userResetForgotPassowrdValidator = () => {
    return [
        body("newPassword")
            .isEmpty().withMessage("Password is Required! ")

    ]
};
const createProjectValidator = () => {
    return [
        body('name')
            .isEmpty()
            .withMessage("Name is required !"),
        body("description").optional(),
    ]
};

const addMemberToProjectValidator = () => {
    return [
        body("email")
            .trim()
            .isEmpty()
            .withMessage("Email is Required !")
            .isEmail()
            .withMessage("Not a valid Email"),
        body("role")
            .isEmpty()
            .withMessage("Role is required !")
            .isIn(AvailableUserRole)
            .withMessage("Role is Invalid !! ")
    ];
}

export {
    createProjectValidator,
    addMemberToProjectValidator,
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPassowrdValidator,

};

import { AvailableUserRole } from "#utils/constants.js";
import { body, param } from "express-validator";


export const projectIdValidator = () => [
    param("projectId")
        .isMongoId()
        .withMessage("Invalid project ID"),
];


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
            .withMessage("Email is Required !")
            .isEmail()
            .withMessage("Email is Invalid "),

        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required !")
            .isLowercase()
            .withMessage("username must be be in lowercase !")
            .isLength({ min: 3 })
            .withMessage("username must be at least 3 character long !"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("password is required !")
        ,
        body("fullname")
            .optional()
            .trim()
        ,

    ];

};

const userLoginValidator = () => {
    return [
        body().custom((value, { req }) => {
            if (!req.body.email && !req.body.username) {
                throw new Error("Email or username is required");
            }
            return true;
        }),

        body("email")
            .optional()
            .trim()
            .isEmail()
            .withMessage("Invalid Email !"),
        body("username")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("username is required !"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters")

    ]
};

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword").notEmpty().withMessage("Old Password required "),
        body("newPassword").notEmpty().withMessage("new Password required ")
    ]
}

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is Required")
            .isEmail()
            .withMessage("Email is Invalid")

    ]
};

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty().withMessage("Password is Required! ")

    ]
};

const createProjectValidator = () => {
    return [
        body('name')
            .notEmpty()
            .withMessage("Name is required !"),
        body("description").optional(),
    ]
};

const addMemberToProjectValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is Required !")
            .isEmail()
            .withMessage("Not a valid Email"),

        body("role")
            .notEmpty()
            .withMessage("Role is required !")
            .isIn(AvailableUserRole)
            .withMessage("Role is Invalid !! ")
    ];
};

const createNoteValidator = () => {
    return [
        body("content")
            .trim()
            .notEmpty()
            .withMessage("project note required")
    ]
};
const updateNoteValidator = () => {
    return [
        body("content")
            .trim()
            .notEmpty()
            .withMessage("project note required")
    ]
};


// 📌 Create Task Validator
const createTaskValidator = () => [
    param("projectId")
        .isMongoId()
        .withMessage("Invalid projectId"),

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required"),

    body("description")
        .optional()
        .isString()
        .withMessage("Description must be a string"),

    body("assignedTo")
        .optional()
        .isMongoId()
        .withMessage("Invalid assignedTo user id"),

    body("status")
        .optional()
        .isIn(AvailableTaskStatues)
        .withMessage("Invalid task status"),
];


// 📌 Update Task Validator
const updateTaskValidator = () => [
    param("projectId")
        .isMongoId()
        .withMessage("Invalid projectId"),

    param("taskId")
        .isMongoId()
        .withMessage("Invalid taskId"),

    body("title")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Title cannot be empty"),

    body("description")
        .optional()
        .isString(),

    body("assignedTo")
        .optional()
        .isMongoId(),

    body("status")
        .optional()
        .isIn(AvailableTaskStatues),
];


// 📌 Get Task Validator
const getTaskValidator = () => [
    param("projectId").isMongoId(),
    param("taskId").isMongoId(),
];


// 📌 Project Tasks Validator
const getTasksValidator = () => [
    param("projectId").isMongoId(),
];

// 📌 Create Subtask
const createSubTaskValidator = () => [
    param("projectId").isMongoId(),
    param("taskId").isMongoId(),

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required"),
];


// 📌 Update Subtask
const updateSubTaskValidator = () => [
    param("projectId").isMongoId(),
    param("subTaskId").isMongoId(),

    body("title")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Title cannot be empty"),

    body("isCompleted")
        .optional()
        .isBoolean()
        .withMessage("isCompleted must be boolean"),
];


// 📌 Delete Subtask
const deleteSubTaskValidator = () => [
    param("projectId").isMongoId(),
    param("subTaskId").isMongoId(),
];


export {
    createProjectValidator,
    addMemberToProjectValidator,
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator,
    createNoteValidator,
    updateNoteValidator,
    projectIdValidator,
    createTaskValidator,
    updateTaskValidator,
    getTaskValidator,
    getTasksValidator,
    createSubTaskValidator,
    updateSubTaskValidator,
    deleteSubTaskValidator,
};

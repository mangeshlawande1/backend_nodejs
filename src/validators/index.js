import { body } from "express-validator";



/**
 *  validation --> attach to route.
 * 
 
 userRegistration   
    method runs --> return array 
    body have multiple fields 
    --> put validation on each requird fields 
 */


const userRegisterValidator = () =>{
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
        .isLength({min:3})
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

}   


export {
    userRegisterValidator,

}
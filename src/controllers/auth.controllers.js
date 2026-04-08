import { User } from "#models/user.models.js";
import { ApiResponse } from "#utils/ApiResponse.js"
import { ApiError } from "#utils/ApiError.js"
import { asyncHandler, } from "#utils/asyncHandler.js";
import { emailVerificationMailgenContent, sendEmail } from "#utils/mail.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access  and refreshtoken ",)
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    const existedUser = await User.findOne({
        $or: [{ username, email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User With Email or Username already exists. ", [])
    }

    const user = await User.create({
        email,
        username,
        password,
        isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })

    // send an email to send user 
    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your Email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
            )
        });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    if (!createdUser) {
        throw new ApiError(501, "Something went wrong while registering user")
    }

    return res.status(201)
        .json(
            new ApiResponse(
                200,
                { user: createdUser },
                "User registered successfully  and verification email has been sent on your email. "
            )
        )
});

//cookie-parser
const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError(403, "Username or email required ")
    };

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(402, "User not found !!");
    };

    const isValidPassword = await user.isPasswordCorrect(password);

    if (!isValidPassword) {
        throw new ApiError(404, "Incorrect Password ")
    };

    // create access and refresh token 
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user?._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    // generate cookies --> required options 
    const options = {
        httpOnly: true,
        secure: true
    };

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findOneAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: ""
            }
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200, {}, "User Logged Out successfully !"
            )
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully "
            )
        );
});


const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params

    if (!verificationToken) {
        throw new ApiError(403, "Email verification TOKEN IS MISSING");
    };

    let hashedToken = crypto
        .crateHash("sha256")
        .update(verificationToken)
        .digest("hex")

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(403, " TOKEN IS EXPIRED OR INVALID");
    };

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.isEmailVerified = true
    await user.save({ validateBeforeSave: false });


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isEmailVerified: true
                },
                "Email is verified"
            ));
});



// const verifyEmail = asyncHandler(async (req, res) => {

// });

export {
    registerUser,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    


}
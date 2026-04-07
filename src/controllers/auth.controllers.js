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

const registerUser = asyncHandler(async (requestAnimationFrame, res) => {
    const { email, username, password, role } = req.body

    const esxistedUser = await User.fondOne({
        $or: [{ username, email }]
    });

    if (esxistedUser) {
        throw new ApiError(409, "User With Email or Username already exists. ", [])
    }

    const user = await User.create({
        email,
        username,
        password,
        role,
        isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken
    user.emailVerfificationExpiry = tokenExpiry

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


import { User } from "#models/user.models.js";

import { ApiError } from "#utils/ApiError.js";
import { ApiResponse } from "#utils/ApiResponse.js";
import { asyncHandler } from "#utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";

/* =========================================================
   COOKIE OPTIONS
========================================================= */

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

/* =========================================================
   GENERATE ACCESS & REFRESH TOKEN
========================================================= */

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId).select(
    "+refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = user.generateAccessToken();

  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  return {
    accessToken,
    refreshToken,
  };
};

/* =========================================================
   REGISTER USER
========================================================= */

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullName } =
    req.body;

  if (!email || !username || !password) {
    throw new ApiError(
      400,
      "Email, username and password are required"
    );
  }

  const existedUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { username: username.toLowerCase() },
    ],
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with this email or username already exists"
    );
  }

  const user = await User.create({
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
    fullName,
    isEmailVerified: false,
  });

  const {
    unHashedToken,
    hashedToken,
    tokenExpiry,
  } = user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;

  user.emailVerificationExpiry = tokenExpiry;

  await user.save({
    validateBeforeSave: false,
  });

  await sendEmail({
    email: user.email,

    subject: "Verify your email",

    mailgenContent:
      emailVerificationMailgenContent(
        user.username,
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/users/verify-email/${unHashedToken}`
      ),
  });

  const createdUser = await User.findById(
    user._id
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: createdUser,
      },
      "User registered successfully. Verification email sent."
    )
  );
});

/* =========================================================
   LOGIN USER
========================================================= */

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } =
    req.body;

  if ((!email && !username) || !password) {
    throw new ApiError(
      400,
      "Email/Username and password are required"
    );
  }

  const query = email
    ? { email: email.toLowerCase() }
    : { username: username.toLowerCase() };

  const user = await User.findOne(query).select(
    "+password +refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(
      401,
      "Please verify your email first"
    );
  }

  const isPasswordCorrect =
    await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(
      401,
      "Invalid credentials"
    );
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(
      user._id
    );

  const loggedInUser = await User.findById(
    user._id
  );

  return res
    .status(200)
    .cookie(
      "accessToken",
      accessToken,
      cookieOptions
    )
    .cookie(
      "refreshToken",
      refreshToken,
      cookieOptions
    )
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

/* =========================================================
   LOGOUT USER
========================================================= */

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie(
      "accessToken",
      cookieOptions
    )
    .clearCookie(
      "refreshToken",
      cookieOptions
    )
    .json(
      new ApiResponse(
        200,
        {},
        "User logged out successfully"
      )
    );
});

/* =========================================================
   GET CURRENT USER
========================================================= */

const getCurrentUser = asyncHandler(
  async (req, res) => {
    return res.status(200).json(
      new ApiResponse(
        200,
        req.user,
        "Current user fetched successfully"
      )
    );
  }
);

/* =========================================================
   VERIFY EMAIL
========================================================= */

const verifyEmail = asyncHandler(
  async (req, res) => {
    const { verificationToken } =
      req.params;

    if (!verificationToken) {
      throw new ApiError(
        400,
        "Verification token is missing"
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken:
        hashedToken,

      emailVerificationExpiry: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      throw new ApiError(
        400,
        "Invalid or expired verification token"
      );
    }

    user.emailVerificationToken =
      undefined;

    user.emailVerificationExpiry =
      undefined;

    user.isEmailVerified = true;

    await user.save({
      validateBeforeSave: false,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isEmailVerified: true,
        },
        "Email verified successfully"
      )
    );
  }
);

/* =========================================================
   RESEND EMAIL VERIFICATION
========================================================= */

const resendEmailVerification =
  asyncHandler(async (req, res) => {
    const user = await User.findById(
      req.user?._id
    );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    if (user.isEmailVerified) {
      throw new ApiError(
        409,
        "Email is already verified"
      );
    }

    const {
      unHashedToken,
      hashedToken,
      tokenExpiry,
    } = user.generateTemporaryToken();

    user.emailVerificationToken =
      hashedToken;

    user.emailVerificationExpiry =
      tokenExpiry;

    await user.save({
      validateBeforeSave: false,
    });

    await sendEmail({
      email: user.email,

      subject: "Verify your email",

      mailgenContent:
        emailVerificationMailgenContent(
          user.username,
          `${req.protocol}://${req.get(
            "host"
          )}/api/v1/users/verify-email/${unHashedToken}`
        ),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        "Verification email sent successfully"
      )
    );
  });

/* =========================================================
   REFRESH ACCESS TOKEN
========================================================= */

const refreshAccessToken =
  asyncHandler(async (req, res) => {
    const incomingRefreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(
        401,
        "Unauthorized request"
      );
    }

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env
          .REFRESH_TOKEN_SECRET
      );

      const user =
        await User.findById(
          decodedToken?._id
        ).select("+refreshToken");

      if (!user) {
        throw new ApiError(
          401,
          "Invalid refresh token"
        );
      }

      if (
        incomingRefreshToken !==
        user.refreshToken
      ) {
        throw new ApiError(
          401,
          "Refresh token expired or already used"
        );
      }

      const {
        accessToken,
        refreshToken,
      } =
        await generateAccessAndRefreshToken(
          user._id
        );

      return res
        .status(200)
        .cookie(
          "accessToken",
          accessToken,
          cookieOptions
        )
        .cookie(
          "refreshToken",
          refreshToken,
          cookieOptions
        )
        .json(
          new ApiResponse(
            200,
            {
              accessToken,
              refreshToken,
            },
            "Access token refreshed successfully"
          )
        );
    } catch (error) {
      throw new ApiError(
        401,
        error?.message ||
        "Invalid refresh token"
      );
    }
  });

/* =========================================================
   FORGOT PASSWORD REQUEST
========================================================= */

const forgotPasswordRequest =
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(
        400,
        "Email is required"
      );
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const {
      hashedToken,
      unHashedToken,
      tokenExpiry,
    } = user.generateTemporaryToken();

    user.forgotPasswordToken =
      hashedToken;

    user.forgotPasswordExpiry =
      tokenExpiry;

    await user.save({
      validateBeforeSave: false,
    });

    await sendEmail({
      email: user.email,

      subject: "Password reset request",

      mailgenContent:
        forgotPasswordMailgenContent(
          user.username,
          `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        ),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        "Password reset email sent successfully"
      )
    );
  });

/* =========================================================
   RESET FORGOT PASSWORD
========================================================= */

const resetForgotPassword =
  asyncHandler(async (req, res) => {
    const { resetToken } =
      req.params;

    const { newPassword } =
      req.body;

    if (!resetToken || !newPassword) {
      throw new ApiError(
        400,
        "Reset token and new password are required"
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      forgotPasswordToken:
        hashedToken,

      forgotPasswordExpiry: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      throw new ApiError(
        400,
        "Invalid or expired reset token"
      );
    }

    user.password = newPassword;

    user.forgotPasswordToken =
      undefined;

    user.forgotPasswordExpiry =
      undefined;

    user.refreshToken = undefined;

    await user.save();

    return res
      .status(200)
      .clearCookie(
        "accessToken",
        cookieOptions
      )
      .clearCookie(
        "refreshToken",
        cookieOptions
      )
      .json(
        new ApiResponse(
          200,
          {},
          "Password reset successfully"
        )
      );
  });

/* =========================================================
   CHANGE CURRENT PASSWORD
========================================================= */

const changeCurrentPassword =
  asyncHandler(async (req, res) => {
    const {
      oldPassword,
      newPassword,
    } = req.body;

    if (
      !oldPassword ||
      !newPassword
    ) {
      throw new ApiError(
        400,
        "Old password and new password are required"
      );
    }

    const user =
      await User.findById(
        req.user?._id
      ).select(
        "+password +refreshToken"
      );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const isPasswordCorrect =
      await user.isPasswordCorrect(
        oldPassword
      );

    if (!isPasswordCorrect) {
      throw new ApiError(
        401,
        "Invalid old password"
      );
    }

    user.password = newPassword;

    user.refreshToken = undefined;

    await user.save();

    return res
      .status(200)
      .clearCookie(
        "accessToken",
        cookieOptions
      )
      .clearCookie(
        "refreshToken",
        cookieOptions
      )
      .json(
        new ApiResponse(
          200,
          {},
          "Password changed successfully"
        )
      );
  });

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword,
};
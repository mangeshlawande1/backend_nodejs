import { User } from '#models/user.models.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { ApiError } from '#utils/ApiError.js';
import { asyncHandler } from '#utils/asyncHandler.js';
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from '#utils/mail.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error || 'something went wrong while generating access  and refreshtoken ',
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  try {
    const existedUser = await User.findOne({
      $or: [{ username, email }],
    });

    if (existedUser) {
      throw new ApiError(
        409,
        'User With Email or Username already exists. ',
        [],
      );
    }

    const user = await User.create({
      email,
      username,
      password,
      isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    // send an email to send user
    await sendEmail({
      email: user?.email,
      subject: 'Please verify your Email',
      mailgenContent: emailVerificationMailgenContent(
        user.username,
        `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${unHashedToken}`,
      ),
    });

    const createdUser = await User.findById(user._id).select(
      '-password -refreshToken -emailVerificationToken -emailVerificationExpiry',
    );

    if (!createdUser) {
      throw new ApiError(501, 'Something went wrong while registering user');
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          { user: createdUser },
          'User registered successfully  and verification email has been sent on your email. ',
        ),
      );
  } catch (error) {
    throw new ApiError(501, error);
  }
});

//cookie-parser
const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(403, 'Username or email required ');
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(402, 'User not found !!');
    }

    const isValidPassword = await user.isPasswordCorrect(password);

    if (!isValidPassword) {
      throw new ApiError(404, 'Incorrect Password ');
    }

    // create access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user?._id,
    );

    const loggedInUser = await User.findById(user._id).select(
      '-password -refreshToken -emailVerificationToken -emailVerificationExpiry',
    );

    // generate cookies --> required options
    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          201,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          'User logged in Successfully',
        ),
      );
  } catch (error) {
    throw new ApiError(501, error);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findOneAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: '',
        },
      },
      {
        new: true,
      },
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie('accessToken', options)
      .clearCookie('refreshToken', options)
      .json(new ApiResponse(200, {}, 'User Logged Out successfully !'));
  } catch (error) {
    throw new ApiError(505, error);
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Current user fetched successfully '));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(403, 'Email verification TOKEN IS MISSING');
  }

  try {
    const hashedToken = crypto
      .crateHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(403, ' TOKEN IS EXPIRED OR INVALID');
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isEmailVerified: true,
        },
        'Email is verified',
      ),
    );
  } catch (error) {
    throw new ApiError(523, error || 'something went try after some time. ');
  }
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, 'User not Found !!');
  }

  if (user.isEmailVerified) {
    throw new ApiError(409, 'Email is already verified!!');
  }

  try {
    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    // send an email to send user
    await sendEmail({
      email: user?.email,
      subject: 'Please verify your Email',
      mailgenContent: emailVerificationMailgenContent(
        user.username,
        `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${unHashedToken}`,
      ),
    });

    return res
      .status(200)
      .json(new ApiResponse(201, {}, 'Mail has been sent to your email ID '));
  } catch (error) {
    throw new ApiError(508, error);
  }
});

// if access token expired
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthroized access');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh Token');
    }
    // check refreshtoken in db
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh Token Expired ');
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      generateAccessAndRefreshTokens(user._id);

    user.refreshToken = newRefreshToken;

    await user.save();

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          201,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed',
        ),
      );
  } catch (error) {
    throw new ApiError(509, error || 'Invalid refreshToken');
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, 'User Not Found !');
    }

    const { hashedToken, unHashedToken, tokenExpiry } =
      user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user?.email,
      subject: 'Password reset request',
      mailgenContent: forgotPasswordMailgenContent(
        user.username,
        `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
      ),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, {}, 'Password reset has beenn sent to your email'),
      );
  } catch (error) {
    throw new ApiError(501, error);
  }
});

const resetForgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  try {
    const hashedToken = crypto
      .crateHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      forgotPasswordToken: hashedToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(409, 'Token is Expired or Invalid ');
    }

    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(201)
      .json(new ApiResponse(200, {}, 'Password Reset Successfully.'));
  } catch (error) {
    throw new ApiError(513, error);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user?._id);

    const isValidPassword = await user.isPasswordCorrect(oldPassword);

    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid Old Password !');
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(201, 'Passwoord changed successfully! '));
  } catch (error) {
    throw new ApiError(502, error);
  }
});

export {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword,
};

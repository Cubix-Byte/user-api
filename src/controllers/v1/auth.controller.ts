import { Request, Response, NextFunction } from "express";
import {
  sendSuccessResponse,
  sendErrorResponse,
  HttpStatusCodes as SERVER_STATUS_CODES,
} from "../../utils/shared-lib-imports";
import * as authService from "../../services/auth.service";
import {
  LoginRequest,
  SuperadminLoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from "../../types/auth.types";

// Authentication controller - handles all auth-related HTTP requests
// User registration endpoint
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = req.body as RegisterRequest;
    const userResponse = await authService.registerUser(userData);

    return sendSuccessResponse(
      res,
      "User registered successfully",
      userResponse
    );
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage === "EMAIL_EXISTS") {
      return sendErrorResponse(
        res,
        "User with this email already exists",
        SERVER_STATUS_CODES.CONFLICT,
        {}
      );
    }

    if (errorMessage === "USERNAME_EXISTS") {
      return sendErrorResponse(
        res,
        "Username already exists in this tenant",
        SERVER_STATUS_CODES.CONFLICT,
        {}
      );
    }

    if (errorMessage === "INVALID_ROLE") {
      return sendErrorResponse(
        res,
        "Invalid role specified",
        SERVER_STATUS_CODES.BAD_REQUEST,
        {}
      );
    }

    if (errorMessage === "SUPERADMIN_EXISTS") {
      return sendErrorResponse(
        res,
        "Superadmin already exists. Only one superadmin is allowed.",
        SERVER_STATUS_CODES.CONFLICT,
        {}
      );
    }

    console.error("Registration error:", error);
    return sendErrorResponse(
      res,
      "Registration failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Unified login endpoint for both SuperAdmin and tenant users
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const loginData = req.body as LoginRequest;
    const loginResponse = await authService.loginUser(loginData);

    // Determine success message based on user type
    const successMessage =
      loginResponse.user.userType === "superadmin"
        ? "Superadmin login successful"
        : "Login successful";

    return sendSuccessResponse(res, successMessage, loginResponse);
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage === "INVALID_CREDENTIALS") {
      return sendErrorResponse(
        res,
        "Invalid email or password",
        SERVER_STATUS_CODES.UNAUTHORIZED,
        {}
      );
    }

    if (errorMessage === "TENANT_NAME_REQUIRED") {
      return sendErrorResponse(
        res,
        "Tenant name is required for tenant users",
        SERVER_STATUS_CODES.BAD_REQUEST,
        {}
      );
    }

    if (errorMessage === "ACCOUNT_LOCKED") {
      return sendErrorResponse(
        res,
        "Account is temporarily locked due to too many failed login attempts",
        SERVER_STATUS_CODES.UNAUTHORIZED,
        {}
      );
    }

    if (errorMessage === "USER_ROLE_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "User role not found. Please contact administrator.",
        SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR,
        {}
      );
    }

    console.error("Login error:", error);
    return sendErrorResponse(
      res,
      "Login failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};


// Refresh access token endpoint
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshData = req.body as RefreshTokenRequest;
    const tokenResponse = await authService.refreshUserToken(refreshData);

    return sendSuccessResponse(
      res,
      "Token refreshed successfully",
      tokenResponse
    );
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage === "INVALID_REFRESH_TOKEN") {
      return sendErrorResponse(
        res,
        "Invalid or expired refresh token",
        SERVER_STATUS_CODES.UNAUTHORIZED,
        {}
      );
    }

    console.error("Token refresh error:", error);
    return sendErrorResponse(
      res,
      "Token refresh failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// User logout endpoint
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await authService.logoutUser(userId);
    }

    return sendSuccessResponse(res, "Logout successful", {});
  } catch (error) {
    console.error("Logout error:", error);
    return sendErrorResponse(
      res,
      "Logout failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Get user profile endpoint
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendErrorResponse(
        res,
        "User ID not found",
        SERVER_STATUS_CODES.UNAUTHORIZED,
        {}
      );
    }

    const user = await authService.getUserProfile(userId);

    return sendSuccessResponse(res, "Profile retrieved successfully", user);
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage === "USER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND,
        {}
      );
    }

    console.error("Get profile error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve profile",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Update user profile endpoint
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendErrorResponse(
        res,
        "User ID not found",
        SERVER_STATUS_CODES.UNAUTHORIZED,
        {}
      );
    }

    const profileData = req.body as UpdateProfileRequest;
    const updatedUser = await authService.updateUserProfile(userId, profileData);

    return sendSuccessResponse(
      res,
      "Profile updated successfully",
      updatedUser
    );
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage === "USER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND,
        {}
      );
    }

    console.error("Update profile error:", error);
    return sendErrorResponse(
      res,
      "Failed to update profile",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Change user password endpoint
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const passwordData = req.body as ChangePasswordRequest;

    if (!userId) {
      return sendErrorResponse(
        res,
        "User ID not found",
        SERVER_STATUS_CODES.UNAUTHORIZED,
        {}
      );
    }

    await authService.changeUserPassword(userId, passwordData);

    return sendSuccessResponse(res, "Password changed successfully", {});
  } catch (error) {
    const errorMessage = (error as Error).message;

    if (errorMessage === "USER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND,
        {}
      );
    }

    if (errorMessage === "INVALID_CURRENT_PASSWORD") {
      return sendErrorResponse(
        res,
        "Current password is incorrect",
        SERVER_STATUS_CODES.BAD_REQUEST,
        {}
      );
    }

    console.error("Change password error:", error);
    return sendErrorResponse(
      res,
      "Failed to change password",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

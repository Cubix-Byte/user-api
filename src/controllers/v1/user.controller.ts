import { Request, Response, NextFunction } from "express";
import {
  sendSuccessResponse,
  sendErrorResponse,
  HttpStatusCodes,
  buildQueryFromRequest,
  ROLE_NAMES,
} from "../../utils/shared-lib-imports";
import * as userService from "../../services/user.service";
import * as userRepository from "../../repositories/user.repository";
import { defaultPageLimit } from "shared-lib";
import mongoose from "mongoose";

/**
 * User Controller - Handles all user management HTTP requests
 */

// Get all users with pagination and filters
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendErrorResponse(
        res,
        "Tenant ID is required",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Build dynamic query and sort from filter parameter
    const queryResult = buildQueryFromRequest(req, res);
    if (!queryResult) return; // Error response already handled by buildQueryFromRequest

    let { query, sort } = queryResult;

    // Prepare pagination parameters
    const pageNo =
      parseInt(req.query.pageNo as string) ||
      parseInt(req.query.page as string) ||
      1;
    const pageSize =
      parseInt(req.query.pageSize as string) ||
      parseInt(req.query.limit as string) ||
      defaultPageLimit;

    // Default sort: order by createdAt desc if no sort is provided
    if (!sort || Object.keys(sort).length === 0) {
      sort = { createdAt: -1 };
    }

    // Handle $eq operator for userType and isActive - extract value if it's an object with only $eq
    // This simplifies the query while preserving $in and other operators
    if (query.userType && typeof query.userType === "object") {
      if (query.userType.$eq && Object.keys(query.userType).length === 1) {
        query.userType = query.userType.$eq;
      }
      // If it has $in or other operators, keep it as is
    }

    if (query.isActive && typeof query.isActive === "object") {
      if (
        query.isActive.$eq !== undefined &&
        Object.keys(query.isActive).length === 1
      ) {
        query.isActive = query.isActive.$eq;
      }
      // If it has other operators, keep it as is
    }

    const result = await userService.getAllUsers({
      pageNo,
      pageSize,
      tenantId,
      query: query || {},
      sort,
    });

    return sendSuccessResponse(res, "Users retrieved successfully", result);
  } catch (error: any) {
    console.error("Get all users error:", error);
    return sendErrorResponse(
      res,
      error.message || "Failed to retrieve users",
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Delete user by ID (soft delete)
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendErrorResponse(
        res,
        "Tenant ID is required",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Check if user exists and is not already deleted (allowing inactive users to be deleted)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(
        res,
        "Invalid user ID",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    const user = await userRepository.findUserByIdForDeletion(id);
    if (!user) {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Check if user belongs to the tenant (unless superadmin)
    if (
      (user as any).tenantId &&
      (user as any).tenantId.toString() !== tenantId &&
      (user as any).userType !== "superadmin"
    ) {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Perform soft delete
    const result = await userService.deleteUser(id);

    if (!result) {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    return sendSuccessResponse(res, "User deleted successfully", {});
  } catch (error: any) {
    console.error("Delete user error:", error);
    const errorMessage = error.message || "Failed to delete user";

    if (errorMessage === "USER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    return sendErrorResponse(
      res,
      errorMessage,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Get user by ID
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendErrorResponse(
        res,
        "Tenant ID is required",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(
        res,
        "Invalid user ID",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Check if requesting user is an admin (ADMIN, PRIMARYADMIN, or SUPERADMIN)
    const isAdmin =
      req.user?.roleName === ROLE_NAMES.ADMIN ||
      req.user?.roleName === ROLE_NAMES.PRIMARYADMIN ||
      req.user?.roleName === ROLE_NAMES.SUPERADMIN;

    // Get user - admins can view inactive users, regular users cannot
    const user = await userService.getUserById(id, isAdmin);

    // Check if user belongs to the tenant (unless superadmin)
    if (
      (user as any).tenantId &&
      (user as any).tenantId.toString() !== tenantId &&
      (user as any).userType !== "superadmin"
    ) {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    return sendSuccessResponse(res, "User retrieved successfully", user);
  } catch (error: any) {
    console.error("Get user by ID error:", error);
    const errorMessage = error.message || "Failed to retrieve user";

    if (errorMessage === "USER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    return sendErrorResponse(
      res,
      errorMessage,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Toggle user status (activate/deactivate)
export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendErrorResponse(
        res,
        "Tenant ID is required",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(
        res,
        "Invalid user ID",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Validate isActive parameter
    if (typeof isActive !== "boolean") {
      return sendErrorResponse(
        res,
        "isActive must be a boolean value",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // Check if user exists (including inactive users, but not deleted)
    const user = await userRepository.findUserByIdForDeletion(id);
    if (!user) {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Check if user belongs to the tenant (unless superadmin)
    if (
      (user as any).tenantId &&
      (user as any).tenantId.toString() !== tenantId &&
      (user as any).userType !== "superadmin"
    ) {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Toggle user status
    const updatedUser = await userService.toggleUserStatus(id, isActive);

    if (!updatedUser) {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    return sendSuccessResponse(
      res,
      `User ${isActive ? "activated" : "deactivated"} successfully`,
      updatedUser
    );
  } catch (error: any) {
    console.error("Toggle user status error:", error);
    const errorMessage = error.message || "Failed to update user status";

    if (errorMessage === "USER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "User not found",
        HttpStatusCodes.NOT_FOUND
      );
    }

    return sendErrorResponse(
      res,
      errorMessage,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// Get user statistics (excluding admin users)
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return sendErrorResponse(
        res,
        "Tenant ID is required",
        HttpStatusCodes.BAD_REQUEST
      );
    }

    const stats = await userService.getUserStats(tenantId);

    return sendSuccessResponse(
      res,
      "User statistics retrieved successfully",
      stats
    );
  } catch (error: any) {
    console.error("Get user stats error:", error);
    return sendErrorResponse(
      res,
      error.message || "Failed to retrieve user statistics",
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

import { Request, Response, NextFunction } from "express";
import {
  sendSuccessResponse,
  sendErrorResponse,
  HttpStatusCodes as SERVER_STATUS_CODES,
} from "../../utils/shared-lib-imports";
import * as userService from "../../services/user.service";
import * as tenantService from "../../services/tenant.service";
import * as academicIntegrationService from "../../services/academic-integration.service";
import * as roleService from "../../services/role.service";
import * as validationService from "../../services/validation.service";
import { IUser } from "../../models/user.schema";

/**
 * Internal Controller for User API
 * Handles microservice-to-microservice communication
 * These endpoints are used by other services (like academy-api) to manage users
 */

// Internal health check
export const internalHealthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return sendSuccessResponse(res, "User API Internal Service is running", {
      service: "user-api-internal",
      timestamp: new Date().toISOString(),
      status: "healthy",
    });
  } catch (error) {
    console.error("Internal health check error:", error);
    return sendErrorResponse(
      res,
      "Internal service error",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// User validation
export const validateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, email, username, tenantId } = { ...req.query, ...req.body };

    if (!userId && !email && !username) {
      return sendErrorResponse(
        res,
        "User identifier required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    let user;
    if (userId) {
      user = await userService.getUserById(userId as string);
    } else if (email) {
      // If tenantId is provided, use tenant-specific lookup
      if (tenantId) {
        user = await userService.getUserByEmailAndTenant(
          email as string,
          tenantId as string
        );
      } else {
        user = await userService.getUserByEmail(email as string);
      }
    } else if (username) {
      // If tenantId is provided, use tenant-specific lookup
      if (tenantId) {
        user = await userService.getUserByUsernameAndTenant(
          username as string,
          tenantId as string
        );
      } else {
        user = await userService.getUserByUsername(username as string);
      }
    }

    if (!user) {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    // Extract roleName from populated role or role object
    let roleName: string | null = null;
    if (user.role) {
      if (typeof user.role === 'object' && 'name' in user.role) {
        roleName = (user.role as any).name;
      } else if (typeof user.role === 'string') {
        roleName = user.role;
      }
    }

    return sendSuccessResponse(res, "User validated successfully", {
      isValid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        isActive: user.isActive,
        tenantId: user.tenantId,
        tenantName: user.tenantName,
        roleName: roleName,
      },
    });
  } catch (error) {
    console.error("Validate user error:", error);

    // If user not found, return 404 instead of 500
    if ((error as Error).message === "USER_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    return sendErrorResponse(
      res,
      "User validation failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Check if user exists by email or username and tenantId
export const checkUserExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, tenantId } = { ...req.query, ...req.body };

    if (!tenantId) {
      return sendErrorResponse(
        res,
        "Tenant ID is required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    if (!email && !username) {
      return sendErrorResponse(
        res,
        "Email or username is required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    let exists = false;
    let existingUser = null;

    if (email) {
      existingUser = await userService.getUserByEmailAndTenant(
        email as string,
        tenantId as string
      );
      if (existingUser) {
        exists = true;
      }
    }

    if (!exists && username) {
      existingUser = await userService.getUserByUsernameAndTenant(
        username as string,
        tenantId as string
      );
      if (existingUser) {
        exists = true;
      }
    }

    return sendSuccessResponse(res, "User existence checked", {
      exists,
      user: exists
        ? {
          id: existingUser?.id,
          email: existingUser?.email,
          username: existingUser?.username,
        }
        : null,
    });
  } catch (error) {
    console.error("Check user exists error:", error);
    return sendErrorResponse(
      res,
      "Failed to check user existence",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Batch check which emails exist in this tenant (for bulk upload validation)
export const checkExistingEmails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { emails, tenantId } = req.body;
    if (!tenantId || !Array.isArray(emails)) {
      return sendErrorResponse(
        res,
        "tenantId and emails (array) are required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }
    const existingEmails = await userService.getExistingEmailsForTenant(
      emails,
      tenantId
    );
    return sendSuccessResponse(res, "Existing emails checked", {
      existingEmails,
    });
  } catch (error) {
    console.error("Check existing emails error:", error);
    return sendErrorResponse(
      res,
      "Failed to check existing emails",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
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
    const user = await userService.getUserById(id, true);

    if (!user) {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    return sendSuccessResponse(res, "User retrieved successfully", user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve user",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Get users by IDs (batch)
export const getUsersByIds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return sendErrorResponse(
        res,
        "User IDs array required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    const users = await userService.getUsersByIds(userIds);

    return sendSuccessResponse(res, "Users retrieved successfully", {
      users,
      count: users.length,
      requested: userIds.length,
    });
  } catch (error) {
    console.error("Get users by IDs error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve users",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Create user (for academy-api)
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData = req.body;
    console.log(
      "🔍 Internal createUser called with data:",
      JSON.stringify(userData, null, 2)
    );

    // Auto-generate username from email if not provided
    if (!userData.username && userData.email) {
      userData.username = userData.email.toLowerCase().trim();
      console.log("🔄 Auto-generated username from email:", userData.username);
    }

    // Auto-set userType to 'parent' if not provided (for parent creation)
    if (!userData.userType && userData.roleName === "PARENT") {
      userData.userType = "parent";
      console.log("🔄 Auto-set userType to 'parent'");
    }

    // Step 1: Comprehensive validation before any data processing
    console.log("🔍 Starting comprehensive validation...");
    const validation = await validationService.validateUserCreation(userData);

    if (!validation.isValid) {
      console.log("❌ Validation failed:", validation.errors);
      return sendErrorResponse(
        res,
        `Validation failed: ${validation.errors.join(", ")}`,
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    console.log("✅ All validations passed");

    // Check if username already exists for this tenant
    const existingUserByUsername = await userService.getUserByUsernameAndTenant(
      userData.username,
      userData.tenantId
    );
    if (existingUserByUsername) {
      return sendErrorResponse(
        res,
        "USERNAME_EXISTS",
        SERVER_STATUS_CODES.CONFLICT
      );
    }

    // Check if email already exists for this tenant
    const existingUserByEmail = await userService.getUserByEmailAndTenant(
      userData.email,
      userData.tenantId
    );
    if (existingUserByEmail) {
      return sendErrorResponse(
        res,
        "EMAIL_EXISTS",
        SERVER_STATUS_CODES.CONFLICT
      );
    }

    // Resolve role name to role ID if roleName is provided
    if (userData.roleName && !userData.role) {
      try {
        // First try to find the role by name for this tenant
        const role = await roleService.getRoleByName(
          userData.roleName,
          userData.tenantId
        );
        userData.role = role._id;
        console.log(
          `Role '${userData.roleName}' resolved to ID: ${role._id} for tenant: ${userData.tenantId}`
        );
      } catch (error) {
        console.log(
          `Role '${userData.roleName}' not found for tenant ${userData.tenantId}, attempting to create it...`
        );

        // Try to create the role if it doesn't exist
        try {
          const newRole = await roleService.createDefaultRole(
            userData.roleName,
            userData.tenantId
          );
          userData.role = newRole._id;
          console.log(
            `✅ Created new role '${userData.roleName}' with ID: ${newRole._id} for tenant: ${userData.tenantId}`
          );
        } catch (createError) {
          console.error(
            `Failed to create role '${userData.roleName}', trying fallback to ADMIN role`
          );

          // Fallback to PRIMARYADMIN or ADMIN role if role creation fails
          try {
            let adminRole;
            try {
              adminRole = await roleService.getRoleByName("PRIMARYADMIN", userData.tenantId);
              userData.roleName = "PRIMARYADMIN";
            } catch (primaryAdminError) {
              adminRole = await roleService.getRoleByName("ADMIN", userData.tenantId);
              userData.roleName = "ADMIN";
            }
            userData.role = adminRole._id;
            console.log(
              `Using fallback ADMIN role with ID: ${adminRole._id} for tenant: ${userData.tenantId}`
            );
          } catch (adminError) {
            return sendErrorResponse(
              res,
              `Neither '${userData.roleName}' nor 'ADMIN' role found for tenant ${userData.tenantId}`,
              SERVER_STATUS_CODES.BAD_REQUEST
            );
          }
        }
      }
    }

    // Set default values for required fields
    userData.userAccessType = userData.userAccessType || "private";
    userData.isEmailVerified =
      userData.isEmailVerified !== undefined ? userData.isEmailVerified : false;
    userData.loginAttempts = userData.loginAttempts || 0;
    userData.isActive =
      userData.isActive !== undefined ? userData.isActive : true;
    userData.createdBy = userData.createdBy || "system"; // Set createdBy if not provided

    // Ensure tenantName is not empty
    if (!userData.tenantName || userData.tenantName.trim() === "") {
      userData.tenantName = "Default School";
      console.log(
        "⚠️ Empty tenantName provided, using default: Default School"
      );
    }

    console.log(
      "📝 Creating user with final data:",
      JSON.stringify(userData, null, 2)
    );
    console.log("🆔 Provided _id in userData:", userData._id);
    const user = await userService.createUser(userData);
    console.log("✅ User created successfully:", user.id);
    console.log("🔍 Created user _id:", user._id);
    console.log("🔍 Created user id:", user.id);

    return sendSuccessResponse(res, "User created successfully", {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      role: user.role,
      roleName: userData.roleName,
      tenantId: user.tenantId,
      tenantName: user.tenantName,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    const errorMessage = (error as Error).message;

    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000 || error.codeName === "DuplicateKey") {
      const keyPattern = error.keyPattern || {};
      if (keyPattern.username && keyPattern.tenantId) {
        return sendErrorResponse(
          res,
          "USERNAME_EXISTS",
          SERVER_STATUS_CODES.CONFLICT
        );
      }
      if (keyPattern.email) {
        return sendErrorResponse(
          res,
          "EMAIL_EXISTS",
          SERVER_STATUS_CODES.CONFLICT
        );
      }
      return sendErrorResponse(
        res,
        "Duplicate key error: User already exists",
        SERVER_STATUS_CODES.CONFLICT
      );
    }

    if (errorMessage === "USERNAME_EXISTS" || errorMessage === "EMAIL_EXISTS") {
      return sendErrorResponse(res, errorMessage, SERVER_STATUS_CODES.CONFLICT);
    }

    console.error("Create user error:", error);
    return sendErrorResponse(
      res,
      "Failed to create user",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Update user (for academy-api)
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await userService.updateUser(id, updateData);

    if (!user) {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    return sendSuccessResponse(res, "User updated successfully", user);
  } catch (error) {
    console.error("Update user error:", error);
    return sendErrorResponse(
      res,
      "Failed to update user",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Delete user (for academy-api)
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await userService.deleteUser(id);

    if (!result) {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    return sendSuccessResponse(res, "User deleted successfully", {});
  } catch (error) {
    console.error("Delete user error:", error);
    return sendErrorResponse(
      res,
      "Failed to delete user",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Get user role
export const getUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    const role = await roleService.getRoleById(user.role.toString());

    return sendSuccessResponse(res, "User role retrieved successfully", {
      userId: user.id,
      role: role,
    });
  } catch (error) {
    console.error("Get user role error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve user role",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Get user permissions
export const getUserPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return sendErrorResponse(
        res,
        "User not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    const permissions = await roleService.getRolePermissions(
      user.role.toString()
    );

    return sendSuccessResponse(res, "User permissions retrieved successfully", {
      userId: user.id,
      permissions: permissions,
    });
  } catch (error) {
    console.error("Get user permissions error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve user permissions",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Validate permission
export const validatePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, permission } = req.body;

    if (!userId || !permission) {
      return sendErrorResponse(
        res,
        "User ID and permission required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    const hasPermission = await roleService.userHasPermission(
      userId,
      permission
    );

    return sendSuccessResponse(res, "Permission validation completed", {
      userId,
      permission,
      hasPermission,
    });
  } catch (error) {
    console.error("Validate permission error:", error);
    return sendErrorResponse(
      res,
      "Permission validation failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Get tenant by ID
export const getTenantById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const tenant = await tenantService.getTenantById(id);

    if (!tenant) {
      return sendErrorResponse(
        res,
        "Tenant not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    return sendSuccessResponse(res, "Tenant retrieved successfully", tenant);
  } catch (error) {
    console.error("Get tenant by ID error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve tenant",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Validate tenant
export const validateTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId, tenantName } = req.body;

    // tenantId can sometimes be passed as an object (e.g. { tenantId, adminId })
    // Normalize it to a string id if possible.
    const normalizedTenantId =
      typeof tenantId === "string"
        ? tenantId
        : tenantId?.tenantId || tenantId?._id || tenantId?.id;

    if (!normalizedTenantId && !tenantName) {
      return sendErrorResponse(
        res,
        "Tenant ID or name required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    let tenant;
    if (normalizedTenantId) {
      // Prefer Academic API as source of truth for tenants
      tenant = await academicIntegrationService.getTenantById(
        normalizedTenantId
      );

      // Fallback to Academic by name if ID lookup failed and name is available
      if (!tenant && tenantName) {
        tenant = await academicIntegrationService.getTenantByName(tenantName);
      }
    } else if (tenantName) {
      tenant = await academicIntegrationService.getTenantByName(tenantName);
    }

    if (!tenant) {
      return sendErrorResponse(
        res,
        "Tenant not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }

    return sendSuccessResponse(res, "Tenant validated successfully", {
      isValid: true,
      tenant: {
        id: tenant.id,
        schoolName: tenant.schoolName,
        profileStatus: tenant.profileStatus,
        isActive: tenant.isActive,
      },
    });
  } catch (error) {
    console.error("Validate tenant error:", error);
    const msg = (error as any)?.message;
    if (msg === "TENANT_NOT_FOUND") {
      return sendErrorResponse(
        res,
        "Tenant not found",
        SERVER_STATUS_CODES.NOT_FOUND
      );
    }
    return sendErrorResponse(
      res,
      "Tenant validation failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Bulk create users
export const bulkCreateUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return sendErrorResponse(
        res,
        "Users array required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    const results = await userService.bulkCreateUsers(users);

    return sendSuccessResponse(res, "Bulk user creation completed", {
      created: results.created,
      failed: results.failed,
      total: users.length,
    });
  } catch (error) {
    console.error("Bulk create users error:", error);
    return sendErrorResponse(
      res,
      "Bulk user creation failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Bulk update users
export const bulkUpdateUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return sendErrorResponse(
        res,
        "Updates array required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    const results = await userService.bulkUpdateUsers(updates);

    return sendSuccessResponse(res, "Bulk user update completed", {
      updated: results.updated,
      failed: results.failed,
      total: updates.length,
    });
  } catch (error) {
    console.error("Bulk update users error:", error);
    return sendErrorResponse(
      res,
      "Bulk user update failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Sync user data
export const syncUserData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, data } = req.body;

    if (!userId || !data) {
      return sendErrorResponse(
        res,
        "User ID and data required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    const result = await userService.syncUserData(userId, data);

    return sendSuccessResponse(res, "User data synced successfully", result);
  } catch (error) {
    console.error("Sync user data error:", error);
    return sendErrorResponse(
      res,
      "User data sync failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

// Sync tenant data
export const syncTenantData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tenantId, data } = req.body;

    if (!tenantId || !data) {
      return sendErrorResponse(
        res,
        "Tenant ID and data required",
        SERVER_STATUS_CODES.BAD_REQUEST
      );
    }

    const result = await tenantService.syncTenantData(tenantId, data);

    return sendSuccessResponse(res, "Tenant data synced successfully", result);
  } catch (error) {
    console.error("Sync tenant data error:", error);
    return sendErrorResponse(
      res,
      "Tenant data sync failed",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
};

import mongoose from "mongoose";
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  LoginResponse,
} from "../types/auth.types";
import * as userRepository from "../repositories/user.repository";
import * as userService from "./user.service";
import * as roleRepository from "../repositories/role.repository";

import { jwtHelper } from "../config/auth.config";
import { getStudentClasses } from "./student-data.service";
import * as tenantRepository from "../repositories/tenant.repository";
import * as academicIntegrationService from "./academic-integration.service";

// Authentication service - contains business logic for user authentication
// Register new user with role assignment and tenant association
export const registerUser = async (data: RegisterRequest) => {
  // Check if superadmin already exists
  if (data.userType === "superadmin") {
    const existingSuperadmin = await userRepository.superadminExists();
    if (existingSuperadmin) {
      throw new Error("SUPERADMIN_EXISTS");
    }
  }

  // Check if username exists for the tenant (if not superadmin)
  if (data.userType !== "superadmin" && data.tenantId) {
    const usernameExists = await userRepository.usernameExistsInTenant(
      data.username,
      data.tenantId
    );
    if (usernameExists) {
      throw new Error("USERNAME_EXISTS");
    }
  }

  const role = await roleRepository.findRoleByName(
    data.roleName,
    data.tenantId
  );
  if (!role) {
    throw new Error("INVALID_ROLE");
  }

  const userData = {
    ...data,
    role: role._id as mongoose.Types.ObjectId,
  };

  let newUser;
  try {
    newUser = await userRepository.createUser(userData);
  } catch (error: any) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      if (data.userType === "superadmin") {
        throw new Error("SUPERADMIN_EXISTS");
      } else {
        throw new Error("USERNAME_EXISTS");
      }
    }
    throw error;
  }

  return {
    id: newUser.id,
    username: newUser.username,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    phoneNumber: newUser.phoneNumber,
    userType: newUser.userType,
    tenantId: newUser.tenantId,
    tenantName: newUser.tenantName,
    role: {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
    },
    isEmailVerified: newUser.isEmailVerified,
    createdAt: (newUser as any).createdAt,
  };
};

// Unified login function for both SuperAdmin and tenant users
export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  let user;

  // If tenantName is provided, find user by email and tenant
  if (data.tenantName) {
    user = await userRepository.findUserByEmailAndTenant(
      data.email,
      data.tenantName
    );

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // For tenant users, ensure they are not superadmin
    if (user.userType === "superadmin") {
      throw new Error("INVALID_CREDENTIALS");
    }
  } else {
    // If no tenantName, only allow SuperAdmin login
    user = await userRepository.findUserByEmailForSuperadmin(data.email);

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Ensure user is superadmin
    if (user.userType !== "superadmin") {
      throw new Error("TENANT_NAME_REQUIRED");
    }
  }

  // DISABLED: Account lockout feature (5 attempts lockout)
  // if ((user as any).isLocked) {
  //   throw new Error("ACCOUNT_LOCKED");
  // }

  const isPasswordValid = await (user as any).comparePassword(data.password);

  if (!isPasswordValid) {
    // DISABLED: Increment login attempts (account lockout disabled)
    // await (user as any).incLoginAttempts();
    throw new Error("INVALID_CREDENTIALS");
  }

  // DISABLED: Reset login attempts (account lockout disabled)
  // if (user.loginAttempts > 0) {
  //   await (user as any).resetLoginAttempts();
  // }

  // Get role - can be populated document or ObjectId
  // If populate fails, role will be null but we can get the ObjectId from user document
  let role = user.role as any;

  // Get role ObjectId from user document (in case populate failed)
  // When populate fails (role document doesn't exist), role becomes null
  // But the original ObjectId is still stored in the user document
  let userRoleId: any = null;

  // Try to get role ID from populated role or from user document
  if (role && typeof role === "object" && role.name) {
    // Role is populated successfully
    userRoleId = role;
  } else if (role && typeof role === "object" && !role.name) {
    // Role is ObjectId, not populated
    userRoleId = role;
  } else if (!role) {
    // Role is null after populate (populate failed), get from user document
    // Mongoose stores the original ObjectId in _doc or we can query it again
    const userDoc = (user as any)._doc || (user as any);
    userRoleId = userDoc.role;

    // If still null, try to get from lean query or re-fetch
    if (!userRoleId) {
      // Re-fetch user without populate to get the role ObjectId
      const userWithoutPopulate =
        await userRepository.findUserByEmailAndTenantWithoutPopulate(
          data.email,
          data.tenantName || ""
        );
      if (userWithoutPopulate && userWithoutPopulate.role) {
        userRoleId = userWithoutPopulate.role;
      }
    }
  } else {
    userRoleId = role;
  }

  // Debug: Check if role exists

  // Handle both _id and id for role (Mongoose populated documents)
  // Role can be ObjectId (not populated) or populated document
  let roleId: string | null = null;
  let roleName: string | null = null;
  let roleDisplayName: string | null = null;

  // Check if role is populated (has name property) or just ObjectId
  if (role && typeof role === "object" && role.name) {
    // Role is populated

    roleId =
      role.id ||
      role._id?.toString() ||
      (role._id ? role._id.toString() : null);
    roleName = role.name;
    roleDisplayName = role.displayName || null;
  } else if (userRoleId) {
    // Role is just ObjectId or null after populate, need to fetch it
    const roleIdToFetch =
      role?.toString() ||
      userRoleId?.toString() ||
      (userRoleId ? userRoleId.toString() : null);

    if (roleIdToFetch) {
      const roleData = await roleRepository.findRoleById(roleIdToFetch);
      if (!roleData) {
        console.error("❌ Role not found in database:", roleIdToFetch);
        console.error("   User ID:", user.id);
        console.error("   User Email:", user.email);
        throw new Error("USER_ROLE_NOT_FOUND");
      }
      roleId =
        roleData.id ||
        roleData._id?.toString() ||
        (roleData._id ? roleData._id.toString() : null);
      roleName = roleData.name;
      roleDisplayName = roleData.displayName || null;
    } else {
      throw new Error("USER_ROLE_NOT_FOUND");
    }
  } else {
    console.error("❌ Role is null and user has no role ID");
    console.error("   User ID:", user.id);
    console.error("   User Email:", user.email);
    throw new Error("USER_ROLE_NOT_FOUND");
  }

  if (!roleId || !roleName) {
    console.error("❌ Role data incomplete:", {
      roleId,
      roleName,
      roleDisplayName,
      originalRole: role,
      userRoleId,
    });
    throw new Error("USER_ROLE_NOT_FOUND");
  }

  // Fetch tenant context from Academic API before generating tokens
  const userIdStr = user.id.toString();
  console.log(
    `🔄 [Login] Fetching full tenant context for admin ID: ${userIdStr} from Academic API...`
  );
  let academicTenantData = await academicIntegrationService.getTenantByAdminId(
    userIdStr
  );

  // Fallback if needed
  if (!academicTenantData && user.tenantName) {
    console.log(
      `ℹ️ [Login] Admin ID fetch failed, trying fallback to tenantName: ${user.tenantName}`
    );
    academicTenantData = await academicIntegrationService.getTenantByName(
      user.tenantName
    );
  }

  // Resolve tenantId for JWT.
  // academicTenantData can be either a full tenant object OR a "tenant-context" shape like:
  // { tenantId: "<tenantObjectId>", adminId: "<adminUserId>" }
  const academicTenantId =
    (academicTenantData as any)?.id ||
    ((academicTenantData as any)?._id &&
    typeof (academicTenantData as any)._id === "string"
      ? (academicTenantData as any)._id
      : (academicTenantData as any)?._id?.toString?.()) ||
    (academicTenantData as any)?.tenantId ||
    (academicTenantData as any)?.tenantId?._id?.toString?.() ||
    (academicTenantData as any)?.tenantId?.id?.toString?.();

  const userTenantIdValue: any = (user as any).tenantId;
  const userTenantId =
    userTenantIdValue?.id?.toString?.() ||
    userTenantIdValue?._id?.toString?.() ||
    (typeof userTenantIdValue === "string"
      ? userTenantIdValue
      : userTenantIdValue?.toString?.());

  let effectiveTenantId = academicTenantId || userTenantId || undefined;

  // Final fallback: resolve from user-api Tenant collection using tenantName
  if (!effectiveTenantId && user.tenantName) {
    const localTenant = await tenantRepository.findTenantByTenantName(
      user.tenantName
    );
    effectiveTenantId = localTenant?._id?.toString?.() ?? undefined;
  }

  console.log(`📡 [Login] Effective Tenant ID for JWT: ${effectiveTenantId}`);

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    roleId: roleId,
    roleName: roleName,
    userAccessType: user.userAccessType,
    tenantId: effectiveTenantId,
    tenantName:
      academicTenantData?.domainName ||
      academicTenantData?.tenantName ||
      user.tenantName,
  };

  const { accessToken, refreshToken } =
    jwtHelper.generateTokenPair(tokenPayload);

  await userRepository.updateUserRefreshToken(
    (user as any)._id.toString(),
    refreshToken
  );

  // If user is a student, fetch their class details
  let classData: any = null;
  if (user.userType === "student") {
    if (effectiveTenantId) {
      classData = await getStudentClasses(user.id, effectiveTenantId);
    }
  }

  return {
    user: {
      id: user.id.toString(),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      // Return tenantId in expected format: { tenantId, adminId } for API response
      tenantId: effectiveTenantId
        ? { tenantId: effectiveTenantId, adminId: user.id.toString() }
        : undefined,
      tenantName:
        academicTenantData?.domainName ||
        academicTenantData?.tenantName ||
        user.tenantName,
      role: {
        id:
          (user.role as any).id ||
          (user.role as any)._id?.toString() ||
          user.role.toString(),
        name: (user.role as any).name,
        displayName:
          (user.role as any).name === "ADMIN"
            ? "Admin"
            : (user.role as any).displayName,
      },
      lastLogin: new Date(),
      class: classData || undefined,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

// Refresh access token using refresh token
export const refreshUserToken = async (data: RefreshTokenRequest) => {
  let decoded;
  try {
    decoded = jwtHelper.verifyRefreshToken(data.refreshToken);
  } catch (error) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const user = await userRepository.findUserByRefreshToken(
    data.refreshToken,
    decoded.userId,
    decoded.email
  );

  if (!user) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const role = user.role as any;

  const refreshUserTenantIdValue: any = (user as any).tenantId;
  let refreshTenantId =
    refreshUserTenantIdValue?.id?.toString?.() ||
    refreshUserTenantIdValue?._id?.toString?.() ||
    (typeof refreshUserTenantIdValue === "string"
      ? refreshUserTenantIdValue
      : refreshUserTenantIdValue?.toString?.());

  if (!refreshTenantId && user.tenantName) {
    const localTenant = await tenantRepository.findTenantByTenantName(
      user.tenantName
    );
    refreshTenantId = localTenant?._id?.toString?.() ?? undefined;
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    roleId: role.id,
    roleName: role.name,
    userAccessType: user.userAccessType,
    tenantId: refreshTenantId,
    tenantName: user.tenantName,
  };

  const { accessToken, refreshToken: newRefreshToken } =
    jwtHelper.generateTokenPair(tokenPayload);

  if (!data.refreshToken) {
    await userRepository.updateUserRefreshToken(
      (user as any)._id.toString(),
      newRefreshToken
    );
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  return {
    accessToken,
  };
};

// Logout user by clearing refresh token
export const logoutUser = async (userId: string) => {
  await userRepository.clearUserRefreshToken(userId);
  return {};
};

// Get user profile information
export const getUserProfile = async (userId: string) => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // If user is a student, fetch their class details
  let classData: any = null;
  if (user.userType === "student") {
    let tenantIdStr: string | null = null;

    if (user.tenantId) {
      // Check if it's a populated document (has _id) or just an ID
      const tId = user.tenantId as any;
      if (tId._id) {
        tenantIdStr = tId._id.toString();
      } else {
        tenantIdStr = tId.toString();
      }
    } else {
      tenantIdStr = user.tenantName || null;
    }

    if (tenantIdStr) {
      classData = await getStudentClasses(user.id, tenantIdStr);
    }
  }

  // Return user object with classes if available
  // We need to convert to object first to add the property safely
  const userObj = user.toObject();
  if (classData) {
    (userObj as any).class = classData;
  }

  return userObj;
};

// Update user profile information
export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileRequest
) => {
  const updatedUser = await userService.updateUser(userId, data);

  if (!updatedUser) {
    throw new Error("USER_NOT_FOUND");
  }

  return updatedUser;
};

// Change user password with current password verification
export const changeUserPassword = async (
  userId: string,
  data: ChangePasswordRequest
) => {
  const user = await userRepository.findUserByIdWithPassword(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const isCurrentPasswordValid = await (user as any).comparePassword(
    data.currentPassword
  );

  if (!isCurrentPasswordValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  user.password = data.newPassword;
  await user.save();

  await userRepository.clearUserRefreshToken(userId);

  return {};
};

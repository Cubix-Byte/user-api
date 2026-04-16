import * as userRepository from "../repositories/user.repository";
import * as roleRepository from "../repositories/role.repository";
import * as roleService from "./role.service";
import { IUser } from "../models/user.schema";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { PASSWORD_CONFIG } from "../utils/shared-lib-imports";

/**
 * User Service - Business logic for user management
 * Handles user CRUD operations and user-related business logic
 */

// Create new user
export const createUser = async (data: Partial<IUser>) => {
  // Check if username already exists within the same tenant
  if (data.tenantId) {
    const existingUserByUsername =
      await userRepository.findUserByUsernameAndTenantId(
        data.username!,
        data.tenantId.toString()
      );
    if (existingUserByUsername) {
      throw new Error("USERNAME_EXISTS");
    }

    // Check if email already exists within the same tenant
    const existingUserByEmail = await userRepository.findUserByEmailAndTenantId(
      data.email!,
      data.tenantId.toString()
    );
    if (existingUserByEmail) {
      throw new Error("EMAIL_EXISTS");
    }
  } else {
    // Fallback to global validation if no tenantId provided (for superadmin)
    const existingUserByUsername = await userRepository.findUserByUsername(
      data.username!
    );
    if (existingUserByUsername) {
      throw new Error("USERNAME_EXISTS");
    }

    const existingUserByEmail = await userRepository.findUserByEmail(
      data.email!
    );
    if (existingUserByEmail) {
      throw new Error("EMAIL_EXISTS");
    }
  }

  // Password will be hashed by the User model's pre-save middleware
  console.log("🔍 User service createUser - input data _id:", data._id);
  const user = await userRepository.createUser(data as any);
  console.log("🔍 User service createUser - created user _id:", user._id);
  console.log("🔍 User service createUser - created user id:", user.id);
  return user;
};

// Get user by ID
export const getUserById = async (id: string, includeInactive: boolean = false) => {
  const user = await userRepository.findUserByIdLean(id, includeInactive);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return user;
};

// Get user by username
export const getUserByUsername = async (username: string) => {
  const user = await userRepository.findUserByUsername(username);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return user;
};

// Get user by email
export const getUserByEmail = async (email: string) => {
  const user = await userRepository.findUserByEmail(email);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return user;
};

// Get user by username and tenant (for validation)
export const getUserByUsernameAndTenant = async (
  username: string,
  tenantId: string
) => {
  const user = await userRepository.findUserByUsernameAndTenantId(
    username,
    tenantId
  );
  return user; // Returns null if not found, user object if found
};

// Get user by email and tenant (for validation)
export const getUserByEmailAndTenant = async (
  email: string,
  tenantId: string
) => {
  const user = await userRepository.findUserByEmailAndTenantId(email, tenantId);
  return user; // Returns null if not found, user object if found
};

/**
 * Batch check which emails already exist as users in this tenant (for bulk upload validation).
 * Returns array of existing emails (lowercase).
 */
export const getExistingEmailsForTenant = async (
  emails: string[],
  tenantId: string
): Promise<string[]> => {
  const set = await userRepository.findExistingEmails(emails, tenantId);
  return Array.from(set);
};

// Update user
export const updateUser = async (id: string, data: Partial<IUser>) => {
  // If password is being updated, we need to use .save() to trigger pre-save middleware
  if (data.password) {
    const user = await userRepository.findUserById(id, true);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Update all fields
    Object.assign(user, data);
    // Save to trigger pre-save middleware for password hashing
    await user.save();
    return user;
  }

  // For non-password updates, use updateUserById
  const user = await userRepository.updateUserById(id, data);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return user;
};

// Delete user (soft delete)
export const deleteUser = async (id: string) => {
  const user = await userRepository.softDeleteUserById(id);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  return user;
};

// Get users by IDs (batch)
export const getUsersByIds = async (userIds: string[]) => {
  const users = await userRepository.findUsersByIds(userIds);
  return users;
};

// Bulk create users (OPTIMIZED VERSION)
export const bulkCreateUsers = async (usersData: Partial<IUser>[]) => {
  const results: any = {
    created: [],
    failed: [],
  };

  if (!usersData || usersData.length === 0) {
    return results;
  }

  console.log(`🚀 Starting optimized bulk user creation for ${usersData.length} users...`);

  try {
    // STEP 1: Group users by tenantId for batch operations
    const usersByTenant = new Map<string, typeof usersData>();
    const usersWithoutTenant: typeof usersData = [];

    for (const userData of usersData) {
      const tenantId = userData.tenantId?.toString();
      if (tenantId) {
        if (!usersByTenant.has(tenantId)) {
          usersByTenant.set(tenantId, []);
        }
        usersByTenant.get(tenantId)!.push(userData);
      } else {
        usersWithoutTenant.push(userData);
      }
    }

    // STEP 2: Batch check for existing usernames and emails per tenant
    const validationResults = new Map<string, { validUsers: typeof usersData; invalidUsers: Array<{ user: Partial<IUser>; error: string }> }>();

    for (const [tenantId, tenantUsers] of usersByTenant.entries()) {
      const validUsers: typeof usersData = [];
      const invalidUsers: Array<{ user: Partial<IUser>; error: string }> = [];

      // Batch check usernames
      const usernames = tenantUsers
        .map(u => u.username)
        .filter(Boolean) as string[];
      const existingUsernames = await userRepository.findExistingUsernames(usernames, tenantId);

      // Batch check emails
      const emails = tenantUsers
        .map(u => u.email)
        .filter(Boolean) as string[];
      const existingEmails = await userRepository.findExistingEmails(emails, tenantId);

      // Validate each user
      for (const userData of tenantUsers) {
        const username = userData.username?.toLowerCase();
        const email = userData.email?.toLowerCase();

        if (username && existingUsernames.has(username)) {
          invalidUsers.push({
            user: userData,
            error: "USERNAME_EXISTS",
          });
          continue;
        }

        if (email && existingEmails.has(email)) {
          invalidUsers.push({
            user: userData,
            error: "EMAIL_EXISTS",
          });
          continue;
        }

        if (!userData.username || !userData.email) {
          invalidUsers.push({
            user: userData,
            error: "MISSING_USERNAME_OR_EMAIL",
          });
          continue;
        }

        validUsers.push(userData);
      }

      validationResults.set(tenantId, { validUsers, invalidUsers });
    }

    // Handle users without tenant (superadmin case - validate individually)
    // For superadmin users, we'll process them separately using the original createUser method
    // since they don't have tenantId and need different validation logic
    for (const userData of usersWithoutTenant) {
      try {
        // Use the original createUser method for superadmin (handles validation)
        const user = await createUser(userData);
        results.created.push(user);
      } catch (error) {
        results.failed.push({
          data: userData,
          error: (error as Error).message,
        });
      }
    }

    // STEP 3: Resolve roles per tenant (with caching)
    const roleCache = new Map<string, Map<string, mongoose.Types.ObjectId>>(); // tenantId -> roleName -> roleId

    for (const [tenantId, tenantUsers] of usersByTenant.entries()) {
      if (tenantId === "_no_tenant") continue; // Skip superadmin users

      const { validUsers } = validationResults.get(tenantId) || { validUsers: [] };
      const uniqueRoleNames = new Set<string>();

      for (const userData of validUsers) {
        const userDataWithRole = userData as any;
        if (userDataWithRole.roleName && !userData.role) {
          uniqueRoleNames.add(userDataWithRole.roleName);
        }
      }

      // Resolve all unique roles for this tenant in parallel
      const rolePromises = Array.from(uniqueRoleNames).map(async (roleName) => {
        try {
          const role = await roleService.getRoleByName(roleName, tenantId);
          return { roleName, roleId: role._id };
        } catch (roleError) {
          // Try to create role
          try {
            const newRole = await roleService.createDefaultRole(roleName, tenantId);
            return { roleName, roleId: newRole._id };
          } catch (createError) {
            // Try fallback roles
            try {
              let adminRole;
              try {
                adminRole = await roleService.getRoleByName("PRIMARYADMIN", tenantId);
              } catch {
                adminRole = await roleService.getRoleByName("ADMIN", tenantId);
              }
              return { roleName, roleId: adminRole._id };
            } catch {
              throw new Error(`Role '${roleName}' not found for tenant ${tenantId}`);
            }
          }
        }
      });

      const resolvedRoles = await Promise.all(rolePromises);
      const tenantRoleMap = new Map<string, mongoose.Types.ObjectId>();
      resolvedRoles.forEach(({ roleName, roleId }) => {
        tenantRoleMap.set(roleName, roleId);
      });
      roleCache.set(tenantId, tenantRoleMap);
    }

    // STEP 4: Prepare users for bulk insert (with role assignment and password hashing)
    const usersToInsert: Array<{
      _id?: mongoose.Types.ObjectId | string;
      username: string;
      email: string;
      password: string; // Will be hashed
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      tenantId?: mongoose.Types.ObjectId | string;
      tenantName?: string;
      role: mongoose.Types.ObjectId;
      userType?: string;
      userAccessType?: string;
      isEmailVerified?: boolean;
      isActive?: boolean;
      isDeleted?: boolean;
      createdBy?: string;
    }> = [];

    const userIndexMap = new Map<number, Partial<IUser>>(); // Track original user data by index

    let insertIndex = 0;
    for (const [tenantId, tenantUsers] of usersByTenant.entries()) {
      const { validUsers } = tenantId !== "_no_tenant"
        ? (validationResults.get(tenantId) || { validUsers: [] })
        : { validUsers: tenantUsers };

      for (const userData of validUsers) {
        const userDataWithRole = userData as any;

        // Resolve role
        let roleId: mongoose.Types.ObjectId | undefined = userData.role as mongoose.Types.ObjectId;

        if (!roleId && userDataWithRole.roleName && userData.tenantId) {
          const tenantRoleMap = roleCache.get(userData.tenantId.toString());
          if (tenantRoleMap) {
            roleId = tenantRoleMap.get(userDataWithRole.roleName);
          }
        }

        if (!roleId) {
          results.failed.push({
            data: userData,
            error: "ROLE_NOT_FOUND",
          });
          continue;
        }

        // Store mapping for error reporting
        userIndexMap.set(insertIndex, userData);

        usersToInsert.push({
          _id: userData._id,
          username: userData.username!,
          email: userData.email!,
          password: userData.password as string, // Will be hashed in parallel
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          tenantId: userData.tenantId,
          tenantName: userData.tenantName,
          role: roleId,
          userType: userData.userType,
          userAccessType: userData.userAccessType,
          isEmailVerified: userData.isEmailVerified,
          isActive: userData.isActive,
          isDeleted: userData.isDeleted,
          createdBy: userData.createdBy,
        });

        insertIndex++;
      }
    }

    // Add validation failures to results
    for (const { invalidUsers } of validationResults.values()) {
      for (const { user, error } of invalidUsers) {
        results.failed.push({
          data: user,
          error,
        });
      }
    }

    if (usersToInsert.length === 0) {
      console.log("⚠️ No valid users to insert after validation");
      return results;
    }

    // STEP 5: Hash all passwords in parallel (CPU-intensive operation)
    console.log(`🔐 Hashing passwords for ${usersToInsert.length} users in parallel...`);

    type PasswordHashResult =
      | { index: number; hashedPassword: string; error?: never }
      | { index: number; hashedPassword?: never; error: string };

    const passwordHashingPromises = usersToInsert.map(async (user, index): Promise<PasswordHashResult> => {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return { index, hashedPassword };
      } catch (error) {
        return { index, error: (error as Error).message };
      }
    });

    const passwordResults = await Promise.all(passwordHashingPromises);

    // Apply hashed passwords
    const passwordErrors: number[] = [];
    passwordResults.forEach((result) => {
      if ('error' in result || !result.hashedPassword) {
        passwordErrors.push(result.index);
        results.failed.push({
          data: userIndexMap.get(result.index),
          error: `Password hashing failed: ${'error' in result ? result.error : 'Unknown error'}`,
        });
      } else {
        // TypeScript now knows hashedPassword is string after the type guard check
        usersToInsert[result.index].password = result.hashedPassword;
      }
    });

    // Remove users with password hashing errors
    const validUsersToInsert = usersToInsert.filter((_, index) => !passwordErrors.includes(index));

    if (validUsersToInsert.length === 0) {
      console.log("⚠️ No valid users to insert after password hashing");
      return results;
    }

    // STEP 6: Bulk insert using insertMany with ordered: true (all-or-nothing)
    // If ANY user fails, ALL users fail - no partial success
    console.log(`💾 Bulk inserting ${validUsersToInsert.length} users using insertMany (all-or-nothing)...`);
    try {
      const insertedUsers = await userRepository.bulkInsertUsers(validUsersToInsert);
      console.log(`✅ Successfully inserted ${insertedUsers.length} users`);

      // Map inserted users back to results
      insertedUsers.forEach((user) => {
        results.created.push(user);
      });
    } catch (bulkError: any) {
      // Handle bulk insert errors
      // With ordered: true, if ANY document fails, insertion stops
      // However, documents inserted before the error remain in DB
      // We need to clean them up for true all-or-nothing behavior
      console.error("❌ Bulk insert failed (all-or-nothing):", bulkError.message);

      // Extract error message and determine field
      let errorMessage = bulkError.message || "Bulk insert failed";
      let errorField = "userCreation";

      // Parse MongoDB duplicate key errors
      if (bulkError.code === 11000 || bulkError.message?.includes("duplicate key")) {
        // Check if it's username or email duplicate
        if (bulkError.message?.includes("username") || bulkError.keyPattern?.username) {
          errorField = "email"; // Username is typically the email
          errorMessage = "Email already exists in the system";
        } else if (bulkError.message?.includes("email") || bulkError.keyPattern?.email) {
          errorField = "email";
          errorMessage = "Email already exists in the system";
        } else {
          errorField = "email";
          errorMessage = "User with this email already exists";
        }
      }

      // Cleanup any users that were inserted before the error (all-or-nothing)
      const insertedCount = bulkError.insertedCount || 0;
      if (insertedCount > 0) {
        console.log(`🧹 Cleaning up ${insertedCount} users that were inserted before error...`);
        const insertedUserIds = validUsersToInsert
          .slice(0, insertedCount)
          .map(u => u._id?.toString())
          .filter(Boolean) as string[];

        // Soft delete inserted users in parallel (all-or-nothing cleanup)
        if (insertedUserIds.length > 0) {
          try {
            await Promise.all(
              insertedUserIds.map(async (userId) => {
                try {
                  await userRepository.softDeleteUserById(userId);
                } catch (deleteError) {
                  console.error(`⚠️ Failed to cleanup user ${userId}:`, deleteError);
                }
              })
            );
            console.log(`✅ Cleaned up ${insertedUserIds.length} users`);
          } catch (cleanupError) {
            console.error("⚠️ Error during user cleanup:", cleanupError);
          }
        }
      }

      // Mark ALL users as failed (all-or-nothing)
      validUsersToInsert.forEach((user, index) => {
        results.failed.push({
          data: userIndexMap.get(index),
          error: errorMessage,
        });
      });
    }

    console.log(`✅ Bulk user creation completed: ${results.created.length} created, ${results.failed.length} failed`);
    return results;
  } catch (error) {
    console.error("❌ Fatal error in bulk user creation:", error);
    // If fatal error, mark all as failed
    usersData.forEach((userData) => {
      results.failed.push({
        data: userData,
        error: (error as Error).message,
      });
    });
    return results;
  }
};

// Bulk update users
export const bulkUpdateUsers = async (
  updates: { id: string; data: Partial<IUser> }[]
) => {
  const results: any = {
    updated: [],
    failed: [],
  };

  for (const update of updates) {
    try {
      const user = await updateUser(update.id, update.data);
      results.updated.push(user);
    } catch (error) {
      results.failed.push({
        id: update.id,
        error: (error as Error).message,
      });
    }
  }

  return results;
};

// Sync user data
export const syncUserData = async (userId: string, data: any) => {
  const user = await updateUser(userId, data);
  return {
    userId,
    synced: true,
    data: user,
  };
};

// Get all users with pagination and filters
export const getAllUsers = async (params: {
  pageNo?: number;
  pageSize?: number;
  tenantId?: string;
  query?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
}) => {
  const users = await userRepository.findUsers({
    pageNo: params.pageNo,
    pageSize: params.pageSize,
    tenantId: params.tenantId,
    query: params.query,
    sort: params.sort,
  });

  const total = await userRepository.countUsers({
    tenantId: params.tenantId,
    query: params.query,
  });

  return {
    users,
    pagination: {
      total,
      pageNo: params.pageNo || 1,
      pageSize: params.pageSize || 10,
      totalPages: Math.ceil(total / (params.pageSize || 10)),
    },
  };
};

// Get users by tenant
export const getUsersByTenant = async (
  tenantId: string,
  params: {
    pageNo?: number;
    pageSize?: number;
    userType?: string;
  }
) => {
  return await getAllUsers({
    ...params,
    tenantId,
  });
};

// Get users by role
export const getUsersByRole = async (
  roleId: string,
  params: {
    pageNo?: number;
    pageSize?: number;
  }
) => {
  const users = await userRepository.findUsersByRole(roleId, params);
  const total = await userRepository.countUsersByRole(roleId, params);

  return {
    users,
    pagination: {
      total,
      pageNo: params.pageNo || 1,
      pageSize: params.pageSize || 10,
      totalPages: Math.ceil(total / (params.pageSize || 10)),
    },
  };
};

// Change user password
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await userRepository.findUserByIdWithPassword(userId, true);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Verify current password
  const isCurrentPasswordValid = await (user as any).comparePassword(
    currentPassword
  );
  if (!isCurrentPasswordValid) {
    throw new Error("INVALID_CURRENT_PASSWORD");
  }

  // Update password using .save() to trigger pre-save middleware for password hashing
  user.password = newPassword;
  await user.save();

  return { success: true };
};

// Reset user password
export const resetPassword = async (userId: string, newPassword: string) => {
  // Find user document first to use .save() which triggers pre-save middleware
  const user = await userRepository.findUserById(userId, true);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Set password and save - this will trigger pre-save middleware to hash the password
  user.password = newPassword;
  await user.save();

  return { success: true };
};

// Activate/Deactivate user
export const toggleUserStatus = async (userId: string, isActive: boolean) => {
  const user = await userRepository.updateUserById(userId, { isActive });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
};

// Get user statistics
export const getUserStatistics = async (tenantId?: string) => {
  const stats = await userRepository.getUserStatistics(tenantId);
  return stats;
};

// Get user statistics excluding admin users
export const getUserStats = async (tenantId?: string) => {
  const stats = await userRepository.getUserStats(tenantId);
  return stats;
};

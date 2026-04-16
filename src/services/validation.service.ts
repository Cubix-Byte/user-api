import * as roleRepository from "../repositories/role.repository";
import * as tenantRepository from "../repositories/tenant.repository";
import { createTenantRoles } from "../seeders/superadmin.seeder";
import { ROLE_NAMES } from "../utils/shared-lib-imports";
import mongoose from "mongoose";

/**
 * Validation Service
 * Handles all validation logic before data insertion/update
 */

/**
 * Validates that a tenant has all required roles
 * If roles are missing, creates them automatically
 */
export const validateTenantRoles = async (
  tenantId: string
): Promise<boolean> => {
  try {
    console.log(`🔍 Validating roles for tenant: ${tenantId}`);

    // Check if tenant exists
    // const tenant = await tenantRepository.findTenantById(tenantId);
    // if (!tenant) {
    //   throw new Error(`Tenant with ID ${tenantId} not found`);
    // }

    // Get all roles for this tenant
    const existingRoles = await roleRepository.findRolesByTenant(tenantId);
    const existingRoleNames = existingRoles.map((role) => role.name);

    // Define required roles for a tenant
    const requiredRoles = [
      ROLE_NAMES.ADMIN,
      ROLE_NAMES.TEACHER,
      ROLE_NAMES.STUDENT,
      ROLE_NAMES.PARENT,
    ];

    // Check which roles are missing
    const missingRoles = requiredRoles.filter(
      (roleName) => !existingRoleNames.includes(roleName)
    );

    if (missingRoles.length > 0) {
      console.log(`⚠️ Missing roles for tenant ${tenantId}:`, missingRoles);
      console.log(`🔄 Creating missing roles for tenant...`);

      // Create all tenant roles (this will skip existing ones)
      await createTenantRoles(new mongoose.Types.ObjectId(tenantId));

      console.log(`✅ All required roles created for tenant ${tenantId}`);
    } else {
      console.log(`✅ All required roles exist for tenant ${tenantId}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error validating tenant roles:`, error);
    throw new Error(
      `Failed to validate tenant roles: ${(error as Error).message}`
    );
  }
};

/**
 * Validates user data before creation
 */
export const validateUserData = async (
  userData: any
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Auto-generate username from email if not provided
  if (!userData.username && userData.email) {
    userData.username = userData.email.toLowerCase().trim();
  }

  // Required fields validation
  if (!userData.username) errors.push("Username is required (or provide email to auto-generate)");
  if (!userData.email) errors.push("Email is required");
  if (!userData.password) errors.push("Password is required");
  if (!userData.firstName) errors.push("First name is required");
  if (!userData.lastName) errors.push("Last name is required");
  if (!userData.tenantId) errors.push("Tenant ID is required");

  // Auto-set userType if roleName is provided
  if (!userData.userType && userData.roleName) {
    const roleToUserTypeMap: { [key: string]: string } = {
      'PARENT': 'parent',
      'TEACHER': 'teacher',
      'STUDENT': 'student',
      'ADMIN': 'admin',
    };
    if (roleToUserTypeMap[userData.roleName.toUpperCase()]) {
      userData.userType = roleToUserTypeMap[userData.roleName.toUpperCase()];
    }
  }

  if (!userData.userType) errors.push("User type is required");

  // Email format validation
  if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push("Invalid email format");
  }

  // Phone number validation (if provided)
  if (
    userData.phoneNumber &&
    !/^[\+]?[0-9\-\s]{10,20}$/.test(userData.phoneNumber)
  ) {
    errors.push(
      "Invalid phone number format. Must be 10-20 characters with optional + prefix"
    );
  }

  // Password strength validation
  if (userData.password && userData.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // User type validation
  const validUserTypes = [
    "superadmin",
    "admin",
    "teacher",
    "student",
    "parent",
  ];
  if (userData.userType && !validUserTypes.includes(userData.userType)) {
    errors.push(
      `Invalid user type. Must be one of: ${validUserTypes.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates that a role exists for the given tenant
 */
export const validateRoleExists = async (
  roleName: string,
  tenantId: string
): Promise<boolean> => {
  try {
    const role = await roleRepository.findRoleByName(roleName, tenantId);
    return !!role;
  } catch (error) {
    return false;
  }
};

/**
 * Comprehensive validation for user creation
 */
export const validateUserCreation = async (
  userData: any
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Step 1: Validate user data format
  const userValidation = await validateUserData(userData);
  if (!userValidation.isValid) {
    errors.push(...userValidation.errors);
  }

  // Step 2: Validate tenant has all required roles
  // try {
  //   await validateTenantRoles(userData.tenantId);
  // } catch (error) {
  //   errors.push(`Tenant validation failed: ${(error as Error).message}`);
  // }

  // Step 3: Validate role exists (if roleName is provided)
  // if (userData.roleName && userData.tenantId) {
  //   const roleExists = await validateRoleExists(
  //     userData.roleName,
  //     userData.tenantId
  //   );
  //   if (!roleExists) {
  //     errors.push(
  //       `Role '${userData.roleName}' does not exist for tenant ${userData.tenantId}`
  //     );
  //   }
  // }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

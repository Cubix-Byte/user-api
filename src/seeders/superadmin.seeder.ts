import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "../config/database";
import { User, Role, Permission } from "../models";
import { ROLE_NAMES, PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "../utils/shared-lib-imports";
import { encryptPassword } from "../utils/encryption.helper";
import mongoose from "mongoose";

/**
 * SuperAdmin Auto-Seeder
 * 
 * This seeder runs automatically on every application startup to ensure:
 * 1. SuperAdmin role exists with all permissions
 * 2. SuperAdmin user exists with default credentials
 * 
 * The seeder is idempotent - it won't create duplicates if they already exist.
 */

// Default SuperAdmin credentials
const SUPERADMIN_CREDENTIALS = {
  username: "superadmin",
  firstName: "Super",
  lastName: "Admin",
  email: "superadmin@brighton.com",
  password: "Super123",
  phoneNumber: "+1234567890"
};

// All permissions that SuperAdmin should have
const permissionsData = [
  // User permissions
  { name: "USER_CREATE", displayName: "Create User", resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.CREATE },
  { name: "USER_READ", displayName: "Read User", resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.READ },
  { name: "USER_UPDATE", displayName: "Update User", resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.UPDATE },
  { name: "USER_DELETE", displayName: "Delete User", resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.DELETE },
  { name: "USER_LIST", displayName: "List Users", resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.LIST },
  { name: "USER_MANAGE", displayName: "Manage Users", resource: PERMISSION_RESOURCES.USER, action: PERMISSION_ACTIONS.MANAGE },

  // Role permissions
  { name: "ROLE_CREATE", displayName: "Create Role", resource: PERMISSION_RESOURCES.ROLE, action: PERMISSION_ACTIONS.CREATE },
  { name: "ROLE_READ", displayName: "Read Role", resource: PERMISSION_RESOURCES.ROLE, action: PERMISSION_ACTIONS.READ },
  { name: "ROLE_UPDATE", displayName: "Update Role", resource: PERMISSION_RESOURCES.ROLE, action: PERMISSION_ACTIONS.UPDATE },
  { name: "ROLE_DELETE", displayName: "Delete Role", resource: PERMISSION_RESOURCES.ROLE, action: PERMISSION_ACTIONS.DELETE },
  { name: "ROLE_LIST", displayName: "List Roles", resource: PERMISSION_RESOURCES.ROLE, action: PERMISSION_ACTIONS.LIST },
  { name: "ROLE_MANAGE", displayName: "Manage Roles", resource: PERMISSION_RESOURCES.ROLE, action: PERMISSION_ACTIONS.MANAGE },

  // Tenant permissions
  { name: "TENANT_CREATE", displayName: "Create Tenant", resource: PERMISSION_RESOURCES.TENANT, action: PERMISSION_ACTIONS.CREATE },
  { name: "TENANT_READ", displayName: "Read Tenant", resource: PERMISSION_RESOURCES.TENANT, action: PERMISSION_ACTIONS.READ },
  { name: "TENANT_UPDATE", displayName: "Update Tenant", resource: PERMISSION_RESOURCES.TENANT, action: PERMISSION_ACTIONS.UPDATE },
  { name: "TENANT_DELETE", displayName: "Delete Tenant", resource: PERMISSION_RESOURCES.TENANT, action: PERMISSION_ACTIONS.DELETE },
  { name: "TENANT_LIST", displayName: "List Tenants", resource: PERMISSION_RESOURCES.TENANT, action: PERMISSION_ACTIONS.LIST },
  { name: "TENANT_MANAGE", displayName: "Manage Tenants", resource: PERMISSION_RESOURCES.TENANT, action: PERMISSION_ACTIONS.MANAGE },

  // Teacher permissions
  { name: "TEACHER_CREATE", displayName: "Create Teacher", resource: PERMISSION_RESOURCES.TEACHER, action: PERMISSION_ACTIONS.CREATE },
  { name: "TEACHER_READ", displayName: "Read Teacher", resource: PERMISSION_RESOURCES.TEACHER, action: PERMISSION_ACTIONS.READ },
  { name: "TEACHER_UPDATE", displayName: "Update Teacher", resource: PERMISSION_RESOURCES.TEACHER, action: PERMISSION_ACTIONS.UPDATE },
  { name: "TEACHER_DELETE", displayName: "Delete Teacher", resource: PERMISSION_RESOURCES.TEACHER, action: PERMISSION_ACTIONS.DELETE },
  { name: "TEACHER_LIST", displayName: "List Teachers", resource: PERMISSION_RESOURCES.TEACHER, action: PERMISSION_ACTIONS.LIST },
  { name: "TEACHER_MANAGE", displayName: "Manage Teachers", resource: PERMISSION_RESOURCES.TEACHER, action: PERMISSION_ACTIONS.MANAGE },

  // Student permissions
  { name: "STUDENT_CREATE", displayName: "Create Student", resource: PERMISSION_RESOURCES.STUDENT, action: PERMISSION_ACTIONS.CREATE },
  { name: "STUDENT_READ", displayName: "Read Student", resource: PERMISSION_RESOURCES.STUDENT, action: PERMISSION_ACTIONS.READ },
  { name: "STUDENT_UPDATE", displayName: "Update Student", resource: PERMISSION_RESOURCES.STUDENT, action: PERMISSION_ACTIONS.UPDATE },
  { name: "STUDENT_DELETE", displayName: "Delete Student", resource: PERMISSION_RESOURCES.STUDENT, action: PERMISSION_ACTIONS.DELETE },
  { name: "STUDENT_LIST", displayName: "List Students", resource: PERMISSION_RESOURCES.STUDENT, action: PERMISSION_ACTIONS.LIST },
  { name: "STUDENT_MANAGE", displayName: "Manage Students", resource: PERMISSION_RESOURCES.STUDENT, action: PERMISSION_ACTIONS.MANAGE },

  // Parent permissions
  { name: "PARENT_CREATE", displayName: "Create Parent", resource: PERMISSION_RESOURCES.PARENT, action: PERMISSION_ACTIONS.CREATE },
  { name: "PARENT_READ", displayName: "Read Parent", resource: PERMISSION_RESOURCES.PARENT, action: PERMISSION_ACTIONS.READ },
  { name: "PARENT_UPDATE", displayName: "Update Parent", resource: PERMISSION_RESOURCES.PARENT, action: PERMISSION_ACTIONS.UPDATE },
  { name: "PARENT_DELETE", displayName: "Delete Parent", resource: PERMISSION_RESOURCES.PARENT, action: PERMISSION_ACTIONS.DELETE },
  { name: "PARENT_LIST", displayName: "List Parents", resource: PERMISSION_RESOURCES.PARENT, action: PERMISSION_ACTIONS.LIST },
  { name: "PARENT_MANAGE", displayName: "Manage Parents", resource: PERMISSION_RESOURCES.PARENT, action: PERMISSION_ACTIONS.MANAGE },


  // System permissions
  { name: "SYSTEM_MANAGE", displayName: "Manage System", resource: PERMISSION_RESOURCES.SYSTEM, action: PERMISSION_ACTIONS.MANAGE },
  { name: "SYSTEM_READ", displayName: "Read System", resource: PERMISSION_RESOURCES.SYSTEM, action: PERMISSION_ACTIONS.READ }
];

/**
 * Ensures all required permissions exist in the database
 */
const ensurePermissions = async (): Promise<void> => {
  console.log("🔐 Ensuring permissions exist...");
  
  for (const permissionData of permissionsData) {
    const existingPermission = await Permission.findOne({ name: permissionData.name });
    
    if (!existingPermission) {
      const permission = new Permission({
        ...permissionData,
        createdBy: "system",
        isActive: true,
        isDeleted: false
      });
      await permission.save();
      console.log(`  ✅ Created permission: ${permissionData.name}`);
    }
  }
  
  console.log("✅ All permissions ensured");
};

/**
 * Ensures SuperAdmin role exists with all permissions
 */
const ensureSuperAdminRole = async (): Promise<any> => {
  console.log("👑 Ensuring SuperAdmin role exists...");
  
  // Check if SuperAdmin role already exists
  let superAdminRole = await Role.findOne({ name: ROLE_NAMES.SUPERADMIN });
  
  if (!superAdminRole) {
    // Get all permissions
    const allPermissions = await Permission.find({});
    
    // Create SuperAdmin role with all permissions
    superAdminRole = new Role({
      name: ROLE_NAMES.SUPERADMIN,
      displayName: "Super Admin",
      description: "Super Administrator with full system access",
      permissions: allPermissions.map(p => p._id),
      level: 1, // SuperAdmin has the highest level (1)
      isActive: true,
      isDeleted: false,
      createdBy: "system"
    });
    
    await superAdminRole.save();
    console.log(`  ✅ Created SuperAdmin role with ${allPermissions.length} permissions`);
  } else {
    console.log("  ✅ SuperAdmin role already exists");
  }
  
  return superAdminRole;
};

/**
 * Ensures SuperAdmin user exists with default credentials
 */
const ensureSuperAdminUser = async (superAdminRole: any): Promise<void> => {
  console.log("👤 Ensuring SuperAdmin user exists...");
  
  // Check if SuperAdmin user already exists
  const existingUser = await User.findOne({ 
    $or: [
      { username: SUPERADMIN_CREDENTIALS.username },
      { email: SUPERADMIN_CREDENTIALS.email }
    ]
  });
  
  if (!existingUser) {
    // Create SuperAdmin user (password will be encrypted by pre-save middleware)
    const superAdminUser = new User({
      username: SUPERADMIN_CREDENTIALS.username,
      firstName: SUPERADMIN_CREDENTIALS.firstName,
      lastName: SUPERADMIN_CREDENTIALS.lastName,
      email: SUPERADMIN_CREDENTIALS.email,
      password: SUPERADMIN_CREDENTIALS.password, // Will be encrypted automatically
      phoneNumber: SUPERADMIN_CREDENTIALS.phoneNumber,
      role: superAdminRole._id,
      userType: "superadmin",
      userAccessType: "private",
      isEmailVerified: true,
      isActive: true,
      isDeleted: false,
      createdBy: "system"
    });
    
    await superAdminUser.save();
    console.log(`  ✅ Created SuperAdmin user: ${SUPERADMIN_CREDENTIALS.username}`);
    console.log(`  📧 Email: ${SUPERADMIN_CREDENTIALS.email}`);
    console.log(`  🔑 Password: ${SUPERADMIN_CREDENTIALS.password}`);
  } else {
    console.log("  ✅ SuperAdmin user already exists");
    
    // Ensure the user has the correct role
    if (!existingUser.role || existingUser.role.toString() !== superAdminRole._id.toString()) {
      existingUser.role = superAdminRole._id;
      await existingUser.save();
      console.log("  🔄 Updated SuperAdmin user role");
    }
    
    // Always update password to ensure it's correct (will be encrypted by pre-save middleware)
    existingUser.password = SUPERADMIN_CREDENTIALS.password;
    await existingUser.save();
    console.log("  🔄 Updated SuperAdmin user password (encrypted)");
  }
};

/**
 * Main seeder function that ensures SuperAdmin role and user exist
 * This function is idempotent and can be run multiple times safely
 */
export const seedSuperAdmin = async (): Promise<void> => {
  try {
    console.log("🌱 Starting SuperAdmin auto-seeder...");
    
    // Ensure permissions exist first
    await ensurePermissions();
    
    // Ensure SuperAdmin role exists
    const superAdminRole = await ensureSuperAdminRole();
    
    // Ensure SuperAdmin user exists
    await ensureSuperAdminUser(superAdminRole);
    
    console.log("✅ SuperAdmin auto-seeder completed successfully!");
    console.log("🎉 SuperAdmin is ready to use!");
    
  } catch (error) {
    console.error("❌ SuperAdmin auto-seeder failed:", error);
    throw error;
  }
};

// Tenant-specific roles data
export const tenantRolesData = [
  {
    name: ROLE_NAMES.ADMIN,
    displayName: "Admin",
    level: 2,
    permissions: [
      // Admin can manage users, teachers, students, parents within their tenant
      "USER_CREATE", "USER_READ", "USER_UPDATE", "USER_DELETE", "USER_LIST", "USER_MANAGE",
      "TEACHER_CREATE", "TEACHER_READ", "TEACHER_UPDATE", "TEACHER_DELETE", "TEACHER_LIST", "TEACHER_MANAGE",
      "STUDENT_CREATE", "STUDENT_READ", "STUDENT_UPDATE", "STUDENT_DELETE", "STUDENT_LIST", "STUDENT_MANAGE",
      "PARENT_CREATE", "PARENT_READ", "PARENT_UPDATE", "PARENT_DELETE", "PARENT_LIST", "PARENT_MANAGE"
    ]
  },
  {
    name: ROLE_NAMES.TEACHER,
    displayName: "Teacher",
    level: 3,
    permissions: [
      // Teachers can read and manage students
      "STUDENT_READ", "STUDENT_LIST", "STUDENT_UPDATE",
      "PARENT_READ", "PARENT_LIST"
    ]
  },
  {
    name: ROLE_NAMES.STUDENT,
    displayName: "Student",
    level: 4,
    permissions: [
      // Students can only read their own data
      "STUDENT_READ"
    ]
  },
  {
    name: ROLE_NAMES.PARENT,
    displayName: "Parent",
    level: 5,
    permissions: [
      // Parents can read their children's data
      "STUDENT_READ", "STUDENT_LIST",
      "PARENT_READ"
    ]
  }
];

/**
 * Function to create tenant-specific roles
 * This function is used by the tenant service when creating new tenants
 */
export const createTenantRoles = async (tenantId: mongoose.Types.ObjectId) => {
  try {
    console.log(`🔄 Creating roles for tenant: ${tenantId}`);
    
    // Get all permissions
    const allPermissions = await Permission.find({
      isActive: true,
      isDeleted: false,
    });
    
    // Create a map of permission names to IDs
    const permissionMap = new Map(
      allPermissions.map(perm => [perm.name, perm._id])
    );

    const createdRoles = [];

    // Create each tenant-specific role
    for (const roleData of tenantRolesData) {
      const permissionIds = roleData.permissions
        .map(permName => permissionMap.get(permName))
        .filter(Boolean);

      const role = await Role.create({
        name: roleData.name,
        displayName: roleData.displayName,
        level: roleData.level,
        permissions: permissionIds,
        tenantId: tenantId,
        createdBy: "system",
        isActive: true,
        isDeleted: false
      });

      createdRoles.push(role);
      console.log(`  ✅ Created role: ${role.name} with ${permissionIds.length} permissions`);
    }

    console.log(`✅ Created ${createdRoles.length} roles for tenant`);
    return createdRoles;

  } catch (error) {
    console.error("❌ Error creating tenant roles:", error);
    throw error;
  }
};

// Export default for easy importing
export default seedSuperAdmin;

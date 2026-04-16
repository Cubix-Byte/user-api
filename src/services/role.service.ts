import * as roleRepository from "../repositories/role.repository";
import * as permissionRepository from "../repositories/permission.repository";
import { IRole } from "../models/role.schema";
import mongoose from "mongoose";

/**
 * Role Service - Business logic for role management
 * Handles role-related operations and permissions
 */

// Get role by ID
export const getRoleById = async (id: string) => {
  const role = await roleRepository.findRoleById(id);
  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }
  return role;
};

// Get role by name
export const getRoleByName = async (name: string, tenantId?: string) => {
  const role = await roleRepository.findRoleByName(name, tenantId);
  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }
  return role;
};

// Get role permissions
export const getRolePermissions = async (roleId: string) => {
  const role = await getRoleById(roleId);
  return role.permissions || [];
};

// Check if user has specific permission
export const userHasPermission = async (userId: string, permission: string) => {
  // This would need user service to get user's role
  // For now, return a simple implementation
  try {
    const role = await roleRepository.findRoleById(userId); // This should be user's role ID
    if (!role) {
      return false;
    }
    
    return role.permissions && role.permissions.some((p: any) => p.name === permission);
  } catch (error) {
    return false;
  }
};

// Get all roles
export const getAllRoles = async (params: {
  pageNo?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}) => {
  const roles = await roleRepository.findRoles(params);
  const total = await roleRepository.countRoles(params);

  return {
    roles,
    pagination: {
      total,
      pageNo: params.pageNo || 1,
      pageSize: params.pageSize || 10,
      totalPages: Math.ceil(total / (params.pageSize || 10)),
    },
  };
};

// Create role
export const createRole = async (data: Partial<IRole>) => {
  const existingRole = await roleRepository.findRoleByName(data.name!);
  if (existingRole) {
    throw new Error("ROLE_NAME_EXISTS");
  }

  const role = await roleRepository.createRole(data);
  return role;
};

// Create default role with basic permissions
export const createDefaultRole = async (roleName: string, tenantId?: string) => {
  const roleNameUpper = roleName.toUpperCase();
  
  // Check if role already exists
  const existingRole = await roleRepository.findRoleByName(roleNameUpper, tenantId);
  if (existingRole) {
    return existingRole;
  }

  // Define role level based on role name
  let level = 1;
  let displayName = roleNameUpper;
  
  switch (roleNameUpper) {
    case 'ADMIN':
      level = 4;
      displayName = 'Administrator';
      break;
    case 'PRIMARYADMIN':
      level = 4;
      displayName = 'Primary Administrator';
      break;
    case 'ACADEMICADMIN':
      level = 4;
      displayName = 'Academic Administrator';
      break;
    case 'COORDINATEADMIN':
      level = 4;
      displayName = 'Coordinate Administrator';
      break;
    case 'GRADINGADMIN':
      level = 4;
      displayName = 'Grading Administrator';
      break;
    case 'FINANCEADMIN':
      level = 4;
      displayName = 'Finance Administrator';
      break;
    case 'TEACHERADMIN':
      level = 4;
      displayName = 'Teacher Administrator';
      break;
    case 'STUDENTADMIN':
      level = 4;
      displayName = 'Student Administrator';
      break;
    case 'TEACHER':
      level = 3;
      displayName = 'Teacher';
      break;
    case 'STUDENT':
      level = 2;
      displayName = 'Student';
      break;
    case 'PARENT':
      level = 1;
      displayName = 'Parent';
      break;
    default:
      level = 1;
      displayName = roleNameUpper;
  }

  const roleData: Partial<IRole> = {
    name: roleNameUpper,
    displayName: displayName,
    level: level,
    permissions: [], // Start with no permissions, can be assigned later
    tenantId: tenantId ? new mongoose.Types.ObjectId(tenantId) : undefined
  };

  const role = await roleRepository.createRole(roleData);
  console.log(`✅ Created default role: ${roleNameUpper} (${displayName}) with level ${level}`);
  return role;
};

// Update role
export const updateRole = async (id: string, data: Partial<IRole>) => {
  const role = await roleRepository.updateRoleById(id, data);
  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }
  return role;
};

// Delete role
export const deleteRole = async (id: string) => {
  const role = await roleRepository.softDeleteRoleById(id);
  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }
  return role;
};

// Get role statistics
export const getRoleStatistics = async () => {
  const stats = await roleRepository.getRoleStatistics();
  return stats;
};

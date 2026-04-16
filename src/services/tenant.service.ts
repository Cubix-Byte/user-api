import * as tenantRepository from "../repositories/tenant.repository";
import * as roleRepository from "../repositories/role.repository";
import * as userRepository from "../repositories/user.repository";
import { ITenant } from "../models/tenant.schema";
import mongoose from "mongoose";
import { ROLE_NAMES } from "../utils/shared-lib-imports";
import { createTenantRoles } from "../seeders/superadmin.seeder";
import { mergePermissionsWithDefaults } from "../utils/constants/permission-types";
import { defaultPageLimit } from "shared-lib";


// Tenant service - contains business logic for tenant (school) management
// Create new tenant with default roles and admin user
export const createTenant = async (data: Partial<ITenant>) => {
  const existingTenant = await tenantRepository.tenantExistsByTenantName(
    data.tenantName!
  );

  if (existingTenant) {
    throw new Error("TENANT_NAME_EXISTS");
  }

  // Prepare/sanitize admin email before creating tenant
  const normalizedTenantSlug = data.tenantName!
    .toLowerCase()
    .replace(/\s+/g, "");
  const adminEmail =
    data.adminEmail?.trim().toLowerCase() ||
    `admin@${normalizedTenantSlug}.com`;

  // Prevent duplicate admin accounts across tenants
  const existingAdminUser = await userRepository.findUserByEmail(adminEmail);
  if (existingAdminUser) {
    throw new Error("EMAIL_EXISTS");
  }

  // Persist sanitized admin email with tenant metadata so everything stays in sync
  data.adminEmail = adminEmail;

  // Create tenant
  const tenant = await tenantRepository.createTenant(data);

  // Create all tenant-specific roles (Admin, Teacher, Student, Parent)
  const createdRoles = await createTenantRoles(
    tenant._id as mongoose.Types.ObjectId
  );

  // Find the Admin role from the created roles
  const adminRole = createdRoles.find(
    (role: any) => role.name === ROLE_NAMES.ADMIN
  );

  if (!adminRole) {
    throw new Error("Failed to create Admin role for tenant");
  }

  // Create admin user for this tenant
  const adminUser = await userRepository.createUser({
    username: adminEmail,
    firstName: "Admin",
    lastName: "User",
    email: adminEmail,
    password: data.demoPassword || "Admin123",
    role: adminRole._id as mongoose.Types.ObjectId,
    tenantId: (tenant._id as mongoose.Types.ObjectId).toString(),
    tenantName: data.tenantName,
    userType: "admin",
    roleName: ROLE_NAMES.ADMIN,
  });

  // Convert to object and merge permissions with defaults
  const tenantObj = tenant.toObject ? tenant.toObject() : tenant;
  if (tenantObj.permissions) {
    tenantObj.permissions = mergePermissionsWithDefaults(tenantObj.permissions);
  } else {
    tenantObj.permissions = mergePermissionsWithDefaults([]);
  }

  return {
    ...tenantObj,
    adminRole: adminRole,
    adminUser: adminUser,
    createdRoles: createdRoles,
  };
};

export const getTenantById = async (id: string) => {
  const tenant = await tenantRepository.findTenantById(id);
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  // Convert to object and merge permissions with defaults
  const tenantObj = tenant.toObject ? tenant.toObject() : tenant;
  if (tenantObj.permissions) {
    tenantObj.permissions = mergePermissionsWithDefaults(tenantObj.permissions);
  } else {
    tenantObj.permissions = mergePermissionsWithDefaults([]);
  }

  return tenantObj;
};

export const getTenantByTenantName = async (tenantName: string) => {
  const tenant = await tenantRepository.findTenantByTenantName(tenantName);
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }
  // Convert to object and merge permissions with defaults
  const tenantObj = tenant.toObject ? tenant.toObject() : tenant;
  if (tenantObj.permissions) {
    tenantObj.permissions = mergePermissionsWithDefaults(tenantObj.permissions);
  } else {
    tenantObj.permissions = mergePermissionsWithDefaults([]);
  }

  return tenantObj;
};

export const updateTenant = async (id: string, data: Partial<ITenant>) => {
  // If permissions are being updated, merge with existing permissions and ensure all 5 types are included
  if (data.permissions && Array.isArray(data.permissions)) {
    // Get existing tenant to merge with existing permissions
    const existingTenant = await tenantRepository.findTenantById(id);
    const existingPermissions = existingTenant?.permissions || [];

    // Create a map of incoming permissions
    const incomingPermissionsMap = new Map();
    data.permissions.forEach((perm) => {
      incomingPermissionsMap.set(perm.type, perm);
    });

    // Merge: incoming permissions override existing, then fill with defaults
    const existingPermissionsMap = new Map();
    existingPermissions.forEach((perm: any) => {
      if (!incomingPermissionsMap.has(perm.type)) {
        existingPermissionsMap.set(perm.type, perm);
      }
    });

    // Combine: incoming + existing (not in incoming) + defaults for missing
    const mergedPermissions = mergePermissionsWithDefaults([
      ...Array.from(incomingPermissionsMap.values()),
      ...Array.from(existingPermissionsMap.values()),
    ]);

    data.permissions = mergedPermissions;
  }

  const tenant = await tenantRepository.updateTenantById(id, data);
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  // Convert to object and merge permissions with defaults for response
  const tenantObj = tenant.toObject ? tenant.toObject() : tenant;
  if (tenantObj.permissions) {
    tenantObj.permissions = mergePermissionsWithDefaults(tenantObj.permissions);
  } else {
    tenantObj.permissions = mergePermissionsWithDefaults([]);
  }

  return tenantObj;
};

export const deleteTenant = async (id: string) => {
  const tenant = await tenantRepository.softDeleteTenantById(id);
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }
  return tenant;
};

export const getAllTenants = async (params: {
  pageNo?: number;
  pageSize?: number;
  query?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
}) => {
  const query = { ...params.query };
  const pageSize = params.pageSize || defaultPageLimit;
  const pageNo = params.pageNo;

  const tenants = await tenantRepository.findTenants({
    pageNo: pageNo,
    pageSize: pageSize,
    query: query,
    sort: params.sort,
  });

  const total = await tenantRepository.countTenants({ query: query });
  const tenantIds = tenants.map((tenant: any) =>
    (tenant._id || tenant.id).toString()
  );

  // Fetch stats for all tenants in the current page
  const allStats = await userRepository.getUsersStatsByTenantIds(tenantIds);
  const statsMap = new Map();
  allStats.forEach((stat: any) => {
    statsMap.set(stat._id.toString(), {
      teachers: stat.teachers,
      students: stat.students,
      parents: stat.parents,
      total: stat.total,
    });
  });

  // Merge permissions with defaults and append stats for each tenant
  const tenantsWithStats = tenants.map((tenant: any) => {
    const tenantObj = tenant.toObject ? tenant.toObject() : tenant;
    const id = (tenantObj._id || tenantObj.id).toString();

    if (tenantObj.permissions) {
      tenantObj.permissions = mergePermissionsWithDefaults(
        tenantObj.permissions
      );
    } else {
      tenantObj.permissions = mergePermissionsWithDefaults([]);
    }

    tenantObj.stats = statsMap.get(id) || {
      teachers: 0,
      students: 0,
      parents: 0,
      total: 0,
    };

    return tenantObj;
  });

  return {
    tenants: tenantsWithStats,
    pagination: {
      total,
      pageNo: pageNo,
      pageSize: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};


// Dashboard metrics for tenant statistics
export const getTenantDashboardMetrics = async () => {
  const totalTenants = await tenantRepository.countTenants({});
  const activeTenants = await tenantRepository.countTenants({
    profileStatus: "active",
  });
  const inactiveTenants = await tenantRepository.countTenants({
    profileStatus: "inactive",
  });

  return {
    totalSchools: totalTenants,
    activeSchools: activeTenants,
    inactiveSchools: inactiveTenants,
    summary: {
      total: totalTenants,
      active: activeTenants,
      inactive: inactiveTenants,
      activePercentage:
        totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0,
      inactivePercentage:
        totalTenants > 0
          ? Math.round((inactiveTenants / totalTenants) * 100)
          : 0,
    },
  };
};

// Get tenant status statistics
export const getTenantStatusStats = async () => {
  const stats = await tenantRepository.getTenantStatusStats();
  return stats;
};

// Get tenant by name
export const getTenantByName = async (name: string) => {
  const tenant = await tenantRepository.findTenantByTenantName(name);
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  // Convert to object and merge permissions with defaults
  const tenantObj = tenant.toObject ? tenant.toObject() : tenant;
  if (tenantObj.permissions) {
    tenantObj.permissions = mergePermissionsWithDefaults(tenantObj.permissions);
  } else {
    tenantObj.permissions = mergePermissionsWithDefaults([]);
  }

  return tenantObj;
};

// Validate tenant
export const validateTenant = async (tenantId: string) => {
  const tenant = await tenantRepository.findTenantById(tenantId);
  return {
    isValid: !!tenant,
    tenant: tenant || null,
  };
};

// Sync tenant data
export const syncTenantData = async (
  tenantId: string,
  data: Partial<ITenant>
) => {
  const tenant = await tenantRepository.updateTenantById(tenantId, data);
  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }
  return tenant;
};

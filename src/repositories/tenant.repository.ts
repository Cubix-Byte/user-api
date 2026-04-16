import Tenant, { ITenant } from "../models/tenant.schema";
import mongoose from "mongoose";

// Tenant repository - handles all database operations for Tenant entity
// Find tenant by ID
export const findTenantById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Tenant.findOne({
    _id: id,
    isActive: true,
    isDeleted: false,
  });
};

export const findTenantByTenantName = async (tenantName: string) => {
  return await Tenant.findOne({
    tenantName,
    isActive: true,
    isDeleted: false,
  });
};

export const findTenantByName = async (schoolName: string) => {
  return await Tenant.findOne({
    schoolName,
    isActive: true,
    isDeleted: false,
  });
};

export const createTenant = async (tenantData: Partial<ITenant>) => {
  const tenant = new Tenant({
    ...tenantData,
    createdBy: "system",
    isActive: true,
    isDeleted: false,
  });
  return await tenant.save();
};

export const updateTenantById = async (
  id: string,
  updateData: Partial<ITenant>
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Tenant.findByIdAndUpdate(
    id,
    { $set: { ...updateData, updatedBy: "system" } },
    { new: true, runValidators: true }
  );
};

export const softDeleteTenantById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Tenant.findByIdAndUpdate(
    id,
    {
      $set: {
        isDeleted: true,
        isActive: false,
        updatedBy: "system",
      },
    },
    { new: true }
  );
};

export const findTenants = async ({
  pageNo = 1,
  pageSize = 10,
  query = {},
  sort = {},
}: {
  pageNo?: number;
  pageSize?: number;
  query?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
}) => {
  const skip = (pageNo - 1) * pageSize;
  const filter = { ...query, isDeleted: false };
  return await Tenant.find(filter).sort(sort).skip(skip).limit(pageSize).lean();
};

export const countTenants = async ({
  query = {},
  search,
  profileStatus,
}: {
  query?: Record<string, any>;
  search?: string;
  profileStatus?: string;
}) => {
  // Use provided query or build default query
  const whereClause: any = { ...query, isDeleted: false };

  // If query was empty, ensure isActive is also included if that was the previous intent
  if (Object.keys(query).length === 0) {
    whereClause.isActive = true;
  }

  // Support legacy search and profileStatus parameters for backward compatibility
  if (profileStatus && !query.profileStatus) {
    whereClause.profileStatus = profileStatus;
  }

  if (search && !query.$or) {
    whereClause.$or = [
      { schoolName: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { state: { $regex: search, $options: "i" } },
    ];
  }

  return await Tenant.countDocuments(whereClause);
};

export const tenantExistsByName = async (schoolName: string) => {
  return await Tenant.findOne({
    schoolName,
    isDeleted: false,
  });
};

export const tenantExistsByTenantName = async (tenantName: string) => {
  return await Tenant.findOne({
    tenantName,
    isDeleted: false,
  });
};
// Get tenant status statistics for dashboard
export const getTenantStatusStats = async () => {
  const stats = await Tenant.aggregate([
    {
      $match: {
        isActive: true,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$profileStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    active: 0,
    inactive: 0,
    total: 0,
  };

  stats.forEach((stat) => {
    if (stat._id === "active") {
      result.active = stat.count;
    } else if (stat._id === "inactive") {
      result.inactive = stat.count;
    }
    result.total += stat.count;
  });

  return result;
};

// Find tenants by partnerId with pagination
// Find tenants by partnerId with pagination and dynamic query support
export const findTenantsByPartnerId = async (
  partnerId: string,
  options?: {
    pageNo?: number;
    pageSize?: number;
    query?: Record<string, any>;
    sort?: Record<string, 1 | -1>;
  }
) => {
  const query = {
    ...options?.query,
    partnerId,
    isDeleted: false,
    isActive: true,
  };

  const pageSize = options?.pageSize || 10;
  const pageNo = options?.pageNo || 1;
  const skip = (pageNo - 1) * pageSize;

  return await Tenant.find(query)
    .sort(options?.sort || { createdAt: -1 })
    .skip(skip)
    .limit(pageSize)
    .lean();
};

// Count tenants by partnerId with dynamic query support
export const countTenantsByPartnerId = async (
  partnerId: string,
  query: Record<string, any> = {}
) => {
  return await Tenant.countDocuments({
    ...query,
    partnerId,
    isDeleted: false,
    isActive: true,
  });
};

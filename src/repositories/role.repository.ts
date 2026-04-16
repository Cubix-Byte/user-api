import Role, { IRole } from "../models/role.schema";
import mongoose from "mongoose";

// Repository layer - handles all database operations for Role entity

export const findRoleByName = async (name: string, tenantId?: string) => {
  const roleName = name.toUpperCase();

  // First try to find tenant-specific role
  if (tenantId) {
    const tenantRole = await Role.findOne({
      name: roleName,
      tenantId: tenantId,
      isActive: true,
      isDeleted: false,
    });

    if (tenantRole) {
      return tenantRole;
    }
  }

  // If no tenant-specific role found, try to find global role
  // SUPERADMIN should always be global (no tenantId)
  if (roleName === "SUPERADMIN") {
    return await Role.findOne({
      name: roleName,
      tenantId: { $exists: false },
      isActive: true,
      isDeleted: false,
    });
  }

  // For other roles, try to find global role (no tenantId)
  return await Role.findOne({
    name: roleName,
    tenantId: { $exists: false },
    isActive: true,
    isDeleted: false,
  });
};

export const findRoleById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Role.findOne({
    _id: id,
    isActive: true,
    isDeleted: false,
  }).populate("permissions");
};

export const findRoleByIdWithPermissions = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Role.findOne({
    _id: id,
    isActive: true,
    isDeleted: false,
  }).populate({
    path: "permissions",
    match: { isActive: true, isDeleted: false },
  });
};

export const findAllRoles = async () => {
  return await Role.find({
    isActive: true,
    isDeleted: false,
  })
    .populate("permissions")
    .sort({ level: 1 });
};

export const findRoles = async ({
  pageNo = 1,
  pageSize = 10,
  search,
}: {
  pageNo?: number;
  pageSize?: number;
  search?: string;
}) => {
  const skip = (pageNo - 1) * pageSize;

  const whereClause: any = {
    isActive: true,
    isDeleted: false,
  };

  if (search) {
    whereClause.$or = [
      { name: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
    ];
  }

  return await Role.find(whereClause)
    .populate("permissions")
    .sort({ level: 1 })
    .skip(skip)
    .limit(pageSize)
    .lean();
};

export const countRoles = async ({ search }: { search?: string }) => {
  const whereClause: any = {
    isActive: true,
    isDeleted: false,
  };

  if (search) {
    whereClause.$or = [
      { name: { $regex: search, $options: "i" } },
      { displayName: { $regex: search, $options: "i" } },
    ];
  }

  return await Role.countDocuments(whereClause);
};

export const createRole = async (roleData: Partial<IRole>) => {
  const role = new Role({
    ...roleData,
    createdBy: "system",
    isActive: true,
    isDeleted: false,
  });
  return await role.save();
};

export const updateRoleById = async (
  id: string,
  updateData: Partial<IRole>
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Role.findByIdAndUpdate(
    id,
    { $set: { ...updateData, updatedBy: "system" } },
    { new: true, runValidators: true }
  ).populate("permissions");
};

export const softDeleteRoleById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Role.findByIdAndUpdate(
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

export const roleExistsByName = async (name: string, tenantId?: string) => {
  const query: any = {
    name: name.toUpperCase(),
    isDeleted: false,
  };

  if (tenantId) {
    query.tenantId = tenantId;
  } else if (name.toUpperCase() === "SUPERADMIN") {
    query.tenantId = { $exists: false };
  }

  return await Role.findOne(query);
};

// Get role statistics
export const getRoleStatistics = async () => {
  const stats = await Role.aggregate([
    {
      $match: {
        isActive: true,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$name",
        count: { $sum: 1 },
      },
    },
  ]);

  const result: any = {
    total: 0,
    superadmin: 0,
    admin: 0,
    teacher: 0,
    student: 0,
    parent: 0,
  };

  stats.forEach((stat) => {
    result[stat._id.toLowerCase()] = stat.count;
    result.total += stat.count;
  });

  return result;
};

export const findRolesByTenant = async (tenantId: string) => {
  return await Role.find({
    tenantId: tenantId,
    isActive: true,
    isDeleted: false,
  }).populate("permissions");
};

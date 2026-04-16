import Permission, { IPermission } from "../models/permission.schema";
import mongoose from "mongoose";

// Repository layer - handles all database operations for Permission entity

export const findPermissionByName = async (name: string) => {
  return await Permission.findOne({
    name: name.toUpperCase(),
    isActive: true,
    isDeleted: false,
  });
};

export const findPermissionById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Permission.findOne({
    _id: id,
    isActive: true,
    isDeleted: false,
  });
};

export const findAllPermissions = async () => {
  return await Permission.find({
    isActive: true,
    isDeleted: false,
  }).sort({ resource: 1, action: 1 });
};

export const createPermission = async (permissionData: Partial<IPermission>) => {
  const permission = new Permission({
    ...permissionData,
    createdBy: "system",
    isActive: true,
    isDeleted: false,
  });
  return await permission.save();
};

export const permissionExistsByName = async (name: string) => {
  return await Permission.findOne({
    name: name.toUpperCase(),
    isDeleted: false,
  });
};


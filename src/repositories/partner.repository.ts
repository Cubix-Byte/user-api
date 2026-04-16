import Partner from "../models/partner.schema";
import { IPartner } from "../types/partner.types";
import mongoose from "mongoose";

// Partner repository - handles all database operations for Partner entity

export const findPartnerById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Partner.findOne({
    _id: id,
    isActive: true,
    isDeleted: false,
  });
};

export const findPartnerByIdWithoutActiveFilter = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Partner.findOne({
    _id: id,
    isDeleted: false,
  });
};

export const createPartner = async (partnerData: Partial<IPartner>) => {
  const partner = new Partner({
    ...partnerData,
    createdBy: "system",
    isActive: true,
    isDeleted: false,
  });
  return await partner.save();
};

export const updatePartnerById = async (
  id: string,
  updateData: Partial<IPartner>
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Partner.findByIdAndUpdate(
    id,
    { $set: { ...updateData, updatedBy: "system" } },
    { new: true, runValidators: true }
  );
};

export const deletePartnerById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await Partner.findByIdAndDelete(id);
};

export const findPartners = async ({
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
  return await Partner.find({
    ...query,
    isDeleted: false,
  })
    .sort(sort)
    .skip(skip)
    .limit(pageSize)
    .lean();
};

export const countPartners = async (query: Record<string, any> = {}) => {
  return await Partner.countDocuments({
    ...query,
    isDeleted: false,
  });
};

export const setDefaultPartner = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  // First, unset all other default partners
  await Partner.updateMany(
    { _id: { $ne: id }, isDeleted: false },
    { $set: { isDefault: false, updatedBy: "system" } }
  );

  // Then set the specified partner as default
  return await Partner.findByIdAndUpdate(
    id,
    { $set: { isDefault: true, updatedBy: "system" } },
    { new: true, runValidators: true }
  );
};
// Get partner status statistics
export const getPartnerStatusStats = async () => {
  const stats = await Partner.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$isActive",
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
    if (stat._id === true) {
      result.active = stat.count;
    } else if (stat._id === false) {
      result.inactive = stat.count;
    }
    result.total += stat.count;
  });

  return result;
};

// Find the default partner
export const findDefaultPartner = async () => {
  return await Partner.findOne({
    isDefault: true,
    isDeleted: false,
  });
};

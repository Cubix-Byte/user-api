import User, { IUser } from "../models/user.schema";
import { RegisterRequest } from "../types/auth.types";
import mongoose from "mongoose";

// User repository - handles all database operations for User entity
// Find user by email (without password)
export const findUserByEmail = async (email: string) => {
  return await User.findOne({
    email,
    isActive: true,
    isDeleted: false,
  });
};


// Find user by email (with password for authentication)
export const findUserByEmailWithPassword = async (email: string) => {
  return await User.findOne({
    email,
    isActive: true,
    isDeleted: false,
  })
    .select("+password +refreshToken")
    .populate("role");
};

// Find user by email, tenantName with password (for tenant users)
export const findUserByEmailAndTenant = async (
  email: string,
  tenantName: string
) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
    tenantName,
    isActive: true,
    isDeleted: false,
  })
    .select("+password +refreshToken")
    .populate({
      path: "role",
      match: { isActive: true, isDeleted: false },
    })
    .populate("tenantId");

  // If role populate failed (role is null), the role ObjectId is still in user document
  // This happens when the role document doesn't exist or is inactive/deleted
  return user;
};

// Find user by email, tenantName without populate (to get raw role ObjectId)
export const findUserByEmailAndTenantWithoutPopulate = async (
  email: string,
  tenantName: string
) => {
  return await User.findOne({
    email: email.toLowerCase(),
    tenantName,
    isActive: true,
    isDeleted: false,
  }).select("+password +refreshToken role");
};

// Find user by email only (for superadmin)
export const findUserByEmailForSuperadmin = async (email: string) => {
  return await User.findOne({
    email: email.toLowerCase(),
    userType: "superadmin",
    isActive: true,
    isDeleted: false,
  })
    .select("+password +refreshToken")
    .populate("role");
};

// Find user by username, tenantName with password (for tenant users)
export const findUserByUsernameAndTenant = async (
  username: string,
  tenantName: string
) => {
  return await User.findOne({
    username: username.toLowerCase(),
    tenantName,
    isActive: true,
    isDeleted: false,
  })
    .select("+password +refreshToken")
    .populate("role")
    .populate("tenantId");
};

// Find user by username only (for superadmin)
export const findUserByUsername = async (username: string) => {
  return await User.findOne({
    username: username.toLowerCase(),
    userType: "superadmin",
    isActive: true,
    isDeleted: false,
  })
    .select("+password +refreshToken")
    .populate("role");
};

// Find user by username (general - for internal APIs)
export const findUserByUsernameGeneral = async (username: string) => {
  return await User.findOne({
    username: username.toLowerCase(),
    isActive: true,
    isDeleted: false,
  })
    .select("+password +refreshToken")
    .populate("role");
};

// Check if username exists for a tenant
export const usernameExistsInTenant = async (
  username: string,
  tenantId: string
) => {
  return await User.findOne({
    username: username.toLowerCase(),
    tenantId,
  });
};

// Find user by username and tenant ID (for validation)
export const findUserByUsernameAndTenantId = async (
  username: string,
  tenantId: string
) => {
  return await User.findOne({
    username: username.toLowerCase(),
    tenantId,
    isActive: true,
    isDeleted: false,
  });
};

// Find user by email and tenant ID (for validation)
export const findUserByEmailAndTenantId = async (
  email: string,
  tenantId: string
) => {
  return await User.findOne({
    email: email.toLowerCase(),
    tenantId,
    isActive: true,
    isDeleted: false,
  });
};

// Batch check for existing usernames within a tenant (optimized for bulk operations)
export const findExistingUsernames = async (
  usernames: string[],
  tenantId: string
): Promise<Set<string>> => {
  if (usernames.length === 0) return new Set();

  const normalizedUsernames = usernames.map(u => u.toLowerCase());
  const existingUsers = await User.find({
    username: { $in: normalizedUsernames },
    tenantId,
    isActive: true,
    isDeleted: false,
  }).select("username").lean();

  return new Set(existingUsers.map(u => u.username?.toLowerCase()).filter(Boolean));
};

// Batch check for existing emails within a tenant (optimized for bulk operations)
export const findExistingEmails = async (
  emails: string[],
  tenantId: string
): Promise<Set<string>> => {
  if (emails.length === 0) return new Set();

  const normalizedEmails = emails.map(e => e.toLowerCase());
  const existingUsers = await User.find({
    email: { $in: normalizedEmails },
    tenantId,
    isActive: true,
    isDeleted: false,
  }).select("email").lean();

  return new Set(existingUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
};

// Bulk insert users (optimized for bulk operations)
// Note: Passwords must be pre-hashed as insertMany doesn't trigger Mongoose middleware
export const bulkInsertUsers = async (
  usersData: Array<{
    _id?: mongoose.Types.ObjectId | string;
    username: string;
    email: string;
    password: string; // Must be pre-hashed
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
  }>
) => {
  // Prepare documents for bulk insert
  const documents = usersData.map((userData) => {
    const doc: any = {
      ...userData,
      username: userData.username.toLowerCase(),
      email: userData.email.toLowerCase(),
      createdBy: userData.createdBy || "system",
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isDeleted: userData.isDeleted !== undefined ? userData.isDeleted : false,
    };

    // Convert _id to ObjectId if provided as string
    if (userData._id) {
      doc._id = typeof userData._id === "string"
        ? new mongoose.Types.ObjectId(userData._id)
        : userData._id;
    }

    // Convert tenantId to ObjectId if provided as string
    if (userData.tenantId) {
      doc.tenantId = typeof userData.tenantId === "string"
        ? new mongoose.Types.ObjectId(userData.tenantId)
        : userData.tenantId;
    }

    // Ensure role is ObjectId
    if (userData.role) {
      doc.role = typeof userData.role === "string"
        ? new mongoose.Types.ObjectId(userData.role)
        : userData.role;
    }

    return doc;
  });

  // Use insertMany for bulk insert with ordered: true for all-or-nothing behavior
  // If any document fails, all subsequent documents will not be inserted
  const result = await User.insertMany(documents, {
    ordered: true, // Stop on first error - all-or-nothing approach
  });

  return result;
};

export const findUserById = async (id: string, includeInactive: boolean = false) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const query: any = {
    _id: id,
    isDeleted: false,
  };

  if (!includeInactive) {
    query.isActive = true;
  }

  return await User.findOne(query).populate("role");
};

export const findUserByIdWithRefreshToken = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await User.findOne({
    _id: id,
    isActive: true,
    isDeleted: false,
  })
    .select("+refreshToken")
    .populate("role");
};

export const findUserByIdWithPassword = async (
  id: string,
  includeInactive: boolean = false
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const query: any = {
    _id: id,
    isDeleted: false,
  };

  if (!includeInactive) {
    query.isActive = true;
  }

  return await User.findOne(query).select("+password");
};

export const createUser = async (
  userData: RegisterRequest & {
    role: mongoose.Types.ObjectId;
    _id?: mongoose.Types.ObjectId | string;
  }
) => {
  console.log("🔍 User repository createUser - input _id:", userData._id);

  const user = new User({
    ...userData,
    createdBy: "system",
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    isDeleted: false,
  });

  // If _id is provided in userData, use it (convert string to ObjectId if needed)
  if (userData._id) {
    console.log("🆔 Setting user _id to provided value:", userData._id);
    // Convert string to ObjectId if it's a string
    if (typeof userData._id === "string") {
      user._id = new mongoose.Types.ObjectId(userData._id);
    } else {
      user._id = userData._id;
    }
  }

  console.log("🔍 User repository createUser - before save _id:", user._id);
  const savedUser = await user.save();
  console.log("🔍 User repository createUser - after save _id:", savedUser._id);
  console.log("🔍 User repository createUser - after save id:", savedUser.id);

  return savedUser;
};

export const updateUserRefreshToken = async (
  userId: string,
  refreshToken: string
) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      refreshToken,
      lastLogin: new Date(),
    },
    { new: true }
  );
};

export const clearUserRefreshToken = async (userId: string) => {
  return await User.findByIdAndUpdate(
    userId,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );
};

export const updateLastLogin = async (userId: string) => {
  return await User.findByIdAndUpdate(
    userId,
    { lastLogin: new Date() },
    { new: true }
  );
};

export const findUserByRefreshToken = async (
  refreshToken: string,
  userId: string,
  email: string
) => {
  return await User.findOne({
    _id: userId,
    email,
    refreshToken,
    isActive: true,
    isDeleted: false,
  })
    .select("+refreshToken")
    .populate("role");
};

export const userExistsByEmail = async (email: string) => {
  return await User.findOne({ email });
};

export const superadminExists = async () => {
  return await User.findOne({
    userType: "superadmin",
    isActive: true,
    isDeleted: false,
  });
};

export const findUsers = async ({
  pageNo = 1,
  pageSize = 10,
  tenantId,
  query = {},
  sort = { createdAt: -1 },
}: {
  pageNo?: number;
  pageSize?: number;
  tenantId?: string;
  query?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
}) => {
  const skip = (pageNo - 1) * pageSize;

  // Build base query - exclude deleted users
  // Include: teachers, students, parents, and admins (ACADEMICADMIN, COORDINATEADMIN, but exclude PRIMARYADMIN)
  const whereClause: any = {
    isDeleted: false,
    $or: [
      // Include non-admin user types (teacher, student, parent)
      { userType: { $in: ["teacher", "student", "parent"] } },
      // Include admin user type (will filter out PRIMARYADMIN in aggregation)
      { userType: "admin" },
    ],
  };

  // Add tenantId filter if provided
  if (tenantId) {
    whereClause.tenantId = new mongoose.Types.ObjectId(tenantId);
  }

  // Merge with dynamic query from buildQuery
  // Special handling: if userType has $in with ["teacher","student","parent"], also include ACADEMICADMIN and COORDINATEADMIN
  let finalQuery = { ...whereClause, ...query };

  // Check if query has userType with $in operator containing teacher, student, parent
  if (query.userType && typeof query.userType === 'object' && query.userType.$in) {
    const userTypes = Array.isArray(query.userType.$in)
      ? query.userType.$in
      : query.userType.$in.split(',');

    // If filtering by teacher/student/parent, we want to also include ACADEMICADMIN and COORDINATEADMIN
    const hasTeacherStudentParent = userTypes.some((type: string) =>
      ["teacher", "student", "parent"].includes(type)
    );

    if (hasTeacherStudentParent) {
      // Keep the $or clause to include admin users (will filter by role in aggregation)
      // Remove userType from finalQuery since we're using $or instead
      delete finalQuery.userType;
    } else {
      // If filtering by something else, use the filter as-is
      delete finalQuery.$or;
      // Keep userType with $in as-is
    }
  } else if (query.userType && typeof query.userType === 'object' && query.userType.$eq) {
    // If userType is explicitly provided as $eq, use it directly
    delete finalQuery.$or;
    finalQuery.userType = query.userType.$eq;
  } else if (query.userType && typeof query.userType !== 'object') {
    // If userType is a string, use it directly
    delete finalQuery.$or;
    finalQuery.userType = query.userType;
  }

  // Use aggregation pipeline to exclude PRIMARYADMIN
  const pipeline: any[] = [
    { $match: finalQuery },
    {
      $lookup: {
        from: "roles",
        localField: "role",
        foreignField: "_id",
        as: "roleData",
      },
    },
    {
      $addFields: {
        roleName: { $arrayElemAt: ["$roleData.name", 0] },
      },
    },
    // Exclude PRIMARYADMIN
    {
      $match: {
        $or: [
          { userType: { $ne: "admin" } },
          { roleName: { $ne: "PRIMARYADMIN" } },
        ],
      },
    },
    // Add role as populated object before removing roleData
    {
      $addFields: {
        role: { $arrayElemAt: ["$roleData", 0] },
      },
    },
    { $unset: "roleData" }, // Remove temporary roleData field
  ];

  // Apply sorting
  const finalSort: Record<string, 1 | -1> =
    Object.keys(sort).length > 0 ? sort : { createdAt: -1 };
  pipeline.push({ $sort: finalSort });

  // Apply pagination
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: pageSize });

  // Execute aggregation
  const users = await User.aggregate(pipeline);

  return users;
};

export const countUsers = async ({
  tenantId,
  query = {},
}: {
  tenantId?: string;
  query?: Record<string, any>;
}) => {
  // Build base query - exclude deleted users
  // Include: teachers, students, parents, and admins (ACADEMICADMIN, COORDINATEADMIN, but exclude PRIMARYADMIN)
  const whereClause: any = {
    isDeleted: false,
    $or: [
      // Include non-admin user types (teacher, student, parent)
      { userType: { $in: ["teacher", "student", "parent"] } },
      // Include admin user type (will filter out PRIMARYADMIN in aggregation)
      { userType: "admin" },
    ],
  };

  // Add tenantId filter if provided
  if (tenantId) {
    whereClause.tenantId = new mongoose.Types.ObjectId(tenantId);
  }

  // Merge with dynamic query from buildQuery
  // Special handling: if userType has $in with ["teacher","student","parent"], also include ACADEMICADMIN and COORDINATEADMIN
  let finalQuery = { ...whereClause, ...query };

  // Check if query has userType with $in operator containing teacher, student, parent
  if (query.userType && typeof query.userType === 'object' && query.userType.$in) {
    const userTypes = Array.isArray(query.userType.$in)
      ? query.userType.$in
      : query.userType.$in.split(',');

    // If filtering by teacher/student/parent, we want to also include ACADEMICADMIN and COORDINATEADMIN
    const hasTeacherStudentParent = userTypes.some((type: string) =>
      ["teacher", "student", "parent"].includes(type)
    );

    if (hasTeacherStudentParent) {
      // Keep the $or clause to include admin users (will filter by role in aggregation)
      // Remove userType from finalQuery since we're using $or instead
      delete finalQuery.userType;
    } else {
      // If filtering by something else, use the filter as-is
      delete finalQuery.$or;
      // Keep userType with $in as-is
    }
  } else if (query.userType && typeof query.userType === 'object' && query.userType.$eq) {
    // If userType is explicitly provided as $eq, use it directly
    delete finalQuery.$or;
    finalQuery.userType = query.userType.$eq;
  } else if (query.userType && typeof query.userType !== 'object') {
    // If userType is a string, use it directly
    delete finalQuery.$or;
    finalQuery.userType = query.userType;
  }

  // Use aggregation pipeline to count users excluding PRIMARYADMIN
  const pipeline: any[] = [
    { $match: finalQuery },
    {
      $lookup: {
        from: "roles",
        localField: "role",
        foreignField: "_id",
        as: "roleData",
      },
    },
    {
      $addFields: {
        roleName: { $arrayElemAt: ["$roleData.name", 0] },
      },
    },
    // Exclude PRIMARYADMIN
    {
      $match: {
        $or: [
          { userType: { $ne: "admin" } },
          { roleName: { $ne: "PRIMARYADMIN" } },
        ],
      },
    },
    { $count: "total" },
  ];

  const result = await User.aggregate(pipeline);
  return result[0]?.total || 0;
};

// Find user by ID (for internal APIs) - with lean for better performance
export const findUserByIdLean = async (
  id: string,
  includeInactive: boolean = false
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const query: any = {
    _id: id,
    isDeleted: false,
  };

  // Only filter by isActive if includeInactive is false
  if (!includeInactive) {
    query.isActive = true;
  }

  return await User.findOne(query).populate("role").lean();
};

// Find users by IDs (batch)
export const findUsersByIds = async (userIds: string[]) => {
  const validIds = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length === 0) {
    return [];
  }

  return await User.find({
    _id: { $in: validIds },
    isActive: true,
    isDeleted: false,
  })
    .populate("role")
    .lean();
};

// Find users by role
export const findUsersByRole = async (
  roleId: string,
  params: {
    pageNo?: number;
    pageSize?: number;
  }
) => {
  const skip = ((params.pageNo || 1) - 1) * (params.pageSize || 10);

  return await User.find({
    role: roleId,
    isActive: true,
    isDeleted: false,
  })
    .populate("role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(params.pageSize || 10)
    .lean();
};

// Count users by role
export const countUsersByRole = async (roleId: string, params: any) => {
  return await User.countDocuments({
    role: roleId,
    isActive: true,
    isDeleted: false,
  });
};

// Get user statistics
export const getUserStatistics = async (tenantId?: string) => {
  const matchClause: any = {
    isActive: true,
    isDeleted: false,
  };

  if (tenantId) {
    matchClause.tenantId = tenantId;
  }

  const stats = await User.aggregate([
    { $match: matchClause },
    {
      $group: {
        _id: "$userType",
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
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// Get user statistics including PRIMARYADMIN (+1) and all admins count
export const getUserStats = async (tenantId?: string) => {
  const matchClause: any = {
    isDeleted: false,
    $or: [
      // Include non-admin user types (teacher, student, parent)
      { userType: { $in: ["teacher", "student", "parent"] } },
      // Include admin user type (will categorize by role in aggregation)
      { userType: "admin" },
    ],
  };

  if (tenantId) {
    matchClause.tenantId = new mongoose.Types.ObjectId(tenantId);
  }

  // First aggregation: Get stats excluding PRIMARYADMIN (for teachers, students, parents, and all admin roles except PRIMARYADMIN)
  const stats = await User.aggregate([
    { $match: matchClause },
    {
      $lookup: {
        from: "roles",
        localField: "role",
        foreignField: "_id",
        as: "roleData",
      },
    },
    {
      $addFields: {
        roleName: { $arrayElemAt: ["$roleData.name", 0] },
      },
    },
    // Exclude PRIMARYADMIN from this aggregation
    {
      $match: {
        $or: [
          { userType: { $ne: "admin" } },
          { roleName: { $ne: "PRIMARYADMIN" } },
        ],
      },
    },
    {
      $group: {
        _id: "$userType",
        count: { $sum: 1 },
      },
    },
  ]);

  // Second aggregation: Count all admins (PRIMARYADMIN + ACADEMICADMIN + COORDINATEADMIN + GRADINGADMIN + FINANCEADMIN + TEACHERADMIN + STUDENTADMIN)
  const adminMatchClause: any = {
    isDeleted: false,
    userType: "admin",
  };

  if (tenantId) {
    adminMatchClause.tenantId = new mongoose.Types.ObjectId(tenantId);
  }

  const adminStats = await User.aggregate([
    { $match: adminMatchClause },
    {
      $lookup: {
        from: "roles",
        localField: "role",
        foreignField: "_id",
        as: "roleData",
      },
    },
    {
      $addFields: {
        roleName: { $arrayElemAt: ["$roleData.name", 0] },
      },
    },
    // Include all admin roles: PRIMARYADMIN, ACADEMICADMIN, COORDINATEADMIN, GRADINGADMIN, FINANCEADMIN, TEACHERADMIN, STUDENTADMIN
    {
      $match: {
        roleName: { $in: ["PRIMARYADMIN", "ACADEMICADMIN", "COORDINATEADMIN", "GRADINGADMIN", "FINANCEADMIN", "TEACHERADMIN", "STUDENTADMIN"] },
      },
    },
    {
      $group: {
        _id: null,
        totalAdmins: { $sum: 1 },
      },
    },
  ]);

  const result: any = {
    total: 0,
    teachers: 0,
    students: 0,
    parents: 0,
    admins: 0, // New KPI for total admins
  };

  // Process non-admin user types and ACADEMICADMIN/COORDINATEADMIN
  stats.forEach((stat) => {
    const userType = stat._id;
    if (userType === "teacher") {
      result.teachers = stat.count;
      result.total += stat.count;
    } else if (userType === "student") {
      result.students = stat.count;
      result.total += stat.count;
    } else if (userType === "parent") {
      result.parents = stat.count;
      result.total += stat.count;
    } else if (userType === "admin") {
      // This includes all admin roles except PRIMARYADMIN (which is counted separately)
      result.total += stat.count;
    } else {
      result.total += stat.count;
    }
  });

  // Get total admins count (PRIMARYADMIN + ACADEMICADMIN + COORDINATEADMIN + GRADINGADMIN + FINANCEADMIN + TEACHERADMIN + STUDENTADMIN)
  const totalAdmins = adminStats[0]?.totalAdmins || 0;
  result.admins = totalAdmins;

  // Add PRIMARYADMIN count (+1) to total
  // Since we're logged in as PRIMARYADMIN, we add 1 to the total
  result.total += 1; // Add PRIMARYADMIN to total

  return result;
};

/**
 * Get user statistics for multiple tenants
 * Aggregates teachers, students, and parents counts for each provided tenantId
 */
export const getUsersStatsByTenantIds = async (tenantIds: string[]) => {
  const validTenantIds = tenantIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (validTenantIds.length === 0) {
    return [];
  }

  const stats = await User.aggregate([
    {
      $match: {
        tenantId: { $in: validTenantIds },
        isActive: true,
        isDeleted: false,
        userType: { $in: ["teacher", "student", "parent"] },
      },
    },
    {
      $group: {
        _id: {
          tenantId: "$tenantId",
          userType: "$userType",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.tenantId",
        teachers: {
          $sum: { $cond: [{ $eq: ["$_id.userType", "teacher"] }, "$count", 0] },
        },
        students: {
          $sum: { $cond: [{ $eq: ["$_id.userType", "student"] }, "$count", 0] },
        },
        parents: {
          $sum: { $cond: [{ $eq: ["$_id.userType", "parent"] }, "$count", 0] },
        },
        total: { $sum: "$count" },
      },
    },
  ]);

  return stats;
};


// Update user by ID
export const updateUserById = async (
  id: string,
  updateData: Partial<IUser>
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await User.findByIdAndUpdate(
    id,
    { $set: { ...updateData, updatedBy: "system" } },
    { new: true, runValidators: true }
  ).populate("role");
};

// Find user by ID for deletion (allows inactive users, but excludes already deleted)
export const findUserByIdForDeletion = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await User.findOne({
    _id: id,
    isDeleted: false,
  }).populate("role");
};

// Soft delete user by ID
export const softDeleteUserById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return await User.findByIdAndUpdate(
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

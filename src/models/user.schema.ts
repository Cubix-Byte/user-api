import mongoose, { Document, Schema } from "mongoose";
import {
  IBaseDocument,
  BaseDocumentSchema,
  USER_TYPE_ARRAY,
  USER_ACCESS_TYPE_ARRAY,
} from "../utils/shared-lib-imports";
import { encryptPassword, comparePassword } from "../utils/encryption.helper";
import bcrypt from "bcryptjs";
// Import Role and Tenant models to ensure they're registered before User model uses them for populate
import "./role.schema";
import "./tenant.schema";

// User model interface - represents user account information
export interface IUser extends IBaseDocument {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  profilePicture?: string; // URL to profile picture stored in storage-api
  role: mongoose.Types.ObjectId;
  tenantId?: mongoose.Types.ObjectId;
  tenantName?: string;
  userType: "superadmin" | "admin" | "teacher" | "student" | "parent";
  userAccessType: "private" | "guest" | "trial";
  isEmailVerified: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  refreshToken?: string;
}

const UserSchema: Schema = new Schema(
  {
    ...BaseDocumentSchema.obj,
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      lowercase: true,
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[\+]?[0-9\-\s]{10,20}$/, "Please enter a valid phone number"],
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required"],
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: function (this: IUser) {
        return this.userType !== "superadmin";
      },
    },
    tenantName: {
      type: String,
      trim: true,
      required: function (this: IUser) {
        return this.userType !== "superadmin";
      },
    },
    userType: {
      type: String,
      required: [true, "User type is required"],
      enum: USER_TYPE_ARRAY,
      default: "admin",
    },
    userAccessType: {
      type: String,
      required: [true, "User access type is required"],
      enum: USER_ACCESS_TYPE_ARRAY,
      default: "private",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { _id, __v, password, refreshToken, ...rest } = ret;
        return { id: (_id as any).toString(), ...rest };
      },
    },
    toObject: {
      transform: function (doc, ret) {
        const { _id, __v, password, refreshToken, ...rest } = ret;
        return { id: (_id as any).toString(), ...rest };
      },
    },
  }
);

// Indexes for better performance
// Compound index for username uniqueness per tenant
UserSchema.index({ username: 1, tenantId: 1 }, { unique: true, sparse: true });
UserSchema.index(
  { username: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { userType: "superadmin" },
  }
);
// Compound index for email uniqueness per tenant (for tenant users)
UserSchema.index({ email: 1, tenantId: 1 }, { unique: true, sparse: true });
// Unique index for email with superadmin filter (for superadmin users)
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { userType: "superadmin" },
  }
);
UserSchema.index({ role: 1 });
UserSchema.index({ tenantId: 1 });
UserSchema.index({ userType: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isDeleted: 1 });

// Virtual for checking if account is locked
UserSchema.virtual("isLocked").get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const hashedPassword = await bcrypt.hash(this.password as string, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const user = this as IUser;
  return bcrypt.compare(candidatePassword, user.password);
};

// Instance method to handle login attempts
UserSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  if (
    this.loginAttempts + 1 >= 5 &&
    !(this.lockUntil && this.lockUntil > new Date())
  ) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

export default mongoose.model<IUser>("User", UserSchema);

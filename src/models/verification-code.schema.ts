import mongoose, { Document, Schema } from "mongoose";
import { IBaseDocument, BaseDocumentSchema } from "../utils/shared-lib-imports";
import bcrypt from "bcryptjs";

/**
 * Verification Code Type Enum
 * Defines the purpose of the verification code
 */
export enum VerificationCodeType {
  FORGET_PASSWORD = "FORGET_PASSWORD",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  // Add more types as needed in the future
}

/**
 * Verification Code Status Enum
 * Tracks the current state of the verification code
 */
export enum VerificationCodeStatus {
  PENDING = "pending", // OTP sent, awaiting verification
  OTP_VERIFIED = "otp-verified", // OTP verified successfully
  EXPIRED = "expired", // OTP expired without verification
  USED = "used", // Verification code used (e.g., password reset completed)
}

/**
 * Verification Code Interface
 * Represents email verification logs with OTP codes
 */
export interface IVerificationCode extends Omit<IBaseDocument, 'createdBy'> {
  createdBy?: string; // Optional for public endpoints (forget password)
  email: string;
  type: VerificationCodeType;
  otp: string; // Hashed OTP for security
  status: VerificationCodeStatus;
  tenantName?: string;
  attempts: number; // Number of verification attempts
  lastAttemptAt?: Date; // Last attempt timestamp
  expiresAt: Date; // OTP expiration timestamp
}

const VerificationCodeSchema: Schema = new Schema(
  {
    ...BaseDocumentSchema.obj,
    // Override createdBy to be optional (for public forget password flow)
    createdBy: {
      type: String,
      required: false, // Optional for public endpoints
      trim: true,
      default: "system" // Default value for system-generated codes
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Verification type is required"],
      enum: Object.values(VerificationCodeType),
      index: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      select: false, // Don't return OTP by default in queries
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: Object.values(VerificationCodeStatus),
      default: VerificationCodeStatus.PENDING,
      index: true,
    },
    tenantName: {
      type: String,
      trim: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastAttemptAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { _id, __v, otp, ...rest } = ret;
        return { id: (_id as any).toString(), ...rest };
      },
    },
    toObject: {
      transform: function (doc, ret) {
        const { _id, __v, otp, ...rest } = ret;
        return { id: (_id as any).toString(), ...rest };
      },
    },
  }
);

// Compound indexes for efficient queries
VerificationCodeSchema.index({ email: 1, type: 1, status: 1 });
VerificationCodeSchema.index({ email: 1, type: 1, createdAt: -1 });
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Virtual for checking if OTP is expired
VerificationCodeSchema.virtual("isExpired").get(function (this: IVerificationCode) {
  return new Date() > this.expiresAt;
});

// Pre-save middleware to hash OTP before saving
VerificationCodeSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) return next();

  try {
    // Hash the OTP with bcrypt
    const hashedOTP = await bcrypt.hash(this.otp as string, 10);
    this.otp = hashedOTP;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare OTP
VerificationCodeSchema.methods.compareOTP = async function (
  candidateOTP: string
): Promise<boolean> {
  const verificationCode = this as IVerificationCode;
  return bcrypt.compare(candidateOTP, verificationCode.otp);
};

// Instance method to increment attempts
VerificationCodeSchema.methods.incrementAttempts = function () {
  this.attempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

// Instance method to mark as verified
VerificationCodeSchema.methods.markAsVerified = function () {
  this.status = VerificationCodeStatus.OTP_VERIFIED;
  return this.save();
};

// Instance method to mark as used
VerificationCodeSchema.methods.markAsUsed = function () {
  this.status = VerificationCodeStatus.USED;
  return this.save();
};

// Instance method to mark as expired
VerificationCodeSchema.methods.markAsExpired = function () {
  this.status = VerificationCodeStatus.EXPIRED;
  return this.save();
};

export default mongoose.model<IVerificationCode>(
  "VerificationCode",
  VerificationCodeSchema
);


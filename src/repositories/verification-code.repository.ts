import VerificationCode, {
  IVerificationCode,
  VerificationCodeType,
  VerificationCodeStatus,
} from "../models/verification-code.schema";
import mongoose from "mongoose";
import {
  MAX_ATTEMPTS_PER_24H,
  COOLDOWN_HOURS_AFTER_MAX_ATTEMPTS,
} from "../utils/helpers/constants/email-verification.constants";
import { formatDateInTimezone } from "../utils/helpers/date-timezone.helper";
import { getTenantByName } from "../services/academic-integration.service";

/**
 * Verification Code Repository
 * Handles all database operations for verification codes
 */

/**
 * Create a new verification code record
 * Note: tenantName should already be normalized (empty strings converted to undefined)
 */
export const createVerificationCode = async (data: {
  email: string;
  type: VerificationCodeType;
  otp: string; // Plain text OTP (will be hashed by pre-save middleware)
  tenantName?: string;
  expiresAt: Date;
}): Promise<IVerificationCode> => {
  const verificationCode = new VerificationCode({
    email: data.email.toLowerCase().trim(),
    type: data.type,
    otp: data.otp, // Will be hashed by pre-save middleware
    status: VerificationCodeStatus.PENDING,
    tenantName: data.tenantName, // Already normalized, don't trim again
    attempts: 0,
    expiresAt: data.expiresAt,
    isActive: true,
    isDeleted: false,
  });

  return await verificationCode.save();
};

/**
 * Find verification code by email, type, and OTP
 * Returns the code with OTP selected for comparison
 */
export const findVerificationCode = async (
  email: string,
  type: VerificationCodeType,
  otp: string
): Promise<IVerificationCode | null> => {
  const verificationCode = await VerificationCode.findOne({
    email: email.toLowerCase().trim(),
    type,
    status: { $in: [VerificationCodeStatus.PENDING, VerificationCodeStatus.OTP_VERIFIED] },
    expiresAt: { $gt: new Date() }, // Not expired
    isActive: true,
    isDeleted: false,
  }).select("+otp"); // Select OTP field for comparison

  if (!verificationCode) {
    return null;
  }

  // Compare OTP using bcrypt
  const bcrypt = (await import("bcryptjs")).default;
  const isOTPValid = await bcrypt.compare(otp, verificationCode.otp);
  if (!isOTPValid) {
    return null;
  }

  return verificationCode;
};

/**
 * Find verification code by ID, email, and type
 * Used for password update verification
 */
export const findVerificationCodeById = async (
  id: string,
  email: string,
  type: VerificationCodeType
): Promise<IVerificationCode | null> => {
  return await VerificationCode.findOne({
    _id: new mongoose.Types.ObjectId(id),
    email: email.toLowerCase().trim(),
    type,
    status: VerificationCodeStatus.OTP_VERIFIED, // Must be verified
    expiresAt: { $gt: new Date() }, // Not expired
    isActive: true,
    isDeleted: false,
  });
};

/**
 * Update verification code status
 */
export const updateVerificationStatus = async (
  id: string,
  status: VerificationCodeStatus
): Promise<IVerificationCode | null> => {
  return await VerificationCode.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
};

/**
 * Get recent verification attempts for an email and type
 * Returns count of attempts in the last N hours
 */
export const getRecentAttempts = async (
  email: string,
  type: VerificationCodeType,
  hours: number = 24
): Promise<number> => {
  const hoursAgo = new Date();
  hoursAgo.setHours(hoursAgo.getHours() - hours);

  const count = await VerificationCode.countDocuments({
    email: email.toLowerCase().trim(),
    type,
    createdAt: { $gte: hoursAgo },
    isActive: true,
    isDeleted: false,
  });

  return count;
};

/**
 * Get the most recent verification attempt for an email and type
 */
export const getLastAttempt = async (
  email: string,
  type: VerificationCodeType
): Promise<IVerificationCode | null> => {
  return await VerificationCode.findOne({
    email: email.toLowerCase().trim(),
    type,
    isActive: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(1);
};

/**
 * Get the most recent verification attempt within a time window for an email and type
 * Returns the most recent attempt that was created within the last N hours
 */
export const getLastAttemptInWindow = async (
  email: string,
  type: VerificationCodeType,
  hours: number = 24
): Promise<IVerificationCode | null> => {
  const hoursAgo = new Date();
  hoursAgo.setHours(hoursAgo.getHours() - hours);

  return await VerificationCode.findOne({
    email: email.toLowerCase().trim(),
    type,
    createdAt: { $gte: hoursAgo },
    isActive: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(1);
};

/**
 * Get the most recent verification attempt within a time window for an email and type
 * Returns the most recent attempt that was created within the last N hours
 */
// export const getLastAttemptInWindow = async (
//   email: string,
//   type: VerificationCodeType,
//   hours: number = 24
// ): Promise<IVerificationCode | null> => {
//   const hoursAgo = new Date();
//   hoursAgo.setHours(hoursAgo.getHours() - hours);

//   return await VerificationCode.findOne({
//     email: email.toLowerCase().trim(),
//     type,
//     createdAt: { $gte: hoursAgo },
//     isActive: true,
//     isDeleted: false,
//   })
//     .sort({ createdAt: -1 })
//     .limit(1);
// };

/**
 * Check if rate limit is exceeded for an email and type
 * Uses atomic operation to prevent race conditions
 * Returns true if rate limit is exceeded, false otherwise
 * Only considers attempts within the 24-hour window for rate limiting
 * 
 * @param email - User email address
 * @param type - Verification code type
 * @param tenantName - Optional tenant name to fetch timezone from academy-api for error message
 */
export const checkRateLimit = async (
  email: string,
  type: VerificationCodeType,
  tenantName?: string
): Promise<{ exceeded: boolean; message?: string; retryAfter?: Date }> => {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Use atomic operation: count documents and check in a single query
  // This prevents race conditions where multiple requests check simultaneously
  const hoursAgo = new Date();
  hoursAgo.setHours(hoursAgo.getHours() - 24);

  // Atomic count operation
  const attempts24h = await VerificationCode.countDocuments({
    email: normalizedEmail,
    type,
    createdAt: { $gte: hoursAgo },
    isActive: true,
    isDeleted: false,
  });

  // If max attempts reached, always block and show cooldown message
  if (attempts24h >= MAX_ATTEMPTS_PER_24H) {
    // Get the most recent attempt within the 24-hour window
    const lastAttemptInWindow = await getLastAttemptInWindow(normalizedEmail, type, 24);
    
    const now = new Date();
    let cooldownEndTime: Date;
    
    if (lastAttemptInWindow && lastAttemptInWindow.createdAt) {
      // Calculate cooldown end time from the last attempt time
      // This ensures the cooldown period is fixed from when the limit was hit
      const cooldownStartTime = new Date(lastAttemptInWindow.createdAt);
      cooldownEndTime = new Date(cooldownStartTime);
      cooldownEndTime.setHours(
        cooldownEndTime.getHours() + COOLDOWN_HOURS_AFTER_MAX_ATTEMPTS
      );
    } else {
      // If no recent attempt found (shouldn't happen, but handle gracefully)
      // Calculate cooldown from current time
      cooldownEndTime = new Date(now);
      cooldownEndTime.setHours(
        cooldownEndTime.getHours() + COOLDOWN_HOURS_AFTER_MAX_ATTEMPTS
      );
    }

    // Fetch tenant timezone from academy-api if tenantName is provided
    let tenantTimezone: string | undefined;
    if (tenantName && tenantName.trim().length > 0) {
      try {
        const tenant = await getTenantByName(tenantName.trim());
        
        if (tenant && tenant.timeZone) {
          tenantTimezone = tenant.timeZone;
        }
      } catch (error) {
        // If tenant fetch fails, continue with undefined timezone (will use UTC)
        console.warn(`Failed to fetch tenant timezone from academy-api for tenantName ${tenantName}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Format date in tenant timezone (or UTC if not available)
    const formattedDate = formatDateInTimezone(cooldownEndTime, tenantTimezone);

    return {
      exceeded: true,
      message: `Maximum verification attempts reached. Please try again after ${formattedDate}`,
      retryAfter: cooldownEndTime,
    };
  }

  return { exceeded: false };
};

/**
 * Mark all pending/verified codes for an email and type as expired
 * Useful when a new code is generated
 */
export const expireOldCodes = async (
  email: string,
  type: VerificationCodeType
): Promise<void> => {
  await VerificationCode.updateMany(
    {
      email: email.toLowerCase().trim(),
      type,
      status: { $in: [VerificationCodeStatus.PENDING, VerificationCodeStatus.OTP_VERIFIED] },
      isActive: true,
      isDeleted: false,
    },
    {
      $set: {
        status: VerificationCodeStatus.EXPIRED,
      },
    }
  );
};

/**
 * Find user by email (for validation before sending verification email)
 * This is a helper to check if user exists without revealing it
 */
export const findUserByEmailForVerification = async (
  email: string,
  tenantName?: string
): Promise<{ exists: boolean; userId?: string; tenantId?: string }> => {
  // Import User model here to avoid circular dependency
  const User = (await import("../models/user.schema")).default;
  
  // Normalize tenantName - convert empty strings to undefined
  const normalizedTenantName = tenantName?.trim() || undefined;
  
  let user;
  if (normalizedTenantName) {
    user = await User.findOne({
      email: email.toLowerCase().trim(),
      tenantName: normalizedTenantName,
      isActive: true,
      isDeleted: false,
    });
  } else {
    // For superadmin or when tenantName is not provided
    user = await User.findOne({
      email: email.toLowerCase().trim(),
      userType: "superadmin",
      isActive: true,
      isDeleted: false,
    });
  }

  return {
    exists: !!user,
    userId: user?._id?.toString(),
    tenantId: user?.tenantId?.toString(),
  };
};


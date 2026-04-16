import * as verificationCodeRepository from "../repositories/verification-code.repository";
import * as userRepository from "../repositories/user.repository";
import VerificationCode, {
  VerificationCodeType,
  VerificationCodeStatus,
} from "../models/verification-code.schema";
import {
  OTP_EXPIRY_MINUTES,
  OTP_LENGTH,
} from "../utils/helpers/constants/email-verification.constants";
import {
  UserNotFoundError,
  RateLimitExceededError,
  EmailSendFailedError,
  DatabaseOperationError,
} from "../utils/errors/forget-password.errors";

/**
 * Forget Password Service
 * Contains business logic for forget password flow
 */

/**
 * Send verification email via notifications-api internal API
 */
const sendVerificationEmailViaNotificationsAPI = async (
  email: string,
  otp: string,
  tenantName: string | undefined,
  type: VerificationCodeType,
  tenantId: string | undefined
): Promise<void> => {
  // Base URL for notifications API
  // If BASE_URL is set in env, use it; otherwise default to localhost:3005
  const baseUrl = process.env.BASE_URL || "http://localhost:3005";
  const internalApiKey = process.env.INTERNAL_API_KEY || "your-internal-api-key";

  // Determine purpose and title based on type
  const purpose = type === VerificationCodeType.FORGET_PASSWORD
    ? "password reset"
    : "email verification";
  const title = type === VerificationCodeType.FORGET_PASSWORD
    ? "Reset Your Password"
    : "Verify Your Email";

  // Prepare template parameters
  const templateParams: Record<string, any> = {
    otp,
    purpose,
    title,
    type: type,
  };

  // Add tenantName badge HTML if tenantName is provided
  if (tenantName) {
    templateParams.tenantName = tenantName;
    templateParams.tenantNameBadge = `<div class="tenant-badge">${tenantName}</div>`;
  } else {
    templateParams.tenantName = "";
    templateParams.tenantNameBadge = "";
  }

  // Call notifications-api internal API
  // baseUrl should be just the base domain (e.g., http://localhost:3005)
  // The code appends /notifications/api/v1/internal/send-email-with-template
  const apiUrl = `${baseUrl}/notifications/api/v1/internal/send-email-with-template`;
  
  const response = await fetch(
    `${baseUrl}/notifications/api/v1/internal/send-email-with-template`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": internalApiKey,
      },
      body: JSON.stringify({
        templateName: "password-reset-otp",
        recipientEmail: email,
        templateParams,
        tenantId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { message?: string };
    const errorMessage = errorData.message || `Failed to send email: ${response.statusText}`;
    console.error(`❌ Failed to send verification email to ${email}:`, {
      url: apiUrl,
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
      tenantId,
    });
    throw new Error(errorMessage);
  }
};

/**
 * Generate a random numeric OTP
 */
const generateOTP = (length: number = OTP_LENGTH): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Send verification email for forget password
 * 1. Check if user exists (without revealing if they don't)
 * 2. Check rate limits (with atomic operation to prevent race conditions)
 * 3. Generate OTP
 * 4. Expire old codes
 * 5. Create verification code record
 * 6. Send email
 */
export const sendForgetPasswordVerificationEmail = async (
  email: string,
  type: VerificationCodeType,
  tenantName?: string
): Promise<void> => {
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Validate email after normalization
  if (!normalizedEmail || normalizedEmail.length === 0) {
    throw new Error("Email is required");
  }

  // Normalize tenantName - convert empty strings to undefined
  const normalizedTenantName = tenantName?.trim() || undefined;

  // Check if user exists
  let userCheck;
  try {
    userCheck = await verificationCodeRepository.findUserByEmailForVerification(
      normalizedEmail,
      normalizedTenantName
    );
  } catch (error) {
    console.error(`❌ [sendForgetPasswordVerificationEmail] Database error checking user:`, {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseOperationError("Failed to verify user");
  }

  // Don't reveal if user exists - always proceed to prevent email enumeration
  // If user doesn't exist, we'll still return success but won't send email

  // Check rate limits with atomic operation to prevent race conditions
  // Pass tenantName to get tenant timezone from academy-api for error message formatting
  let rateLimitCheck;
  try {
    rateLimitCheck = await verificationCodeRepository.checkRateLimit(
      normalizedEmail,
      type,
      normalizedTenantName
    );
  } catch (error) {
    console.error(`❌ [sendForgetPasswordVerificationEmail] Database error checking rate limit:`, {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseOperationError("Failed to check rate limit");
  }

  if (rateLimitCheck.exceeded) {
    throw new RateLimitExceededError(
      rateLimitCheck.message || "Rate limit exceeded. Please try again later.",
      rateLimitCheck.retryAfter
    );
  }

  // Only proceed if user exists (but don't reveal this to caller)
  if (!userCheck.exists) {
    // Return early to prevent email enumeration (caller will still get success response)
    return;
  }

  // Generate OTP
  const otp = generateOTP();

  // Calculate expiry time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  // Expire old codes and create new verification code
  // Note: Using try-catch for error handling. For full transaction support,
  // repository methods would need to accept optional session parameters.
  let verificationCode;
  try {
    // Expire old codes for this email and type
    await verificationCodeRepository.expireOldCodes(normalizedEmail, type);

    // Create verification code record (OTP will be hashed by pre-save middleware)
    verificationCode = await verificationCodeRepository.createVerificationCode(
      {
        email: normalizedEmail,
        type,
        otp, // Plain text OTP (will be hashed)
        tenantName: normalizedTenantName,
        expiresAt,
      }
    );
  } catch (error) {
    console.error(`❌ [sendForgetPasswordVerificationEmail] Database error creating verification code:`, {
      message: error instanceof Error ? error.message : String(error),
    });
    throw new DatabaseOperationError("Failed to create verification code");
  }

  // Send verification email via notifications-api internal API
  try {
    await sendVerificationEmailViaNotificationsAPI(
      normalizedEmail,
      otp,
      normalizedTenantName,
      type,
      userCheck.tenantId?.toString()
    );
    console.log(
      `✅ Verification email sent to ${normalizedEmail} for ${type}`
    );
  } catch (error) {
    // Log the error safely without exposing sensitive data or circular references
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`❌ [sendForgetPasswordVerificationEmail] Failed to send email to ${normalizedEmail}:`, {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
    });

    // If email sending fails, mark the code as expired
    try {
      await verificationCodeRepository.updateVerificationStatus(
        verificationCode._id.toString(),
        VerificationCodeStatus.EXPIRED
      );
    } catch (dbError) {
      console.error(`❌ [sendForgetPasswordVerificationEmail] Failed to update verification code status:`, {
        message: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }
    
    // Use custom error class for better error handling
    throw new EmailSendFailedError(
      errorMessage && errorMessage.trim().length > 0 && !errorMessage.startsWith("Failed to send email: ")
        ? errorMessage
        : "Failed to send verification email. Please try again."
    );
  }
};

/**
 * Verify email OTP
 * 1. Find verification code by email, type, and OTP
 * 2. Check if code is valid and not expired
 * 3. Increment attempts if OTP is wrong
 * 4. Update status to OTP_VERIFIED if correct
 * 5. Return verificationCodeId
 */
export const verifyEmail = async (
  email: string,
  type: VerificationCodeType,
  otp: string
): Promise<{ verificationCodeId: string }> => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find verification code with OTP comparison
  const verificationCode =
    await verificationCodeRepository.findVerificationCode(
      normalizedEmail,
      type,
      otp
    );

  if (!verificationCode) {
    // Find the code to increment attempts (even if OTP is wrong)
    const lastCode = await verificationCodeRepository.getLastAttempt(
      normalizedEmail,
      type
    );

    if (lastCode) {
      // Increment attempts using repository update
      await VerificationCode.updateOne(
        { _id: lastCode._id },
        { 
          $inc: { attempts: 1 },
          $set: { lastAttemptAt: new Date() }
        }
      );
    }

    throw new Error("Invalid or expired verification code");
  }

  // Check if code is expired
  if (new Date() > verificationCode.expiresAt) {
    await verificationCodeRepository.updateVerificationStatus(
      verificationCode._id.toString(),
      VerificationCodeStatus.EXPIRED
    );
    throw new Error("Verification code has expired");
  }

  // Check if code is already used
  if (verificationCode.status === VerificationCodeStatus.USED) {
    throw new Error("Verification code has already been used");
  }

  // Mark as verified
  await verificationCodeRepository.updateVerificationStatus(
    verificationCode._id.toString(),
    VerificationCodeStatus.OTP_VERIFIED
  );

  return {
    verificationCodeId: verificationCode._id.toString(),
  };
};

/**
 * Update password after email verification
 * 1. Verify verificationCodeId, email, and type match
 * 2. Check if code status is OTP_VERIFIED
 * 3. Find user by email (and tenantName if provided)
 * 4. Update user password
 * 5. Mark verification code as USED
 */
export const updatePassword = async (
  email: string,
  verificationCodeId: string,
  type: VerificationCodeType,
  newPassword: string,
  tenantName?: string
): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  // Verify verification code
  const verificationCode =
    await verificationCodeRepository.findVerificationCodeById(
      verificationCodeId,
      normalizedEmail,
      type
    );

  if (!verificationCode) {
    throw new Error("Invalid or expired verification code");
  }

  // Check if code is verified
  if (verificationCode.status !== VerificationCodeStatus.OTP_VERIFIED) {
    throw new Error("Verification code not verified. Please verify your email first.");
  }

  // Check if code is expired
  if (new Date() > verificationCode.expiresAt) {
    await verificationCodeRepository.updateVerificationStatus(
      verificationCodeId,
      VerificationCodeStatus.EXPIRED
    );
    throw new Error("Verification code has expired");
  }

  // Find user
  let user;
  if (tenantName) {
    user = await userRepository.findUserByEmailAndTenant(
      normalizedEmail,
      tenantName.trim()
    );
  } else {
    // For superadmin
    user = await userRepository.findUserByEmailForSuperadmin(normalizedEmail);
  }

  if (!user) {
    throw new Error("User not found");
  }

  // Update password (will be hashed by pre-save middleware)
  user.password = newPassword;
  await user.save();

  // Mark verification code as used
  await verificationCodeRepository.updateVerificationStatus(
    verificationCodeId,
    VerificationCodeStatus.USED
  );

  console.log(`✅ Password updated for user: ${normalizedEmail}`);
};


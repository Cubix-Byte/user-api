import { z } from "zod";
import { VerificationCodeType } from "../../models/verification-code.schema";

/**
 * Forget Password Validators
 * Zod validation schemas for forget password endpoints
 */

// Enum values for verification code type
const VerificationCodeTypeEnum = z.nativeEnum(VerificationCodeType);

/**
 * Send Verification Email Schema
 * Validates request to send verification email with OTP
 */
export const sendVerificationEmailSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Please enter a valid email")
      .toLowerCase()
      .trim()
      .min(1, "Email is required"),
    type: VerificationCodeTypeEnum.refine(
      (val) => Object.values(VerificationCodeType).includes(val),
      {
        message: `Type must be one of: ${Object.values(VerificationCodeType).join(", ")}`,
      }
    ),
    tenantName: z
      .string()
      .trim()
      .min(1, "Tenant name is required for tenant users")
      .optional(),
  }),
});

/**
 * Verify Email Schema
 * Validates request to verify OTP code
 */
export const verifyEmailSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Please enter a valid email")
      .toLowerCase()
      .trim()
      .min(1, "Email is required"),
    type: VerificationCodeTypeEnum.refine(
      (val) => Object.values(VerificationCodeType).includes(val),
      {
        message: `Type must be one of: ${Object.values(VerificationCodeType).join(", ")}`,
      }
    ),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d+$/, "OTP must contain only digits"),
  }),
});

/**
 * Update Password Schema
 * Validates request to update password after email verification
 */
export const updatePasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Please enter a valid email")
      .toLowerCase()
      .trim()
      .min(1, "Email is required"),
    verificationCodeId: z
      .string()
      .min(1, "Verification code ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid verification code ID format"),
    type: VerificationCodeTypeEnum.refine(
      (val) => Object.values(VerificationCodeType).includes(val),
      {
        message: `Type must be one of: ${Object.values(VerificationCodeType).join(", ")}`,
      }
    ),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "New password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
    tenantName: z
      .string()
      .trim()
      .min(1, "Tenant name is required for tenant users")
      .optional(),
  }),
});


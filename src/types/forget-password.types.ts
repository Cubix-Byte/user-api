import { VerificationCodeType } from "../models/verification-code.schema";

/**
 * Forget Password Types
 * Type definitions for forget password flow requests
 */

/**
 * Send Verification Email Request
 */
export interface SendVerificationEmailRequest {
  email: string;
  type: VerificationCodeType | string;
  tenantName?: string;
}

/**
 * Verify Email Request
 */
export interface VerifyEmailRequest {
  email: string;
  type: VerificationCodeType | string;
  otp: string;
}

/**
 * Update Password Request
 */
export interface UpdatePasswordRequest {
  email: string;
  verificationCodeId: string;
  type: VerificationCodeType | string;
  newPassword: string;
  tenantName?: string;
}


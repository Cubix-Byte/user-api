import { Request, Response, NextFunction } from "express";
import {
  HttpStatusCodes as SERVER_STATUS_CODES,
} from "../../utils/shared-lib-imports";
import * as forgetPasswordService from "../../services/forget-password.service";
import { VerificationCodeType } from "../../models/verification-code.schema";
import {
  SendVerificationEmailRequest,
  VerifyEmailRequest,
  UpdatePasswordRequest,
} from "../../types/forget-password.types";
import {
  UserNotFoundError,
  RateLimitExceededError,
  EmailSendFailedError,
  DatabaseOperationError,
} from "../../utils/errors/forget-password.errors";

/**
 * Forget Password Controller
 * Handles HTTP requests for forget password flow
 */

/**
 * Send verification email endpoint
 * POST /user/api/v1/auth/forget-password/send-verification
 * 
 * Security: Always returns 200 status to prevent email enumeration attacks
 */
export const sendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestData = req.body as SendVerificationEmailRequest;

    // Validate type at runtime (validator should catch this, but double-check for safety)
    if (!Object.values(VerificationCodeType).includes(requestData.type as VerificationCodeType)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "type", message: `Type must be one of: ${Object.values(VerificationCodeType).join(", ")}` }],
      });
    }

    await forgetPasswordService.sendForgetPasswordVerificationEmail(
      requestData.email,
      requestData.type as VerificationCodeType,
      requestData.tenantName
    );

    // Always return success to prevent email enumeration attacks
    // OTP is never included in response for security reasons
    return res.status(200).json({
      success: true,
      message: "Verification code has been sent",
      data: {}
    });
  } catch (error) {
    // Log error safely without exposing sensitive data
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("❌ [sendVerificationEmail] Error occurred:", {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
      request: {
        method: req.method,
        path: req.path,
        body: { email: req.body?.email, type: req.body?.type, tenantName: req.body?.tenantName },
        ip: req.ip,
      },
    });

    // Handle specific error types using error classes
    if (error instanceof RateLimitExceededError) {
      // Rate limit errors should be returned to inform user they've hit the limit
      // This doesn't reveal email enumeration since it's a security feature
      const err = error as Error & { statusCode?: number };
      err.statusCode = SERVER_STATUS_CODES.FORBIDDEN;
      return next(err);
    }

    if (error instanceof UserNotFoundError) {
      // Always return success even if user not found to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: "Verification code has been sent",
        data: {}
      });
    }

    if (error instanceof EmailSendFailedError || error instanceof DatabaseOperationError) {
      // For internal errors, still return 200 to prevent information leakage
      // Log the error for monitoring but don't expose it to the client
      return res.status(200).json({
        success: true,
        message: "Verification code has been sent",
        data: {}
      });
    }

    // For any other unexpected errors, still return 200 to prevent enumeration
    return res.status(200).json({
      success: true,
      message: "Verification code has been sent",
      data: {}
    });
  }
};

/**
 * Verify email OTP endpoint
 * POST /user/api/v1/auth/forget-password/verify
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestData = req.body as VerifyEmailRequest;

    const result = await forgetPasswordService.verifyEmail(
      requestData.email,
      requestData.type as VerificationCodeType,
      requestData.otp
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: result
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    const err = error as Error & { statusCode?: number };

    // Log detailed error information
    console.error("❌ [verifyEmail] Error occurred:", {
      message: errorMessage,
      stack: err.stack,
      request: {
        method: req.method,
        path: req.path,
        body: { email: req.body?.email, type: req.body?.type },
        ip: req.ip,
      },
    });

    // Determine status code based on error type
    if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("expired") ||
      errorMessage.includes("already been used")
    ) {
      err.statusCode = SERVER_STATUS_CODES.BAD_REQUEST;
      err.message = errorMessage;
    } else {
      err.statusCode = SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR;
      err.message = "Failed to verify email";
    }

    // Pass error to error middleware
    return next(err);
  }
};

/**
 * Update password endpoint
 * POST /user/api/v1/auth/forget-password/update-password
 */
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestData = req.body as UpdatePasswordRequest;

    await forgetPasswordService.updatePassword(
      requestData.email,
      requestData.verificationCodeId,
      requestData.type as VerificationCodeType,
      requestData.newPassword,
      requestData.tenantName
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
      data: {}
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    const err = error as Error & { statusCode?: number };

    // Log detailed error information
    console.error("❌ [updatePassword] Error occurred:", {
      message: errorMessage,
      stack: err.stack,
      request: {
        method: req.method,
        path: req.path,
        body: { email: req.body?.email, type: req.body?.type, tenantName: req.body?.tenantName },
        ip: req.ip,
      },
    });

    // Determine status code based on error type
    if (errorMessage === "User not found") {
      err.statusCode = SERVER_STATUS_CODES.NOT_FOUND;
      err.message = "User not found";
    } else if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("expired") ||
      errorMessage.includes("not verified")
    ) {
      err.statusCode = SERVER_STATUS_CODES.BAD_REQUEST;
      err.message = errorMessage;
    } else {
      err.statusCode = SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR;
      err.message = "Failed to update password";
    }

    // Pass error to error middleware
    return next(err);
  }
};


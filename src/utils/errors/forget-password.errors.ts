import { HttpStatusCodes as SERVER_STATUS_CODES } from "../shared-lib-imports";

/**
 * Custom Error Classes for Forget Password Flow
 * Provides type-safe error handling instead of string matching
 */

export class UserNotFoundError extends Error {
  public readonly statusCode: number = SERVER_STATUS_CODES.NOT_FOUND;
  public readonly code: string = "USER_NOT_FOUND";

  constructor(message: string = "User not found") {
    super(message);
    this.name = "UserNotFoundError";
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class RateLimitExceededError extends Error {
  public readonly statusCode: number = SERVER_STATUS_CODES.FORBIDDEN;
  public readonly code: string = "RATE_LIMIT_EXCEEDED";
  public readonly retryAfter?: Date;

  constructor(message: string, retryAfter?: Date) {
    super(message);
    this.name = "RateLimitExceededError";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitExceededError.prototype);
  }
}

export class EmailSendFailedError extends Error {
  public readonly statusCode: number = SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR;
  public readonly code: string = "EMAIL_SEND_FAILED";

  constructor(message: string = "Failed to send verification email. Please try again.") {
    super(message);
    this.name = "EmailSendFailedError";
    Object.setPrototypeOf(this, EmailSendFailedError.prototype);
  }
}

export class DatabaseOperationError extends Error {
  public readonly statusCode: number = SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR;
  public readonly code: string = "DATABASE_OPERATION_ERROR";

  constructor(message: string = "Database operation failed") {
    super(message);
    this.name = "DatabaseOperationError";
    Object.setPrototypeOf(this, DatabaseOperationError.prototype);
  }
}

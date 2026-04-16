import { Request, Response, NextFunction } from "express";
import { sendErrorResponse, HttpStatusCodes as SERVER_STATUS_CODES } from '../utils/shared-lib-imports';

const INTERNAL_SERVER_ERROR = "Internal server error occurred";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const err = error as Error & { statusCode?: number; code?: number };
  
  // Log error with request details for better debugging
  console.error("❌ [Error Middleware] Error occurred:", {
    message: err.message,
    name: err.name,
    stack: err.stack,
    statusCode: err.statusCode,
    request: {
      method: req.method,
      path: req.path,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      // Log body only in development to avoid logging sensitive data in production
      ...(process.env.NODE_ENV === "development" && { body: req.body }),
    },
  });

  // MongoDB/Mongoose specific errors
  if (error.name === "MongoError" || error.name === "MongoServerError") {
    sendErrorResponse(
      res,
      "Database error",
      SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR,
      { details: error.message }
    );
    return;
  }

  if (error.name === "ValidationError") {
    sendErrorResponse(
      res,
      "Validation error",
      SERVER_STATUS_CODES.BAD_REQUEST,
      { details: error.message }
    );
    return;
  }

  if (error.name === "CastError") {
    sendErrorResponse(
      res,
      "Invalid ID format",
      SERVER_STATUS_CODES.BAD_REQUEST,
      { details: error.message }
    );
    return;
  }

  // Handle duplicate key error
  if (err.code === 11000) {
    sendErrorResponse(
      res,
      "Duplicate entry",
      SERVER_STATUS_CODES.CONFLICT,
      { details: error.message }
    );
    return;
  }

  // Handle custom status codes from controllers
  if (err.statusCode) {
    sendErrorResponse(
      res,
      err.message || INTERNAL_SERVER_ERROR,
      err.statusCode,
      { details: err.message || "An error occurred" }
    );
    return;
  }

  // Default error response
  sendErrorResponse(
    res,
    INTERNAL_SERVER_ERROR,
    SERVER_STATUS_CODES.INTERNAL_SERVER_ERROR,
    { details: "Something went wrong" }
  );
};



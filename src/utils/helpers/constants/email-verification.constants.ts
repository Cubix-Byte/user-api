/**
 * Email Verification Constants
 * 
 * Configuration constants for email verification and OTP functionality
 * Used for forget password and other email verification flows
 * 
 * Note: Email sending is now handled by notifications-api
 * This file only contains rate limiting and OTP configuration constants
 */

// Rate Limiting Constants
export const MAX_ATTEMPTS_PER_24H = 5; // Maximum verification attempts allowed in 24 hours
export const COOLDOWN_HOURS_AFTER_MAX_ATTEMPTS = 5; // Cooldown period after max attempts reached

// OTP Configuration
export const OTP_EXPIRY_MINUTES = 15; // OTP validity period in minutes
export const OTP_LENGTH = 6; // Length of OTP code (6 digits)


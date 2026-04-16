import bcrypt from 'bcryptjs';

/**
 * Password Helper
 * 
 * Centralized password handling utilities for the user-api.
 * Uses bcrypt with a fixed salt rounds for consistency across the application.
 */

// Fixed salt rounds for consistent hashing
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param plainPassword - The plain text password to hash
 * @returns Promise<string> - The hashed password
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Password hashing failed: ${(error as Error).message}`);
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param plainPassword - The plain text password to compare
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise<boolean> - True if passwords match, false otherwise
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error(`Password comparison failed: ${(error as Error).message}`);
  }
};

/**
 * Get the salt rounds used for hashing
 * @returns number - The salt rounds
 */
export const getSaltRounds = (): number => {
  return SALT_ROUNDS;
};

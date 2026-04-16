import * as crypto from "crypto";

/**
 * Encryption Helper
 *
 * Simple encrypt/decrypt solution for passwords
 * Uses AES-256-CBC encryption with a fixed key
 */

// Fixed encryption key (32 bytes for AES-256)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "brighton-ai-encryption-key-32-chars!!";
const ENCRYPTION_KEY_BUFFER = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt a plain text password
 * @param plainPassword - The plain text password to encrypt
 * @returns string - The encrypted password
 */
export const encryptPassword = (plainPassword: string): string => {
  try {
    // Create a random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);

    // Create cipher with IV
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY_BUFFER, iv);

    // Encrypt the password
    let encrypted = cipher.update(plainPassword, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine IV + encrypted data
    const result = iv.toString("hex") + ":" + encrypted;

    return result;
  } catch (error) {
    throw new Error(`Password encryption failed: ${(error as Error).message}`);
  }
};

/**
 * Decrypt an encrypted password
 * @param encryptedPassword - The encrypted password to decrypt
 * @returns string - The decrypted plain text password
 */
export const decryptPassword = (encryptedPassword: string): string => {
  try {
    // Split the encrypted data
    const parts = encryptedPassword.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted password format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    // Create decipher with IV
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY_BUFFER,
      iv
    );

    // Decrypt the password
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(`Password decryption failed: ${(error as Error).message}`);
  }
};

/**
 * Compare a plain password with an encrypted password
 * @param plainPassword - The plain text password to compare
 * @param encryptedPassword - The encrypted password to compare against
 * @returns boolean - True if passwords match, false otherwise
 */
export const comparePassword = (
  plainPassword: string,
  encryptedPassword: string
): boolean => {
  try {
    const decryptedPassword = decryptPassword(encryptedPassword);
    return plainPassword === decryptedPassword;
  } catch (error) {
    return false;
  }
};

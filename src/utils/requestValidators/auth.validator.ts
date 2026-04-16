import { z } from 'zod';
import { ROLE_NAMES, USER_TYPE_ARRAY } from '../shared-lib-imports';

export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Please enter a valid email')
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(6, 'Password must be at least 6 characters'),
    tenantName: z.string()
      .min(1, 'Tenant name is required for tenant users')
      .trim()
      .optional()
  }),
});


export const registerSchema = z.object({
  body: z.object({
    username: z.string()
      .min(1, 'Username is required')
      .max(50, 'Username cannot exceed 50 characters')
      .toLowerCase()
      .trim(),
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters')
      .trim(),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters')
      .trim(),
    email: z.string()
      .email('Please enter a valid email')
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    phoneNumber: z.string()
      .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
      .optional(),
    roleName: z.string()
      .toUpperCase()
      .refine((val) => Object.values(ROLE_NAMES).includes(val as any), {
        message: `Role must be one of: ${Object.values(ROLE_NAMES).join(', ')}`
      }),
    tenantId: z.string().optional(),
    tenantName: z.string().trim().optional(),
    userType: z.enum(USER_TYPE_ARRAY as unknown as [string, ...string[]]),
    description: z.string()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string()
      .min(1, 'Refresh token is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string()
      .min(6, 'Current password must be at least 6 characters'),
    newPassword: z.string()
      .min(6, 'New password must be at least 6 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Please enter a valid email')
      .toLowerCase()
      .trim(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string()
      .min(1, 'Reset token is required'),
    newPassword: z.string()
      .min(6, 'New password must be at least 6 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string()
      .max(50, 'First name cannot exceed 50 characters')
      .trim()
      .optional(),
    lastName: z.string()
      .max(50, 'Last name cannot exceed 50 characters')
      .trim()
      .optional(),
    phoneNumber: z.string()
      .regex(/^[\+]?[0-9\-\s]{10,20}$/, 'Please enter a valid phone number')
      .trim()
      .optional(),
    profilePicture: z.string()
      .url('Please enter a valid URL for profile picture')
      .trim()
      .optional(),
  }),
});

